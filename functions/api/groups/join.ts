// Pages Function: Join a group
// POST /api/groups/join — Join a group (associates bracket with group)

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { inviteCode, bracketId, email, displayName } = body;

    if (!inviteCode || !bracketId || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
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

    // Find the group
    const group = await DB.prepare(
      `SELECT * FROM groups WHERE invite_code = ?`
    ).bind(inviteCode).first();

    if (!group) {
      return new Response(JSON.stringify({ error: 'Group not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already a member
    const existing = await DB.prepare(
      `SELECT id FROM group_members WHERE group_id = ? AND email = ?`
    ).bind(group.id, email).first();

    if (existing) {
      // Update their bracket_id if they have a newer one
      await DB.prepare(
        `UPDATE group_members SET bracket_id = ?, display_name = ? WHERE group_id = ? AND email = ?`
      ).bind(bracketId, displayName || email.split('@')[0], group.id, email).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Bracket updated in group',
        group: {
          id: group.id,
          name: group.name,
          inviteCode: group.invite_code,
          tournamentId: group.tournament_id,
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add to group
    await DB.prepare(`
      INSERT INTO group_members (group_id, bracket_id, email, display_name, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(group.id, bracketId, email, displayName || email.split('@')[0], new Date().toISOString()).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Joined group successfully',
      group: {
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        tournamentId: group.tournament_id,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Join group error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to join group' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}