'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useHistoryStore } from '@/store/historyStore';

// Call this once in layout or a top-level component
// It watches for auth changes and resets the store to the correct user's data
export function useUserHistory() {
  useEffect(() => {
    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const email = session?.user?.email;
        const storageKey = email
          ? `quiz-history-${email}`
          : 'quiz-history-guest';

        // Read data for this user from localStorage
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            const results = parsed?.state?.results ?? [];
            // Directly set the results in the store
            useHistoryStore.setState({ results });
          } else {
            // New user or no history — start fresh
            useHistoryStore.setState({ results: [] });
          }
        } catch {
          useHistoryStore.setState({ results: [] });
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);
}