'use client';

import { useHistoryStore } from '@/store/historyStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Trophy, Medal, Target, Brain } from 'lucide-react';

export default function LeaderboardPage() {
  const { results } = useHistoryStore();
  const router = useRouter();

  // Build personal leaderboard from history
  const topResults = [...results]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);

  if (results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No scores yet</h2>
          <p className="text-gray-500 mb-6">Take some quizzes to appear on the leaderboard.</p>
          <Button onClick={() => router.push('/quiz/create')}>Create a Quiz</Button>
        </div>
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-3xl font-extrabold text-gray-900">Leaderboard</h1>
          <p className="text-gray-500 mt-1">Your top quiz performances</p>
        </div>

        {/* Top 3 podium */}
        {topResults.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10">
            {/* 2nd place */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-2 border-2 border-gray-300">
                <span className="text-2xl">🥈</span>
              </div>
              <p className="text-xs font-semibold text-gray-700 truncate w-20">
                {topResults[1].quiz.config.topic}
              </p>
              <p className="text-lg font-extrabold text-gray-500">
                {topResults[1].percentage}%
              </p>
              <div className="bg-gray-200 h-16 w-20 rounded-t-xl mt-1" />
            </div>

            {/* 1st place */}
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-2 border-2 border-yellow-400">
                <span className="text-3xl">🥇</span>
              </div>
              <p className="text-xs font-semibold text-gray-700 truncate w-24">
                {topResults[0].quiz.config.topic}
              </p>
              <p className="text-2xl font-extrabold text-yellow-500">
                {topResults[0].percentage}%
              </p>
              <div className="bg-yellow-200 h-24 w-24 rounded-t-xl mt-1" />
            </div>

            {/* 3rd place */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-2 border-2 border-orange-300">
                <span className="text-2xl">🥉</span>
              </div>
              <p className="text-xs font-semibold text-gray-700 truncate w-20">
                {topResults[2].quiz.config.topic}
              </p>
              <p className="text-lg font-extrabold text-orange-500">
                {topResults[2].percentage}%
              </p>
              <div className="bg-orange-200 h-10 w-20 rounded-t-xl mt-1" />
            </div>
          </div>
        )}

        {/* Full list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {topResults.map((result, index) => (
            <div
              key={result.id}
              className={`flex items-center gap-4 px-5 py-4 ${
                index !== topResults.length - 1 ? 'border-b border-gray-50' : ''
              } ${index < 3 ? 'bg-gradient-to-r from-yellow-50/30 to-transparent' : ''}`}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                {index < 3
                  ? <span className="text-xl">{medals[index]}</span>
                  : <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {result.quiz.config.topic}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    result.quiz.config.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    result.quiz.config.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {result.quiz.config.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {result.score}/{result.quiz.questions.length}
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className={`text-xl font-extrabold ${
                result.percentage >= 80 ? 'text-green-500' :
                result.percentage >= 50 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {result.percentage}%
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button onClick={() => router.push('/quiz/create')}>
            <Brain className="w-4 h-4 mr-2" />
            Beat Your High Score
          </Button>
        </div>
      </div>
    </div>
  );
}