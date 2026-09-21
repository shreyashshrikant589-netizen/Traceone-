"""Public APIs for the TraceOne possible-match vision MVP."""

from ai.vision.detection import detect_faces
from ai.vision.embeddings import generate_face_embedding
from ai.vision.match import compare_faces
from ai.vision.quality import check_image_quality
from ai.vision.schemas import FaceBoundingBox, FaceDetection, ImageQualityResult, MatchStatus, PossibleMatchCandidate, PossibleMatchResult
from ai.vision.similarity import classify_similarity, cosine_similarity

__all__ = [
	"FaceBoundingBox",
	"FaceDetection",
	"ImageQualityResult",
	"MatchStatus",
	"PossibleMatchCandidate",
	"PossibleMatchResult",
	"check_image_quality",
	"classify_similarity",
	"compare_faces",
	"cosine_similarity",
	"detect_faces",
	"generate_face_embedding",
]
