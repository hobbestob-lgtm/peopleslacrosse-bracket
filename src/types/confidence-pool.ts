// Confidence Pool types for weekly PLL/WLL pick'em

export interface WeeklyMatchup {
  id: string;           // e.g., 'pll-2026-w5-g1'
  weekNumber: number;    // e.g., 5
  round: string;         // 'regular' | 'playoff' | 'championship'
  homeTeam: string;      // team ID
  awayTeam: string;      // team ID
  homeScore?: number;    // final score (null if not played)
  awayScore?: number;    // final score (null if not played)
  date: string;          // ISO date, e.g., '2026-06-19'
  time?: string;         // e.g., '7:00 PM ET'
  venue?: string;        // e.g., 'Long Island, NY'
  status: 'upcoming' | 'live' | 'completed';
}

export interface WeeklySchedule {
  weekNumber: number;
  tournamentId: string;  // 'pll-2026' | 'wll-2026'
  startDate: string;     // ISO date
  endDate: string;       // ISO date
  venue: string;         // e.g., 'Long Island, NY'
  matchups: WeeklyMatchup[];
}

export interface ConfidencePick {
  matchupId: string;      // which game
  winnerId: string;       // which team you pick
  confidence: number;     // 1-N (highest = most confident)
}

export interface ConfidencePoolEntry {
  id: string;
  tournamentId: string;
  weekNumber: number;
  picks: ConfidencePick[];
  displayName: string;
  email: string;
  groupId?: string;       // optional group
  totalPoints?: number;    // calculated after games
  createdAt: string;
}

// Confidence pool scoring:
// - If your pick is correct, you earn the confidence number as points
// - If your pick is wrong, you earn 0 points for that game
// - Maximum possible score = 1+2+3+...+N = N*(N+1)/2
// Example: 4 games, you assign confidence 1-4
//   Correct picks: earn confidence value. Wrong picks: earn 0.
//   Max score = 1+2+3+4 = 10

export interface ConfidencePoolConfig {
  tournamentId: string;
  weekNumber: number;
  totalGames: number;         // number of games this week
  maxConfidence: number;      // same as totalGames (each number 1-N used once)
  lockTime: string;           // ISO datetime when picks lock
  status: 'open' | 'locked' | 'completed';
}

export function calculateConfidenceScore(
  picks: ConfidencePick[],
  results: Map<string, { winnerId: string }>, // matchupId -> winner
): number {
  let score = 0;
  for (const pick of picks) {
    const result = results.get(pick.matchupId);
    if (result && result.winnerId === pick.winnerId) {
      score += pick.confidence;
    }
  }
  return score;
}

export function maxPossibleScore(totalGames: number): number {
  return (totalGames * (totalGames + 1)) / 2;
}

export function validateConfidencePicks(
  picks: ConfidencePick[],
  matchupCount: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (picks.length !== matchupCount) {
    errors.push(`Expected ${matchupCount} picks, got ${picks.length}`);
  }

  const confidences = picks.map(p => p.confidence);
  const expected = Array.from({ length: matchupCount }, (_, i) => i + 1);

  const sorted = [...confidences].sort((a, b) => a - b);
  for (let i = 0; i < matchupCount; i++) {
    if (sorted[i] !== expected[i]) {
      errors.push(`Confidence numbers must be 1 through ${matchupCount}, each used exactly once`);
      break;
    }
  }

  const matchupIds = picks.map(p => p.matchupId);
  const uniqueMatchups = new Set(matchupIds);
  if (uniqueMatchups.size !== matchupIds.length) {
    errors.push('Each matchup must have exactly one pick');
  }

  return { valid: errors.length === 0, errors };
}

export function generatePoolEntryId(): string {
  return `pool_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}