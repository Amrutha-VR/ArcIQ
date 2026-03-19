'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useHistoryStore } from '@/store/historyStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loadResults, clearResults } = useHistoryStore();

  useEffect(() => {
    const supabase = createClient();

    // Load on mount if already logged in
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        loadResults(data.user.id);
      }
    });

    // Load/clear on auth state change
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          loadResults(session.user.id);
        }
        if (event === 'SIGNED_OUT') {
          clearResults();
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}