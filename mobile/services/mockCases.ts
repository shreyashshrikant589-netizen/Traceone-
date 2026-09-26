export type MockCaseStatus = 'LOCAL_SEARCH' | 'PUBLIC_ESCALATION_PENDING' | 'PUBLIC_SEARCH' | 'SEARCH_COMPLETED' | 'CASE_RESOLVED';

export type MockCase = {
  name: string;
  age: number;
  location: string;
  time: string;
  status: MockCaseStatus;
  priority: 'Critical' | 'High' | 'Standard';
  updated: string;
};

export const mockCases: MockCase[] = [
  { name: 'Aarohi Sharma', age: 24, location: 'North District · Community Park', time: 'Today, 08:40', status: 'LOCAL_SEARCH', priority: 'High', updated: '12 min ago' },
  { name: 'Meera Kapoor', age: 31, location: 'Riverside East · Gate 2', time: 'Yesterday, 19:15', status: 'PUBLIC_ESCALATION_PENDING', priority: 'Critical', updated: '34 min ago' },
  { name: 'Ishita Rao', age: 19, location: 'Central Market', time: 'Mar 18, 16:20', status: 'PUBLIC_SEARCH', priority: 'High', updated: '1 hr ago' },
  { name: 'Kavya Menon', age: 28, location: 'West Station', time: 'Mar 11, 10:05', status: 'SEARCH_COMPLETED', priority: 'Standard', updated: 'Mar 12' },
  { name: 'Riya Das', age: 36, location: 'Lake Road', time: 'Mar 04, 21:10', status: 'CASE_RESOLVED', priority: 'Standard', updated: 'Mar 06' },
];
