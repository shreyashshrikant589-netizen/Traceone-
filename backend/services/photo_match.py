from dataclasses import dataclass


def unavailable_result() -> "PhotoMatchResult":
    return PhotoMatchResult(similarity_score=None, model_version=None, available=False)


@dataclass(frozen=True)
class PhotoMatchResult:
    similarity_score: float | None
    model_version: str | None
    available: bool


class PhotoMatchService:
    """Adapter boundary for a future real image-matching implementation."""

    def analyze(self, source_image_url: str, candidate_image_url: str) -> PhotoMatchResult:
        return unavailable_result()


def safe_analyze(matcher: PhotoMatchService, source_image_url: str, candidate_image_url: str) -> PhotoMatchResult:
    """Validate a future model boundary without allowing it to affect persistence unsafely."""
    try:
        result = matcher.analyze(source_image_url, candidate_image_url)
        similarity_score = getattr(result, "similarity_score", None)
        model_version = getattr(result, "model_version", None)
        available = bool(getattr(result, "available", False))
        if similarity_score is None:
            return unavailable_result()
        if not isinstance(similarity_score, (int, float)) or not 0 <= float(similarity_score) <= 1:
            return unavailable_result()
        if not isinstance(model_version, str) or not model_version.strip() or not available:
            return unavailable_result()
        return PhotoMatchResult(similarity_score=float(similarity_score), model_version=model_version, available=True)
    except Exception:
        return unavailable_result()