import { BracketPick, BracketScore, GroupPick, KnockoutPick, TournamentConfig, Team } from '../types/bracket';

/**
 * Validate that a group pick has all teams in the group, exactly once each.
 */
export function validateGroupPick(
  groupPick: GroupPick,
  groupTeams: Team[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const pickIds = groupPick.positions;
  const teamIds = groupTeams.map(t => t.id);

  if (pickIds.length !== teamIds.length) {
    errors.push(`Group ${groupPick.groupId}: Expected ${teamIds.length} teams, got ${pickIds.length}`);
  }

  const missing = teamIds.filter(id => !pickIds.includes(id));
  const duplicates = pickIds.filter((id, i) => pickIds.indexOf(id) !== i);

  if (missing.length > 0) {
    errors.push(`Group ${groupPick.groupId}: Missing teams: ${missing.join(', ')}`);
  }
  if (duplicates.length > 0) {
    errors.push(`Group ${groupPick.groupId}: Duplicate teams: ${[...new Set(duplicates)].join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate all picks for a bracket.
 */
export function validateBracket(
  pick: BracketPick,
  tournament: TournamentConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const groupPick of pick.groupPicks) {
    const group = tournament.groups.find(g => g.id === groupPick.groupId);
    if (!group) {
      errors.push(`Unknown group: ${groupPick.groupId}`);
      continue;
    }
    const result = validateGroupPick(groupPick, group.teams);
    errors.push(...result.errors);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Resolve which teams play in each knockout match, based on group and knockout picks.
 * Uses iterative resolution to handle match_winner/match_loser dependencies.
 */
export function resolveKnockoutMatchTeams(
  groupPicks: GroupPick[],
  knockoutPicks: KnockoutPick[],
  tournament: TournamentConfig
): Record<string, { team1: Team | null; team2: Team | null }> {
  const teamMap: Record<string, Team> = {};
  for (const group of tournament.groups) {
    for (const team of group.teams) {
      teamMap[team.id] = team;
    }
  }

  // Build position map from group picks
  const positionMap: Record<string, Record<number, string>> = {};
  for (const gp of groupPicks) {
    positionMap[gp.groupId] = {};
    gp.positions.forEach((teamId, index) => {
      positionMap[gp.groupId][index + 1] = teamId;
    });
  }

  // Build match results from knockout picks
  const matchResults: Record<string, string> = {};
  for (const kp of knockoutPicks) {
    matchResults[kp.matchId] = kp.winnerId;
  }

  // Build match lookup
  const matchLookup: Record<string, typeof tournament.knockoutMatches[0]> = {};
  for (const match of tournament.knockoutMatches) {
    matchLookup[match.id] = match;
  }

  const result: Record<string, { team1: Team | null; team2: Team | null }> = {};

  // Resolve in round order: quarterfinals first, then semis, then medals
  const roundOrder = ['quarterfinal', 'semifinal', 'bronze', 'gold'];

  for (const round of roundOrder) {
    const roundMatches = tournament.knockoutMatches.filter(m => m.round === round);

    for (const match of roundMatches) {
      const resolveSlot = (slot: { type: string; groupId?: string; position?: number; matchId?: string }): Team | null => {
        if (slot.type === 'group_position') {
          const teamId = positionMap[slot.groupId!]?.[slot.position!];
          return teamId ? teamMap[teamId] || null : null;
        }
        if (slot.type === 'match_winner') {
          const winnerId = matchResults[slot.matchId!];
          return winnerId ? teamMap[winnerId] || null : null;
        }
        if (slot.type === 'match_loser') {
          // Need the source match's teams and the winner
          const sourceMatchId = slot.matchId!;
          const sourceMatchResult = result[sourceMatchId];
          if (!sourceMatchResult) return null;
          const winnerId = matchResults[sourceMatchId];
          if (!winnerId) return null;
          // Loser is the team that's NOT the winner
          if (sourceMatchResult.team1?.id === winnerId) return sourceMatchResult.team2;
          if (sourceMatchResult.team2?.id === winnerId) return sourceMatchResult.team1;
          return null;
        }
        return null;
      };

      result[match.id] = {
        team1: resolveSlot(match.slot1),
        team2: resolveSlot(match.slot2),
      };
    }
  }

  return result;
}

/**
 * Calculate bracket score against actual results.
 */
export function calculateScore(
  pick: BracketPick,
  actualGroupResults: Record<string, string[]>,
  actualKnockoutResults: Record<string, string>,
  tournament: TournamentConfig
): BracketScore {
  const scoring = tournament.scoring;
  let groupPoints = 0;
  let knockoutPoints = 0;
  let upsetBonusPoints = 0;

  const groupScores = [];
  const knockoutScores = [];

  // Score group stage
  for (const groupPick of pick.groupPicks) {
    const actualPositions = actualGroupResults[groupPick.groupId];
    let groupPts = 0;
    const details = groupPick.positions.map((pickedTeamId, index) => {
      const position = index + 1;
      const actualTeamId = actualPositions?.[index] || null;
      const correct = actualTeamId === pickedTeamId;
      if (correct) groupPts += scoring.groupPosition;
      return { position, pickedTeamId, actualTeamId, correct };
    });
    groupPoints += groupPts;
    groupScores.push({
      groupId: groupPick.groupId,
      actualPositions: actualPositions || null,
      pointsEarned: groupPts,
      details,
    });
  }

  // Score knockout rounds
  for (const knockPick of pick.knockoutPicks) {
    const match = tournament.knockoutMatches.find(m => m.id === knockPick.matchId)!;
    const actualWinner = actualKnockoutResults[knockPick.matchId];
    const correct = knockPick.winnerId === actualWinner;
    let pts = 0;

    if (correct) {
      const roundPoints = {
        quarterfinal: scoring.quarterfinal,
        semifinal: scoring.semifinal,
        bronze: scoring.bronze,
        gold: scoring.gold,
      }[match.round] || 0;

      pts = roundPoints;

      // Check for upset bonus
      if (actualWinner && isUnderdog(knockPick.winnerId, tournament)) {
        const bonus = Math.round(roundPoints * scoring.upsetBonusPercent / 100);
        upsetBonusPoints += bonus;
        pts += bonus;
      }
    }

    knockoutPoints += pts;
    knockoutScores.push({
      matchId: knockPick.matchId,
      picked: knockPick.winnerId,
      actual: actualWinner || null,
      correct,
      points: pts,
    });
  }

  return {
    bracketId: pick.id,
    totalPoints: groupPoints + knockoutPoints + upsetBonusPoints,
    groupPoints,
    knockoutPoints,
    upsetBonusPoints,
    groupScores,
    knockoutScores,
    rank: null,
    percentile: null,
  };
}

/**
 * Determine if a team is an underdog based on their seed position.
 * Teams seeded 5-8 in an 8-team tournament are underdogs.
 */
function isUnderdog(teamId: string, tournament: TournamentConfig): boolean {
  const team = tournament.groups.flatMap(g => g.teams).find(t => t.id === teamId);
  if (!team?.seed) return false;
  return team.seed > 4;
}

/**
 * Generate a unique bracket ID.
 */
export function generateBracketId(): string {
  return `bracket_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generate a unique group invite code.
 */
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}