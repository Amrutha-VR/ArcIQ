'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useHistoryStore } from '@/store/historyStore';
import { useQuizStore } from '@/store/quizStore';
import { exportResultAsPdf } from '@/lib/utils/exportPdf';
import { shareQuiz } from '@/lib/utils/shareQuiz';
import { computeBadges, getBadgesEarnedFromResult } from '@/lib/utils/badges';
import { Badge } from '@/types';

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { results } = useHistoryStore();
  const { setCurrentQuiz, startQuiz } = useQuizStore();
  const streak = useHistoryStore(s => s.getStreak());

  const [shareMsg, setShareMsg] = useState('');
  const [animatedScore, setAnimatedScore] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [activeTab, setActiveTab] = useState<'badges' | 'breakdown' | 'dashboard'>('badges');
  const confettiFired = useRef(false);

  const result = results.find(r => r.id === id);

  // Badges earned from THIS quiz
  const earnedThisQuiz = result
    ? getBadgesEarnedFromResult(result, results, streak)
    : [];

  // All earned badges overall
  const allBadges = result ? computeBadges(results, streak) : [];
  const allEarned = allBadges.filter(b => b.earned);

  // Dashboard stats
  const totalQuizzes = results.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes)
    : 0;
  const bestScore = totalQuizzes > 0
    ? Math.max(...results.map(r => r.percentage))
    : 0;

  useEffect(() => {
    if (!result || confettiFired.current) return;
    confettiFired.current = true;

    // Animate score
    const target = result.percentage;
    let current = 0;
    const step = Math.max(target / 50, 1);
    const counter = setInterval(() => {
      current = Math.min(current + step, target);
      setAnimatedScore(Math.round(current));
      if (current >= target) clearInterval(counter);
    }, 25);

    // Confetti for 80%+
    if (result.percentage >= 80) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00c8f0', '#d4a800', '#00e87a', '#e03030'],
        });
        setTimeout(() => {
          confetti({ particleCount: 60, angle: 60, spread: 50, origin: { x: 0 } });
          confetti({ particleCount: 60, angle: 120, spread: 50, origin: { x: 1 } });
        }, 600);
      });
    }

    return () => clearInterval(counter);
  }, [result]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="hud-panel p-8 text-center max-w-sm w-full">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="font-black tracking-wider mb-4"
            style={{ fontFamily: 'Orbitron', color: 'var(--danger-red)', fontSize: '13px' }}>
            MISSION DATA NOT FOUND
          </p>
          <button onClick={() => router.push('/history')}
            className="btn-arc btn-outline px-6 py-2.5 w-full">
            VIEW MISSION LOG
          </button>
        </div>
      </div>
    );
  }

  const { quiz, answers, score, percentage, timeTaken } = result;
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  const scoreColor =
    percentage >= 80 ? 'var(--success-green)'
    : percentage >= 60 ? 'var(--warning-amber)'
    : 'var(--danger-red)';

  const scoreLabel =
    percentage === 100 ? '⚡ PERFECT — ARC REACTOR EFFICIENCY'
    : percentage >= 80 ? '🥇 GOLD AVENGER PERFORMANCE'
    : percentage >= 60 ? '🛡 SILVER SHIELD PERFORMANCE'
    : percentage >= 40 ? '🥉 BRONZE AGENT PERFORMANCE'
    : '🔩 IRON RECRUIT — KEEP TRAINING';

  function handleRetake() {
    setCurrentQuiz(quiz);
    startQuiz();
    router.push(`/quiz/${quiz.id}`);
  }

  async function handleShare() {
    const res = await shareQuiz(quiz.config.topic, score, quiz.questions.length, percentage);
    if (res === 'copied') {
      setShareMsg('COPIED TO CLIPBOARD!');
      setTimeout(() => setShareMsg(''), 3000);
    }
  }

  const tabs = [
    { id: 'badges' as const, label: `🏆 BADGES (${earnedThisQuiz.length})` },
    { id: 'breakdown' as const, label: '📋 BREAKDOWN' },
    { id: 'dashboard' as const, label: '📊 STATS' },
  ];

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--iron-darker)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Score Hero */}
        <div className="text-center mb-8">
          <p className="stat-label mb-4">MISSION DEBRIEF</p>

          {/* Arc Reactor Score */}
          <div className="relative w-44 h-44 mx-auto mb-5 flex items-center justify-center">
            {[160, 120, 80].map((size, i) => (
              <div key={size} className="absolute rounded-full"
                style={{
                  width: size, height: size,
                  border: `1.5px solid ${scoreColor}`,
                  opacity: 1 - i * 0.28,
                  animation: `arcPulse ${1.5 + i * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  boxShadow: i === 0 ? `0 0 20px ${scoreColor}40` : 'none',
                }} />
            ))}
            <div className="relative z-10 text-center">
              <p className="font-black"
                style={{
                  fontFamily: 'Orbitron',
                  fontSize: '42px',
                  color: scoreColor,
                  textShadow: `0 0 24px ${scoreColor}80`,
                  lineHeight: 1,
                }}>
                {animatedScore}%
              </p>
              <p className="stat-label mt-1">EFFICIENCY</p>
            </div>
          </div>

          <p className="font-bold tracking-wider mb-1"
            style={{ fontFamily: 'Orbitron', color: scoreColor, fontSize: '12px' }}>
            {scoreLabel}
          </p>
          <p className="text-sm" style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani' }}>
            {quiz.config.topic} · {quiz.config.difficulty}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="hud-panel p-4 mb-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'SCORE', value: `${score}/${quiz.questions.length}` },
              { label: 'TIME', value: `${minutes}m ${seconds}s` },
              { label: 'CORRECT', value: `${answers.filter(a => a.isCorrect).length}` },
            ].map(({ label, value }) => (
              <div key={label} className="py-3 rounded-lg"
                style={{ background: 'rgba(0,200,240,0.05)', border: '1px solid var(--iron-border)' }}>
                <p className="text-lg font-black stat-value">{value}</p>
                <p className="stat-label mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl"
          style={{ background: 'var(--iron-panel)', border: '1px solid var(--iron-border)' }}>
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all"
              style={{
                fontFamily: 'Orbitron',
                fontSize: '9px',
                background: activeTab === tab.id ? 'rgba(0,200,240,0.15)' : 'transparent',
                color: activeTab === tab.id ? 'var(--arc-blue)' : 'var(--iron-text)',
                border: activeTab === tab.id ? '1px solid rgba(0,200,240,0.3)' : '1px solid transparent',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Badges */}
        {activeTab === 'badges' && (
          <div className="space-y-4 mb-5">

            {/* Earned this quiz */}
            <div className="hud-panel p-5"
              style={{ borderColor: 'rgba(212,168,0,0.3)', background: 'rgba(212,168,0,0.03)' }}>
              <p className="stat-label mb-1" style={{ color: 'var(--iron-gold)' }}>
                🎖 EARNED THIS MISSION
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {earnedThisQuiz.map(badge => (
                  <button key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className="p-4 rounded-xl text-center transition-all hover:scale-105"
                    style={{
                      background: 'rgba(0,200,240,0.06)',
                      border: '1px solid rgba(0,200,240,0.3)',
                      boxShadow: '0 0 12px rgba(0,200,240,0.08)',
                    }}>
                    <div className="text-3xl mb-2">{badge.emoji}</div>
                    <p style={{
                      fontFamily: 'Orbitron', fontSize: '9px',
                      color: 'var(--arc-blue)', fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}>
                      {badge.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani' }}>
                      {badge.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* All badges wallet preview */}
            <div className="hud-panel p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="stat-label">ALL BADGES ({allEarned.length}/{allBadges.length})</p>
                <button onClick={() => router.push('/wallet')}
                  className="text-xs font-bold"
                  style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '9px' }}>
                  OPEN WALLET →
                </button>
              </div>

              {/* Progress */}
              <div className="w-full h-1.5 rounded-full mb-4" style={{ background: 'var(--iron-border)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${(allEarned.length / allBadges.length) * 100}%`,
                    background: 'linear-gradient(90deg, var(--arc-blue), var(--arc-glow))',
                  }} />
              </div>

              <div className="grid grid-cols-5 gap-2">
                {allBadges.map(badge => (
                  <button key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className="p-2 rounded-lg text-center transition-all"
                    style={{
                      background: badge.earned ? 'rgba(0,200,240,0.08)' : 'transparent',
                      border: `1px solid ${badge.earned ? 'rgba(0,200,240,0.25)' : 'var(--iron-border)'}`,
                      filter: badge.earned ? 'none' : 'grayscale(1)',
                      opacity: badge.earned ? 1 : 0.35,
                    }}
                    title={badge.name}>
                    <div className="text-xl">{badge.emoji}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Breakdown */}
        {activeTab === 'breakdown' && (
          <div className="hud-panel p-5 mb-5">
            <p className="stat-label mb-4">QUESTION BREAKDOWN</p>
            <div className="space-y-3">
              {quiz.questions.map((q, index) => {
                const answer = answers.find(a => a.questionId === q.id);
                const isCorrect = answer?.isCorrect ?? false;
                const selectedOption = answer?.selectedOption ?? -1;

                return (
                  <div key={q.id} className="p-4 rounded-xl"
                    style={{
                      background: isCorrect
                        ? 'rgba(0,232,122,0.05)' : 'rgba(255,68,68,0.05)',
                      border: `1px solid ${isCorrect
                        ? 'rgba(0,232,122,0.2)' : 'rgba(255,68,68,0.2)'}`,
                    }}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0">{isCorrect ? '✅' : '❌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold mb-2"
                          style={{
                            color: 'var(--iron-bright)',
                            fontFamily: 'Rajdhani',
                            lineHeight: 1.4,
                            fontSize: '15px',
                          }}>
                          {index + 1}. {q.question}
                        </p>
                        {!isCorrect && (
                          <div className="space-y-1 mb-2">
                            {selectedOption >= 0 ? (
                              <p className="text-xs" style={{ color: 'var(--danger-red)' }}>
                                ✗ Your answer: {q.options[selectedOption]}
                              </p>
                            ) : (
                              <p className="text-xs" style={{ color: 'var(--danger-red)' }}>
                                ✗ No answer — time expired
                              </p>
                            )}
                            <p className="text-xs font-semibold"
                              style={{ color: 'var(--success-green)' }}>
                              ✓ Correct: {q.options[q.correctAnswer]}
                            </p>
                          </div>
                        )}
                        {isCorrect && (
                          <p className="text-xs font-semibold mb-2"
                            style={{ color: 'var(--success-green)' }}>
                            ✓ {q.options[q.correctAnswer]}
                          </p>
                        )}
                        <p className="text-xs italic"
                          style={{ color: 'var(--iron-text-soft)', fontFamily: 'Rajdhani' }}>
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Dashboard Stats */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 mb-5">
            <div className="hud-panel p-5">
              <p className="stat-label mb-4">YOUR OVERALL PERFORMANCE</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'TOTAL MISSIONS', value: String(totalQuizzes) },
                  { label: 'AVG SCORE', value: `${avgScore}%` },
                  { label: 'BEST SCORE', value: `${bestScore}%` },
                  { label: 'DAY STREAK', value: `${streak} 🔥` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-xl text-center"
                    style={{ background: 'rgba(0,200,240,0.05)', border: '1px solid var(--iron-border)' }}>
                    <p className="text-2xl font-black stat-value mb-1">{value}</p>
                    <p className="stat-label">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hud-panel p-5">
              <p className="stat-label mb-3">RECENT MISSIONS</p>
              <div className="space-y-2">
                {results.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2.5 px-1"
                    style={{ borderBottom: '1px solid var(--iron-border)' }}>
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-semibold truncate"
                        style={{ color: 'var(--iron-bright)', fontFamily: 'Rajdhani' }}>
                        {r.quiz.config.topic}
                      </p>
                      <p className="stat-label" style={{ fontSize: '9px' }}>
                        {r.quiz.config.difficulty} · {r.quiz.questions.length}Q
                      </p>
                    </div>
                    <p className="font-black shrink-0"
                      style={{
                        fontFamily: 'Orbitron',
                        fontSize: '14px',
                        color: r.percentage >= 80 ? 'var(--success-green)'
                          : r.percentage >= 60 ? 'var(--warning-amber)'
                          : 'var(--danger-red)',
                      }}>
                      {r.percentage}%
                    </p>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/dashboard')}
                className="btn-arc btn-outline w-full py-2.5 mt-4"
                style={{ fontSize: '10px' }}>
                OPEN FULL DASHBOARD →
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/')}
            className="btn-arc btn-outline py-3">
            🏠 HOME
          </button>
          <button onClick={() => router.push('/quiz/create')}
            className="btn-arc btn-outline py-3"
            style={{ borderColor: 'var(--arc-blue)', color: 'var(--arc-blue)' }}>
            ⚡ NEW MISSION
          </button>
          <button onClick={handleRetake}
            className="btn-arc btn-primary py-3">
            🔄 RETRY
          </button>
          <button onClick={() => exportResultAsPdf(result)}
            className="btn-arc btn-outline py-3"
            style={{ borderColor: 'var(--iron-gold)', color: 'var(--iron-gold)' }}>
            📄 EXPORT PDF
          </button>
          <button onClick={handleShare}
            className="btn-arc btn-outline py-3 col-span-2"
            style={{ borderColor: 'var(--success-green)', color: 'var(--success-green)' }}>
            🔗 {shareMsg || 'SHARE INTEL'}
          </button>
        </div>
      </div>

      {/* Badge Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(6,9,18,0.9)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedBadge(null)}>
          <div
            className="hud-panel corner-accent p-7 max-w-sm w-full text-center"
            style={{
              borderColor: selectedBadge.earned ? 'var(--arc-blue)' : 'var(--iron-border)',
              boxShadow: selectedBadge.earned ? '0 0 40px rgba(0,200,240,0.15)' : 'none',
            }}
            onClick={e => e.stopPropagation()}>

            <div className="text-5xl mb-3"
              style={{ filter: selectedBadge.earned ? 'none' : 'grayscale(1)' }}>
              {selectedBadge.emoji}
            </div>

            <p className="stat-label mb-1">
              {selectedBadge.earned ? '✓ BADGE EARNED' : '🔒 BADGE LOCKED'}
            </p>
            <h2 className="font-black tracking-wider mb-4"
              style={{
                fontFamily: 'Orbitron',
                fontSize: '14px',
                color: selectedBadge.earned ? 'var(--arc-blue)' : 'var(--iron-text)',
              }}>
              {selectedBadge.name}
            </h2>

            <div className="p-4 rounded-xl mb-5 text-left"
              style={{
                background: selectedBadge.earned
                  ? 'rgba(0,200,240,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${selectedBadge.earned
                  ? 'rgba(0,200,240,0.2)' : 'var(--iron-border)'}`,
              }}>
              <p className="stat-label mb-2">
                {selectedBadge.earned ? 'JARVIS REMARKS' : 'HOW TO UNLOCK'}
              </p>
              <p style={{
                color: 'var(--iron-text)',
                fontFamily: 'Rajdhani',
                fontSize: '15px',
                lineHeight: 1.6,
              }}>
                {selectedBadge.earned ? selectedBadge.remark : selectedBadge.condition}
              </p>
            </div>

            {selectedBadge.earnedFromQuiz && (
              <p className="stat-label mb-4">
                Earned on: {selectedBadge.earnedFromQuiz}
              </p>
            )}

            <button onClick={() => setSelectedBadge(null)}
              className="btn-arc btn-outline w-full py-2.5">
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}