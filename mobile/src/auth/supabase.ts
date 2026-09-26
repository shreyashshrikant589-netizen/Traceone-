import { createClient, type AuthChangeEvent, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthSessionProvider } from "../api/client";
import type { MobileConfig } from "../config";

export function createSupabaseClient(config: MobileConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey);
}

export function createAuthSessionProvider(client: SupabaseClient): AuthSessionProvider & {
  signIn(email: string, password: string): Promise<Session>;
  signUp(email: string, password: string): Promise<Session | null>;
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): { unsubscribe: () => void };
} {
  return {
    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session ? { access_token: data.session.access_token } : null;
    },
    async refreshSession() {
      const { data, error } = await client.auth.refreshSession();
      if (error) return null;
      return data.session ? { access_token: data.session.access_token } : null;
    },
    async signOut() {
      await client.auth.signOut();
    },
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.session) throw error ?? new Error("Sign-in did not return a session.");
      return data.session;
    },
    async signUp(email, password) {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;
      return data.session;
    },
    onAuthStateChange(callback) {
      const { data } = client.auth.onAuthStateChange(callback);
      return { unsubscribe: () => data.subscription.unsubscribe() };
    },
  };
}
