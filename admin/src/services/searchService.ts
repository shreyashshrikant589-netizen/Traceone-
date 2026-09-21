import { operationsTeams, operationsZones } from '../data/operations';
import { searchZones } from '../data/searchZones';
import type { OperationsTeam, OperationsZone } from '../data/operations';
import type { SearchZone } from '../data/searchZones';
import { mockResponse, type ApiResponse, type ServiceOptions } from './api';

export function fetchSearchZones(_options?: ServiceOptions): Promise<ApiResponse<SearchZone[]>> {
  return mockResponse(searchZones);
}

export function fetchOperationsZones(_options?: ServiceOptions): Promise<ApiResponse<OperationsZone[]>> {
  return mockResponse(operationsZones);
}

export function fetchOperationsTeams(_options?: ServiceOptions): Promise<ApiResponse<OperationsTeam[]>> {
  return mockResponse(operationsTeams);
}
