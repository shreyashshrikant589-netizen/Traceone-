export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResult = {
  ok: boolean;
  message?: string;
};

const MOCK_USERS = new Set(['admin@traceone.io', 'manager@traceone.io']);

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const email = credentials.email.trim().toLowerCase();

  if (!MOCK_USERS.has(email) || credentials.password.trim().length === 0) {
    return { ok: false, message: 'Invalid credentials. Please check your email and password.' };
  }

  return { ok: true };
}
