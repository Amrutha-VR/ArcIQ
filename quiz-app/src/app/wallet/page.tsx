'use client';

import { useState } from 'react';
import { useHistoryStore } from '@/store/historyStore';
import { computeBadges } from '@/lib/utils/badges';
import { Badge } from '@/types';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function WalletPage() {
  const router = useRouter();
  const { results } = useHistoryStore();
  const streak = useHistoryStore(s => s.getStreak());
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const badges = computeBadges(results, streak);
  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--iron-darker)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="stat-label mb-1">STARK INTELLIGENCE PLATFORM</p>
          <h1 className="text-2xl font-black tracking-wider mb-1"
            style={{ color: 'var(--iron-bright)' }}>
            ACHIEVEMENT WALLET
          </h1>
          <p style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani' }}>
            {earned.length} of {badges.length} badges earned
          </p>

          {/* Progress bar */}
          <div className="mt-3 w-full h-1.5 rounded-full" style={{ background: 'var(--iron-border)' }}>
            <div className="h-full rounded-full transition-all duration-700 arc-glow"
              style={{
                width: `${(earned.length / badges.length) * 100}%`,
                background: 'linear-gradient(90deg, var(--arc-blue), var(--arc-glow))',
              }} />
          </div>
        </div>

        {/* Earned Badges */}
        {earned.length > 0 && (
          <div className="mb-8">
            <p className="stat-label mb-3">EARNED BADGES</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {earned.map(badge => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="hud-panel p-4 text-center transition-all hover:scale-105 cursor-pointer"
                  style={{ borderColor: 'rgba(0,200,240,0.3)' }}>
                  <div className="text-4xl mb-2">{badge.emoji}</div>
                  <p className="text-xs font-black tracking-wider mb-1"
                    style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '10px' }}>
                    {badge.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani' }}>
                    {badge.description}
                  </p>
                  {badge.earnedAt && (
                    <p className="text-xs mt-2 stat-label">
                      {format(new Date(badge.earnedAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Locked Badges */}
        {locked.length > 0 && (
          <div>
            <p className="stat-label mb-3">LOCKED BADGES</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {locked.map(badge => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="hud-panel p-4 text-center transition-all hover:opacity-70 cursor-pointer badge-locked">
                  <div className="text-4xl mb-2">{badge.emoji}</div>
                  <p className="text-xs font-black tracking-wider mb-1"
                    style={{ fontFamily: 'Orbitron', color: 'var(--iron-text)', fontSize: '10px' }}>
                    {badge.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--iron-text-soft)', fontFamily: 'Rajdhani' }}>
                    {badge.condition}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🏆</p>
            <p className="font-black tracking-wider mb-2" style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)' }}>
              NO BADGES YET
            </p>
            <p className="mb-6" style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani' }}>
              Complete quizzes to start earning badges
            </p>
            <button
              onClick={() => router.push('/quiz/create')}
              className="btn-arc btn-primary px-6 py-3">
              ⚡ Start First Mission
            </button>
          </div>
        )}
      </div>

      {/* Badge Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(6,9,18,0.85)' }}
          onClick={() => setSelectedBadge(null)}>
          <div
            className="hud-panel corner-accent p-8 max-w-sm w-full text-center"
            style={{ borderColor: selectedBadge.earned ? 'var(--arc-blue)' : 'var(--iron-border)' }}
            onClick={e => e.stopPropagation()}>

            {/* Badge emoji */}
            <div className={`text-6xl mb-4 ${!selectedBadge.earned ? 'badge-locked' : ''}`}>
              {selectedBadge.emoji}
            </div>

            <p className="text-xs stat-label mb-1">
              {selectedBadge.earned ? 'BADGE EARNED' : 'BADGE LOCKED'}
            </p>
            <h2 className="text-lg font-black tracking-wider mb-3"
              style={{ fontFamily: 'Orbitron', color: selectedBadge.earned ? 'var(--arc-blue)' : 'var(--iron-text)' }}>
              {selectedBadge.name}
            </h2>

            {/* Remark */}
            <div className="p-4 rounded-lg mb-4 text-left"
              style={{
                background: selectedBadge.earned ? 'rgba(0,200,240,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedBadge.earned ? 'rgba(0,200,240,0.2)' : 'var(--iron-border)'}`,
              }}>
              <p className="text-xs stat-label mb-2">
                {selectedBadge.earned ? 'JARVIS REMARKS' : 'HOW TO UNLOCK'}
              </p>
              <p className="text-sm leading-relaxed"
                style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani', fontSize: '15px' }}>
                {selectedBadge.earned ? selectedBadge.remark : selectedBadge.condition}
              </p>
            </div>

            {selectedBadge.earnedFromQuiz && (
              <p className="text-xs mb-4 stat-label">
                Earned on: {selectedBadge.earnedFromQuiz}
              </p>
            )}

            <button
              onClick={() => setSelectedBadge(null)}
              className="btn-arc btn-outline px-6 py-2.5 w-full">
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}