export const mockDashboard = {
  user: { name: 'Nishant', initials: 'N' },
  activeSearch: {
    caseName: 'Aarohi Sharma',
    zone: 'North District · Zone 04',
    priority: 'High priority',
    status: 'IN_PROGRESS',
    progress: 68,
  },
  quickActions: ['Create Case', 'Join Case', 'Scan QR', 'Report Sighting'] as const,
  activeCases: [
    { name: 'Aarohi Sharma', reference: 'TO-2048', zone: 'North District', status: 'In progress', priority: 'High' },
    { name: 'Meera Kapoor', reference: 'TO-2042', zone: 'Riverside East', status: 'Assigned', priority: 'Standard' },
  ],
  volunteer: { zone: 'Zone 04 · Community Park', priority: 'High', progress: 68 },
  manager: { activeCases: 3, activeVolunteers: 18, coverage: 68, priorityZones: 4, pendingEscalation: 1 },
  reporter: { cases: 1, status: 'Local search active' },
} as const;
