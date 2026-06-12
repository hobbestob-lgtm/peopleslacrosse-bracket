// Tournament types and bracket data structures

export interface Team {
  id: string;
  name: string;
  shortName: string;
  flag: string; // Emoji flag or abbreviation (used in share images)
  lucideIcon?: string; // Lucide icon name for UI rendering (PLL/WLL teams)
  group: string; // Group letter
  seed?: number;
  record?: string; // e.g. '3-2'
}

export interface Group {
  id: string; // e.g., "A", "B"
  name: string;
  teams: Team[];
}

export interface KnockoutMatch {
  id: string;
  round: 'quarterfinal' | 'semifinal' | 'bronze' | 'gold';
  slot1: {
    type: 'group_position' | 'match_winner' | 'match_loser';
    groupId?: string;
    position?: number; // 1st, 2nd, 3rd, 4th in group
    matchId?: string;
  };
  slot2: {
    type: 'group_position' | 'match_winner' | 'match_loser';
    groupId?: string;
    position?: number;
    matchId?: string;
  };
}

export interface TournamentConfig {
  id: string;
  name: string;
  shortName: string;
  year: number;
  slug: string;
  type: 'olympic_sixes' | 'ncaa' | 'pll' | 'world_championship' | 'pan_american';
  groups: Group[];
  knockoutMatches: KnockoutMatch[];
  scoring: ScoringConfig;
  status: 'upcoming' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
}

export interface ScoringConfig {
  groupPosition: number; // Points per correct group position pick
  quarterfinal: number;
  semifinal: number;
  bronze: number;
  gold: number;
  upsetBonusPercent: number; // e.g., 50 = +50% for picking an underdog
}

export interface BracketPick {
  id: string;
  tournamentId: string;
  email: string;
  displayName: string;
  groupPicks: GroupPick[]; // Position rankings per group
  knockoutPicks: KnockoutPick[]; // Match winner picks
  thirdPlacePicks: string[]; // Team IDs advancing as third-place
  createdAt: string;
  updatedAt: string;
}

export interface GroupPick {
  groupId: string;
  positions: string[]; // Team IDs ordered 1st through 4th
}

export interface KnockoutPick {
  matchId: string;
  winnerId: string;
}

export interface GroupScore {
  groupId: string;
  actualPositions: string[] | null; // null until group stage completes
  pointsEarned: number;
  details: { position: number; pickedTeamId: string; actualTeamId: string | null; correct: boolean }[];
}

export interface BracketScore {
  bracketId: string;
  totalPoints: number;
  groupPoints: number;
  knockoutPoints: number;
  upsetBonusPoints: number;
  groupScores: GroupScore[];
  knockoutScores: { matchId: string; picked: string; actual: string | null; correct: boolean; points: number }[];
  rank: number | null;
  percentile: number | null;
}

export interface PrivateGroup {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  tournamentId: string;
  createdAt: string;
  members: GroupMember[];
}

export interface GroupMember {
  email: string;
  displayName: string;
  bracketId: string;
  joinedAt: string;
}

export interface TournamentStats {
  totalBrackets: number;
  mostPickedChampion: { teamId: string; teamName: string; count: number; percent: number }[];
  averageScore: number | null;
  topBrackets: BracketScore[];
}