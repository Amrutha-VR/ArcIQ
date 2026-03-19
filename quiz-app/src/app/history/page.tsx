'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHistoryStore } from '@/store/historyStore';
import { useQuizStore } from '@/store/quizStore';
import { format } from 'date-fns';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
const SORT_OPTIONS = [
  { value: 'date', label: 'DATE' },
  { value: 'score', label: 'SCORE' },
  { value: 'topic', label: 'TOPIC' },
] as const;

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
          <p className="mb-6"
            style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani', fontSize: '16px' }}>
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
              color: avgScore >= 80 ? 'var(--success-green)'
                : avgScore >= 60 ? 'var(--warning-amber)'
                : 'var(--danger-red)',
              bg: avgScore >= 80 ? 'rgba(0,232,122,0.07)'
                : avgScore >= 60 ? 'rgba(255,184,0,0.07)'
                : 'rgba(255,68,68,0.07)',
              border: avgScore >= 80 ? 'rgba(0,232,122,0.2)'
                : avgScore >= 60 ? 'rgba(255,184,0,0.2)'
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
            <div key={label} className="p-4 rounded-xl text-center"
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

        {/* ── Filters Panel ── */}
        <div className="hud-panel p-5 mb-6 space-y-4">

          {/* Search — icon sits inside the input padding */}
          <div>
            <p className="stat-label mb-2">SEARCH MISSIONS</p>
            <div className="relative">
              {/* icon */}
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '14px',
                  color: 'var(--iron-text-soft)',
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}>
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by topic..."
                style={{
                  width: '100%',
                  paddingLeft: '40px',   // room for icon
                  paddingRight: '16px',
                  paddingTop: '11px',
                  paddingBottom: '11px',
                  background: 'rgba(0,200,240,0.04)',
                  border: '1px solid var(--iron-border)',
                  borderRadius: '8px',
                  color: 'var(--iron-bright)',
                  fontFamily: 'Rajdhani',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--arc-blue)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,200,240,0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--iron-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Difficulty chips */}
          <div>
            <p className="stat-label mb-2">DIFFICULTY</p>
            <div className="flex gap-2 flex-wrap">
              {/* All chip */}
              <button
                onClick={() => setFilters({ difficulty: undefined })}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontFamily: 'Orbitron',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  border: `1px solid ${!filters.difficulty ? 'var(--arc-blue)' : 'var(--iron-border)'}`,
                  background: !filters.difficulty ? 'rgba(0,200,240,0.15)' : 'transparent',
                  color: !filters.difficulty ? 'var(--arc-blue)' : 'var(--iron-text-soft)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                ALL
              </button>

              {DIFFICULTIES.map(d => {
                const isActive = filters.difficulty === d;
                const color = d === 'Easy' ? 'var(--success-green)'
                  : d === 'Medium' ? 'var(--warning-amber)'
                  : 'var(--danger-red)';
                const activeBg = d === 'Easy' ? 'rgba(0,232,122,0.15)'
                  : d === 'Medium' ? 'rgba(255,184,0,0.15)'
                  : 'rgba(255,68,68,0.15)';

                return (
                  <button
                    key={d}
                    onClick={() => setFilters({ difficulty: d })}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontFamily: 'Orbitron',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      border: `1px solid ${isActive ? color : 'var(--iron-border)'}`,
                      background: isActive ? activeBg : 'transparent',
                      color: isActive ? color : 'var(--iron-text-soft)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? `0 0 10px ${color}30` : 'none',
                    }}>
                    {d === 'Easy' ? '🟢' : d === 'Medium' ? '🟡' : '🔴'} {d.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort options */}
          <div>
            <p className="stat-label mb-2">SORT BY</p>
            <div className="flex gap-2 flex-wrap">
              {SORT_OPTIONS.map(opt => {
                const isActive = filters.sortBy === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilters({ sortBy: opt.value })}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontFamily: 'Orbitron',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      border: `1px solid ${isActive ? 'var(--arc-blue)' : 'var(--iron-border)'}`,
                      background: isActive ? 'rgba(0,200,240,0.15)' : 'transparent',
                      color: isActive ? 'var(--arc-blue)' : 'var(--iron-text-soft)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? '0 0 10px rgba(0,200,240,0.2)' : 'none',
                    }}>
                    {opt.label}
                  </button>
                );
              })}

              {/* Order toggle — styled as a pill */}
              <button
                onClick={() => setFilters({
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                })}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontFamily: 'Orbitron',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  border: '1px solid var(--iron-border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--iron-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--arc-blue)';
                  e.currentTarget.style.color = 'var(--arc-blue)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--iron-border)';
                  e.currentTarget.style.color = 'var(--iron-text)';
                }}>
                <span style={{ fontSize: '12px' }}>
                  {filters.sortOrder === 'desc' ? '↓' : '↑'}
                </span>
                {filters.sortOrder === 'desc' ? 'NEWEST' : 'OLDEST'}
              </button>
            </div>
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
              const secs = result.timeTaken % 60;

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

              const diffColor =
                result.quiz.config.difficulty === 'Easy' ? 'var(--success-green)'
                : result.quiz.config.difficulty === 'Medium' ? 'var(--warning-amber)'
                : 'var(--danger-red)';

              const diffBg =
                result.quiz.config.difficulty === 'Easy' ? 'rgba(0,232,122,0.1)'
                : result.quiz.config.difficulty === 'Medium' ? 'rgba(255,184,0,0.1)'
                : 'rgba(255,68,68,0.1)';

              return (
                <div
                  key={result.id}
                  className="hud-panel rounded-xl overflow-hidden transition-all hover:scale-[1.01]"
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/quiz/results/${result.id}`)}>

                  {/* Colored top accent */}
                  <div className="h-0.5 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${scoreColor}, transparent)`,
                    }} />

                  <div className="p-5">
                    <div className="flex items-center gap-4">

                      {/* Score badge */}
                      <div
                        className="rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{
                          width: '60px',
                          height: '60px',
                          background: scoreBg,
                          border: `1px solid ${scoreBorder}`,
                        }}>
                        <p className="font-black leading-none"
                          style={{
                            fontFamily: 'Orbitron',
                            color: scoreColor,
                            fontSize: '15px',
                          }}>
                          {result.percentage}%
                        </p>
                        <p className="stat-label mt-0.5" style={{ fontSize: '8px' }}>SCORE</p>
                      </div>

                      {/* Info block */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="font-bold truncate"
                            style={{
                              color: 'var(--iron-bright)',
                              fontFamily: 'Rajdhani',
                              fontSize: '17px',
                            }}>
                            {result.quiz.config.topic}
                          </h3>
                          <span
                            className="shrink-0"
                            style={{
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontFamily: 'Orbitron',
                              fontSize: '8px',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              color: diffColor,
                              background: diffBg,
                            }}>
                            {result.quiz.config.difficulty.toUpperCase()}
                          </span>
                        </div>

                        {/* Meta pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            { icon: '📅', text: format(new Date(result.completedAt), 'MMM d, yyyy') },
                            { icon: '❓', text: `${result.quiz.questions.length}Q` },
                            { icon: '⏱', text: `${minutes}m ${secs}s` },
                            { icon: '✅', text: `${result.answers.filter(a => a.isCorrect).length}/${result.quiz.questions.length}` },
                          ].map(({ icon, text }) => (
                            <span
                              key={text}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--iron-border)',
                                fontFamily: 'Rajdhani',
                                fontSize: '12px',
                                color: 'var(--iron-text)',
                              }}>
                              {icon} {text}
                            </span>
                          ))}
                        </div>

                        {/* Mini progress bar */}
                        <div className="mt-3 w-full h-1 rounded-full"
                          style={{ background: 'var(--iron-border)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${result.percentage}%`,
                              background: scoreColor,
                              boxShadow: `0 0 6px ${scoreColor}50`,
                              transition: 'width 0.6s ease',
                            }} />
                        </div>
                      </div>

                      {/* Rank */}
                      <div className="text-right shrink-0 self-start">
                        <p className="stat-label">#{index + 1}</p>
                      </div>
                    </div>

                    {/* Action row */}
                    <div
                      className="flex gap-2 mt-4 pt-3"
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