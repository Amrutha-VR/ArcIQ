'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '@/store/quizStore';
import { useHistoryStore } from '@/store/historyStore';
import { UserAnswer, QuizResult } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { ChatAssistant } from '@/components/chat/ChatAssistant';

export default function QuizPage() {
  const router = useRouter();
  const {
    currentQuiz,
    currentQuestionIndex,
    userAnswers,
    quizStartTime,
    questionStartTime,
    answerQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
  } = useQuizStore();

  const { addResult } = useHistoryStore();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [finishing, setFinishing] = useState(false);

  const question = currentQuiz?.questions[currentQuestionIndex];
  const totalQuestions = currentQuiz?.questions.length ?? 0;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const existingAnswer = userAnswers.find(a => a.questionId === question?.id);

  // correctAnswer as number — guaranteed
  const correctIdx = question ? Number(question.correctAnswer) : -1;

  useEffect(() => {
    if (!currentQuiz) router.push('/quiz/create');
  }, [currentQuiz, router]);

  useEffect(() => {
    if (existingAnswer !== undefined) {
      setSelectedOption(existingAnswer.selectedOption);
      setHasAnswered(true);
    } else {
      setSelectedOption(null);
      setHasAnswered(false);
    }
  }, [currentQuestionIndex]);

  const handleAutoSubmit = useCallback(() => {
    if (!question || hasAnswered) return;
    const answer: UserAnswer = {
      questionId: question.id,
      selectedOption: -1,
      isCorrect: false,
      timeTaken: currentQuiz?.config.timePerQuestion ?? 0,
    };
    answerQuestion(answer);
    setHasAnswered(true);
  }, [question, hasAnswered, currentQuiz, answerQuestion]);

  const autoSubmitRef = useRef(handleAutoSubmit);
  useEffect(() => {
    autoSubmitRef.current = handleAutoSubmit;
  }, [handleAutoSubmit]);

  useEffect(() => {
    if (!currentQuiz?.config.timePerQuestion || hasAnswered) return;
    setTimeLeft(currentQuiz.config.timePerQuestion);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => autoSubmitRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, hasAnswered]);

  function handleSelectOption(index: number) {
    if (hasAnswered) return;
    setSelectedOption(index);
  }

  function handleConfirmAnswer() {
    if (selectedOption === null || !question || hasAnswered) return;

    const timeTaken = questionStartTime
      ? Math.round((Date.now() - questionStartTime) / 1000)
      : 0;

    // Always compare numbers
    const isCorrect = selectedOption === correctIdx;

    const answer: UserAnswer = {
      questionId: question.id,
      selectedOption,
      isCorrect,
      timeTaken,
    };

    answerQuestion(answer);
    setHasAnswered(true);
  }

  async function handleFinishQuiz() {
    if (!currentQuiz || !quizStartTime || finishing) return;
    setFinishing(true);

    const totalTime = Math.round((Date.now() - quizStartTime) / 1000);
    const allAnswers = [...userAnswers];
    const score = allAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((score / totalQuestions) * 100);

    const result: QuizResult = {
      id: uuidv4(),
      quizId: currentQuiz.id,
      quiz: currentQuiz,
      answers: allAnswers,
      score,
      percentage,
      timeTaken: totalTime,
      completedAt: new Date().toISOString(),
    };

    // Get user ID from Supabase
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? 'anonymous';

    // Save to Supabase (addResult is now async)
    await addResult(result, userId);

    router.push(`/quiz/results/${result.id}`);
  }

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const answeredCount = userAnswers.length;
  const timerPct = currentQuiz?.config.timePerQuestion
    ? (timeLeft / currentQuiz.config.timePerQuestion) * 100
    : 100;

  if (!currentQuiz || !question) return null;

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--iron-darker)' }}>
      <div className="max-w-2xl mx-auto">

        {/* HUD Header */}
        <div className="hud-panel rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '9px', letterSpacing: '0.1em' }}>
                OBJECTIVE {currentQuestionIndex + 1} / {totalQuestions}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--iron-text)' }}>
                {currentQuiz.config.topic} · {currentQuiz.config.difficulty}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {currentQuiz.config.timePerQuestion && !hasAnswered && (
                <div className="text-center">
                  <p className="text-2xl font-black"
                    style={{
                      fontFamily: 'Orbitron',
                      color: timeLeft <= 5 ? 'var(--danger-red)'
                        : timeLeft <= 10 ? 'var(--warning-amber)'
                        : 'var(--arc-blue)',
                    }}>
                    {timeLeft}
                  </p>
                  <p style={{ fontFamily: 'Orbitron', color: 'var(--iron-text)', fontSize: '8px' }}>SEC</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-lg font-black"
                  style={{ fontFamily: 'Orbitron', color: 'var(--success-green)' }}>
                  {answeredCount}
                </p>
                <p style={{ fontFamily: 'Orbitron', color: 'var(--iron-text)', fontSize: '8px' }}>DONE</p>
              </div>
            </div>
          </div>

          <div className="w-full h-1 rounded-full" style={{ background: 'var(--iron-border)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--arc-blue)', boxShadow: '0 0 6px rgba(0,200,240,0.5)' }} />
          </div>

          {currentQuiz.config.timePerQuestion && !hasAnswered && (
            <div className="w-full h-0.5 rounded-full mt-1" style={{ background: 'var(--iron-border)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${timerPct}%`,
                  background: timerPct > 50 ? 'var(--success-green)'
                    : timerPct > 20 ? 'var(--warning-amber)'
                    : 'var(--danger-red)',
                }} />
            </div>
          )}
        </div>

        {/* Question Card */}
        <div className="hud-panel rounded-lg p-6 mb-4 corner-accent relative">
          <div className="absolute top-0 right-0 w-5 h-5">
            <div className="absolute top-0 right-0 w-full h-0.5" style={{ background: 'var(--arc-blue)' }} />
            <div className="absolute top-0 right-0 w-0.5 h-full" style={{ background: 'var(--arc-blue)' }} />
          </div>

          <h2 className="text-lg font-semibold mb-6 leading-relaxed"
            style={{ color: 'var(--iron-bright)', fontFamily: 'Rajdhani' }}>
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, index) => {
              let borderColor = 'var(--iron-border)';
              let bgColor = 'transparent';
              let textColor = 'var(--iron-text)';
              let indicator = '';

              if (hasAnswered) {
                if (index === correctIdx) {
                  // Correct answer — always green
                  borderColor = 'var(--success-green)';
                  bgColor = 'rgba(0,232,122,0.1)';
                  textColor = 'var(--success-green)';
                  indicator = '✓';
                } else if (index === selectedOption) {
                  // What the user picked and it was wrong — red
                  borderColor = 'var(--danger-red)';
                  bgColor = 'rgba(255,68,68,0.1)';
                  textColor = 'var(--danger-red)';
                  indicator = '✗';
                }
              } else if (selectedOption === index) {
                borderColor = 'var(--arc-blue)';
                bgColor = 'rgba(0,200,240,0.1)';
                textColor = 'var(--arc-blue)';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectOption(index)}
                  className="w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3"
                  style={{
                    border: `1px solid ${borderColor}`,
                    background: bgColor,
                    cursor: hasAnswered ? 'default' : 'pointer',
                  }}>
                  <span
                    className="w-7 h-7 rounded flex items-center justify-center text-xs font-black shrink-0"
                    style={{
                      fontFamily: 'Orbitron',
                      border: `1px solid ${borderColor}`,
                      color: textColor,
                    }}>
                    {['A', 'B', 'C', 'D'][index]}
                  </span>
                  <span style={{ color: textColor, fontFamily: 'Rajdhani', fontSize: '16px', flex: 1 }}>
                    {option}
                  </span>
                  {indicator && (
                    <span className="ml-auto font-bold" style={{ color: textColor, fontSize: '16px' }}>
                      {indicator}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {hasAnswered && (
            <div className="mt-5 p-4 rounded-lg"
              style={{
                background: 'rgba(0,200,240,0.05)',
                border: '1px solid rgba(0,200,240,0.2)',
              }}>
              <p style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '9px', letterSpacing: '0.1em', marginBottom: '8px' }}>
                JARVIS ANALYSIS
              </p>
              <p style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani', fontSize: '15px', lineHeight: 1.6 }}>
                {question.explanation}
              </p>
              <p style={{ color: 'var(--success-green)', fontFamily: 'Rajdhani', fontSize: '13px', marginTop: '8px', fontWeight: 600 }}>
                ✓ Correct answer: {question.options[correctIdx]}
              </p>
            </div>
          )}
        </div>

        {/* Dot navigation */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {currentQuiz.questions.map((q, index) => {
            const ans = userAnswers.find(a => a.questionId === q.id);
            const isActive = index === currentQuestionIndex;
            return (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className="w-8 h-8 rounded text-xs font-black transition-all"
                style={{
                  fontFamily: 'Orbitron',
                  background: isActive ? 'var(--arc-blue)'
                    : ans ? (ans.isCorrect ? 'rgba(0,232,122,0.2)' : 'rgba(255,68,68,0.2)')
                    : 'var(--iron-panel)',
                  border: `1px solid ${isActive ? 'var(--arc-blue)'
                    : ans ? (ans.isCorrect ? 'var(--success-green)' : 'var(--danger-red)')
                    : 'var(--iron-border)'}`,
                  color: isActive ? 'var(--iron-darker)'
                    : ans ? (ans.isCorrect ? 'var(--success-green)' : 'var(--danger-red)')
                    : 'var(--iron-text)',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}>
                {index + 1}
              </button>
            );
          })}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-5 py-2 rounded text-xs font-black tracking-widest transition-all disabled:opacity-30"
            style={{
              fontFamily: 'Orbitron',
              border: '1px solid var(--iron-border)',
              color: 'var(--iron-text)',
              background: 'transparent',
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
            }}>
            ← PREV
          </button>

          <div className="flex gap-3">
            {!hasAnswered && selectedOption !== null && (
              <button
                onClick={handleConfirmAnswer}
                className="px-5 py-2 rounded text-xs font-black tracking-widest transition-all"
                style={{
                  fontFamily: 'Orbitron',
                  background: 'linear-gradient(135deg, var(--arc-blue), var(--arc-glow))',
                  color: 'var(--iron-darker)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(0,200,240,0.3)',
                }}>
                CONFIRM
              </button>
            )}

            {hasAnswered && (
              isLastQuestion ? (
                <button
                  onClick={handleFinishQuiz}
                  disabled={finishing}
                  className="px-5 py-2 rounded text-xs font-black tracking-widest transition-all disabled:opacity-50"
                  style={{
                    fontFamily: 'Orbitron',
                    background: 'linear-gradient(135deg, var(--success-green), #00cc66)',
                    color: 'var(--iron-darker)',
                    border: 'none',
                    cursor: finishing ? 'not-allowed' : 'pointer',
                  }}>
                  {finishing ? '⚙ SAVING...' : '✓ MISSION COMPLETE'}
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  className="px-5 py-2 rounded text-xs font-black tracking-widest transition-all"
                  style={{
                    fontFamily: 'Orbitron',
                    background: 'linear-gradient(135deg, var(--arc-blue), var(--arc-glow))',
                    color: 'var(--iron-darker)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(0,200,240,0.3)',
                  }}>
                  NEXT →
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <ChatAssistant quizContext={{
        topic: currentQuiz.config.topic,
        difficulty: currentQuiz.config.difficulty,
      }} />
    </div>
  );
}