export type JoinErrorCode = 'INVALID_QR' | 'EXPIRED_QR' | 'UNAUTHORIZED' | 'NETWORK_ERROR';

export type JoinCasePayload = {
  caseId?: string;
  tokenOrCode: string;
};

export type CreateInvitePayload = { expires_at: string; max_uses?: number };

export type JoinPreview = {
  case_id: string;
  case_number: string;
  title: string;
  event_name?: string | null;
  venue_name?: string | null;
  status: string;
  invite_valid: boolean;
  expires_at: string;
  age?: number | string;
  gender?: string;
  location?: string;
  last_seen_location?: string;
  last_seen_time?: string;
  clothing?: string;
  physical_description?: string;
  direction?: string;
  known_destination?: string;
  photo_url?: string | null;
  priority?: string;
};

export interface JoinCaseService {
  previewCase(payload: JoinCasePayload): Promise<JoinPreview>;
  joinCase(payload: JoinCasePayload): Promise<void>;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const INVITES_STORAGE_KEY = 'traceone_saved_invites';
const CASES_STORAGE_KEY = 'traceone_local_cases';

export interface StoredCaseInvite {
  join_code: string;
  case_id: string;
  invite_token?: string;
  title?: string;
  case_number?: string;
  caseData?: Partial<JoinPreview>;
  saved_at: number;
}

export async function saveLocalCaseInvite(invite: StoredCaseInvite): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(INVITES_STORAGE_KEY);
    const list: StoredCaseInvite[] = raw ? JSON.parse(raw) : [];
    // Deduplicate by join_code or case_id
    const filtered = list.filter(
      (item) => item.join_code !== invite.join_code && item.case_id !== invite.case_id
    );
    filtered.unshift(invite);
    // Keep last 30
    await AsyncStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(filtered.slice(0, 30)));
  } catch (e) {
    console.warn('Could not save invite locally:', e);
  }
}

export async function findLocalCaseInvite(codeOrToken: string, caseId?: string): Promise<StoredCaseInvite | null> {
  try {
    const clean = codeOrToken.trim();
    const raw = await AsyncStorage.getItem(INVITES_STORAGE_KEY);
    if (!raw) return null;
    const list: StoredCaseInvite[] = JSON.parse(raw);
    const found = list.find((item) => {
      if (item.join_code && item.join_code === clean) return true;
      if (item.invite_token && item.invite_token === clean) return true;
      if (caseId && item.case_id === caseId) return true;
      return false;
    });
    return found || null;
  } catch {
    return null;
  }
}

export async function saveRecentCaseLocal(caseDetails: Partial<JoinPreview>): Promise<void> {
  try {
    if (!caseDetails.case_id) return;
    const raw = await AsyncStorage.getItem(CASES_STORAGE_KEY);
    const list: Array<Partial<JoinPreview>> = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((c) => c.case_id !== caseDetails.case_id);
    filtered.unshift(caseDetails);
    await AsyncStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(filtered.slice(0, 30)));
  } catch (e) {
    console.warn('Could not save case locally:', e);
  }
}

export async function findRecentCaseLocal(caseId: string): Promise<Partial<JoinPreview> | null> {
  try {
    const raw = await AsyncStorage.getItem(CASES_STORAGE_KEY);
    if (!raw) return null;
    const list: Array<Partial<JoinPreview>> = JSON.parse(raw);
    return list.find((c) => c.case_id === caseId) || null;
  } catch {
    return null;
  }
}
