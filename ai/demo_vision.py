"""Synthetic possible-match vision demonstration."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

if __package__ in (None, ""):
    repo_root = Path(__file__).resolve().parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

from ai.vision.match import compare_faces
from ai.vision.quality import check_image_quality


def main() -> None:
    reference = np.arange(32 * 32, dtype=float).reshape(32, 32)
    candidate = {
        "pixels": np.concatenate([reference, np.zeros((32, 32))], axis=1),
        "face_boxes": [
            {"x": 0, "y": 0, "width": 32, "height": 32},
            {"x": 32, "y": 0, "width": 32, "height": 32},
        ],
    }
    result = compare_faces(reference, candidate)

    print("TraceOne Possible Match / Computer Vision Demo")
    print("DEMO ONLY - synthetic image data; not production identity verification.\n")
    print(f"Reference image quality: {check_image_quality(reference).model_dump()}")
    print(f"Candidate image quality: {result.candidate_quality.model_dump() if result.candidate_quality else None}")
    for candidate_result in result.candidates:
        print(f"Candidate face ID: {candidate_result.candidate_face_id}")
        print(f"Similarity score: {candidate_result.similarity_score:.4f}")
        print(f"Status: {candidate_result.status.value}")
        print(f"Needs human verification: {candidate_result.requires_human_verification}")
    print(f"Best overall status: {result.status.value}")
    print(f"Model version: {result.model_version}")
    print(f"Explanation: {result.explanation}")


if __name__ == "__main__":
    main()
