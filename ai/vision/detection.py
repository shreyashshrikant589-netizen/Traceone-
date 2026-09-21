"""Face-detection adapter for the deterministic vision MVP.

This module does not perform real face detection. It accepts explicit synthetic face
boxes for tests and otherwise uses the complete valid image as a placeholder region.
The adapter boundary is intended for a reviewed detector in a future implementation.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from ai.vision.quality import image_pixels
from ai.vision.schemas import FaceBoundingBox, FaceDetection


def _boxes_from_image(image: Any) -> list[Any]:
    if isinstance(image, dict):
        return list(image.get("face_boxes", image.get("faces", [])))
    return []


def _coerce_box(box: Any, index: int, width: int, height: int) -> FaceDetection | None:
    if isinstance(box, dict):
        values = (box.get("x"), box.get("y"), box.get("width"), box.get("height"))
    else:
        values = tuple(box) if isinstance(box, (list, tuple)) else ()
    if len(values) != 4 or any(value is None for value in values):
        return None
    x, y, box_width, box_height = (int(value) for value in values)
    x = max(0, min(x, width - 1))
    y = max(0, min(y, height - 1))
    box_width = max(1, min(box_width, width - x))
    box_height = max(1, min(box_height, height - y))
    return FaceDetection(face_id=f"face_{index}", bounding_box=FaceBoundingBox(x=x, y=y, width=box_width, height=box_height), confidence=0.5)


def detect_faces(image: Any) -> list[FaceDetection]:
    """Return deterministic placeholder detections for a valid image."""
    pixels = image_pixels(image)
    if pixels is None or pixels.ndim not in (2, 3) or pixels.size == 0:
        return []
    height, width = int(pixels.shape[0]), int(pixels.shape[1])
    configured_boxes = _boxes_from_image(image)
    if configured_boxes:
        detections = [_coerce_box(box, index + 1, width, height) for index, box in enumerate(configured_boxes)]
        return [detection for detection in detections if detection is not None]
    return [FaceDetection(face_id="face_1", bounding_box=FaceBoundingBox(x=0, y=0, width=width, height=height), confidence=0.5)]


def crop_face(image: Any, detection: FaceDetection) -> np.ndarray:
    """Crop a detected region from an image or synthetic image mapping."""
    pixels = image_pixels(image)
    if pixels is None:
        raise ValueError("Cannot crop a missing image.")
    box = detection.bounding_box
    return pixels[box.y : box.y + box.height, box.x : box.x + box.width]
