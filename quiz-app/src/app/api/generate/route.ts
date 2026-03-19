import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions } from '@/lib/huggingface/generateQuestions';
import { QuizConfig } from '@/types';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 5; // max 5 requests per minute

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) return false;

  record.count++;
  return true;
}

function validateConfig(config: unknown): config is QuizConfig {
  if (!config || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;

  if (typeof c.topic !== 'string') return false;
  if (c.topic.trim().length < 2 || c.topic.trim().length > 200) return false;
  if (!['Easy', 'Medium', 'Hard'].includes(c.difficulty as string)) return false;
  if (typeof c.numQuestions !== 'number') return false;
  if (c.numQuestions < 5 || c.numQuestions > 20) return false;

  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before generating another quiz.' },
        { status: 429 }
      );
    }

    // Parse body safely
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const config = (body as Record<string, unknown>)?.config;

    // Validate
    if (!validateConfig(config)) {
      return NextResponse.json(
        { error: 'Invalid configuration. Check topic, difficulty, and question count.' },
        { status: 400 }
      );
    }

    // Retry logic
    let questions;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        questions = await generateQuestions(config);
        break;
      } catch (error: unknown) {
        attempts++;
        const message = error instanceof Error ? error.message : '';
        if (message === 'MODEL_LOADING' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 20000));
          continue;
        }
        throw error;
      }
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate valid questions. Please try a different topic.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred.';
    console.error('Generate API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}