"""Independent eligibility constraints for volunteer allocation."""

from __future__ import annotations

import math

from ai.allocation.schemas import VolunteerInput, VolunteerStatus, ZoneInput, ZoneStatus


def has_valid_coordinates(latitude: float | None, longitude: float | None) -> bool:
    """Return whether both supplied coordinates are within valid geographic ranges."""
    if latitude is None or longitude is None:
        return False
    return math.isfinite(latitude) and math.isfinite(longitude) and -90 <= latitude <= 90 and -180 <= longitude <= 180


def is_volunteer_available(volunteer: VolunteerInput) -> bool:
    """Return whether a volunteer is currently available for assignment."""
    return volunteer.available and volunteer.status == VolunteerStatus.AVAILABLE


def has_remaining_capacity(volunteer: VolunteerInput) -> bool:
    """Return whether the volunteer can accept another assignment."""
    return volunteer.current_assignment_count < volunteer.max_capacity


def is_volunteer_eligible(volunteer: VolunteerInput, require_location: bool = False) -> bool:
    """Check availability, remaining capacity, and optional location requirements."""
    if not is_volunteer_available(volunteer) or not has_remaining_capacity(volunteer):
        return False
    return not require_location or has_valid_coordinates(volunteer.latitude, volunteer.longitude)


def is_zone_eligible(zone: ZoneInput) -> bool:
    """Return whether a zone can receive an assignment under MVP search rules."""
    if zone.status == ZoneStatus.SEARCHED:
        return False
    if zone.required_volunteers <= 0:
        return False
    return math.isfinite(zone.priority_score) and 0 <= zone.priority_score <= 100


def can_assign_volunteer_to_zone(volunteer: VolunteerInput, zone: ZoneInput, require_location: bool = False) -> bool:
    """Return whether both the volunteer and zone satisfy basic assignment constraints."""
    return is_volunteer_eligible(volunteer, require_location=require_location) and is_zone_eligible(zone)