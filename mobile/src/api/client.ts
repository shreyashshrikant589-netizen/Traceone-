export type AuthSession = {
  access_token: string;
};

export type AuthSessionProvider = {
  getSession(): Promise<AuthSession | null>;
  refreshSession(): Promise<AuthSession | null>;
  signOut(): Promise<void>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: "NETWORK" | "AUTHENTICATION" | "FORBIDDEN" | "VALIDATION" | "SERVER" | "UNKNOWN",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function classifyStatus(status: number): ApiError["code"] {
  if (status === 401) return "AUTHENTICATION";
  if (status === 403) return "FORBIDDEN";
  if (status >= 400 && status < 500) return "VALIDATION";
  if (status >= 500) return "SERVER";
  return "UNKNOWN";
}

export function createApiClient(baseUrl: string, sessionProvider: AuthSessionProvider, timeoutMs = 10000) {
  async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
    const session = await sessionProvider.getSession();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}${path}`, { ...init, headers, signal: controller.signal });
      if (response.status === 401 && !retried) {
        const refreshed = await sessionProvider.refreshSession();
        if (refreshed) return request<T>(path, init, true);
        await sessionProvider.signOut();
      }
      const body = await response.json().catch(() => undefined);
      if (!response.ok) {
        const message = typeof body?.detail === "string" ? body.detail : "API request failed.";
        throw new ApiError(message, response.status, classifyStatus(response.status));
      }
      return body as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const message = error instanceof DOMException && error.name === "AbortError" ? "API request timed out." : "Network request failed.";
      throw new ApiError(message, 0, "NETWORK");
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  };
}
