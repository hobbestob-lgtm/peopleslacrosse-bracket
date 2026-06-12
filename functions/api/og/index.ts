// Dynamic OG image generator for bracket/picks share URLs
// Generates a 1200x630 branded image with pick highlights

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const bracketId = url.searchParams.get('bracket');
  const confidenceId = url.searchParams.get('confidence');
  const tournament = url.searchParams.get('tournament') || 'pll-2026';

  // Fetch community stats for context
  let statsData: any = {};
  try {
    const statsRes = await fetch(new URL('/api/stats?tournament=' + tournament, request.url));
    if (statsRes.ok) {
      statsData = await statsRes.json();
    }
  } catch (e) {
    // Stats are optional
  }

  // Build SVG-based OG image (works without canvas library)
  const svg = buildOglImageSVG(bracketId, confidenceId, tournament, statsData);

  // Convert SVG to PNG using a simple approach
  // Since we can't use Canvas in Workers, we'll serve the SVG directly
  // Most social platforms support SVG og:images, but for maximum compatibility
  // we return SVG with proper content type
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300', // 5 min cache
      'CDN-Cache-Control': 'public, max-age=300',
    },
  });
};

function buildOglImageSVG(
  bracketId: string | null,
  confidenceId: string | null,
  tournament: string,
  stats: any
): string {
  const tournamentName = tournament === 'wll-2026' ? 'WLL 2026' :
                          tournament === 'olympic-sixes-2028' ? 'LA 2028 Olympic Sixes' :
                          'PLL 2026';

  const totalPicks = stats?.totalBrackets || stats?.totalConfidenceEntries || 0;
  const pickLabel = confidenceId ? 'confidence picks' : bracketId ? 'bracket' : 'predictions';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0f2035;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0a1628;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff8c00;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffd700;stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:#ff8c00;stop-opacity:0.05" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />

  <!-- Grid decoration -->
  <g opacity="0.04" stroke="#ffffff" stroke-width="1">
    ${Array.from({length: 10}, (_, i) => `<line x1="${i * 120}" y1="0" x2="${i * 120}" y2="630" />`).join('\n    ')}
    ${Array.from({length: 6}, (_, i) => `<line x1="0" y1="${i * 120}" x2="1200" y2="${i * 120}" />`).join('\n    ')}
  </g>

  <!-- Top accent bar -->
  <rect width="1200" height="6" fill="url(#gold)" />

  <!-- Accent glow -->
  <rect x="0" y="0" width="1200" height="200" fill="url(#accent)" />

  <!-- Lacrosse emoji -->
  <text x="600" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="80" text-anchor="middle" fill="#ffffff">🥍</text>

  <!-- Main title -->
  <text x="600" y="270" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="bold" fill="#ffffff" text-anchor="middle">LACROSSE BRACKET</text>
  <text x="600" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="bold" fill="#ffd700" text-anchor="middle">PREDICTOR</text>

  <!-- Tournament name -->
  <text x="600" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#b0b8c8" text-anchor="middle">${tournamentName}</text>

  <!-- Divider -->
  <rect x="400" y="430" width="400" height="2" rx="1" fill="#ffd700" opacity="0.6" />

  <!-- Stats line -->
  <text x="600" y="475" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#8896aa" text-anchor="middle">
    ${totalPicks > 0 ? `${totalPicks} ${totalPicks === 1 ? 'entry' : 'entries'} — Make your ${pickLabel}!` : `Make your ${pickLabel} — Compete with friends!`}
  </text>

  <!-- Features -->
  <text x="600" y="510" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#6b7a8d" text-anchor="middle">Pick winners · Rank confidence · Create groups · Track scores</text>

  <!-- Bottom bar -->
  <rect x="0" y="570" width="1200" height="60" fill="#0f1e30" />
  <rect x="0" y="568" width="1200" height="2" fill="#ffd700" opacity="0.4" />

  <!-- Branding -->
  <text x="600" y="608" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="#ffd700" text-anchor="middle" letter-spacing="3">PEOPLE'S LACROSSE</text>
</svg>`;
}