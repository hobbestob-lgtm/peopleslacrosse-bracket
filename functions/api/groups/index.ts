// Pages Function: Group operations
// POST /api/groups — Create a group
// GET /api/groups?inviteCode=xxx — Get group info
// GET /api/groups?groupId=xxx&members=true — Get group with members

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { name, tournamentId, createdByEmail, createdByName } = body;

    if (!name || !tournamentId || !createdByEmail) {
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

    // Generate unique group ID and invite code
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await DB.prepare(`
      INSERT INTO groups (id, name, invite_code, tournament_id, created_by_email, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(groupId, name, inviteCode, tournamentId, createdByEmail, new Date().toISOString()).run();

    return new Response(JSON.stringify({
      success: true,
      group: {
        id: groupId,
        name,
        inviteCode,
        tournamentId,
        createdBy: createdByEmail,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Create group error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to create group' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const inviteCode = url.searchParams.get('inviteCode');
    const groupId = url.searchParams.get('groupId');
    const withMembers = url.searchParams.get('members') === 'true';

    const DB = env.DB;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Lookup by invite code (for joining)
    if (inviteCode) {
      const group = await DB.prepare(
        `SELECT * FROM groups WHERE invite_code = ?`
      ).bind(inviteCode).first();

      if (!group) {
        return new Response(JSON.stringify({ error: 'Group not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get member count
      const countResult = await DB.prepare(
        `SELECT COUNT(*) as count FROM group_members WHERE group_id = ?`
      ).bind(group.id).first();

      return new Response(JSON.stringify({
        success: true,
        group: {
          id: group.id,
          name: group.name,
          inviteCode: group.invite_code,
          tournamentId: group.tournament_id,
          createdBy: group.created_by_email,
          memberCount: (countResult as any)?.count || 0,
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Lookup by groupId (with members)
    if (groupId) {
      const group = await DB.prepare(
        `SELECT * FROM groups WHERE id = ?`
      ).bind(groupId).first();

      if (!group) {
        return new Response(JSON.stringify({ error: 'Group not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let members: any[] = [];
      if (withMembers) {
        const membersResult = await DB.prepare(`
          SELECT gm.email, gm.display_name, gm.joined_at, b.id as bracket_id, b.score
          FROM group_members gm
          LEFT JOIN brackets b ON gm.bracket_id = b.id
          WHERE gm.group_id = ?
          ORDER BY gm.joined_at ASC
        `).bind(groupId).all();
        members = (membersResult.result || []).map((m: any) => ({
          email: m.email,
          displayName: m.display_name,
          joinedAt: m.joined_at,
          bracketId: m.bracket_id,
          score: m.score,
        }));
      }

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
        members,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Provide inviteCode or groupId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Get group error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to get group' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}