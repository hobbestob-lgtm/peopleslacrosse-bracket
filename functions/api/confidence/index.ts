// Cloudflare Pages Function — POST/GET confidence pool picks
interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (method === 'POST') {
      const body = await request.json() as {
        tournamentId: string;
        weekNumber: number;
        picks: { matchupId: string; winnerId: string; confidence: number }[];
        displayName: string;
        email?: string;
        groupId?: string;
      };

      if (!body.tournamentId || !body.weekNumber || !body.picks?.length) {
        return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const entryId = `pool_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      await env.DB.prepare(
        `INSERT INTO confidence_picks (id, tournament_id, week_number, picks_json, display_name, email, group_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        entryId,
        body.tournamentId,
        body.weekNumber,
        JSON.stringify(body.picks),
        body.displayName || 'Anonymous',
        body.email || null,
        body.groupId || null
      ).run();

      return new Response(JSON.stringify({ success: true, entryId }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (method === 'GET') {
      const entryId = url.searchParams.get('entryId');
      const tournamentId = url.searchParams.get('tournamentId');
      const weekNumber = url.searchParams.get('week');

      if (entryId) {
        const entry = await env.DB.prepare(
          'SELECT * FROM confidence_picks WHERE id = ?'
        ).bind(entryId).first();

        if (!entry) {
          return new Response(JSON.stringify({ success: false, error: 'Entry not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          entry: {
            ...entry,
            picks: JSON.parse(entry.picks_json as string),
          },
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (tournamentId && weekNumber) {
        const entries = await env.DB.prepare(
          'SELECT * FROM confidence_picks WHERE tournament_id = ? AND week_number = ? ORDER BY created_at DESC'
        ).bind(tournamentId, Number(weekNumber)).all();

        return new Response(JSON.stringify({
          success: true,
          entries: entries.results.map((e: any) => ({
            ...e,
            picks: JSON.parse(e.picks_json),
          })),
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ success: false, error: 'Provide entryId or tournamentId+week' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Confidence pool error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};