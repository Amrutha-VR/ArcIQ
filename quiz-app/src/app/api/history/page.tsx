'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHistoryStore } from '@/store/historyStore';
import { useQuizStore } from '@/store/quizStore';
import { format } from 'date-fns';

export default function HistoryPage() {
  const router = useRouter();
  const { results, filters, setFilters, getFilteredResults } = useHistoryStore();
  const { setCurrentQuiz, startQuiz } = useQuizStore();
  const [search, setSearch] = useState('');

  const filtered = getFilteredResults();

  function handleRetake(resultId: string) {
    const result = results.find(r => r.id === resultId);
    if (!result) return;
    setCurrentQuiz(result.quiz);
    startQuiz();
    router.push(`/quiz/${result.quiz.id}`);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setFilters({ search: value });
  }

  const totalQuizzes = results.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / totalQuizzes)
    : 0;
  const bestScore = totalQuizzes > 0
    ? Math.max(...results.map(r => r.percentage))
    : 0;

  if (results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4 arc-pulse">📋</div>
          <h2 className="font-black tracking-wider mb-2"
            style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)', fontSize: '18px' }}>
            NO MISSIONS LOGGED
          </h2>
          <p className="mb-6" style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani', fontSize: '16px' }}>
            Complete your first quiz to see mission history here.
          </p>
          <button
            onClick={() => router.push('/quiz/create')}
            className="btn-arc btn-primary px-8 py-3">
            ⚡ START FIRST MISSION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--iron-darker)' }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="stat-label mb-1">STARK INTELLIGENCE PLATFORM</p>
          <h1 className="font-black tracking-wider mb-1"
            style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)', fontSize: '22px' }}>
            MISSION LOG
          </h1>
          <p style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani', fontSize: '15px' }}>
            {totalQuizzes} mission{totalQuizzes !== 1 ? 's' : ''} on record
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: 'TOTAL',
              value: String(totalQuizzes),
              icon: '🚀',
              color: 'var(--arc-blue)',
              bg: 'rgba(0,200,240,0.07)',
              border: 'rgba(0,200,240,0.18)',
            },
            {
              label: 'AVG SCORE',
              value: `${avgScore}%`,
              icon: '🎯',
              color: avgScore >= 80
                ? 'var(--success-green)'
                : avgScore >= 60
                ? 'var(--warning-amber)'
                : 'var(--danger-red)',
              bg: avgScore >= 80
                ? 'rgba(0,232,122,0.07)'
                : avgScore >= 60
                ? 'rgba(255,184,0,0.07)'
                : 'rgba(255,68,68,0.07)',
              border: avgScore >= 80
                ? 'rgba(0,232,122,0.2)'
                : avgScore >= 60
                ? 'rgba(255,184,0,0.2)'
                : 'rgba(255,68,68,0.2)',
            },
            {
              label: 'BEST',
              value: `${bestScore}%`,
              icon: '⚡',
              color: 'var(--iron-gold)',
              bg: 'rgba(212,168,0,0.07)',
              border: 'rgba(212,168,0,0.2)',
            },
          ].map(({ label, value, icon, color, bg, border }) => (
            <div key={label}
              className="p-4 rounded-xl text-center"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="text-xl mb-1">{icon}</div>
              <p className="font-black"
                style={{ fontFamily: 'Orbitron', color, fontSize: '20px' }}>
                {value}
              </p>
              <p className="stat-label mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters Panel */}
        <div className="hud-panel p-4 mb-6">
          <p className="stat-label mb-3">FILTER & SORT</p>
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: 'var(--iron-text-soft)' }}>
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by topic..."
                className="input-arc"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* Difficulty */}
            <select
              value={filters.difficulty ?? ''}
              onChange={e => setFilters({
                difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' | undefined || undefined,
              })}
              className="input-arc"
              style={{ width: 'auto', minWidth: '140px' }}>
              <option value="">All Difficulties</option>
              <option value="Easy">🟢 Easy</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Hard">🔴 Hard</option>
            </select>

            {/* Sort by */}
            <select
              value={filters.sortBy}
              onChange={e => setFilters({ sortBy: e.target.value as 'date' | 'score' | 'topic' })}
              className="input-arc"
              style={{ width: 'auto', minWidth: '140px' }}>
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="topic">Sort by Topic</option>
            </select>

            {/* Sort order toggle */}
            <button
              onClick={() => setFilters({
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
              })}
              className="btn-arc btn-outline px-4 py-2 shrink-0"
              style={{ fontSize: '11px', minWidth: '90px' }}>
              {filters.sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
            </button>
          </div>
        </div>

        {/* Results count */}
        {filtered.length !== results.length && (
          <p className="stat-label mb-3">
            SHOWING {filtered.length} OF {results.length} MISSIONS
          </p>
        )}

        {/* Empty filter state */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-black tracking-wider mb-2"
              style={{ fontFamily: 'Orbitron', color: 'var(--iron-text)', fontSize: '14px' }}>
              NO MISSIONS MATCH
            </p>
            <p style={{ color: 'var(--iron-text-soft)', fontFamily: 'Rajdhani' }}>
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((result, index) => {
              const minutes = Math.floor(result.timeTaken / 60);
              const seconds = result.timeTaken % 60;

              const scoreColor =
                result.percentage >= 80 ? 'var(--success-green)'
                : result.percentage >= 60 ? 'var(--warning-amber)'
                : 'var(--danger-red)';

              const scoreBg =
                result.percentage >= 80 ? 'rgba(0,232,122,0.08)'
                : result.percentage >= 60 ? 'rgba(255,184,0,0.08)'
                : 'rgba(255,68,68,0.08)';

              const scoreBorder =
                result.percentage >= 80 ? 'rgba(0,232,122,0.25)'
                : result.percentage >= 60 ? 'rgba(255,184,0,0.25)'
                : 'rgba(255,68,68,0.25)';

              const difficultyColor =
                result.quiz.config.difficulty === 'Easy' ? 'var(--success-green)'
                : result.quiz.config.difficulty === 'Medium' ? 'var(--warning-amber)'
                : 'var(--danger-red)';

              const difficultyBg =
                result.quiz.config.difficulty === 'Easy' ? 'rgba(0,232,122,0.1)'
                : result.quiz.config.difficulty === 'Medium' ? 'rgba(255,184,0,0.1)'
                : 'rgba(255,68,68,0.1)';

              return (
                <div
                  key={result.id}
                  className="hud-panel rounded-xl overflow-hidden transition-all hover:scale-[1.01]"
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/quiz/results/${result.id}`)}>

                  {/* Top accent bar based on score */}
                  <div className="h-0.5 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${scoreColor}, transparent)`,
                    }} />

                  <div className="p-5">
                    <div className="flex items-center gap-4">

                      {/* Score Ring */}
                      <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{ background: scoreBg, border: `1px solid ${scoreBorder}` }}>
                        <p className="font-black leading-none"
                          style={{ fontFamily: 'Orbitron', color: scoreColor, fontSize: '16px' }}>
                          {result.percentage}%
                        </p>
                        <p className="stat-label mt-0.5" style={{ fontSize: '8px' }}>SCORE</p>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold truncate"
                            style={{
                              color: 'var(--iron-bright)',
                              fontFamily: 'Rajdhani',
                              fontSize: '17px',
                            }}>
                            {result.quiz.config.topic}
                          </h3>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              fontFamily: 'Orbitron',
                              fontSize: '8px',
                              color: difficultyColor,
                              background: difficultyBg,
                              letterSpacing: '0.05em',
                            }}>
                            {result.quiz.config.difficulty.toUpperCase()}
                          </span>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="stat-label flex items-center gap-1">
                            📅 {format(new Date(result.completedAt), 'MMM d, yyyy')}
                          </span>
                          <span className="stat-label flex items-center gap-1">
                            ❓ {result.quiz.questions.length}Q
                          </span>
                          <span className="stat-label flex items-center gap-1">
                            ⏱ {minutes}m {seconds}s
                          </span>
                          <span className="stat-label flex items-center gap-1">
                            ✅ {result.answers.filter(a => a.isCorrect).length}/{result.quiz.questions.length}
                          </span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="mt-2.5 w-full h-1 rounded-full"
                          style={{ background: 'var(--iron-border)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${result.percentage}%`,
                              background: scoreColor,
                              boxShadow: `0 0 6px ${scoreColor}60`,
                            }} />
                        </div>
                      </div>

                      {/* Rank number */}
                      <div className="text-right shrink-0">
                        <p className="stat-label mb-1">#{index + 1}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4 pt-3"
                      style={{ borderTop: '1px solid var(--iron-border)' }}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/quiz/results/${result.id}`);
                        }}
                        className="btn-arc btn-outline flex-1 py-2"
                        style={{ fontSize: '10px' }}>
                        📋 REVIEW
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleRetake(result.id);
                        }}
                        className="btn-arc btn-primary flex-1 py-2"
                        style={{ fontSize: '10px' }}>
                        🔄 RETRY MISSION
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        {filtered.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/quiz/create')}
              className="btn-arc btn-primary px-8 py-3">
              ⚡ START NEW MISSION
            </button>
          </div>
        )}

      </div>
    </div>
  );
}