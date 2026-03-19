import { create } from 'zustand';
import { QuizResult, HistoryFilters } from '@/types';

interface HistoryState {
  results: QuizResult[];
  loading: boolean;
  filters: HistoryFilters;
  addResult: (result: QuizResult, userId: string) => Promise<void>;
  loadResults: (userId: string) => Promise<void>;
  clearResults: () => void;
  setFilters: (filters: Partial<HistoryFilters>) => void;
  getFilteredResults: () => QuizResult[];
  getStreak: () => number;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  results: [],
  loading: false,
  filters: {
    sortBy: 'date',
    sortOrder: 'desc',
  },

  // Load all attempts for this user from Supabase
  loadResults: async (userId: string) => {
    set({ loading: true });
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Map DB rows back to QuizResult shape
      const results: QuizResult[] = (data ?? []).map(row => ({
        id: row.id,
        quizId: row.quiz_id,
        quiz: {
          id: row.quiz_id,
          config: {
            topic: row.topic,
            difficulty: row.difficulty as 'Easy' | 'Medium' | 'Hard',
            numQuestions: row.num_questions,
          },
          questions: row.questions,
          createdAt: row.completed_at,
        },
        answers: row.answers,
        score: row.score,
        percentage: row.percentage,
        timeTaken: row.time_taken,
        completedAt: row.completed_at,
        userId: row.user_id,
      }));

      set({ results, loading: false });
    } catch (err) {
      console.error('Failed to load results:', err);
      set({ loading: false });
    }
  },

  // Save a new result to Supabase and add to local state
  addResult: async (result: QuizResult, userId: string) => {
    // Optimistically add to local state first so UI updates immediately
    set(state => ({ results: [result, ...state.results] }));

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.from('quiz_attempts').insert({
        id: result.id,
        user_id: userId,
        quiz_id: result.quizId,
        topic: result.quiz.config.topic,
        difficulty: result.quiz.config.difficulty,
        num_questions: result.quiz.questions.length,
        questions: result.quiz.questions,
        answers: result.answers,
        score: result.score,
        percentage: result.percentage,
        time_taken: result.timeTaken,
        completed_at: result.completedAt,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save result to Supabase:', err);
      // Don't remove from local state — at least the session shows it
    }
  },

  clearResults: () => set({ results: [] }),

  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
  },

  getFilteredResults: () => {
    const { results, filters } = get();
    let filtered = [...results];

    if (filters.difficulty) {
      filtered = filtered.filter(
        r => r.quiz.config.difficulty === filters.difficulty
      );
    }

    if (filters.search) {
      filtered = filtered.filter(r =>
        r.quiz.config.topic
          .toLowerCase()
          .includes(filters.search!.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'date') {
        comparison =
          new Date(a.completedAt).getTime() -
          new Date(b.completedAt).getTime();
      } else if (filters.sortBy === 'score') {
        comparison = a.percentage - b.percentage;
      } else if (filters.sortBy === 'topic') {
        comparison = a.quiz.config.topic.localeCompare(b.quiz.config.topic);
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  },

  getStreak: () => {
    const { results } = get();
    if (results.length === 0) return 0;

    const uniqueDates = Array.from(
      new Set(
        results.map(r => {
          const d = new Date(r.completedAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      )
    ).sort((a, b) => b - a);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkTime = today.getTime();

    for (const dateTime of uniqueDates) {
      if (dateTime === checkTime) {
        streak++;
        checkTime = checkTime - 24 * 60 * 60 * 1000;
      } else if (dateTime < checkTime) {
        break;
      }
    }

    return streak;
  },
}));