import type { AIPriorityResult } from './aiPriority';

export const mockAIPriorityResults: AIPriorityResult[] = [
  { zoneId: 'Zone A', priority: 87, reasons: ['Near last known location', 'Recent witness report'], updatedAt: 'Updated 12 min ago', change: 'UP', previousPriority: 79 },
  { zoneId: 'Zone B', priority: 74, reasons: ['Exit proximity', 'Crowd flow'], updatedAt: 'Updated 18 min ago', change: 'UNCHANGED', previousPriority: 74 },
  { zoneId: 'Zone C', priority: 61, reasons: ['Not searched yet', 'Exit proximity'], updatedAt: 'Updated 31 min ago', change: 'DOWN', previousPriority: 68 },
  { zoneId: 'Zone D', priority: 32, reasons: ['Crowd flow', 'Not searched yet'], updatedAt: 'Updated 45 min ago', change: 'UP', previousPriority: 27 },
];

export const mockWitnessPriorityResults: AIPriorityResult[] = [
  { zoneId: 'Parking', priority: 94, reasons: ['Child moving toward parking', 'Near last known location'], updatedAt: 'Updated just now', change: 'UP', previousPriority: 82 },
  { zoneId: 'Exit', priority: 87, reasons: ['Child moving toward parking', 'Exit proximity'], updatedAt: 'Updated just now', change: 'UP', previousPriority: 70 },
  { zoneId: 'Food Court', priority: 48, reasons: ['Not searched yet', 'Crowd flow'], updatedAt: 'Updated just now', change: 'DOWN', previousPriority: 55 },
];

export const mockBeforeWitnessResults: AIPriorityResult[] = [
  { zoneId: 'Parking', priority: 82, reasons: ['Near last known location'], updatedAt: 'Before witness report', change: 'UNCHANGED' },
  { zoneId: 'Exit', priority: 70, reasons: ['Exit proximity'], updatedAt: 'Before witness report', change: 'UNCHANGED' },
  { zoneId: 'Food Court', priority: 55, reasons: ['Not searched yet'], updatedAt: 'Before witness report', change: 'UNCHANGED' },
];
