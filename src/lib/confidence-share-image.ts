'use client';

import { TournamentConfig, Team } from '@/types/bracket';
import { WeeklySchedule, ConfidencePick } from '@/types/confidence-pool';

interface ConfidenceShareImageOptions {
  tournament: TournamentConfig;
  weekSchedule: WeeklySchedule;
  picks: ConfidencePick[];
  displayName: string;
  totalPoints: number;
  maxPoints: number;
  communityStats?: {
    totalEntries: number;
    matchupStats: Record<string, {
      weekNumber: number;
      teams: Record<string, { pickCount: number; totalConfidence: number; avgConfidence: number }>;
      totalPicks: number;
    }>;
  };
}

function getTeam(tournament: TournamentConfig, teamId: string): Team | undefined {
  return tournament.groups.flatMap(g => g.teams).find(t => t.id === teamId);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Decorative accent: subtle grid lines in background
function drawBackgroundGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(42, 58, 84, 0.3)';
  ctx.lineWidth = 0.5;
  for (let y = 0; y < h; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let x = 0; x < w; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}

// Draw a mini bar for community pick percentages
function drawPickBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, pct: number, color: string) {
  // Background
  ctx.fillStyle = 'rgba(10, 22, 40, 0.6)';
  roundRect(ctx, x, y, w, 14, 4);
  ctx.fill();
  // Fill
  const fillW = Math.max(w * (pct / 100), 6);
  const grad = ctx.createLinearGradient(x, y, x + fillW, y);
  grad.addColorStop(0, color);
  grad.addColorStop(1, color === '#ffd700' ? '#ff8c00' : color);
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, fillW, 14, 4);
  ctx.fill();
  // Percentage text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${pct}%`, x + fillW + 6, y + 11);
}

/**
 * Generate a shareable confidence pool picks image — 1080x1350 (4:5 IG feed).
 */
export function generateConfidenceShareImage(options: ConfidenceShareImageOptions): Promise<Blob> {
  const { tournament, weekSchedule, picks, displayName, maxPoints, communityStats } = options;

  const WIDTH = 1080;
  const HEIGHT = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(0.4, '#0f2035');
  bg.addColorStop(1, '#0a1628');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBackgroundGrid(ctx, WIDTH, HEIGHT);

  // Top accent bar
  const headerGrad = ctx.createLinearGradient(0, 0, WIDTH, 0);
  headerGrad.addColorStop(0, '#ffd700');
  headerGrad.addColorStop(1, '#ff8c00');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, WIDTH, 6);

  // ── HEADER ──
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.fillText(`🥍 ${tournament.shortName}`, WIDTH / 2, 62);

  ctx.fillStyle = '#8899aa';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`Week ${weekSchedule.weekNumber} Confidence Picks`, WIDTH / 2, 92);

  ctx.fillStyle = '#6b7b8b';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`${weekSchedule.venue} · ${formatDate(weekSchedule.startDate)}${weekSchedule.startDate !== weekSchedule.endDate ? ` – ${formatDate(weekSchedule.endDate)}` : ''}`, WIDTH / 2, 114);

  // Separator
  ctx.strokeStyle = '#2a3a54';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 132);
  ctx.lineTo(WIDTH - 50, 132);
  ctx.stroke();

  // ── MY PICKS SECTION ──
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('MY PICKS', 50, 158);

  // Picks sorted by confidence (highest first)
  const sortedPicks = [...picks].sort((a, b) => b.confidence - a.confidence);
  const cardHeight = 72;
  const cardGap = 10;
  let y = 172;

  for (let i = 0; i < sortedPicks.length; i++) {
    const pick = sortedPicks[i];
    const matchup = weekSchedule.matchups.find(m => m.id === pick.matchupId);
    const winner = getTeam(tournament, pick.winnerId);
    const opponent = matchup ? getTeam(tournament, matchup.homeTeam === pick.winnerId ? matchup.awayTeam : matchup.homeTeam) : undefined;
    if (!winner || !matchup) continue;

    const isTop = pick.confidence === Math.max(...picks.map(p => p.confidence));

    // Card background
    ctx.fillStyle = isTop ? 'rgba(255, 215, 0, 0.06)' : 'rgba(26, 42, 68, 0.5)';
    roundRect(ctx, 50, y, WIDTH - 100, cardHeight, 10);
    ctx.fill();
    ctx.strokeStyle = isTop ? '#ffd700' : '#2a3a54';
    ctx.lineWidth = isTop ? 2 : 1;
    roundRect(ctx, 50, y, WIDTH - 100, cardHeight, 10);
    ctx.stroke();

    // Confidence badge (circle)
    const badgeX = 50 + 36;
    const badgeY = y + cardHeight / 2;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 18, 0, Math.PI * 2);
    ctx.fillStyle = isTop ? '#ffd700' : '#4ade80';
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = isTop ? '#000' : '#000';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`${pick.confidence}`, badgeX, badgeY + 6);

    // Winner name + record
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`${winner.flag} ${winner.shortName}`, 98, y + 28);
    // Record
    if (winner.record) {
      ctx.fillStyle = winner.record.split('-')[0] > winner.record.split('-')[1] ? '#4ade80' : '#ef4444';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`(${winner.record})`, 98 + ctx.measureText(`${winner.flag} ${winner.shortName}`).width + 8, y + 28);
    }

    // vs opponent + date
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`vs ${opponent?.flag || ''} ${opponent?.shortName || 'TBD'}${opponent?.record ? ` (${opponent.record})` : ''}`, 98, y + 50);

    // PTS label
    ctx.textAlign = 'right';
    ctx.fillStyle = isTop ? '#ffd700' : '#4ade80';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`${pick.confidence} PTS`, WIDTH - 66, y + 30);

    // Date
    ctx.fillStyle = '#4a5a6a';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(formatShortDate(matchup.date), WIDTH - 66, y + 50);

    y += cardHeight + cardGap;
  }

  // ── COMMUNITY PICKS SECTION ──
  y += 16;
  ctx.strokeStyle = '#2a3a54';
  ctx.beginPath();
  ctx.moveTo(50, y);
  ctx.lineTo(WIDTH - 50, y);
  ctx.stroke();
  y += 18;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('📊 COMMUNITY PICKS', 50, y);

  if (communityStats && communityStats.totalEntries > 0) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`${communityStats.totalEntries} pick${communityStats.totalEntries !== 1 ? 's' : ''}`, WIDTH - 50, y);
    y += 20;

    // Show community percentages for each matchup
    const sortedMatchupIds = Object.entries(communityStats.matchupStats)
      .sort(([, a], [, b]) => b.totalPicks - a.totalPicks);

    for (const [matchupId, stats] of sortedMatchupIds.slice(0, 4)) {
      const matchup = weekSchedule.matchups.find(m => m.id === matchupId);
      if (!matchup) continue;

      const homeTeam = getTeam(tournament, matchup.homeTeam);
      const awayTeam = getTeam(tournament, matchup.awayTeam);
      if (!homeTeam || !awayTeam) continue;

      const teams = Object.entries(stats.teams).sort(([, a], [, b]) => b.pickCount - a.pickCount);
      const total = stats.totalPicks || 1;

      // Matchup label
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8899aa';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(`${homeTeam.flag} ${homeTeam.shortName} vs ${awayTeam.flag} ${awayTeam.shortName}`, 50, y + 12);

      // Pick bars
      let barY = y + 18;
      for (const [teamId, teamStats] of teams) {
        const team = getTeam(tournament, teamId);
        if (!team) continue;
        const pct = Math.round((teamStats.pickCount / total) * 100);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText(`${team.flag} ${team.shortName}`, 50, barY + 12);
        drawPickBar(ctx, 180, barY, WIDTH - 290, pct, teamId === picks.find(p => p.matchupId === matchupId)?.winnerId ? '#ffd700' : '#4a8a6a');
        barY += 20;
      }
      y = barY + 6;
    }
  } else {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4a5a6a';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Be the first to make picks!', 50, y + 16);
    y += 30;
  }

  // ── CTA SECTION ──
  const ctaY = HEIGHT - 120;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
  roundRect(ctx, 40, ctaY, WIDTH - 80, 70, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 40, ctaY, WIDTH - 80, 70, 12);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('🥍 Make Your Picks → bracket.peopleslacrosse.com', WIDTH / 2, ctaY + 28);

  ctx.fillStyle = '#8899aa';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Compete with friends · Create a group · Track your scores', WIDTH / 2, ctaY + 52);

  // PL branding
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText("People's Lacrosse", WIDTH / 2, HEIGHT - 32);

  // Display name
  if (displayName) {
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`— ${displayName}'s picks —`, WIDTH / 2, HEIGHT - 52);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error('Failed to generate image')); },
      'image/png', 1.0
    );
  });
}

/**
 * Generate an Instagram Story-sized image (1080x1920).
 */
export function generateConfidenceStoryImage(options: ConfidenceShareImageOptions): Promise<Blob> {
  const { tournament, weekSchedule, picks, displayName, maxPoints, communityStats } = options;

  const WIDTH = 1080;
  const HEIGHT = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(0.5, '#0f2035');
  bg.addColorStop(1, '#0a1628');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBackgroundGrid(ctx, WIDTH, HEIGHT);

  // Top accent
  const headerGrad = ctx.createLinearGradient(0, 0, WIDTH, 0);
  headerGrad.addColorStop(0, '#ffd700');
  headerGrad.addColorStop(1, '#ff8c00');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, WIDTH, 8);

  // ── HEADER ──
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.fillText(`🥍 ${tournament.shortName}`, WIDTH / 2, 90);

  ctx.fillStyle = '#8899aa';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`Week ${weekSchedule.weekNumber} Picks`, WIDTH / 2, 128);

  ctx.fillStyle = '#6b7b8b';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`${weekSchedule.venue}`, WIDTH / 2, 156);

  ctx.strokeStyle = '#2a3a54';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 180);
  ctx.lineTo(WIDTH - 60, 180);
  ctx.stroke();

  // ── MY PICKS ──
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('MY PICKS', 60, 210);

  const sortedPicks = [...picks].sort((a, b) => b.confidence - a.confidence);
  let y = 230;
  const cardH = 110;
  const cardGap = 14;

  for (let i = 0; i < sortedPicks.length; i++) {
    const pick = sortedPicks[i];
    const matchup = weekSchedule.matchups.find(m => m.id === pick.matchupId);
    const winner = getTeam(tournament, pick.winnerId);
    const opponent = matchup ? getTeam(tournament, matchup.homeTeam === pick.winnerId ? matchup.awayTeam : matchup.homeTeam) : undefined;
    if (!winner || !matchup) continue;

    const isTop = pick.confidence === Math.max(...picks.map(p => p.confidence));

    ctx.fillStyle = isTop ? 'rgba(255, 215, 0, 0.06)' : 'rgba(26, 42, 68, 0.5)';
    roundRect(ctx, 50, y, WIDTH - 100, cardH, 14);
    ctx.fill();
    ctx.strokeStyle = isTop ? '#ffd700' : '#2a3a54';
    ctx.lineWidth = isTop ? 2 : 1;
    roundRect(ctx, 50, y, WIDTH - 100, cardH, 14);
    ctx.stroke();

    // Confidence badge
    ctx.beginPath();
    ctx.arc(50 + 40, y + cardH / 2, 22, 0, Math.PI * 2);
    ctx.fillStyle = isTop ? '#ffd700' : '#4ade80';
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`${pick.confidence}`, 50 + 40, y + cardH / 2 + 7);

    // Winner
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText(`${winner.flag} ${winner.shortName}`, 105, y + 40);

    // Record
    if (winner.record) {
      const nameWidth = ctx.measureText(`${winner.flag} ${winner.shortName}`).width;
      ctx.fillStyle = winner.record.split('-')[0] > winner.record.split('-')[1] ? '#4ade80' : '#ef4444';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(`(${winner.record})`, 105 + nameWidth + 8, y + 40);
    }

    // Opponent + record
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(`vs ${opponent?.flag || ''} ${opponent?.shortName || 'TBD'}${opponent?.record ? ` (${opponent.record})` : ''}`, 105, y + 68);

    // PTS
    ctx.textAlign = 'right';
    ctx.fillStyle = isTop ? '#ffd700' : '#4ade80';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`${pick.confidence} PTS`, WIDTH - 66, y + 38);

    // Date
    ctx.fillStyle = '#4a5a6a';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(formatShortDate(matchup.date), WIDTH - 66, y + 60);

    y += cardH + cardGap;
  }

  // ── COMMUNITY PICKS ──
  y += 20;
  ctx.strokeStyle = '#2a3a54';
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(WIDTH - 60, y);
  ctx.stroke();
  y += 20;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('📊 COMMUNITY PICKS', 60, y);

  if (communityStats && communityStats.totalEntries > 0) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`${communityStats.totalEntries} pick${communityStats.totalEntries !== 1 ? 's' : ''}`, WIDTH - 60, y);
    y += 22;

    const sortedMatchupIds = Object.entries(communityStats.matchupStats)
      .sort(([, a], [, b]) => b.totalPicks - a.totalPicks);

    for (const [matchupId, stats] of sortedMatchupIds.slice(0, 4)) {
      const matchup = weekSchedule.matchups.find(m => m.id === matchupId);
      if (!matchup) continue;
      const homeTeam = getTeam(tournament, matchup.homeTeam);
      const awayTeam = getTeam(tournament, matchup.awayTeam);
      if (!homeTeam || !awayTeam) continue;

      const teams = Object.entries(stats.teams).sort(([, a], [, b]) => b.pickCount - a.pickCount);
      const total = stats.totalPicks || 1;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#8899aa';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(`${homeTeam.flag} ${homeTeam.shortName} vs ${awayTeam.flag} ${awayTeam.shortName}`, 60, y + 14);

      let barY = y + 20;
      for (const [teamId, teamStats] of teams) {
        const team = getTeam(tournament, teamId);
        if (!team) continue;
        const pct = Math.round((teamStats.pickCount / total) * 100);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText(`${team.flag} ${team.shortName}`, 60, barY + 12);
        drawPickBar(ctx, 200, barY, WIDTH - 320, pct, teamId === picks.find(p => p.matchupId === matchupId)?.winnerId ? '#ffd700' : '#4a8a6a');
        barY += 22;
      }
      y = barY + 8;
    }
  } else {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4a5a6a';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Be the first to make picks!', 60, y + 18);
    y += 36;
  }

  // ── CTA ──
  const ctaY = HEIGHT - 140;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
  roundRect(ctx, 40, ctaY, WIDTH - 80, 80, 14);
  ctx.fill();
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  roundRect(ctx, 40, ctaY, WIDTH - 80, 80, 14);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('🥍 Make Your Picks', WIDTH / 2, ctaY + 32);

  ctx.fillStyle = '#8899aa';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('bracket.peopleslacrosse.com · Compete with friends', WIDTH / 2, ctaY + 58);

  // Branding
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText("People's Lacrosse", WIDTH / 2, HEIGHT - 36);

  if (displayName) {
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`— ${displayName}'s picks —`, WIDTH / 2, HEIGHT - 60);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error('Failed to generate image')); },
      'image/png', 1.0
    );
  });
}

export async function openConfidenceShareImageInNewTab(options: ConfidenceShareImageOptions): Promise<void> {
  const blob = await generateConfidenceShareImage(options);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function openConfidenceStoryImageInNewTab(options: ConfidenceShareImageOptions): Promise<void> {
  const blob = await generateConfidenceStoryImage(options);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function downloadConfidenceShareImage(options: ConfidenceShareImageOptions, isStory?: boolean): Promise<void> {
  const blob = isStory ? await generateConfidenceStoryImage(options) : await generateConfidenceShareImage(options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = isStory
    ? `${options.tournament.slug}-week${options.weekSchedule.weekNumber}-picks-story.png`
    : `${options.tournament.slug}-week${options.weekSchedule.weekNumber}-picks.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyConfidenceShareImageToClipboard(options: ConfidenceShareImageOptions): Promise<boolean> {
  try {
    const blob = await generateConfidenceShareImage(options);
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

// Re-export for backward compat
function generateShareImage(options: ConfidenceShareImageOptions): Promise<Blob> {
  return generateConfidenceShareImage(options);
}