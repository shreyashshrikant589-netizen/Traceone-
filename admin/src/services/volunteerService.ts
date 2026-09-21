import { teams, volunteers } from '../data/volunteers';
import type { Team, Volunteer } from '../data/volunteers';
import { mockResponse, type ApiResponse, type ServiceOptions } from './api';

export function fetchVolunteers(_options?: ServiceOptions): Promise<ApiResponse<Volunteer[]>> {
  return mockResponse(volunteers);
}

export function fetchVolunteer(volunteerId: string, _options?: ServiceOptions): Promise<ApiResponse<Volunteer | undefined>> {
  return mockResponse(volunteers.find((volunteer) => volunteer.id === volunteerId));
}

export function fetchTeams(_options?: ServiceOptions): Promise<ApiResponse<Team[]>> {
  return mockResponse(teams);
}
