export type ApiSource = 'mock' | 'backend';

export type ApiResponse<T> = {
  data: T;
  source: ApiSource;
};

export type ApiError = {
  message: string;
  code?: string;
};

export type ServiceOptions = {
  signal?: AbortSignal;
};

export function mockResponse<T>(data: T): Promise<ApiResponse<T>> {
  return Promise.resolve({ data, source: 'mock' });
}
