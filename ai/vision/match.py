"""Possible-match pipeline for explicitly supplied case images."""

from __future__ import annotations

from typing import Any

from ai.vision.detection import crop_face, detect_faces
from ai.vision.embeddings import generate_face_embedding
from ai.vision.quality import check_image_quality
from ai.vision.schemas import MatchStatus, PossibleMatchCandidate, PossibleMatchResult
from ai.vision.similarity import classify_similarity, cosine_similarity


def compare_faces(reference_image: Any, candidate_image: Any) -> PossibleMatchResult:
    """Compare supplied images and return ranked similarity signals for human review."""
    reference_quality = check_image_quality(reference_image)
    candidate_quality = check_image_quality(candidate_image)
    if not reference_quality.is_acceptable or not candidate_quality.is_acceptable:
        return PossibleMatchResult(
            status=MatchStatus.QUALITY_REJECTED,
            explanation="One or more supplied images did not pass basic quality checks. Human review is required.",
            reference_quality=reference_quality,
            candidate_quality=candidate_quality,
        )

    reference_faces = detect_faces(reference_image)
    candidate_faces = detect_faces(candidate_image)
    if not reference_faces or not candidate_faces:
        return PossibleMatchResult(
            status=MatchStatus.NO_FACE_DETECTED,
            explanation="No usable face region was available for prototype comparison. Human review is required.",
            reference_quality=reference_quality,
            candidate_quality=candidate_quality,
        )

    reference_face = reference_faces[0]
    reference_embedding = generate_face_embedding(crop_face(reference_image, reference_face))
    candidates: list[PossibleMatchCandidate] = []
    for candidate_face in candidate_faces:
        candidate_embedding = generate_face_embedding(crop_face(candidate_image, candidate_face))
        score = cosine_similarity(reference_embedding, candidate_embedding)
        candidates.append(PossibleMatchCandidate(candidate_face_id=candidate_face.face_id, similarity_score=score, status=classify_similarity(score)))
    candidates.sort(key=lambda candidate: candidate.similarity_score, reverse=True)
    best = candidates[0]
    return PossibleMatchResult(
        status=best.status,
        similarity_score=best.similarity_score,
        reference_face_id=reference_face.face_id,
        candidate_face_id=best.candidate_face_id,
        candidates=candidates,
        explanation="Face representations show a prototype similarity score. Human verification is required; this is not identity confirmation.",
        reference_quality=reference_quality,
        candidate_quality=candidate_quality,
    )
