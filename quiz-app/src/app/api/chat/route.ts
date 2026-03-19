import { NextRequest, NextResponse } from 'next/server';

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { messages, quizContext } = await req.json();

    const systemPrompt = `You are a helpful quiz learning assistant for QuizAI. 
${quizContext ? `The user is currently taking a quiz about: "${quizContext.topic}" at ${quizContext.difficulty} difficulty.` : ''}
Help the user understand concepts, give hints without directly revealing answers, and explain topics clearly.
Keep responses concise and educational. If asked for a direct answer during a quiz, give a hint instead.`;

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.1-8B-Instruct:novita',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}