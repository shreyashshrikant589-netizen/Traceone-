export type PriorityChange = 'UP' | 'DOWN' | 'UNCHANGED';

export type AIPriorityResult = {
  zoneId: string;
  priority: number;
  reasons: string[];
  updatedAt: string;
  change?: PriorityChange;
  previousPriority?: number;
  rank?: number;
  confidence?: number;
  modelVersion?: string;
};

export type EvidenceGraphNode = { id: string; node_type: string; reference_id?: string | null; location?: Record<string, unknown> | null; timestamp?: string | null; description?: string | null; confidence: number };
export type EvidenceGraphEdge = { id: string; source_node_id: string; target_node_id: string; relationship_type: string; weight: number; confidence: number };
export type EvidenceGraph = { nodes: EvidenceGraphNode[]; edges: EvidenceGraphEdge[] };
export type ZoneAIExplanation = { zone_id: string; priority_score: number; confidence: number; model_version: string; explanation: string; supporting_evidence: Array<{ node_type: string; description?: string | null; confidence: number }> };

export interface AIPriorityService {
  getSearchPriority(caseId: string): Promise<AIPriorityResult[]>;
}
