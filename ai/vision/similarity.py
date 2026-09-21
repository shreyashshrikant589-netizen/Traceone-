"""Similarity calculations and review-oriented status classification."""

from __future__ import annotations

from typing import Iterable

import numpy as np

from ai.vision.schemas import MatchStatus

POSSIBLE_MATCH_THRESHOLD = 0.65
HIGH_SIMILARITY_THRESHOLD = 0.85


def cosine_similarity(embedding_a: Iterable[float], embedding_b: Iterable[float]) -> float:
    """Return safe cosine similarity, mapped to 0..1 for non-negative vectors."""
    vector_a = np.asarray(list(embedding_a), dtype=float).reshape(-1)
    vector_b = np.asarray(list(embedding_b), dtype=float).reshape(-1)
    if vector_a.size == 0 or vector_b.size == 0 or vector_a.size != vector_b.size:
        return 0.0
    if not np.isfinite(vector_a).all() or not np.isfinite(vector_b).all():
        return 0.0
    denominator = float(np.linalg.norm(vector_a) * np.linalg.norm(vector_b))
    if denominator == 0:
        return 0.0
    raw_score = float(np.dot(vector_a, vector_b) / denominator)
    return round(max(0.0, min(1.0, raw_score)), 6)


def classify_similarity(score: float) -> MatchStatus:
    """Classify a prototype score for review; no classification means identity."""
    if score >= HIGH_SIMILARITY_THRESHOLD:
        return MatchStatus.HIGH_SIMILARITY_REVIEW
    if score >= POSSIBLE_MATCH_THRESHOLD:
        return MatchStatus.POSSIBLE_MATCH
    if score > 0:
        return MatchStatus.LOW_SIMILARITY
    return MatchStatus.NO_MATCH
