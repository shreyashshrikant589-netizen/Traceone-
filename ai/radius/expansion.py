"""Deterministic search-area expansion recommendations."""

from __future__ import annotations

from ai.radius.schemas import RadiusStage, SearchRadiusInput, SearchRadiusRecommendation

STAGE_RADII_KM = (1.0, 3.0, 7.0, 12.0, 20.0)
STAGES = tuple(RadiusStage)


def _current_stage(radius_km: float) -> int:
	if radius_km <= STAGE_RADII_KM[0]:
		return 0
	if radius_km <= STAGE_RADII_KM[1]:
		return 1
	if radius_km <= STAGE_RADII_KM[2]:
		return 2
	if radius_km <= STAGE_RADII_KM[3]:
		return 3
	return 4


def _score_input(data: SearchRadiusInput) -> tuple[float, list[str]]:
	score = 0.0
	reasons: list[str] = []
	if data.time_elapsed_min >= 60:
		score += 20
		reasons.append("Time elapsed supports considering a wider search area.")
	elif data.time_elapsed_min >= 30:
		score += 10
		reasons.append("Elapsed time provides a modest reason to review expansion.")
	if data.recent_sighting_count > 0:
		score += min(15, data.recent_sighting_count * 7.5)
		reasons.append("Recent sighting evidence supports focused expansion review.")
	if data.direction_match >= 0.7:
		score += 15
		reasons.append("Strong directional evidence supports expansion along the indicated route.")
	if 0 < data.exit_distance <= 2:
		score += 15
		reasons.append("Nearby exits support checking roads and exit routes.")
	if data.connectivity_score >= 0.7:
		score += 15
		reasons.append("Connectivity supports reviewing linked routes and transport nodes.")
	if data.destination_match >= 0.7:
		score += 10
		reasons.append("Destination alignment supports reviewing the known destination area.")
	if data.coverage_percent >= 80:
		score -= 25
		reasons.append("High search coverage reduces the need to repeat already-covered areas.")
	elif data.coverage_percent >= 60:
		score -= 10
		reasons.append("Existing coverage moderates the expansion recommendation.")
	return round(max(0.0, min(100.0, score)), 2), reasons


def recommend_search_radius(search_input: SearchRadiusInput | dict[str, object]) -> SearchRadiusRecommendation:
	"""Return a review-oriented search stage and radius recommendation."""
	data = search_input if isinstance(search_input, SearchRadiusInput) else SearchRadiusInput(**search_input)
	current_index = _current_stage(data.current_radius_km)
	score, reasons = _score_input(data)
	evidence_index = min(4, int(score // 20))
	target_index = max(current_index, evidence_index)
	if data.coverage_percent >= 80:
		target_index = current_index
	target_index = min(4, target_index)
	current_stage = STAGES[current_index]
	next_stage = STAGES[target_index] if target_index > current_index else None
	recommended_radius = max(data.current_radius_km, STAGE_RADII_KM[target_index])
	if next_stage is None:
		reasons.append("No additional stage is recommended from the available evidence.")
	confidence = round(min(1.0, 0.35 + len(reasons) * 0.08), 2)
	return SearchRadiusRecommendation(
		current_stage=current_stage,
		recommended_radius_km=round(recommended_radius, 2),
		next_stage=next_stage,
		expansion_score=score,
		confidence=confidence,
		reasons=reasons,
	)


recommend_radius_expansion = recommend_search_radius
