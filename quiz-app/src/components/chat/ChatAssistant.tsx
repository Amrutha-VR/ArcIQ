'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatAssistantProps {
  quizContext?: {
    topic: string;
    difficulty: string;
  };
}

const INITIAL_MESSAGE = (topic?: string): ChatMessage => ({
  id: uuidv4(),
  role: 'assistant',
  content: topic
    ? `Good day. I'm JARVIS. I'll assist you with "${topic}" without compromising mission integrity. Ask away.`
    : `Good day. I'm JARVIS, your AI assistant. How may I assist you today?`,
  timestamp: new Date().toISOString(),
});

export function ChatAssistant({ quizContext }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_MESSAGE(quizContext?.topic),
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          quizContext,
        }),
      });

      const data = await res.json() as { content?: string; error?: string };

      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: data.content ?? 'My apologies. I encountered an error.',
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'Connection interrupted. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating button — fixed bottom-right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Ask JARVIS"
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '20px',
            zIndex: 9999,
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,200,240,0.25), rgba(0,200,240,0.08))',
            border: '2px solid var(--arc-blue)',
            boxShadow: '0 0 20px rgba(0,200,240,0.35), 0 0 40px rgba(0,200,240,0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
          🤖
        </button>
      )}

      {/* Chat window — fixed bottom-right */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '20px',
            zIndex: 9999,
            width: '340px',
            height: '460px',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--iron-panel)',
            border: '1px solid var(--arc-blue)',
            borderRadius: '12px',
            boxShadow: '0 0 40px rgba(0,200,240,0.2)',
            overflow: 'hidden',
          }}>

          {/* Header */}
          <div style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,200,240,0.08)',
            borderBottom: '1px solid var(--iron-border)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--arc-blue)',
                animation: 'arcPulse 2s infinite',
              }} />
              <span style={{
                fontFamily: 'Orbitron',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--arc-blue)',
              }}>
                JARVIS ASSISTANT
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--iron-text)',
                cursor: 'pointer',
                fontSize: '16px',
                lineHeight: 1,
                padding: '2px 6px',
                borderRadius: '4px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger-red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--iron-text)')}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                gap: '8px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '26px', height: '26px',
                  borderRadius: '6px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  background: msg.role === 'assistant'
                    ? 'rgba(0,200,240,0.15)'
                    : 'rgba(212,168,0,0.15)',
                  border: `1px solid ${msg.role === 'assistant' ? 'rgba(0,200,240,0.3)' : 'rgba(212,168,0,0.3)'}`,
                }}>
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div style={{
                  maxWidth: '75%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  fontFamily: 'Rajdhani',
                  background: msg.role === 'assistant'
                    ? 'rgba(0,200,240,0.06)'
                    : 'rgba(212,168,0,0.08)',
                  border: `1px solid ${msg.role === 'assistant'
                    ? 'rgba(0,200,240,0.15)'
                    : 'rgba(212,168,0,0.2)'}`,
                  color: 'var(--iron-text)',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px',
                  background: 'rgba(0,200,240,0.15)',
                  border: '1px solid rgba(0,200,240,0.3)',
                }}>🤖</div>
                <div style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(0,200,240,0.06)',
                  border: '1px solid rgba(0,200,240,0.15)',
                  display: 'flex', gap: '4px', alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--arc-blue)',
                      animation: 'arcPulse 1s infinite',
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--iron-border)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexShrink: 0,
            background: 'rgba(0,0,0,0.2)',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask JARVIS..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid var(--iron-border)',
                background: 'rgba(0,200,240,0.04)',
                color: 'var(--iron-bright)',
                fontFamily: 'Rajdhani',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--arc-blue)')}
              onBlur={e => (e.target.style.borderColor = 'var(--iron-border)')}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, var(--arc-blue), var(--arc-glow))'
                  : 'var(--iron-border)',
                color: 'var(--iron-darker)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}