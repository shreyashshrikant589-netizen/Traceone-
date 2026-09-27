import type { ProfileData } from './profile';

export const mockProfile: ProfileData = {
  name: 'Nishant', role: 'Volunteer', accountStatus: 'Account active', reputation: 'Reliable',
  credits: [{ label: 'Search Session', value: 10 }, { label: 'Verified Sighting', value: 15 }, { label: 'Verified Case Contribution', value: 25 }],
  badges: ['First Search', 'Search Contributor', 'Community Helper'],
  searchHistory: [{ caseName: 'Aarohi Sharma', zone: 'Zone A · Community Park', startTime: 'Today, 09:10', endTime: 'Today, 10:42', duration: '1h 32m', result: 'Search completed', notes: 'North walking path checked.' }, { caseName: 'Meera Kapoor', zone: 'Riverside East · Gate 2', startTime: 'Yesterday, 19:30', endTime: 'Yesterday, 20:15', duration: '45m', result: 'No observation reported', notes: 'Returned safely to staging point.' }],
};
