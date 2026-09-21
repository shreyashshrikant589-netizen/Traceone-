export type ReputationLabel = 'Trusted' | 'Reliable' | 'Regular' | 'Limited Trust' | 'Restricted';

export type SearchHistoryItem = {
  caseName: string;
  zone: string;
  startTime: string;
  endTime: string;
  duration: string;
  result: string;
  notes: string;
};

export type ProfileData = {
  name: string;
  role: string;
  accountStatus: string;
  credits: { label: string; value: number }[];
  reputation: ReputationLabel;
  badges: string[];
  searchHistory: SearchHistoryItem[];
};

export interface ProfileService {
  getProfile(): Promise<ProfileData>;
  listSearchHistory(): Promise<SearchHistoryItem[]>;
}
