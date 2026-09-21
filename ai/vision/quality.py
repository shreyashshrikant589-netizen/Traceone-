"""Basic, dependency-light image quality checks for synthetic MVP inputs."""

from __future__ import annotations

from typing import Any

import numpy as np

from ai.vision.schemas import ImageQualityResult

MIN_DIMENSION = 16


def image_pixels(image: Any) -> np.ndarray | None:
	"""Return pixels from an ndarray, array-like value, or synthetic image mapping."""
	if image is None:
		return None
	if isinstance(image, dict):
		image = image.get("pixels")
	try:
		return np.asarray(image)
	except (TypeError, ValueError):
		return None


def check_image_quality(image: Any) -> ImageQualityResult:
	"""Check image integrity and dimensions without making identity claims."""
	pixels = image_pixels(image)
	issues: list[str] = []
	if pixels is None or pixels.size == 0:
		return ImageQualityResult(is_acceptable=False, width=0, height=0, quality_score=0.0, issues=["image is missing or empty"])
	if pixels.ndim not in (2, 3):
		return ImageQualityResult(is_acceptable=False, width=0, height=0, quality_score=0.0, issues=["image must be a 2D grayscale or 3D color array"])

	height, width = int(pixels.shape[0]), int(pixels.shape[1])
	if width < MIN_DIMENSION or height < MIN_DIMENSION:
		issues.append(f"image dimensions are below {MIN_DIMENSION}x{MIN_DIMENSION}")
	if not np.issubdtype(pixels.dtype, np.number):
		issues.append("image pixels must be numeric")
	elif not np.isfinite(pixels).all():
		issues.append("image contains invalid numeric values")

	dimension_score = min(1.0, min(width, height) / 128.0)
	quality_score = round(max(0.0, min(1.0, 0.5 + 0.5 * dimension_score)), 4)
	if issues:
		quality_score = round(quality_score * 0.5, 4)
	return ImageQualityResult(is_acceptable=not issues, width=width, height=height, quality_score=quality_score, issues=issues)
