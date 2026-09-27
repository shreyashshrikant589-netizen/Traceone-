export type Metric = {
  label: string;
  value: string;
  trend: string;
  positive?: boolean;
};

export type AlertItem = {
  id: string;
  title: string;
  time: string;
  severity: 'critical' | 'warning' | 'info';
  detail: string;
};

export type CaseStatus = 'Active' | 'Critical' | 'Searching' | 'Resolved' | 'Escalated' | 'Closed';

export type CasePriority = 'High' | 'Medium' | 'Low';

export type CaseItem = {
  id: string;
  missingPerson: string;
  age: number;
  location: string;
  createdAt: string;
  assignedTeams: string[];
  caseManager: string;
  status: CaseStatus;
  priority: CasePriority;
  updatedAt: string;
};

export type CaseTimelineEvent = {
  id: string;
  title: string;
  detail: string;
  actor: string;
  timestamp: string;
  type: 'case' | 'search' | 'sighting' | 'escalation';
};
