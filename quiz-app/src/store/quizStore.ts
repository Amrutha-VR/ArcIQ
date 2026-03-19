import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // Auto-saves to localStorage
import { Quiz, QuizConfig, UserAnswer, Question } from '@/types';

interface QuizState {
  // Current quiz being taken
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  quizStartTime: number | null;
  questionStartTime: number | null;
  isGenerating: boolean;
  generationError: string | null;

  // Actions
  setCurrentQuiz: (quiz: Quiz) => void;
  answerQuestion: (answer: UserAnswer) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  goToQuestion: (index: number) => void;
  startQuiz: () => void;
  resetQuiz: () => void;
  setGenerating: (value: boolean) => void;
  setGenerationError: (error: string | null) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      currentQuiz: null,
      currentQuestionIndex: 0,
      userAnswers: [],
      quizStartTime: null,
      questionStartTime: null,
      isGenerating: false,
      generationError: null,

      setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),

      answerQuestion: (answer) => {
        const { userAnswers } = get();
        // Replace existing answer for this question if re-answering
        const existing = userAnswers.findIndex(a => a.questionId === answer.questionId);
        if (existing >= 0) {
          const updated = [...userAnswers];
          updated[existing] = answer;
          set({ userAnswers: updated });
        } else {
          set({ userAnswers: [...userAnswers, answer] });
        }
      },

      goToNextQuestion: () => {
        const { currentQuestionIndex, currentQuiz } = get();
        if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
          set({
            currentQuestionIndex: currentQuestionIndex + 1,
            questionStartTime: Date.now(),
          });
        }
      },

      goToPreviousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({
            currentQuestionIndex: currentQuestionIndex - 1,
            questionStartTime: Date.now(),
          });
        }
      },

      goToQuestion: (index) => set({
        currentQuestionIndex: index,
        questionStartTime: Date.now(),
      }),

      startQuiz: () => set({
        quizStartTime: Date.now(),
        questionStartTime: Date.now(),
        currentQuestionIndex: 0,
        userAnswers: [],
      }),

      resetQuiz: () => set({
        currentQuiz: null,
        currentQuestionIndex: 0,
        userAnswers: [],
        quizStartTime: null,
        questionStartTime: null,
        generationError: null,
      }),

      setGenerating: (value) => set({ isGenerating: value }),
      setGenerationError: (error) => set({ generationError: error }),
    }),
    {
      name: 'quiz-progress', // localStorage key
      partialize: (state) => ({
        // Only persist these fields (not functions)
        currentQuiz: state.currentQuiz,
        currentQuestionIndex: state.currentQuestionIndex,
        userAnswers: state.userAnswers,
        quizStartTime: state.quizStartTime,
      }),
    }
  )
);