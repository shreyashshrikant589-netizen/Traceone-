export type MobileConfig = {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

declare const process: { env: Record<string, string | undefined> };

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getMobileConfig(env: Record<string, string | undefined> = process.env): MobileConfig {
  return {
    apiBaseUrl: requiredEnv("EXPO_PUBLIC_API_BASE_URL", env.EXPO_PUBLIC_API_BASE_URL).replace(/\/$/, ""),
    supabaseUrl: requiredEnv("EXPO_PUBLIC_SUPABASE_URL", env.EXPO_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: requiredEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  };
}
