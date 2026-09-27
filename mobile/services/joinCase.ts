export type JoinErrorCode = 'INVALID_QR' | 'EXPIRED_QR' | 'UNAUTHORIZED' | 'NETWORK_ERROR';

export type JoinCasePayload = {
  tokenOrCode: string;
};

export type JoinPreview = {
  title: string;
  status: 'LOCAL_SEARCH' | 'PUBLIC_SEARCH';
  authorizedInformation: string;
  eligibility: 'ELIGIBLE' | 'PENDING_REVIEW' | 'NOT_ELIGIBLE';
};

export interface JoinCaseService {
  previewCase(payload: JoinCasePayload): Promise<JoinPreview>;
  joinCase(payload: JoinCasePayload): Promise<void>;
}
