// Pages Function: GET /api/stats
export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const tournamentId = url.searchParams.get('tournamentId');

    if (!tournamentId) {
      return new Response(JSON.stringify({ error: 'Missing tournamentId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const DB = env.DB;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    const totalResult = await DB.prepare(`SELECT COUNT(*) as total FROM brackets WHERE tournament_id = ?`).bind(tournamentId).first();
    const emailResult = await DB.prepare(`SELECT COUNT(DISTINCT email) as total FROM emails WHERE tournament_id = ?`).bind(tournamentId).first();

    return new Response(JSON.stringify({
      success: true,
      totalBrackets: totalResult?.total || 0,
      totalEmails: emailResult?.total || 0,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Stats error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to get stats' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}