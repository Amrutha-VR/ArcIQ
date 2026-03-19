import { Question, QuizConfig } from '@/types';

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

function buildPrompt(config: QuizConfig): string {
  return `Generate ${config.numQuestions} multiple choice quiz questions about "${config.topic}" at ${config.difficulty} difficulty level.

OUTPUT FORMAT: Return ONLY a JSON array. No markdown. No code fences. No explanation. Start with [ and end with ].

EACH QUESTION MUST FOLLOW THIS EXACT STRUCTURE:
{"id":"q1","question":"Question text?","options":["Option A","Option B","Option C","Option D"],"correctAnswer":0,"explanation":"Why this answer is correct.","type":"mcq"}

RULES FOR correctAnswer:
- correctAnswer is an INTEGER from 0 to 3
- It is the INDEX of the correct option in the options array
- options[correctAnswer] must equal the factually correct answer
- EXAMPLE: if question is "What is 2+2?" and correct answer is 4, and options are ["3","4","5","6"], then correctAnswer must be 1 because options[1]="4"
- DOUBLE CHECK: before writing correctAnswer, verify options[correctAnswer] is actually correct

TOPIC: ${config.topic}
DIFFICULTY: ${config.difficulty}
COUNT: ${config.numQuestions}

Return the JSON array now:`;
}

function extractJSON(text: string): string {
  // Remove markdown code fences
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  // Find the array bounds
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON array found in response');
  }

  return cleaned.slice(start, end + 1);
}

function safeParseInt(value: unknown): number | null {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value.trim(), 10);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

function parseAIResponse(text: string): Question[] {
  const jsonString = extractJSON(text);

  let parsed: unknown[];
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    // Try to fix common JSON issues
    const fixed = jsonString
      .replace(/,(\s*[}\]])/g, '$1') // trailing commas
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // unquoted keys
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // control chars
    parsed = JSON.parse(fixed);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI response is not a JSON array');
  }

  const questions: Question[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const raw = parsed[i];
    if (!raw || typeof raw !== 'object') continue;
    const q = raw as Record<string, unknown>;

    // Validate question text
    if (typeof q.question !== 'string' || q.question.trim().length === 0) {
      console.warn(`Skipping q${i}: missing question text`);
      continue;
    }

    // Validate options
    if (!Array.isArray(q.options) || q.options.length < 4) {
      console.warn(`Skipping q${i}: invalid options`);
      continue;
    }

    const options = (q.options as unknown[]).slice(0, 4).map(o =>
      typeof o === 'string' ? o.trim() : String(o)
    );

    if (options.some(o => o.length === 0)) {
      console.warn(`Skipping q${i}: empty option`);
      continue;
    }

    // Parse correctAnswer — CRITICAL: always convert to integer
    const correctAnswer = safeParseInt(q.correctAnswer);

    if (correctAnswer === null || correctAnswer < 0 || correctAnswer > 3) {
      console.warn(`Skipping q${i}: invalid correctAnswer "${q.correctAnswer}"`);
      continue;
    }

    // Final sanity check: log what the correct answer maps to
    console.log(
      `Q${i + 1}: correctAnswer=${correctAnswer} → "${options[correctAnswer]}"`
    );

    questions.push({
      id: typeof q.id === 'string' ? q.id : `q${i + 1}`,
      question: (q.question as string).trim(),
      options,
      correctAnswer, // always a number 0-3
      explanation:
        typeof q.explanation === 'string' && q.explanation.trim().length > 0
          ? q.explanation.trim()
          : `The correct answer is: ${options[correctAnswer]}`,
      type: 'mcq',
    });
  }

  if (questions.length === 0) {
    throw new Error('No valid questions could be parsed');
  }

  return questions;
}

export async function generateQuestions(
  config: QuizConfig
): Promise<Question[]> {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3.1-8B-Instruct:novita',
      messages: [
        {
          role: 'system',
          content:
            'You are a quiz generator. You output only raw JSON arrays. You never use markdown. correctAnswer is always an integer 0-3 representing the index of the correct option in the options array. You always verify your answers are factually correct.',
        },
        {
          role: 'user',
          content: buildPrompt(config),
        },
      ],
      max_tokens: 4000,
      temperature: 0.1, // as low as possible
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 503) throw new Error('MODEL_LOADING');
    throw new Error(`HuggingFace API error: ${error}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const generatedText = data.choices?.[0]?.message?.content ?? '';

  if (!generatedText.trim()) {
    throw new Error('Empty response from AI model');
  }

  return parseAIResponse(generatedText);
}