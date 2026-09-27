export type AuthStatus = 'idle' | 'loading' | 'validation-error' | 'network-error' | 'authentication-error' | 'success';

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
};

export type ForgotPasswordInput = {
  email: string;
};

export type AuthResult = {
  status: AuthStatus;
  message?: string;
};

export interface AuthService {
  signIn(input: LoginInput): Promise<AuthResult>;
  register(input: RegisterInput): Promise<AuthResult>;
  sendPasswordReset(input: ForgotPasswordInput): Promise<AuthResult>;
}
