// Pages Function: Get groups for a user by email
// GET /api/groups/mine?email=xxx — Returns all groups the user has created or joined

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const DB = env.DB;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Groups the user created
    const createdGroups = await DB.prepare(`
      SELECT g.id, g.name, g.invite_code, g.tournament_id, g.created_by_email, g.created_at,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      WHERE g.created_by_email = ?
      ORDER BY g.created_at DESC
    `).bind(email).all();

    // Groups the user joined (but didn't create)
    const joinedGroups = await DB.prepare(`
      SELECT g.id, g.name, g.invite_code, g.tournament_id, g.created_by_email, g.created_at,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
             gm.joined_at
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id
      WHERE gm.email = ? AND g.created_by_email != ?
      ORDER BY gm.joined_at DESC
    `).bind(email, email).all();

    const TOURNAMENT_NAMES: Record<string, string> = {
      'olympic-sixes-2028': 'Olympic Sixes LA 2028',
      'pll-2026': 'PLL 2026',
      'wll-2026': 'WLL 2026',
    };

    const formatGroup = (g: any, role: string) => ({
      id: g.id,
      name: g.name,
      inviteCode: g.invite_code,
      tournamentId: g.tournament_id,
      tournamentName: TOURNAMENT_NAMES[g.tournament_id] || g.tournament_id,
      createdBy: g.created_by_email,
      memberCount: g.member_count || 0,
      role,
      createdAt: g.created_at,
    });

    const groups = [
      ...(createdGroups.result || []).map((g: any) => formatGroup(g, 'creator')),
      ...(joinedGroups.result || []).map((g: any) => formatGroup(g, 'member')),
    ];

    return new Response(JSON.stringify({
      success: true,
      groups,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('My groups error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to get groups' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}