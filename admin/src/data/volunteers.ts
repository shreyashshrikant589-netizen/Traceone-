export type VolunteerStatus = 'Active' | 'Available' | 'Searching' | 'Offline';
export type VerificationStatus = 'Verified' | 'Pending verification';

export type Volunteer = {
  id: string;
  name: string;
  role: string;
  verification: VerificationStatus;
  team: string;
  activeCase: string;
  status: VolunteerStatus;
  credits: number;
  lastActive: string;
  joined: string;
  phone: string;
  badges: string[];
};

export const volunteers: Volunteer[] = [
  { id: 'VOL-2041', name: 'Nisha Patel', role: 'Field volunteer', verification: 'Verified', team: 'Alpha-12', activeCase: 'CASE-1042', status: 'Searching', credits: 248, lastActive: '4 min ago', joined: 'Mar 2026', phone: '+1 (555) 014-2041', badges: ['Rapid responder', 'North zone'] },
  { id: 'VOL-2088', name: 'Samuel Lee', role: 'Team coordinator', verification: 'Verified', team: 'Bravo-08', activeCase: 'CASE-1071', status: 'Active', credits: 316, lastActive: '9 min ago', joined: 'Jan 2026', phone: '+1 (555) 014-2088', badges: ['Team leader', 'Night shift'] },
  { id: 'VOL-2112', name: 'Amina Wu', role: 'Search volunteer', verification: 'Verified', team: 'Delta-03', activeCase: 'CASE-1108', status: 'Available', credits: 184, lastActive: '16 min ago', joined: 'Apr 2026', phone: '+1 (555) 014-2112', badges: ['Evidence trained'] },
  { id: 'VOL-2175', name: 'Marcus Chen', role: 'Search volunteer', verification: 'Pending verification', team: 'Unassigned', activeCase: 'None', status: 'Available', credits: 42, lastActive: '1 hr ago', joined: 'Sep 2026', phone: '+1 (555) 014-2175', badges: ['New volunteer'] },
  { id: 'VOL-2204', name: 'Elena Garcia', role: 'First aid volunteer', verification: 'Verified', team: 'Echo-07', activeCase: 'CASE-1126', status: 'Offline', credits: 129, lastActive: 'Yesterday', joined: 'Feb 2026', phone: '+1 (555) 014-2204', badges: ['First aid'] },
  { id: 'VOL-2240', name: 'David Morgan', role: 'Field volunteer', verification: 'Verified', team: 'Alpha-12', activeCase: 'CASE-1042', status: 'Searching', credits: 207, lastActive: '12 min ago', joined: 'May 2026', phone: '+1 (555) 014-2240', badges: ['K9 support'] },
];

export const volunteerTimeline = [
  { title: 'Checked in to North District Park', detail: 'Search shift started with Alpha-12.', time: 'Today, 09:18' },
  { title: 'Submitted field update', detail: 'North entrance cleared; moved to east footpath.', time: 'Today, 09:42' },
  { title: 'Completed safety briefing', detail: 'Briefing acknowledged in the volunteer app.', time: 'Today, 08:58' },
  { title: 'Joined TraceOne', detail: 'Volunteer account created and onboarding completed.', time: 'Mar 12, 2026' },
];

export type Team = {
  id: string;
  name: string;
  leader: string;
  members: number;
  assignedCase: string;
  zone: string;
  status: 'Active' | 'Searching' | 'Standby' | 'Needs update';
};

export const teams: Team[] = [
  { id: 'team-alpha', name: 'Alpha-12', leader: 'Nisha Patel', members: 6, assignedCase: 'CASE-1042', zone: 'North District Park', status: 'Active' },
  { id: 'team-bravo', name: 'Bravo-08', leader: 'Samuel Lee', members: 5, assignedCase: 'CASE-1071', zone: 'Old Town Corridor', status: 'Searching' },
  { id: 'team-delta', name: 'Delta-03', leader: 'Amina Wu', members: 4, assignedCase: 'CASE-1108', zone: 'Cedar Bridge', status: 'Active' },
  { id: 'team-echo', name: 'Echo-07', leader: 'Elena Garcia', members: 3, assignedCase: 'CASE-1126', zone: 'East Industrial Route', status: 'Needs update' },
  { id: 'team-charlie', name: 'Charlie-04', leader: 'Jon Bell', members: 4, assignedCase: 'None', zone: 'Standby pool', status: 'Standby' },
];
