export type PriorityChange = 'UP' | 'DOWN' | 'UNCHANGED';

export type AIPriorityResult = {
  zoneId: string;
  priority: number;
  reasons: string[];
  updatedAt: string;
  change?: PriorityChange;
  previousPriority?: number;
};

export interface AIPriorityService {
  getSearchPriority(caseId: string): Promise<AIPriorityResult[]>;
}
