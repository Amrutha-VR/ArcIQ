'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '@/store/quizStore';
import { QuizConfig, Quiz } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const difficulties = ['Easy', 'Medium', 'Hard'] as const;

const difficultyConfig = {
  Easy: { color: 'var(--success-green)', label: 'RECRUIT', desc: 'Basic concepts' },
  Medium: { color: 'var(--warning-amber)', label: 'AGENT', desc: 'Intermediate level' },
  Hard: { color: 'var(--danger-red)', label: 'AVENGER', desc: 'Expert knowledge' },
};

export default function CreateQuizPage() {
  const router = useRouter();
  const { setCurrentQuiz, startQuiz } = useQuizStore();

  const [config, setConfig] = useState<QuizConfig>({
    topic: '',
    difficulty: 'Medium',
    numQuestions: 10,
    timePerQuestion: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  const loadingMessages = [
    'JARVIS is analyzing your request...',
    'Accessing Stark knowledge database...',
    'Generating mission briefing...',
    'Calibrating difficulty parameters...',
    'Preparing quiz protocol...',
  ];

  async function handleGenerate() {
    if (!config.topic.trim()) {
      setError('ALERT: Mission topic is required, sir.');
      return;
    }
    if (config.topic.trim().length < 2) {
      setError('ALERT: Topic must be at least 2 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    // Cycle loading messages
    let msgIndex = 0;
    setLoadingMsg(loadingMessages[0]);
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIndex]);
    }, 3000);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Mission briefing generation failed.');
      }

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('JARVIS returned invalid mission data. Please retry.');
      }

      const quiz: Quiz = {
        id: uuidv4(),
        config,
        questions: data.questions,
        createdAt: new Date().toISOString(),
      };

      setCurrentQuiz(quiz);
      startQuiz();
      router.push(`/quiz/${quiz.id}`);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown system error.';
      setError(message);
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest mb-2"
            style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '10px' }}>
            STARK INTELLIGENCE PLATFORM
          </p>
          <h1 className="text-3xl font-black tracking-wider mb-2"
            style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)' }}>
            MISSION BRIEFING
          </h1>
          <p style={{ color: 'var(--iron-text)' }}>
            Configure your knowledge assessment parameters
          </p>
        </div>

        {/* Form Panel */}
        <div className="hud-panel rounded-lg p-6 corner-tl relative">

          {/* Corner decorations */}
          <div className="absolute top-0 right-0 w-5 h-5">
            <div className="absolute top-0 right-0 w-full h-0.5"
              style={{ background: 'var(--arc-blue)' }} />
            <div className="absolute top-0 right-0 w-0.5 h-full"
              style={{ background: 'var(--arc-blue)' }} />
          </div>
          <div className="absolute bottom-0 left-0 w-5 h-5">
            <div className="absolute bottom-0 left-0 w-full h-0.5"
              style={{ background: 'var(--arc-blue)' }} />
            <div className="absolute bottom-0 left-0 w-0.5 h-full"
              style={{ background: 'var(--arc-blue)' }} />
          </div>

          <div className="space-y-6">

            {/* Topic */}
            <div>
              <label className="block text-xs font-bold tracking-widest mb-2"
                style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '10px' }}>
                MISSION TOPIC
              </label>
              <input
                type="text"
                value={config.topic}
                onChange={e => { setConfig(c => ({ ...c, topic: e.target.value })); setError(null); }}
                placeholder="e.g. Quantum Physics, World War II, Python..."
                className="w-full px-4 py-3 rounded text-sm outline-none transition-all"
                style={{
                  background: 'rgba(0,212,255,0.05)',
                  border: '1px solid var(--iron-border)',
                  color: 'var(--iron-bright)',
                  fontFamily: 'Rajdhani',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--arc-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--iron-border)'}
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold tracking-widest mb-3"
                style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '10px' }}>
                CLEARANCE LEVEL
              </label>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map(d => {
                  const cfg = difficultyConfig[d];
                  const isSelected = config.difficulty === d;
                  return (
                    <button key={d}
                      onClick={() => setConfig(c => ({ ...c, difficulty: d }))}
                      className="py-3 px-2 rounded text-center transition-all"
                      style={{
                        border: `1px solid ${isSelected ? cfg.color : 'var(--iron-border)'}`,
                        background: isSelected ? `rgba(${d === 'Easy' ? '0,255,136' : d === 'Medium' ? '255,184,0' : '255,51,51'},0.1)` : 'transparent',
                        boxShadow: isSelected ? `0 0 15px ${cfg.color}40` : 'none',
                      }}>
                      <p className="text-xs font-black tracking-widest"
                        style={{ fontFamily: 'Orbitron', color: cfg.color, fontSize: '9px' }}>
                        {cfg.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--iron-text)' }}>
                        {cfg.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Questions slider */}
            <div>
              <label className="block text-xs font-bold tracking-widest mb-2"
                style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '10px' }}>
                MISSION OBJECTIVES:{' '}
                <span style={{ color: 'var(--iron-bright)' }}>{config.numQuestions}</span>
              </label>
              <input type="range" min={5} max={20} value={config.numQuestions}
                onChange={e => setConfig(c => ({ ...c, numQuestions: parseInt(e.target.value) }))}
                className="w-full"
                style={{ accentColor: 'var(--arc-blue)' }}
              />
              <div className="flex justify-between text-xs mt-1"
                style={{ color: 'var(--iron-text)' }}>
                <span>5</span><span>20</span>
              </div>
            </div>

            {/* Time slider */}
            <div>
              <label className="block text-xs font-bold tracking-widest mb-2"
                style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '10px' }}>
                TIME PER OBJECTIVE:{' '}
                <span style={{ color: 'var(--iron-bright)' }}>{config.timePerQuestion}s</span>
              </label>
              <input type="range" min={10} max={120} step={5} value={config.timePerQuestion}
                onChange={e => setConfig(c => ({ ...c, timePerQuestion: parseInt(e.target.value) }))}
                className="w-full"
                style={{ accentColor: 'var(--arc-blue)' }}
              />
              <div className="flex justify-between text-xs mt-1"
                style={{ color: 'var(--iron-text)' }}>
                <span>10s</span><span>120s</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded text-sm"
                style={{
                  background: 'rgba(255,51,51,0.1)',
                  border: '1px solid var(--danger-red)',
                  color: 'var(--danger-red)',
                  fontFamily: 'Orbitron',
                  fontSize: '11px',
                }}>
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 rounded font-black tracking-widest text-sm transition-all disabled:opacity-50"
              style={{
                fontFamily: 'Orbitron',
                background: loading
                  ? 'rgba(0,212,255,0.2)'
                  : 'linear-gradient(135deg, var(--arc-blue), var(--arc-glow))',
                color: loading ? 'var(--arc-blue)' : 'var(--iron-darker)',
                border: loading ? '1px solid var(--arc-blue)' : 'none',
              }}>
              {loading ? '⚙ PROCESSING...' : '⚡ INITIATE MISSION'}
            </button>

            {loading && (
              <p className="text-center text-xs arc-pulse"
                style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '10px' }}>
                {loadingMsg}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}