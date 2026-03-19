export function generateShareText(topic: string, score: number, total: number, percentage: number): string {
  const emoji = percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪';
  return `${emoji} I scored ${percentage}% (${score}/${total}) on a "${topic}" quiz on QuizAI! Can you beat my score?`;
}

export async function shareQuiz(topic: string, score: number, total: number, percentage: number) {
  const text = generateShareText(topic, score, total, percentage);
  const url = window.location.origin + '/quiz/create';

  if (navigator.share) {
    // Native share on mobile
    try {
      await navigator.share({ title: 'QuizAI Result', text, url });
      return;
    } catch {
      // User cancelled, fall through to clipboard
    }
  }

  // Fallback — copy to clipboard
  await navigator.clipboard.writeText(`${text}\n${url}`);
  return 'copied';
}