export type UserRole = 'volunteer' | 'coordinator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type CaseStatus = 'draft' | 'active' | 'paused' | 'resolved' | 'closed';

export type CaseListStatus = 'LOCAL_SEARCH' | 'PUBLIC_ESCALATION_PENDING' | 'PUBLIC_SEARCH' | 'SEARCH_COMPLETED' | 'CASE_RESOLVED';

export interface Case {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  coordinatorId: string;
  createdAt: string;
  updatedAt: string;
}

export type SearchZoneStatus = 'unassigned' | 'assigned' | 'in-progress' | 'complete';

export interface SearchZone {
  id: string;
  caseId: string;
  name: string;
  status: SearchZoneStatus;
}

export interface VolunteerAssignment {
  id: string;
  caseId: string;
  zoneId: string;
  volunteerId: string;
  assignedAt: string;
}

export interface Evidence {
  id: string;
  caseId: string;
  submittedBy: string;
  description: string;
  createdAt: string;
}

export interface Sighting {
  id: string;
  caseId: string;
  reportedBy: string;
  description: string;
  reportedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type SearchSessionStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface SearchSession {
  id: string;
  caseId: string;
  status: SearchSessionStatus;
  startsAt: string;
  endsAt?: string;
}
