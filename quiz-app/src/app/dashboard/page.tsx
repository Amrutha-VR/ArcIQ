'use client';

import { useRouter } from 'next/navigation';
import { useHistoryStore } from '@/store/historyStore';
import { Button } from '@/components/ui/Button';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { format } from 'date-fns';
import { computeBadges } from '@/lib/utils/badges';

export default function DashboardPage() {
  const router = useRouter();
  const { results } = useHistoryStore();
  const streak = useHistoryStore(s => s.getStreak());
  const allBadges = computeBadges(results, streak);
  const earnedBadges = allBadges.filter(b => b.earned);

  const totalQuizzes = results.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes)
    : 0;
  const bestScore = totalQuizzes > 0
    ? Math.max(...results.map(r => r.percentage))
    : 0;
  const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0);
  const totalMinutes = Math.floor(totalTime / 60);

  const chartData = [...results]
    .slice(0, 10)
    .reverse()
    .map((r, i) => ({
      name: `M${i + 1}`,
      score: r.percentage,
      date: format(new Date(r.completedAt), 'MMM d'),
    }));

  const difficultyData = ['Easy', 'Medium', 'Hard'].map(d => ({
    name: d,
    avgScore: Math.round(
      results.filter(r => r.quiz.config.difficulty === d)
        .reduce((sum, r) => sum + r.percentage, 0) /
      (results.filter(r => r.quiz.config.difficulty === d).length || 1)
    ),
    count: results.filter(r => r.quiz.config.difficulty === d).length,
  }));

  const difficultyColors: Record<string, string> = {
    Easy: '#00e87a',
    Medium: '#ffb800',
    Hard: '#ff4444',
  };

  if (results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4 arc-pulse">🧠</div>
          <h2 className="font-black tracking-wider mb-2"
            style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)', fontSize: '18px' }}>
            NO DATA YET
          </h2>
          <p className="mb-6" style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani' }}>
            Complete quizzes to see your analytics here.
          </p>
          <Button onClick={() => router.push('/quiz/create')}>⚡ Start First Mission</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--iron-darker)' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="stat-label mb-1">STARK INTELLIGENCE PLATFORM</p>
            <h1 className="font-black tracking-wider"
              style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)', fontSize: '22px' }}>
              SYSTEMS DASHBOARD
            </h1>
          </div>
          <div className="text-right">
            <p className="stat-label">BADGES</p>
            <p className="font-black"
              style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '20px' }}>
              {earnedBadges.length}/{allBadges.length}
            </p>
          </div>
        </div>

        {/* Stat Cards — vibrant colors */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'MISSIONS',
              value: totalQuizzes,
              icon: '🚀',
              color: 'var(--arc-blue)',
              bg: 'rgba(0,200,240,0.08)',
              border: 'rgba(0,200,240,0.2)',
            },
            {
              label: 'AVG SCORE',
              value: `${avgScore}%`,
              icon: '🎯',
              color: avgScore >= 80 ? 'var(--success-green)' : avgScore >= 60 ? 'var(--warning-amber)' : 'var(--danger-red)',
              bg: avgScore >= 80 ? 'rgba(0,232,122,0.08)' : avgScore >= 60 ? 'rgba(255,184,0,0.08)' : 'rgba(255,68,68,0.08)',
              border: avgScore >= 80 ? 'rgba(0,232,122,0.2)' : avgScore >= 60 ? 'rgba(255,184,0,0.2)' : 'rgba(255,68,68,0.2)',
            },
            {
              label: 'BEST SCORE',
              value: `${bestScore}%`,
              icon: '⚡',
              color: 'var(--iron-gold)',
              bg: 'rgba(212,168,0,0.08)',
              border: 'rgba(212,168,0,0.2)',
            },
            {
              label: 'STREAK 🔥',
              value: `${streak}d`,
              icon: '🔥',
              color: 'var(--danger-red)',
              bg: 'rgba(255,68,68,0.08)',
              border: 'rgba(255,68,68,0.2)',
            },
          ].map(({ label, value, icon, color, bg, border }) => (
            <div key={label}
              className="p-5 rounded-xl"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="text-2xl mb-3">{icon}</div>
              <p className="text-3xl font-black mb-1"
                style={{ fontFamily: 'Orbitron', color }}>
                {value}
              </p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>

        {/* Time spent */}
        <div className="hud-panel p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏱</span>
            <div>
              <p className="stat-label">TOTAL TRAINING TIME</p>
              <p className="font-black"
                style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '20px' }}>
                {totalMinutes}m
              </p>
            </div>
          </div>
          <button onClick={() => router.push('/wallet')}
            className="btn-arc btn-outline px-4 py-2"
            style={{ fontSize: '10px', borderColor: 'var(--iron-gold)', color: 'var(--iron-gold)' }}>
            🏆 VIEW WALLET
          </button>
        </div>

        {/* Score Trend */}
        {chartData.length > 0 && (
          <div className="hud-panel p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">📈</span>
              <p className="font-black tracking-wider"
                style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)', fontSize: '13px' }}>
                SCORE TREND
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,48,80,0.8)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--iron-text)', fontFamily: 'Orbitron' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--iron-text)', fontFamily: 'Orbitron' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--iron-panel)',
                    border: '1px solid var(--arc-blue)',
                    borderRadius: '8px',
                    fontFamily: 'Rajdhani',
                  }}
                  labelStyle={{ color: 'var(--arc-blue)', fontFamily: 'Orbitron', fontSize: '11px' }}
                  itemStyle={{ color: 'var(--iron-bright)' }}
                  formatter={(value) => [`${value}%`, 'Score']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--arc-blue)"
                  strokeWidth={2.5}
                  dot={{ fill: 'var(--arc-blue)', r: 5, strokeWidth: 2, stroke: 'var(--iron-darker)' }}
                  activeDot={{ r: 7, stroke: 'var(--arc-blue)', strokeWidth: 2, fill: 'var(--iron-darker)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Difficulty Breakdown */}
        <div className="hud-panel p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🎯</span>
            <p className="font-black tracking-wider"
              style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)', fontSize: '13px' }}>
              PERFORMANCE BY DIFFICULTY
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={difficultyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,48,80,0.8)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--iron-text)', fontFamily: 'Orbitron' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--iron-text)', fontFamily: 'Orbitron' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--iron-panel)',
                  border: '1px solid var(--iron-border)',
                  borderRadius: '8px',
                  fontFamily: 'Rajdhani',
                }}
                formatter={(value) => [`${value}%`, 'Avg Score']}
              />
              <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                {difficultyData.map(entry => (
                  <Cell key={entry.name} fill={difficultyColors[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Difficulty legend */}
          <div className="flex gap-4 mt-3 justify-center">
            {difficultyData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full"
                  style={{ background: difficultyColors[d.name] }} />
                <span className="stat-label">{d.name}: {d.count} quiz{d.count !== 1 ? 'zes' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Badge Preview */}
        <div className="hud-panel p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-black tracking-wider"
              style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)', fontSize: '13px' }}>
              🏆 ACHIEVEMENT WALLET
            </p>
            <button onClick={() => router.push('/wallet')}
              className="btn-arc btn-outline px-3 py-1.5"
              style={{ fontSize: '9px' }}>
              OPEN →
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--iron-border)' }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${(earnedBadges.length / allBadges.length) * 100}%`,
                  background: 'linear-gradient(90deg, var(--arc-blue), var(--arc-glow))',
                  boxShadow: '0 0 8px rgba(0,200,240,0.4)',
                }} />
            </div>
            <span className="stat-label shrink-0">
              {earnedBadges.length}/{allBadges.length}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {allBadges.map(badge => (
              <div key={badge.id}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{
                  background: badge.earned ? 'rgba(0,200,240,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${badge.earned ? 'rgba(0,200,240,0.3)' : 'var(--iron-border)'}`,
                  filter: badge.earned ? 'none' : 'grayscale(1)',
                  opacity: badge.earned ? 1 : 0.3,
                  boxShadow: badge.earned ? '0 0 8px rgba(0,200,240,0.15)' : 'none',
                }}
                title={badge.name}>
                {badge.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="hud-panel p-5">
          <p className="font-black tracking-wider mb-4"
            style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)', fontSize: '13px' }}>
            📋 RECENT MISSIONS
          </p>
          <div className="space-y-2">
            {results.slice(0, 5).map(result => (
              <div key={result.id}
                className="flex items-center gap-4 py-3 px-1 cursor-pointer rounded-lg transition-all hover:bg-opacity-50"
                style={{ borderBottom: '1px solid var(--iron-border)' }}
                onClick={() => router.push(`/quiz/results/${result.id}`)}>

                {/* Score indicator */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: result.percentage >= 80
                      ? 'rgba(0,232,122,0.1)' : result.percentage >= 60
                      ? 'rgba(255,184,0,0.1)' : 'rgba(255,68,68,0.1)',
                    border: `1px solid ${result.percentage >= 80
                      ? 'rgba(0,232,122,0.3)' : result.percentage >= 60
                      ? 'rgba(255,184,0,0.3)' : 'rgba(255,68,68,0.3)'}`,
                  }}>
                  <p className="font-black"
                    style={{
                      fontFamily: 'Orbitron',
                      fontSize: '10px',
                      color: result.percentage >= 80 ? 'var(--success-green)'
                        : result.percentage >= 60 ? 'var(--warning-amber)'
                        : 'var(--danger-red)',
                    }}>
                    {result.percentage}%
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate"
                    style={{ color: 'var(--iron-bright)', fontFamily: 'Rajdhani' }}>
                    {result.quiz.config.topic}
                  </p>
                  <p className="stat-label" style={{ fontSize: '9px' }}>
                    {result.quiz.config.difficulty} · {result.quiz.questions.length}Q ·{' '}
                    {format(new Date(result.completedAt), 'MMM d')}
                  </p>
                </div>

                <span style={{ color: 'var(--iron-text-soft)', fontSize: '12px' }}>→</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/history')}
            className="btn-arc btn-outline w-full py-2.5 mt-4"
            style={{ fontSize: '10px' }}>
            VIEW FULL MISSION LOG →
          </button>
        </div>

      </div>
    </div>
  );
}