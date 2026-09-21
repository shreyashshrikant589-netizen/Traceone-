export type PoliceStatus = 'PENDING' | 'NOTIFIED' | 'ACKNOWLEDGED' | 'CLOSED';
export type ManagerAction = 'PUBLISH_CASE' | 'NOTIFY_POLICE';

export type ManagerOverview = {
  activeCases: number;
  searchCoverage: number;
  activeVolunteers: number;
  priorityZones: number;
  evidence: number;
  witnessReports: number;
  pendingEscalation: number;
  possibleMatches: number;
  policeStatus: PoliceStatus;
};

export interface ManagerService {
  getOverview(): Promise<ManagerOverview>;
  publishCase(caseId: string): Promise<void>;
  notifyPolice(caseId: string): Promise<void>;
}
