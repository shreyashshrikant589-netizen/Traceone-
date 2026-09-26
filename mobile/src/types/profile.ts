export type TraceOneRole = "SUPER_ADMIN" | "CASE_MANAGER" | "VOLUNTEER" | "REPORTER";

export type Profile = {
  id: string;
  auth_user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: TraceOneRole;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type AppAuthState =
  | { status: "loading" }
  | { status: "logged_out" }
  | { status: "profile_unavailable"; message: string }
  | { status: "inactive_or_unverified"; profile: Profile }
  | { status: "ready"; profile: Profile };

export function roleRoute(role: TraceOneRole): "admin" | "case-manager" | "volunteer" | "reporter" {
  if (role === "SUPER_ADMIN") return "admin";
  if (role === "CASE_MANAGER") return "case-manager";
  if (role === "VOLUNTEER") return "volunteer";
  return "reporter";
}
