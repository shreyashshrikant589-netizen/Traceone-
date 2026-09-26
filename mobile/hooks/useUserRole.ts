import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

/**
 * Hook to retrieve the authenticated user's role.
 * Adjust the import path for the supabase client if it differs in the project.
 * Returns role string such as 'VOLUNTEER', 'CASE_MANAGER', 'REPORTER', or 'ADMIN'.
 */
export const useUserRole = (): string => {
  const [role, setRole] = useState<string>('VOLUNTEER');

  useEffect(() => {
    const fetchRole = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Supabase getSession error:', error);
        return;
      }
      const session = data.session;
      const fetchedRole = (session?.user?.user_metadata?.role as string) ?? 'VOLUNTEER';
      setRole(fetchedRole);
    };
    fetchRole();
  }, []);

  return role;
};
