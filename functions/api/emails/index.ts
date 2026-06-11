// Pages Function: POST /api/emails
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { email, tournamentId, displayName, bracketId } = body;

    if (!email || !tournamentId) {
      return new Response(JSON.stringify({ error: 'Missing email or tournamentId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const DB = env.DB;
    if (DB) {
      const now = new Date().toISOString();
      await DB.prepare(`
        INSERT INTO emails (email, tournament_id, display_name, bracket_id, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(email, tournamentId, displayName || '', bracketId || '', now).run();
    }

    // TODO: Push to Google Sheets via service account
    return new Response(JSON.stringify({ success: true, message: 'Email collected' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Email collection error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to collect email' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}