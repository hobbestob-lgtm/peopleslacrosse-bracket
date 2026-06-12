// Pages Function: Group leaderboard
// GET /api/groups/leaderboard?groupId=xxx — Get group leaderboard with member brackets/scores

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const inviteCode = url.searchParams.get('inviteCode');

    const DB = env.DB;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Resolve group by ID or invite code
    let group: any;
    if (inviteCode) {
      group = await DB.prepare(
        `SELECT * FROM groups WHERE invite_code = ?`
      ).bind(inviteCode).first();
    } else if (groupId) {
      group = await DB.prepare(
        `SELECT * FROM groups WHERE id = ?`
      ).bind(groupId).first();
    } else {
      return new Response(JSON.stringify({ error: 'Provide groupId or inviteCode' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!group) {
      return new Response(JSON.stringify({ error: 'Group not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get members with their bracket info
    const membersResult = await DB.prepare(`
      SELECT
        gm.email,
        gm.display_name,
        gm.joined_at,
        gm.bracket_id,
        b.score as bracket_score,
        b.knockout_picks,
        b.group_picks
      FROM group_members gm
      LEFT JOIN brackets b ON gm.bracket_id = b.id
      WHERE gm.group_id = ?
      ORDER BY b.score DESC NULLS LAST, gm.joined_at ASC
    `).bind(group.id).all();

    // Get confidence picks for the group members
    const confidenceResult = await DB.prepare(`
      SELECT
        c.email,
        c.week_number,
        c.picks,
        c.score,
        c.created_at
      FROM confidence_picks c
      WHERE c.tournament_id = ? AND c.email IN (
        SELECT email FROM group_members WHERE group_id = ?
      )
      ORDER BY c.week_number DESC, c.score DESC
    `).bind(group.tournament_id, group.id).all();

    const members = (membersResult.result || []).map((m: any) => ({
      email: m.email,
      displayName: m.display_name,
      joinedAt: m.joined_at,
      bracketId: m.bracket_id,
      bracketScore: m.bracket_score ?? 0,
    }));

    const confidencePicks = (confidenceResult.result || []).map((c: any) => ({
      email: c.email,
      weekNumber: c.week_number,
      score: c.score ?? 0,
      createdAt: c.created_at,
    }));

    // Aggregate confidence scores per member
    const confidenceScores: Record<string, number> = {};
    for (const cp of confidencePicks) {
      confidenceScores[cp.email] = (confidenceScores[cp.email] || 0) + cp.score;
    }

    // Merge bracket + confidence scores
    const leaderboard = members.map((m: any) => ({
      ...m,
      totalScore: m.bracketScore + (confidenceScores[m.email] || 0),
      confidenceScore: confidenceScores[m.email] || 0,
    })).sort((a: any, b: any) => b.totalScore - a.totalScore);

    return new Response(JSON.stringify({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        tournamentId: group.tournament_id,
        createdBy: group.created_by_email,
        memberCount: members.length,
      },
      leaderboard,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to get leaderboard' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}