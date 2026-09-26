import type { CaseDetail, CaseTimelineEvent } from './caseDetails';

export const mockCaseDetail: CaseDetail = {
  name: 'Aarohi Sharma', age: 24, gender: 'Female', status: 'LOCAL_SEARCH', location: 'North District · Community Park', lastSeenTime: 'Today, 08:40', clothing: 'Blue denim jacket, white sneakers, black backpack', physicalDescription: 'Long dark hair, approximately 165 cm, small birthmark near left cheek.', knownDestination: 'Expected at Central Library', direction: 'North toward the transit entrance', searchProgress: 68, searchZones: 8, completedZones: 5, volunteerCount: 18, evidenceCount: 4, priority: 'High',
};

export const mockCaseTimeline: CaseTimelineEvent[] = [
  { type: 'CASE_CREATED', title: 'Case Created', description: 'Missing-person report was submitted and shared with the response team.', timestamp: 'Today, 08:42' },
  { type: 'LOCAL_SEARCH_STARTED', title: 'Local Search Started', description: 'Initial search was activated for the North District.', timestamp: 'Today, 08:49' },
  { type: 'VOLUNTEER_JOINED', title: 'Volunteer Joined', description: 'A new authorized volunteer joined the local response team.', timestamp: 'Today, 08:56' },
  { type: 'SEARCH_ZONE_ASSIGNED', title: 'Search Zone Assigned', description: 'Zone 04 was assigned to the North District team.', timestamp: 'Today, 09:02' },
  { type: 'EVIDENCE_SUBMITTED', title: 'Evidence Submitted', description: 'A verified backpack observation was added to the case.', timestamp: 'Today, 09:18' },
  { type: 'WITNESS_REPORT', title: 'Witness Report', description: 'A witness reported seeing someone matching the description near the park entrance.', timestamp: 'Today, 09:27' },
  { type: 'PRIORITY_UPDATED', title: 'Priority Updated', description: 'Search priority was raised after the witness report was reviewed.', timestamp: 'Today, 09:35' },
  { type: 'PUBLIC_ESCALATION', title: 'Public Escalation', description: 'Coordinator review is required before public escalation.', timestamp: 'Today, 09:44' },
  { type: 'PUBLIC_SEARCH', title: 'Public Search', description: 'Approved public search guidance was published to the response network.', timestamp: 'Today, 10:02' },
  { type: 'POSSIBLE_MATCH', title: 'Possible Match', description: 'A possible match was flagged for human verification.', timestamp: 'Today, 10:16' },
  { type: 'HUMAN_VERIFICATION', title: 'Human Verification', description: 'The response team is reviewing the possible match against verified details.', timestamp: 'Today, 10:24' },
  { type: 'POLICE_NOTIFICATION', title: 'Police Notification', description: 'Relevant authorities were notified through the authorized response process.', timestamp: 'Today, 10:31' },
];
