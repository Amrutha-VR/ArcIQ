import { Badge, QuizResult } from '@/types';

export const BADGE_DEFINITIONS: Omit<Badge, 'earned' | 'earnedAt' | 'earnedFromQuiz'>[] = [
  // Performance badges — shown after EVERY quiz based on score
  {
    id: 'iron_recruit',
    name: 'Iron Recruit',
    emoji: '🔩',
    description: 'Complete any quiz',
    remark: "Every legend starts somewhere. You stepped into the arena. Tony Stark built his first suit in a cave — you just took your first step. Welcome, Recruit.",
    condition: 'Complete any quiz',
  },
  {
    id: 'bronze_agent',
    name: 'Bronze Agent',
    emoji: '🥉',
    description: 'Score between 40–59%',
    remark: "Not bad for a first pass. You got the basics down. JARVIS notes: 'Subject shows potential. Recommend further training.' Keep going.",
    condition: 'Score 40–59% on any quiz',
  },
  {
    id: 'silver_shield',
    name: 'Silver Shield',
    emoji: '🛡',
    description: 'Score between 60–79%',
    remark: "Solid performance. SHIELD would accept you. You know your stuff — now sharpen the edges. A 60–79% agent is good. An 80%+ agent is unstoppable.",
    condition: 'Score 60–79% on any quiz',
  },
  {
    id: 'gold_avenger',
    name: 'Gold Avenger',
    emoji: '🥇',
    description: 'Score 80–99% on any quiz',
    remark: "Avenger-level performance. That's top tier. JARVIS has flagged you as a high-value intelligence asset. The team needs people like you.",
    condition: 'Score 80–99% on any quiz',
  },
  {
    id: 'arc_reactor',
    name: 'Arc Reactor',
    emoji: '⚡',
    description: 'Score 100% on any quiz',
    remark: "PERFECT. 100% efficiency — that's arc reactor output. Clean energy. Zero waste. Tony himself couldn't have done it better. You are the suit.",
    condition: 'Score 100% on any quiz',
  },
  // Milestone badges
  {
    id: 'first_mission',
    name: 'First Mission',
    emoji: '🚀',
    description: 'Complete your first quiz',
    remark: "The journey of a thousand miles begins with a single step. Or in Stark's case, a single repulsor blast. You've taken yours.",
    condition: 'Complete 1 quiz',
  },
  {
    id: 'centurion',
    name: 'Centurion',
    emoji: '💪',
    description: 'Complete 10 quizzes',
    remark: "10 missions. Battle-tested and knowledge-forged. The Centurion badge is named after the Mark III armor — the suit that started it all.",
    condition: 'Complete 10 quizzes',
  },
  {
    id: 'stark_intelligence',
    name: 'Stark Intelligence',
    emoji: '🧠',
    description: 'Score 80%+ on a Hard quiz',
    remark: "Hard difficulty. 80%+. You don't just know things — you understand them. That's the difference between a technician and a genius.",
    condition: 'Score 80%+ on Hard difficulty',
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    emoji: '💨',
    description: 'Finish 10 questions in under 3 minutes',
    remark: "Faster than a repulsor blast. JARVIS clocked your response time as 'inhumanly efficient.' Speed and accuracy — the Iron Man combo.",
    condition: 'Complete 10 questions under 3 minutes',
  },
  {
    id: 'streak_3',
    name: 'On A Roll',
    emoji: '🔥',
    description: '3-day quiz streak',
    remark: "Three consecutive days of mental training. The arc reactor doesn't power down — neither do you. Consistency is a superpower.",
    condition: '3-day quiz streak',
  },
];

export function getPerformanceBadgeForScore(percentage: number): typeof BADGE_DEFINITIONS[0] | null {
  if (percentage === 100) return BADGE_DEFINITIONS.find(b => b.id === 'arc_reactor') ?? null;
  if (percentage >= 80) return BADGE_DEFINITIONS.find(b => b.id === 'gold_avenger') ?? null;
  if (percentage >= 60) return BADGE_DEFINITIONS.find(b => b.id === 'silver_shield') ?? null;
  if (percentage >= 40) return BADGE_DEFINITIONS.find(b => b.id === 'bronze_agent') ?? null;
  return BADGE_DEFINITIONS.find(b => b.id === 'iron_recruit') ?? null;
}

export function computeBadges(results: QuizResult[], streak: number): Badge[] {
  const uniqueTopics = new Set(results.map(r => r.quiz.config.topic)).size;

  return BADGE_DEFINITIONS.map(def => {
    let earned = false;
    let earnedAt: string | undefined;
    let earnedFromQuiz: string | undefined;

    switch (def.id) {
      case 'iron_recruit':
        earned = results.length >= 1;
        if (earned) {
          const r = results[results.length - 1];
          earnedAt = r.completedAt;
          earnedFromQuiz = r.quiz.config.topic;
        }
        break;

      case 'bronze_agent': {
        const r = results.find(r => r.percentage >= 40 && r.percentage < 60);
        earned = !!r;
        if (r) { earnedAt = r.completedAt; earnedFromQuiz = r.quiz.config.topic; }
        break;
      }

      case 'silver_shield': {
        const r = results.find(r => r.percentage >= 60 && r.percentage < 80);
        earned = !!r;
        if (r) { earnedAt = r.completedAt; earnedFromQuiz = r.quiz.config.topic; }
        break;
      }

      case 'gold_avenger': {
        const r = results.find(r => r.percentage >= 80 && r.percentage < 100);
        earned = !!r;
        if (r) { earnedAt = r.completedAt; earnedFromQuiz = r.quiz.config.topic; }
        break;
      }

      case 'arc_reactor': {
        const r = results.find(r => r.percentage === 100);
        earned = !!r;
        if (r) { earnedAt = r.completedAt; earnedFromQuiz = r.quiz.config.topic; }
        break;
      }

      case 'first_mission':
        earned = results.length >= 1;
        if (earned) {
          const r = results[results.length - 1];
          earnedAt = r.completedAt;
          earnedFromQuiz = r.quiz.config.topic;
        }
        break;

      case 'centurion':
        earned = results.length >= 10;
        if (earned) {
          earnedAt = results[results.length - 10]?.completedAt;
        }
        break;

      case 'stark_intelligence': {
        const r = results.find(r => r.quiz.config.difficulty === 'Hard' && r.percentage >= 80);
        earned = !!r;
        if (r) { earnedAt = r.completedAt; earnedFromQuiz = r.quiz.config.topic; }
        break;
      }

      case 'speed_demon': {
        const r = results.find(r => r.quiz.questions.length >= 10 && r.timeTaken < 180);
        earned = !!r;
        if (r) { earnedAt = r.completedAt; earnedFromQuiz = r.quiz.config.topic; }
        break;
      }

      case 'streak_3':
        earned = streak >= 3;
        break;
    }

    return { ...def, earned, earnedAt, earnedFromQuiz };
  });
}

// Get badges earned specifically from this quiz result
export function getBadgesEarnedFromResult(
  result: QuizResult,
  allResults: QuizResult[],
  streak: number
): Badge[] {
  const earned: Badge[] = [];

  // 1. Always give a performance badge based on score
  const perfBadgeDef = getPerformanceBadgeForScore(result.percentage);
  if (perfBadgeDef) {
    earned.push({
      ...perfBadgeDef,
      earned: true,
      earnedAt: result.completedAt,
      earnedFromQuiz: result.quiz.config.topic,
    });
  }

  // 2. Check milestone badges
  const allBadges = computeBadges(allResults, streak);

  // First mission — if this is the first quiz
  if (allResults.length === 1) {
    const b = allBadges.find(b => b.id === 'first_mission');
    if (b?.earned && !earned.find(e => e.id === 'first_mission')) earned.push(b);
  }

  // Centurion — if this quiz made it 10
  if (allResults.length === 10) {
    const b = allBadges.find(b => b.id === 'centurion');
    if (b?.earned) earned.push(b);
  }

  // Stark Intelligence — if this quiz was Hard 80%+
  if (result.quiz.config.difficulty === 'Hard' && result.percentage >= 80) {
    const prev = allResults.slice(0, -1);
    const alreadyHad = prev.some(r => r.quiz.config.difficulty === 'Hard' && r.percentage >= 80);
    if (!alreadyHad) {
      const b = allBadges.find(b => b.id === 'stark_intelligence');
      if (b?.earned) earned.push(b);
    }
  }

  // Speed demon
  if (result.quiz.questions.length >= 10 && result.timeTaken < 180) {
    const prev = allResults.slice(0, -1);
    const alreadyHad = prev.some(r => r.quiz.questions.length >= 10 && r.timeTaken < 180);
    if (!alreadyHad) {
      const b = allBadges.find(b => b.id === 'speed_demon');
      if (b?.earned) earned.push(b);
    }
  }

  // Streak
  if (streak >= 3) {
    const b = allBadges.find(b => b.id === 'streak_3');
    if (b?.earned) earned.push(b);
  }

  // Deduplicate
  return earned.filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i);
}