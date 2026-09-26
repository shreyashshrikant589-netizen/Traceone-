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

import { supabase } from './supabase';

export const authService: AuthService = {
  async signIn(input) {
    const { error } = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
    return error ? { status: 'authentication-error', message: error.message } : { status: 'success' };
  },
  async register(input) {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.fullName, phone: input.phoneNumber } },
    });
    return error ? { status: 'authentication-error', message: error.message } : { status: 'success' };
  },
  async sendPasswordReset(input) {
    const { error } = await supabase.auth.resetPasswordForEmail(input.email);
    return error ? { status: 'authentication-error', message: error.message } : { status: 'success' };
  },
};
