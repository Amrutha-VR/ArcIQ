export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // ALWAYS a number 0-3, never a string
  explanation: string;
  type: 'mcq' | 'true-false';
}

export interface QuizConfig {
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  numQuestions: number;
  timePerQuestion?: number;
}

export interface Quiz {
  id: string;
  config: QuizConfig;
  questions: Question[];
  createdAt: string;
  userId?: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  timeTaken: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  quiz: Quiz;
  answers: UserAnswer[];
  score: number;
  percentage: number;
  timeTaken: number;
  completedAt: string;
  userId?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  totalQuizzes: number;
  totalScore: number;
  streak: number;
  lastQuizDate?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatarUrl?: string;
  totalQuizzes: number;
  avgScore: number;
  streak: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface HistoryFilters {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  sortBy: 'date' | 'score' | 'topic';
  sortOrder: 'asc' | 'desc';
  search?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  remark: string;
  condition: string;
  earned: boolean;
  earnedAt?: string;
  earnedFromQuiz?: string;
}