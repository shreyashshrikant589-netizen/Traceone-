export type LoginCredentials = {
  email: string;
  password: string;
  role?: 'admin' | 'manager';
};

export type LoginResult = {
  ok: boolean;
  message?: string;
};

const MOCK_USERS = new Set(['admin@traceone.io', 'manager@traceone.io']);
const AUTH_STORAGE_KEY = 'traceone-admin-auth';
const REMEMBERED_EMAIL_KEY = 'traceone-admin-remembered';
const ROLE_MAP: Record<string, 'admin' | 'manager'> = {
  'admin@traceone.io': 'admin',
  'manager@traceone.io': 'manager',
};

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true' || sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
}

export function getRememberedEmail(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(REMEMBERED_EMAIL_KEY);
}

export function setAuthenticatedSession(email: string, rememberMe: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (rememberMe) {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim().toLowerCase());
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}

export function logout(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const email = credentials.email.trim().toLowerCase();
  const selectedRole = credentials.role ?? ROLE_MAP[email];

  if (!MOCK_USERS.has(email) || credentials.password.trim().length === 0) {
    return { ok: false, message: 'Invalid credentials. Please check your email and password.' };
  }

  if (selectedRole && selectedRole !== ROLE_MAP[email]) {
    return { ok: false, message: 'This account is not assigned to the selected portal role.' };
  }

  return { ok: true };
}
