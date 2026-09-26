import type { AuthSessionProvider } from "../api/client";
import type { AppAuthState, Profile } from "../types/profile";

export type ProfileApi = {
  get<T>(path: string): Promise<T>;
};

export async function loadAuthState(sessionProvider: AuthSessionProvider, api: ProfileApi): Promise<AppAuthState> {
  const session = await sessionProvider.getSession();
  if (!session) return { status: "logged_out" };
  try {
    const profile = await api.get<Profile>("/api/v1/profile/me");
    if (!profile.is_active || !profile.is_verified) return { status: "inactive_or_unverified", profile };
    return { status: "ready", profile };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile could not be loaded.";
    return { status: "profile_unavailable", message };
  }
}
