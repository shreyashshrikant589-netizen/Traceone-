"""Deterministic image representation for the vision MVP.

The output is a normalized pixel-feature vector, not a production face-recognition
embedding and not a biometric identity assertion.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from ai.vision.quality import image_pixels

EMBEDDING_DIMENSION = 64


def generate_face_embedding(face_crop: Any) -> np.ndarray:
    """Create a deterministic normalized representation from a synthetic face crop."""
    pixels = image_pixels(face_crop)
    if pixels is None or pixels.size == 0:
        raise ValueError("Cannot represent an empty face crop.")
    if pixels.ndim == 3:
        pixels = pixels.astype(float).mean(axis=2)
    else:
        pixels = pixels.astype(float)
    if not np.isfinite(pixels).all():
        raise ValueError("Face crop contains invalid numeric values.")
    values = np.resize(pixels.reshape(-1), EMBEDDING_DIMENSION)
    values -= values.min()
    maximum = values.max()
    if maximum > 0:
        values /= maximum
    norm = float(np.linalg.norm(values))
    if norm == 0:
        return np.zeros(EMBEDDING_DIMENSION, dtype=float)
    return values / norm
