export type VolunteerAssignmentStatus = 'UNSEARCHED' | 'ASSIGNED' | 'IN_PROGRESS' | 'SEARCHED' | 'REOPEN';

export type VolunteerAssignmentView = {
  caseName: string;
  missingPerson: string;
  assignedZone: string;
  priority: 'Critical' | 'High' | 'Standard';
  status: VolunteerAssignmentStatus;
  instructions: string;
};

export type SearchZoneView = {
  name: string;
  priorityScore: number;
  status: VolunteerAssignmentStatus;
  reason: string;
};

export interface VolunteerService {
  getMyAssignment(): Promise<VolunteerAssignmentView | null>;
  listSearchZones(): Promise<SearchZoneView[]>;
}
