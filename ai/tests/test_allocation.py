import unittest

from ai.allocation import VolunteerInput, VolunteerStatus, ZoneInput, ZoneStatus, allocate_volunteers


class TestVolunteerAllocation(unittest.TestCase):
    def volunteer(self, volunteer_id="v1", **overrides):
        values = {
            "volunteer_id": volunteer_id,
            "latitude": 18.5204,
            "longitude": 73.8567,
            "available": True,
            "current_assignment_count": 0,
            "max_capacity": 1,
            "skills": [],
            "status": VolunteerStatus.AVAILABLE,
        }
        values.update(overrides)
        return VolunteerInput(**values)

    def zone(self, zone_id="z1", **overrides):
        values = {
            "zone_id": zone_id,
            "priority_score": 80.0,
            "latitude": 18.5204,
            "longitude": 73.8567,
            "required_volunteers": 1,
            "coverage_percent": 10.0,
            "status": ZoneStatus.UNSEARCHED,
        }
        values.update(overrides)
        return ZoneInput(**values)

    def test_basic_assignment(self):
        result = allocate_volunteers([self.volunteer()], [self.zone()])
        self.assertEqual(len(result.assignments), 1)
        self.assertEqual(result.assignments[0].volunteer_id, "v1")

    def test_high_priority_zone_is_considered_first(self):
        zones = [self.zone("low", priority_score=20), self.zone("high", priority_score=90)]
        result = allocate_volunteers([self.volunteer()], zones)
        self.assertEqual(result.assignments[0].zone_id, "high")
        self.assertIn("low", result.unfilled_zones)

    def test_capacity_is_respected(self):
        result = allocate_volunteers([self.volunteer(max_capacity=1)], [self.zone("z1"), self.zone("z2")])
        self.assertEqual(len(result.assignments), 1)

    def test_unavailable_volunteer_is_ignored(self):
        result = allocate_volunteers([self.volunteer(available=False)], [self.zone()])
        self.assertEqual(result.assignments, [])
        self.assertEqual(result.unfilled_zones, ["z1"])

    def test_searched_zone_is_ignored(self):
        result = allocate_volunteers([self.volunteer()], [self.zone(status=ZoneStatus.SEARCHED)])
        self.assertEqual(result.assignments, [])
        self.assertEqual(result.unfilled_zones, [])

    def test_insufficient_volunteers_are_reported(self):
        result = allocate_volunteers([self.volunteer()], [self.zone(required_volunteers=2)])
        self.assertEqual(len(result.assignments), 1)
        self.assertEqual(result.unfilled_zones, ["z1"])

    def test_distance_affects_assignment_preference(self):
        volunteers = [
            self.volunteer("near", latitude=18.5204, longitude=73.8567),
            self.volunteer("far", latitude=19.0760, longitude=72.8777),
        ]
        result = allocate_volunteers(volunteers, [self.zone()])
        self.assertEqual(result.assignments[0].volunteer_id, "near")

    def test_coverage_affects_zone_need(self):
        zones = [self.zone("high-coverage", priority_score=80, coverage_percent=90), self.zone("low-coverage", priority_score=80, coverage_percent=10)]
        result = allocate_volunteers([self.volunteer()], zones)
        self.assertEqual(result.assignments[0].zone_id, "low-coverage")

    def test_reopened_zone_can_receive_assignment(self):
        result = allocate_volunteers([self.volunteer()], [self.zone(status=ZoneStatus.REOPENED)])
        self.assertEqual(len(result.assignments), 1)

    def test_repeated_allocation_has_same_assignments(self):
        volunteers = [self.volunteer("v1"), self.volunteer("v2", latitude=18.53)]
        zones = [self.zone("z1", priority_score=90), self.zone("z2", priority_score=50)]
        first = allocate_volunteers(volunteers, zones)
        second = allocate_volunteers(volunteers, zones)
        self.assertEqual([a.model_dump(exclude_none=True) for a in first.assignments], [a.model_dump(exclude_none=True) for a in second.assignments])

    def test_assignment_contains_required_fields_and_review(self):
        assignment = allocate_volunteers([self.volunteer()], [self.zone()]).assignments[0]
        self.assertTrue(assignment.assignment_id)
        self.assertTrue(assignment.reason)
        self.assertTrue(assignment.requires_review)

    def test_busy_volunteer_and_full_capacity_are_not_assigned(self):
        volunteers = [
            self.volunteer("busy", status=VolunteerStatus.BUSY),
            self.volunteer("full", current_assignment_count=1),
        ]
        result = allocate_volunteers(volunteers, [self.zone()])
        self.assertEqual(result.assignments, [])

    def test_multiple_volunteers_can_fill_zone(self):
        result = allocate_volunteers([self.volunteer("v1"), self.volunteer("v2")], [self.zone(required_volunteers=2)])
        self.assertEqual({assignment.volunteer_id for assignment in result.assignments}, {"v1", "v2"})

    def test_no_assignment_violates_basic_constraints(self):
        volunteers = [self.volunteer("v1"), self.volunteer("v2", available=False)]
        zones = [self.zone(required_volunteers=2)]
        result = allocate_volunteers(volunteers, zones)
        self.assertEqual([assignment.volunteer_id for assignment in result.assignments], ["v1"])
        self.assertNotIn("v2", [assignment.volunteer_id for assignment in result.assignments])


if __name__ == "__main__":
    unittest.main()
