import unittest

import numpy as np

from ai.vision.detection import detect_faces
from ai.vision.embeddings import generate_face_embedding
from ai.vision.match import compare_faces
from ai.vision.quality import check_image_quality
from ai.vision.schemas import MatchStatus
from ai.vision.similarity import cosine_similarity


class TestVisionMVP(unittest.TestCase):
    def setUp(self):
        self.reference = np.arange(32 * 32, dtype=float).reshape(32, 32)
        self.candidate = {
            "pixels": np.concatenate([self.reference, np.zeros((32, 32))], axis=1),
            "face_boxes": [
                {"x": 0, "y": 0, "width": 32, "height": 32},
                {"x": 32, "y": 0, "width": 32, "height": 32},
            ],
        }

    def test_image_quality_accepts_valid_synthetic_image(self):
        result = check_image_quality(self.reference)
        self.assertTrue(result.is_acceptable)
        self.assertEqual((result.width, result.height), (32, 32))
        self.assertGreater(result.quality_score, 0)

    def test_invalid_empty_image_handling(self):
        result = check_image_quality(np.array([]))
        self.assertFalse(result.is_acceptable)
        self.assertTrue(result.issues)

    def test_minimum_dimension_handling(self):
        result = check_image_quality(np.zeros((4, 4)))
        self.assertFalse(result.is_acceptable)
        self.assertTrue(any("dimensions" in issue for issue in result.issues))

    def test_cosine_similarity_identical_vectors(self):
        self.assertEqual(cosine_similarity([1, 2, 3], [1, 2, 3]), 1.0)

    def test_cosine_similarity_different_vectors(self):
        self.assertEqual(cosine_similarity([1, 0], [0, 1]), 0.0)

    def test_zero_vector_handling(self):
        self.assertEqual(cosine_similarity([0, 0], [1, 0]), 0.0)

    def test_dimension_mismatch_handling(self):
        self.assertEqual(cosine_similarity([1, 0], [1, 0, 0]), 0.0)

    def test_representation_is_deterministic(self):
        first = generate_face_embedding(self.reference)
        second = generate_face_embedding(self.reference)
        np.testing.assert_array_equal(first, second)

    def test_representation_is_normalized(self):
        embedding = generate_face_embedding(self.reference)
        self.assertAlmostEqual(float(np.linalg.norm(embedding)), 1.0)
        self.assertEqual(embedding.shape, (64,))

    def test_possible_match_result_structure(self):
        result = compare_faces(self.reference, {"pixels": self.reference})
        self.assertEqual(result.status, MatchStatus.HIGH_SIMILARITY_REVIEW)
        self.assertIsNotNone(result.similarity_score)
        self.assertTrue(result.requires_human_verification)
        self.assertEqual(result.model_version, "vision-mvp-0.1")

    def test_human_verification_is_always_required(self):
        result = compare_faces(self.reference, {"pixels": self.reference})
        self.assertTrue(result.requires_human_verification)
        self.assertTrue(all(candidate.requires_human_verification for candidate in result.candidates))

    def test_status_never_becomes_verified(self):
        result = compare_faces(self.reference, {"pixels": self.reference})
        self.assertNotEqual(result.status.value, "VERIFIED")
        self.assertNotIn("confirmed", result.explanation.lower())

    def test_multiple_candidate_handling(self):
        detections = detect_faces(self.candidate)
        self.assertEqual(len(detections), 2)
        result = compare_faces(self.reference, self.candidate)
        self.assertEqual(len(result.candidates), 2)

    def test_candidate_ranking_by_similarity(self):
        result = compare_faces(self.reference, self.candidate)
        self.assertEqual(result.candidates[0].candidate_face_id, "face_1")
        self.assertGreater(result.candidates[0].similarity_score, result.candidates[1].similarity_score)

    def test_low_similarity_handling(self):
        result = compare_faces(self.reference, {"pixels": np.zeros((32, 32))})
        self.assertEqual(result.status, MatchStatus.NO_MATCH)

    def test_quality_rejection_is_structured(self):
        result = compare_faces(np.zeros((4, 4)), self.reference)
        self.assertEqual(result.status, MatchStatus.QUALITY_REJECTED)
        self.assertTrue(result.requires_human_verification)

    def test_explanation_makes_no_identity_claim(self):
        result = compare_faces(self.reference, {"pixels": self.reference})
        explanation = result.explanation.lower()
        self.assertIn("similarity", explanation)
        self.assertIn("human verification", explanation)
        self.assertNotIn("identity confirmed", explanation)
        self.assertNotIn("this is the missing person", explanation)


if __name__ == "__main__":
    unittest.main()
