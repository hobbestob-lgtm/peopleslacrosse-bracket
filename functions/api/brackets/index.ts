// Pages Function: POST & GET /api/brackets
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { tournamentId, email, displayName, groupPicks, knockoutPicks, thirdPlacePicks } = body;

    if (!tournamentId || !email || !groupPicks || !knockoutPicks) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const id = `bracket_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const DB = env.DB;

    if (DB) {
      await DB.prepare(`
        INSERT INTO brackets (id, tournament_id, email, display_name, group_picks, knockout_picks, third_place_picks, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, tournamentId, email, displayName || email.split('@')[0],
        JSON.stringify(groupPicks), JSON.stringify(knockoutPicks),
        JSON.stringify(thirdPlacePicks || []), now, now
      ).run();
    }

    return new Response(JSON.stringify({ success: true, bracketId: id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Save bracket error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to save bracket' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const bracketId = url.searchParams.get('bracketId');

    if (!bracketId) {
      return new Response(JSON.stringify({ error: 'Missing bracketId parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const DB = env.DB;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await DB.prepare(`SELECT * FROM brackets WHERE id = ?`).bind(bracketId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Bracket not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      bracket: {
        id: result.id,
        tournamentId: result.tournament_id,
        email: result.email,
        displayName: result.display_name,
        groupPicks: JSON.parse(result.group_picks as string),
        knockoutPicks: JSON.parse(result.knockout_picks as string),
        thirdPlacePicks: JSON.parse(result.third_place_picks as string),
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      },
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Load bracket error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to load bracket' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}