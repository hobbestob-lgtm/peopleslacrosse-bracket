// Pages Function: GET /api/stats — Community stats for brackets and confidence pools
export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const tournamentId = url.searchParams.get('tournamentId');
    const weekNumber = url.searchParams.get('week');
    const type = url.searchParams.get('type') || 'bracket'; // 'bracket' | 'confidence' | 'all'

    const DB = env.DB;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    if (!tournamentId) {
      return new Response(JSON.stringify({ error: 'Missing tournamentId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const result: any = { success: true, tournamentId };

    // Bracket stats
    if (type === 'bracket' || type === 'all') {
      // Total brackets
      const totalBrackets = await DB.prepare(
        'SELECT COUNT(*) as total FROM brackets WHERE tournament_id = ?'
      ).bind(tournamentId).first();

      // Group position picks — how many times each team was picked in each position
      const bracketRows = await DB.prepare(
        'SELECT group_picks, knockout_picks, third_place_picks FROM brackets WHERE tournament_id = ?'
      ).bind(tournamentId).all();

      // Aggregate group picks
      const groupPickCounts: Record<string, Record<string, Record<number, number>>> = {}; // groupId -> teamId -> position -> count
      // Aggregate knockout picks
      const knockoutPickCounts: Record<string, Record<string, number>> = {}; // matchId -> winnerId -> count
      // Champion counts
      const championCounts: Record<string, number> = {}; // teamId -> count

      for (const row of bracketRows.results as any[]) {
        try {
          const groupPicks = JSON.parse(row.group_picks);
          for (const pick of groupPicks) {
            if (!groupPickCounts[pick.groupId]) groupPickCounts[pick.groupId] = {};
            for (let i = 0; i < pick.positions.length; i++) {
              const teamId = pick.positions[i];
              if (!groupPickCounts[pick.groupId][teamId]) groupPickCounts[pick.groupId][teamId] = {};
              groupPickCounts[pick.groupId][teamId][i + 1] = (groupPickCounts[pick.groupId][teamId][i + 1] || 0) + 1;
            }
          }

          const knockoutPicks = JSON.parse(row.knockout_picks);
          for (const pick of knockoutPicks) {
            if (!knockoutPickCounts[pick.matchId]) knockoutPickCounts[pick.matchId] = {};
            knockoutPickCounts[pick.matchId][pick.winnerId] = (knockoutPickCounts[pick.matchId][pick.winnerId] || 0) + 1;
          }

          // Find champion (gold match winner)
          const goldMatch = knockoutPicks.find((p: any) => p.matchId.includes('gold'));
          if (goldMatch) {
            championCounts[goldMatch.winnerId] = (championCounts[goldMatch.winnerId] || 0) + 1;
          }
        } catch (e) {
          // Skip malformed rows
        }
      }

      result.bracket = {
        totalBrackets: totalBrackets?.total || 0,
        groupPickCounts,
        knockoutPickCounts,
        championCounts,
      };
    }

    // Confidence pool stats
    if (type === 'confidence' || type === 'all') {
      const weekFilter = weekNumber ? ' AND week_number = ?' : '';
      const params = weekNumber ? [tournamentId, Number(weekNumber)] : [tournamentId];

      const totalEntries = await DB.prepare(
        `SELECT COUNT(*) as total FROM confidence_picks WHERE tournament_id = ?${weekFilter}`
      ).bind(...params).first();

      // Get all entries for aggregation
      const entries = await DB.prepare(
        `SELECT picks_json, week_number FROM confidence_picks WHERE tournament_id = ?${weekFilter}`
      ).bind(...params).all();

      // Aggregate: for each matchup, count picks per team and average confidence
      const matchupStats: Record<string, {
        weekNumber: number;
        teams: Record<string, { pickCount: number; totalConfidence: number; avgConfidence: number }>;
        totalPicks: number;
      }> = {};

      for (const row of entries.results as any[]) {
        try {
          const picks = JSON.parse(row.picks_json);
          for (const pick of picks) {
            if (!matchupStats[pick.matchupId]) {
              matchupStats[pick.matchupId] = { weekNumber: row.week_number, teams: {}, totalPicks: 0 };
            }
            if (!matchupStats[pick.matchupId].teams[pick.winnerId]) {
              matchupStats[pick.matchupId].teams[pick.winnerId] = { pickCount: 0, totalConfidence: 0, avgConfidence: 0 };
            }
            matchupStats[pick.matchupId].teams[pick.winnerId].pickCount++;
            matchupStats[pick.matchupId].teams[pick.winnerId].totalConfidence += pick.confidence;
            matchupStats[pick.matchupId].totalPicks++;
          }
        } catch (e) {
          // Skip malformed
        }
      }

      // Calculate averages and percentages
      for (const matchupId of Object.keys(matchupStats)) {
        for (const teamId of Object.keys(matchupStats[matchupId].teams)) {
          const team = matchupStats[matchupId].teams[teamId];
          team.avgConfidence = Math.round((team.totalConfidence / team.pickCount) * 10) / 10;
        }
      }

      result.confidence = {
        totalEntries: totalEntries?.total || 0,
        matchupStats,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Stats error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to get stats' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}