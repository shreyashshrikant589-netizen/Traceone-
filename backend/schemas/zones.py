from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class ZoneStatus(StrEnum):
    UNSEARCHED = "UNSEARCHED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    SEARCHED = "SEARCHED"
    REOPEN = "REOPEN"


class ZoneGeometry(BaseModel):
    type: str
    coordinates: list[Any]

    @model_validator(mode="after")
    def validate_geojson(self) -> "ZoneGeometry":
        if self.type not in {"Polygon", "MultiPolygon"}:
            raise ValueError("Geometry must be a Polygon or MultiPolygon.")
        polygons = [self.coordinates] if self.type == "Polygon" else self.coordinates
        if not polygons:
            raise ValueError("Geometry must contain at least one polygon.")
        for polygon in polygons:
            if not isinstance(polygon, list) or not polygon:
                raise ValueError("Polygon coordinates are invalid.")
            for ring in polygon:
                if not isinstance(ring, list) or len(ring) < 4 or ring[0] != ring[-1]:
                    raise ValueError("Each polygon ring must contain four closed points.")
                for point in ring:
                    if not isinstance(point, list) or len(point) < 2:
                        raise ValueError("Each coordinate must contain longitude and latitude.")
                    longitude, latitude = point[:2]
                    if not isinstance(longitude, (int, float)) or not isinstance(latitude, (int, float)):
                        raise ValueError("Coordinates must be numeric.")
                    if not -180 <= longitude <= 180 or not -90 <= latitude <= 90:
                        raise ValueError("Coordinates are outside valid bounds.")
        return self

    def as_multipolygon(self) -> dict[str, Any]:
        return {"type": "MultiPolygon", "coordinates": [self.coordinates] if self.type == "Polygon" else self.coordinates}


class ZoneCreate(BaseModel):
    name: str = Field(min_length=1, max_length=240)
    description: str | None = None
    geometry: ZoneGeometry


class ZoneAssign(BaseModel):
    volunteer_id: UUID


class ZoneStatusUpdate(BaseModel):
    status: ZoneStatus


class ZoneResponse(BaseModel):
    id: UUID
    case_id: UUID
    name: str
    description: str | None = None
    geometry: dict[str, Any]
    status: ZoneStatus
    priority_score: float | None = None
    priority_rank: int | None = None
    assigned_volunteer_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
