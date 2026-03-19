'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const QUOTES = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    text: "Intelligence is the ability to adapt to change.",
    author: "Stephen Hawking",
  },
  {
    text: "The more that you read, the more things you will know.",
    author: "Dr. Seuss",
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    text: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
  },
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
  },
  {
    text: "The beautiful thing about learning is nobody can take it away from you.",
    author: "B.B. King",
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
  },
  {
    text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert",
  },
  {
    text: "Genius is one percent inspiration and ninety-nine percent perspiration.",
    author: "Thomas Edison",
  },
];

function QuoteRotator() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % QUOTES.length);
        setVisible(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="max-w-xl mx-auto text-center"
      style={{
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}>
      <div className="p-5 rounded-xl"
        style={{
          background: 'rgba(0,200,240,0.04)',
          border: '1px solid rgba(0,200,240,0.12)',
        }}>
        <p className="text-base leading-relaxed mb-3"
          style={{
            color: 'var(--iron-text)',
            fontFamily: 'Rajdhani',
            fontSize: '17px',
            fontStyle: 'italic',
          }}>
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-xs font-bold tracking-widest"
          style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '10px' }}>
          — {quote.author}
        </p>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setVisible(false); setTimeout(() => { setIndex(i); setVisible(true); }, 300); }}
            style={{
              width: i === index ? '16px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === index ? 'var(--arc-blue)' : 'var(--iron-border)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">

      {/* Background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[280, 460, 640, 820].map((size, i) => (
          <div key={size} className="absolute rounded-full"
            style={{
              width: size, height: size,
              border: `1px solid rgba(0,200,240,${0.07 - i * 0.015})`,
              animation: `arcPulse ${3 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }} />
        ))}
      </div>

      {/* Arc Reactor */}
      <div className="relative mb-10">
        <div className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(0,200,240,0.2), rgba(0,200,240,0.03))',
            boxShadow: '0 0 30px rgba(0,200,240,0.3), 0 0 60px rgba(0,200,240,0.1)',
          }}>
          <div className="w-18 h-18 rounded-full flex items-center justify-center"
            style={{
              width: '72px', height: '72px',
              background: 'radial-gradient(circle, var(--arc-blue), var(--arc-glow))',
              animation: 'arcPulse 1.8s ease-in-out infinite',
              boxShadow: '0 0 20px rgba(0,200,240,0.5)',
            }}>
            <div className="rounded-full"
              style={{
                width: '32px', height: '32px',
                background: 'var(--iron-darker)',
                boxShadow: 'inset 0 0 12px rgba(0,200,240,0.7)',
              }} />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-3 boot-up">
        <p className="stat-label mb-3">STARK INTELLIGENCE PLATFORM v3.0</p>
        <h1 className="text-5xl md:text-6xl font-black tracking-wider mb-3"
          style={{
            fontFamily: 'Orbitron',
            color: 'var(--iron-bright)',
            textShadow: '0 0 30px rgba(0,200,240,0.4)',
            lineHeight: 1.1,
          }}>
          Arc IQ
        </h1>
        <p className="text-lg max-w-lg mx-auto"
          style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani', lineHeight: 1.6 }}>
          AI-powered knowledge missions. Pick a topic, set your difficulty,
          and let JARVIS generate your briefing.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-12">
        <Link href="/quiz/create"
          className="btn-arc btn-primary px-8 py-4"
          style={{ fontSize: '12px' }}>
          ⚡ INITIATE MISSION
        </Link>
        <Link href="/dashboard"
          className="btn-arc btn-outline px-8 py-4"
          style={{ fontSize: '12px' }}>
          📊 VIEW SYSTEMS
        </Link>
      </div>

      {/* Quotes Section */}
      <div className="w-full max-w-2xl mb-10">
        <p className="stat-label text-center mb-3">DAILY INTELLIGENCE BRIEFING</p>
        <QuoteRotator />
      </div>

      {/* Bottom stats */}
      <div className="flex gap-8 text-center">
        {[
          { label: 'Think', value: 'LLAMA 3.1' },
          { label: 'Solve', value: 'ONLINE' },
          { label: 'Win', value: 'ACTIVE' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="stat-label mb-1">{label}</p>
            <p className="font-black text-sm arc-pulse"
              style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}