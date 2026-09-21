"""Small deterministic geographic distance helper for allocation."""

from __future__ import annotations

import math

from ai.allocation.constraints import has_valid_coordinates


def calculate_distance_km(lat1: float | None, lon1: float | None, lat2: float | None, lon2: float | None) -> float | None:
    """Return Haversine distance in kilometers, or None when coordinates are unavailable."""
    if not all(has_valid_coordinates(latitude, longitude) for latitude, longitude in ((lat1, lon1), (lat2, lon2))):
        return None
    earth_radius_km = 6371.0088
    latitude_one, latitude_two = math.radians(lat1), math.radians(lat2)
    delta_latitude = math.radians(lat2 - lat1)
    delta_longitude = math.radians(lon2 - lon1)
    haversine = math.sin(delta_latitude / 2) ** 2 + math.cos(latitude_one) * math.cos(latitude_two) * math.sin(delta_longitude / 2) ** 2
    return round(earth_radius_km * 2 * math.asin(math.sqrt(max(0.0, min(1.0, haversine)))), 4)
