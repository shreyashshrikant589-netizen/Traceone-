import { caseList, caseTimeline } from '../data/dashboard';
import type { CaseItem, CaseTimelineEvent } from '../types';
import { mockResponse, type ApiResponse, type ServiceOptions } from './api';

export type CaseQuery = { search?: string; status?: CaseItem['status'] };

export function fetchCases(_query: CaseQuery = {}, _options?: ServiceOptions): Promise<ApiResponse<CaseItem[]>> {
  return mockResponse(caseList);
}

export function fetchCase(caseId: string, _options?: ServiceOptions): Promise<ApiResponse<CaseItem | undefined>> {
  return mockResponse(caseList.find((item) => item.id === caseId));
}

export function fetchCaseTimeline(_caseId: string, _options?: ServiceOptions): Promise<ApiResponse<CaseTimelineEvent[]>> {
  return mockResponse(caseTimeline);
}
