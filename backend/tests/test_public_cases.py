import unittest
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException

from backend.schemas.common import UserRole
from backend.schemas.public_cases import CaseSettingsUpdate, EscalationRequest
from backend.security.auth import CurrentUser
from backend.services import public_cases
from backend.services import reports
from backend.schemas.reports import WitnessCreate

CASE_ID = UUID("33333333-3333-3333-3333-333333333333")
MANAGER_ID = UUID("11111111-1111-1111-1111-111111111111")
VOLUNTEER_ID = UUID("22222222-2222-2222-2222-222222222222")


def user(role: UserRole, profile_id: UUID) -> CurrentUser:
    return CurrentUser(UUID("44444444-4444-4444-4444-444444444444"), {"id": str(profile_id), "role": role, "is_active": True, "is_verified": True})


class FakeDatabase:
    def __init__(self) -> None:
        self.case = {"id": str(CASE_ID), "case_number": "T-1", "created_by": str(MANAGER_ID), "case_manager_id": str(MANAGER_ID), "title": "Test case", "description": "Public details", "event_name": "Event", "venue_name": "Venue", "last_seen_at": None, "last_seen_location": {"lat": 1}, "priority": "HIGH", "status": "LOCAL_SEARCH_COMPLETED", "is_public": False, "public_at": None}
        self.settings = None
        self.publications = []
        self.members = []
        self.events = []
        self.notifications = []

    def case_by_id(self, case_id: str) -> dict | None:
        return self.case if case_id == str(CASE_ID) else None

    def list_case_memberships_for_user(self, profile_id: str) -> list[dict]:
        return [row for row in self.members if row["user_id"] == profile_id]

    def case_settings_by_case_id(self, case_id: str) -> dict | None:
        return self.settings

    def create_case_settings(self, values: dict) -> dict:
        self.settings = {"id": "settings", "created_at": "now", "updated_at": "now", **values}
        return self.settings

    def update_case_settings(self, case_id: str, values: dict) -> dict:
        self.settings.update(values)
        return self.settings

    def list_case_publications(self, case_id: str, scope=None, publication_status=None) -> list[dict]:
        return [row for row in self.publications if (not scope or row["scope"] == scope) and (not publication_status or row["status"] == publication_status)]

    def create_case_publication(self, values: dict) -> dict:
        row = {"id": f"pub-{len(self.publications)}", "created_at": "now", **values}
        self.publications.append(row)
        return row

    def update_case_publication(self, publication_id: str, values: dict) -> dict:
        row = next(row for row in self.publications if row["id"] == publication_id)
        row.update(values)
        return row

    def update_case(self, case_id: str, values: dict) -> dict:
        self.case.update(values)
        return self.case

    def list_cases(self) -> list[dict]:
        return [self.case]

    def list_active_profiles(self, role: str) -> list[dict]:
        return [{"id": str(VOLUNTEER_ID), "is_active": True, "is_verified": True, "role": role}]

    def create_timeline_event(self, values: dict) -> dict:
        self.events.append(values)
        return values

    def create_notification(self, values: dict) -> dict:
        self.notifications.append(values)
        return values


class PublicCaseTests(unittest.TestCase):
    def test_missing_settings_use_safe_defaults_and_manager_can_update(self) -> None:
        database = FakeDatabase()
        settings = public_cases.get_settings(database, user(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID)
        self.assertFalse(settings["allow_public_escalation"])
        updated = public_cases.update_settings(database, user(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID, CaseSettingsUpdate(allow_public_escalation=True, retention_days=90))
        self.assertTrue(updated["allow_public_escalation"])
        self.assertEqual(updated["retention_days"], 90)

    def test_volunteer_cannot_request_escalation(self) -> None:
        database = FakeDatabase()
        public_cases.get_settings(database, user(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID)
        with self.assertRaisesRegex(HTTPException, "authorized"):
            public_cases.request_escalation(database, user(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID, EscalationRequest(reason="Needs more eyes"))

    def test_approval_publishes_and_notifies_volunteers(self) -> None:
        database = FakeDatabase()
        public_cases.update_settings(database, user(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID, CaseSettingsUpdate(allow_public_escalation=True, retention_days=7))
        public_cases.request_escalation(database, user(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID, EscalationRequest(reason="Needs more eyes"))
        public_cases.approve_escalation(database, user(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID)
        self.assertEqual(database.case["status"], "PUBLIC_SEARCH")
        self.assertTrue(database.case["is_public"])
        self.assertEqual(database.publications[0]["status"], "ACTIVE")
        self.assertEqual(database.events[-1]["event_type"], "PUBLIC_SEARCH_STARTED")
        self.assertIn("CASE_PUBLIC", [notification["type"] for notification in database.notifications])

    def test_volunteer_cannot_approve_escalation(self) -> None:
        database = FakeDatabase()
        # Enable public escalation and create a pending request
        public_cases.update_settings(database, user(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID, CaseSettingsUpdate(allow_public_escalation=True, retention_days=7))
        public_cases.request_escalation(database, user(UserRole.CASE_MANAGER, MANAGER_ID), CASE_ID, EscalationRequest(reason="Needs more eyes"))
        # Volunteer attempts approval
        with self.assertRaisesRegex(HTTPException, "authorized"):
            public_cases.approve_escalation(database, user(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID)

    def test_public_projection_hides_location_when_disabled(self) -> None:
        database = FakeDatabase()
        database.case.update({"status": "PUBLIC_SEARCH", "is_public": True, "public_at": "now"})
        database.settings = {"id": "settings", "case_id": str(CASE_ID), "allow_location_sharing": False, "allow_public_sightings": True, "allow_photo_reports": False, "allow_public_escalation": True, "auto_expire_publication": False, "retention_days": 30}
        database.publications.append({"id": "pub", "scope": "PUBLIC", "status": "ACTIVE", "expires_at": None})
        self.assertIsNone(public_cases.public_case(database, CASE_ID)["last_seen_location"])

    def test_expiry_retracts_public_case_without_resolving(self) -> None:
        database = FakeDatabase()
        database.case.update({"status": "PUBLIC_SEARCH", "is_public": True})
        database.settings = {"id": "settings", "case_id": str(CASE_ID), "allow_location_sharing": False, "allow_public_sightings": True, "allow_photo_reports": False, "allow_public_escalation": True, "auto_expire_publication": True, "retention_days": 30}
        database.publications.append({"id": "pub", "scope": "PUBLIC", "status": "ACTIVE", "expires_at": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()})
        public_cases.expire_if_needed(database, CASE_ID)
        self.assertEqual(database.publications[0]["status"], "EXPIRED")
        self.assertFalse(database.case["is_public"])
        self.assertEqual(database.case["status"], "LOCAL_SEARCH_COMPLETED")

    def test_public_sighting_requires_setting(self) -> None:
        database = FakeDatabase()
        database.case.update({"status": "PUBLIC_SEARCH", "is_public": True})
        database.settings = {"id": "settings", "case_id": str(CASE_ID), "allow_public_sightings": False}
        with self.assertRaisesRegex(HTTPException, "disabled"):
            reports.create_witness(database, user(UserRole.VOLUNTEER, VOLUNTEER_ID), CASE_ID, WitnessCreate(description="Seen"))


if __name__ == "__main__":
    unittest.main()