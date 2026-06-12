'use client';

import { TournamentConfig, Team } from '@/types/bracket';
import { WeeklySchedule, ConfidencePick } from '@/types/confidence-pool';
import { drawTeamIconAsync, drawTeamLabelAsync, getTeamCanvasLabel, getTeamLabelWidth, preloadTeamIcons } from '@/lib/canvas-team';

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Decorative accent: subtle grid lines in background
function drawBackgroundGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(42, 58, 84, 0.15)';
  ctx.lineWidth = 0.5;
  for (let y = 0; y < h; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  for (let x = 0; x < w; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
}

// Draw a subtle horizontal section divider with label
function drawSectionDivider(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, label?: string) {
  if (label) {
    ctx.font = 'bold 13px system-ui, sans-serif';
    const labelW = ctx.measureText(label).width + 24;
    const midX = (x1 + x2) / 2;
    ctx.strokeStyle = '#2a3a54';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(midX - labelW / 2, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(midX + labelW / 2, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7b8b';
    ctx.fillText(label, midX, y - 6);
  } else {
    ctx.strokeStyle = '#2a3a54';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  }
}

// Draw a mini bar for community pick percentages
function drawPickBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, pct: number, color: string) {
  ctx.fillStyle = 'rgba(10, 22, 40, 0.6)';
  roundRect(ctx, x, y, w, 14, 4);
  ctx.fill();
  const fillW = Math.max(w * (pct / 100), 6);
  const grad = ctx.createLinearGradient(x, y, x + fillW, y);
  grad.addColorStop(0, color);
  grad.addColorStop(1, color === '#ffd700' ? '#ff8c00' : color);
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, fillW, 14, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${pct}%`, x + fillW + 6, y + 11);
}

/**
 * Generate a shareable confidence pool picks image — 1080x1920 (9:16 IG story).
 * Generous spacing between cards, clear section breaks.
 */
export async function generateConfidenceShareImage(options: ConfidenceShareImageOptions): Promise<Blob> {
  const { tournament, weekSchedule, picks, displayName, maxPoints, communityStats } = options;

  await preloadTeamIcons(tournament.groups.flatMap(g => g.teams));

  let logoImg: HTMLImageElement | null = null;
  try { logoImg = await loadImage('/pl-logo-gold-sm.png'); } catch {}

  const WIDTH = 1080;
  const HEIGHT = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const MX = 50;
  const CW = WIDTH - MX * 2;

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

  // ── HEADER with logo ──
  ctx.textAlign = 'center';
  if (logoImg) {
    const logoH = 140;
    const logoW = Math.round(logoImg.naturalWidth / logoImg.naturalHeight * logoH);
    ctx.drawImage(logoImg, (WIDTH - logoW) / 2, 24, logoW, logoH);
    ctx.fillStyle = '#8899aa';
    ctx.font = 'bold 38px system-ui, sans-serif';
    ctx.fillText(`Week ${weekSchedule.weekNumber} Confidence Picks`, WIDTH / 2, 190);
  } else {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.fillText(`🥍 ${tournament.shortName}`, WIDTH / 2, 62);
    ctx.fillStyle = '#8899aa';
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.fillText(`Week ${weekSchedule.weekNumber} Confidence Picks`, WIDTH / 2, 92);
  }

  ctx.fillStyle = '#6b7b8b';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`${weekSchedule.venue} · ${formatDate(weekSchedule.startDate)}${weekSchedule.startDate !== weekSchedule.endDate ? ` – ${formatDate(weekSchedule.endDate)}` : ''}`, WIDTH / 2, 214);

  // ── MY PICKS SECTION ──
  let y = 246;
  drawSectionDivider(ctx, MX, WIDTH - MX, y, 'MY PICKS');
  y += 18;

  const sortedPicks = [...picks].sort((a, b) => b.confidence - a.confidence);
  const cardHeight = 84;    // Increased from 72 for logo breathing room
  const cardGap = 12;       // Increased from 10
  const innerPad = 16;      // Card inner padding
  const badgeR = 20;

  for (let i = 0; i < sortedPicks.length; i++) {
    const pick = sortedPicks[i];
    const matchup = weekSchedule.matchups.find(m => m.id === pick.matchupId);
    const winner = getTeam(tournament, pick.winnerId);
    const opponent = matchup ? getTeam(tournament, matchup.homeTeam === pick.winnerId ? matchup.awayTeam : matchup.homeTeam) : undefined;
    if (!winner || !matchup) continue;

    const isTop = pick.confidence === Math.max(...picks.map(p => p.confidence));

    // Card background
    ctx.fillStyle = isTop ? 'rgba(255, 215, 0, 0.06)' : 'rgba(26, 42, 68, 0.5)';
    roundRect(ctx, MX, y, CW, cardHeight, 10);
    ctx.fill();
    ctx.strokeStyle = isTop ? '#ffd700' : '#2a3a54';
    ctx.lineWidth = isTop ? 2 : 1;
    roundRect(ctx, MX, y, CW, cardHeight, 10);
    ctx.stroke();

    // Confidence badge (circle)
    const badgeX = MX + 36;
    const badgeY = y + cardHeight / 2;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = isTop ? '#ffd700' : '#4ade80';
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`${pick.confidence}`, badgeX, badgeY + 6);

    // Winner name + record (with team logo)
    ctx.textAlign = 'left';
    const nameY = y + innerPad + 14;
    await drawTeamLabelAsync(ctx, winner, MX + 70, nameY, { fontSize: 20, bold: true, color: '#ffffff', showRecord: true });

    // vs opponent + date
    const vsY = y + innerPad + 40;
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '14px system-ui, sans-serif';
    const vsLabel = opponent ? `vs ${getTeamCanvasLabel(opponent)}` : 'vs TBD';
    ctx.fillText(vsLabel, MX + 70, vsY);
    if (opponent?.record) {
      ctx.fillStyle = opponent.record.split('-')[0] > opponent.record.split('-')[1] ? '#4ade80' : '#ef4444';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(`(${opponent.record})`, MX + 70 + ctx.measureText(vsLabel).width + 4, vsY);
    }

    // PTS label
    ctx.textAlign = 'right';
    ctx.fillStyle = isTop ? '#ffd700' : '#4ade80';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`${pick.confidence} PTS`, WIDTH - MX - innerPad, nameY);

    // Date
    ctx.fillStyle = '#4a5a6a';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(formatShortDate(matchup.date), WIDTH - MX - innerPad, vsY);

    y += cardHeight + cardGap;
  }

  // ── COMMUNITY PICKS SECTION ──
  y += 14;
  drawSectionDivider(ctx, MX, WIDTH - MX, y, 'COMMUNITY PICKS');
  y += 20;

  if (communityStats && communityStats.totalEntries > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`${communityStats.totalEntries} pick${communityStats.totalEntries !== 1 ? 's' : ''}`, MX, y);
    y += 24;

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

      // Matchup card background
      const matchupH = 60;
      ctx.fillStyle = 'rgba(26, 42, 68, 0.35)';
      roundRect(ctx, MX, y, CW, matchupH, 8);
      ctx.fill();

      // Matchup label
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8899aa';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(`${getTeamCanvasLabel(homeTeam)} vs ${getTeamCanvasLabel(awayTeam)}`, MX + 12, y + 16);

      // Pick bars
      let barY = y + 22;
      for (const [teamId, teamStats] of teams) {
        const team = getTeam(tournament, teamId);
        if (!team) continue;
        const pct = Math.round((teamStats.pickCount / total) * 100);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui, sans-serif';
        await drawTeamLabelAsync(ctx, team, MX + 12, barY + 12, { fontSize: 12, bold: true, color: '#ffffff' });
        drawPickBar(ctx, MX + 160, barY, CW - 200, pct, teamId === picks.find(p => p.matchupId === matchupId)?.winnerId ? '#ffd700' : '#4a8a6a');
        barY += 20;
      }
      y += matchupH + 10;
    }
  } else {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4a5a6a';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Be the first to make picks!', MX, y + 16);
    y += 30;
  }

  // ── FOOTER ──
  const FOOTER_HEIGHT = 420;
  const footerY = HEIGHT - FOOTER_HEIGHT;

  ctx.fillStyle = 'rgba(8, 16, 30, 0.92)';
  ctx.fillRect(0, footerY, WIDTH, FOOTER_HEIGHT);

  const goldGrad = ctx.createLinearGradient(0, 0, WIDTH, 0);
  goldGrad.addColorStop(0, 'rgba(255, 215, 0, 0)');
  goldGrad.addColorStop(0.15, '#ffd700');
  goldGrad.addColorStop(0.85, '#ffd700');
  goldGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, footerY); ctx.lineTo(WIDTH, footerY); ctx.stroke();

  const footerLogoH = 180;
  const footerLogoW = logoImg ? Math.round(logoImg.naturalWidth / logoImg.naturalHeight * footerLogoH) : 0;
  const logoTopY = footerY + 30;
  if (logoImg) {
    ctx.drawImage(logoImg, (WIDTH - footerLogoW) / 2, logoTopY, footerLogoW, footerLogoH);
  } else {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.fillText("PEOPLE'S LACROSSE", WIDTH / 2, logoTopY + 60);
  }

  const urlY = logoTopY + footerLogoH + 65;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.fillText('bracket.peopleslacrosse.com', WIDTH / 2, urlY);

  const subtitleY = urlY + 45;
  ctx.fillStyle = '#8899aa';
  ctx.font = '27px system-ui, sans-serif';
  ctx.fillText('🥍 Confidence Picks · Compete with Friends · Create a Group', WIDTH / 2, subtitleY);

  if (displayName) {
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '23px system-ui, sans-serif';
    ctx.fillText(`— ${displayName}'s picks —`, WIDTH / 2, subtitleY + 40);
  }

  ctx.fillStyle = '#ffd700';
  ctx.fillRect(0, HEIGHT - 5, WIDTH, 5);

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
export async function generateConfidenceStoryImage(options: ConfidenceShareImageOptions): Promise<Blob> {
  const { tournament, weekSchedule, picks, displayName, maxPoints, communityStats } = options;

  await preloadTeamIcons(tournament.groups.flatMap(g => g.teams));

  let logoImg: HTMLImageElement | null = null;
  try { logoImg = await loadImage('/pl-logo-gold-sm.png'); } catch {}

  const WIDTH = 1080;
  const HEIGHT = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const MX = 50;
  const CW = WIDTH - MX * 2;

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

  // ── HEADER with logo ──
  ctx.textAlign = 'center';
  if (logoImg) {
    const logoH = 140;
    const logoW = Math.round(logoImg.naturalWidth / logoImg.naturalHeight * logoH);
    ctx.drawImage(logoImg, (WIDTH - logoW) / 2, 24, logoW, logoH);
    ctx.fillStyle = '#8899aa';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(`Week ${weekSchedule.weekNumber} Confidence Picks`, WIDTH / 2, 190);
  } else {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.fillText(`🥍 ${tournament.shortName}`, WIDTH / 2, 90);
    ctx.fillStyle = '#8899aa';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillText(`Week ${weekSchedule.weekNumber} Confidence Picks`, WIDTH / 2, 128);
  }

  ctx.fillStyle = '#6b7b8b';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`${weekSchedule.venue}`, WIDTH / 2, 216);

  // ── MY PICKS ──
  let y = 246;
  drawSectionDivider(ctx, MX, WIDTH - MX, y, 'MY PICKS');
  y += 18;

  const sortedPicks = [...picks].sort((a, b) => b.confidence - a.confidence);
  const cardH = 100;   // Increased from 110 — but with better internal spacing
  const cardGap = 14;
  const innerPad = 18;

  for (let i = 0; i < sortedPicks.length; i++) {
    const pick = sortedPicks[i];
    const matchup = weekSchedule.matchups.find(m => m.id === pick.matchupId);
    const winner = getTeam(tournament, pick.winnerId);
    const opponent = matchup ? getTeam(tournament, matchup.homeTeam === pick.winnerId ? matchup.awayTeam : matchup.homeTeam) : undefined;
    if (!winner || !matchup) continue;

    const isTop = pick.confidence === Math.max(...picks.map(p => p.confidence));

    // Card
    ctx.fillStyle = isTop ? 'rgba(255, 215, 0, 0.06)' : 'rgba(26, 42, 68, 0.5)';
    roundRect(ctx, MX, y, CW, cardH, 14);
    ctx.fill();
    ctx.strokeStyle = isTop ? '#ffd700' : '#2a3a54';
    ctx.lineWidth = isTop ? 2 : 1;
    roundRect(ctx, MX, y, CW, cardH, 14);
    ctx.stroke();

    // Confidence badge
    const badgeX = MX + 40;
    const badgeY = y + cardH / 2;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 24, 0, Math.PI * 2);
    ctx.fillStyle = isTop ? '#ffd700' : '#4ade80';
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`${pick.confidence}`, badgeX, badgeY + 7);

    // Winner (with logo)
    ctx.textAlign = 'left';
    const nameY = y + innerPad + 14;
    await drawTeamLabelAsync(ctx, winner, MX + 80, nameY, { fontSize: 24, bold: true, color: '#ffffff', showRecord: true });

    // vs opponent
    const vsY = y + innerPad + 44;
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '16px system-ui, sans-serif';
    const vsLabel = opponent ? `vs ${getTeamCanvasLabel(opponent)}` : 'vs TBD';
    ctx.fillText(vsLabel, MX + 80, vsY);
    if (opponent?.record) {
      ctx.fillStyle = opponent.record.split('-')[0] > opponent.record.split('-')[1] ? '#4ade80' : '#ef4444';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`(${opponent.record})`, MX + 80 + ctx.measureText(vsLabel).width + 4, vsY);
    }

    // PTS
    ctx.textAlign = 'right';
    ctx.fillStyle = isTop ? '#ffd700' : '#4ade80';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`${pick.confidence} PTS`, WIDTH - MX - innerPad, nameY);

    // Date
    ctx.fillStyle = '#4a5a6a';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(formatShortDate(matchup.date), WIDTH - MX - innerPad, vsY);

    y += cardH + cardGap;
  }

  // ── COMMUNITY PICKS ──
  y += 16;
  drawSectionDivider(ctx, MX, WIDTH - MX, y, 'COMMUNITY PICKS');
  y += 20;

  if (communityStats && communityStats.totalEntries > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`${communityStats.totalEntries} pick${communityStats.totalEntries !== 1 ? 's' : ''}`, MX, y);
    y += 24;

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

      const matchupH = 65;
      ctx.fillStyle = 'rgba(26, 42, 68, 0.35)';
      roundRect(ctx, MX, y, CW, matchupH, 8);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#8899aa';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(`${getTeamCanvasLabel(homeTeam)} vs ${getTeamCanvasLabel(awayTeam)}`, MX + 14, y + 18);

      let barY = y + 24;
      for (const [teamId, teamStats] of teams) {
        const team = getTeam(tournament, teamId);
        if (!team) continue;
        const pct = Math.round((teamStats.pickCount / total) * 100);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px system-ui, sans-serif';
        await drawTeamLabelAsync(ctx, team, MX + 14, barY + 12, { fontSize: 14, bold: true, color: '#ffffff' });
        drawPickBar(ctx, MX + 180, barY, CW - 220, pct, teamId === picks.find(p => p.matchupId === matchupId)?.winnerId ? '#ffd700' : '#4a8a6a');
        barY += 22;
      }
      y += matchupH + 12;
    }
  } else {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4a5a6a';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Be the first to make picks!', MX, y + 18);
    y += 36;
  }

  // ── FOOTER ──
  const FOOTER_HEIGHT = 500;
  const footerY = HEIGHT - FOOTER_HEIGHT;

  ctx.fillStyle = 'rgba(8, 16, 30, 0.92)';
  ctx.fillRect(0, footerY, WIDTH, FOOTER_HEIGHT);

  const goldGrad2 = ctx.createLinearGradient(0, 0, WIDTH, 0);
  goldGrad2.addColorStop(0, 'rgba(255, 215, 0, 0)');
  goldGrad2.addColorStop(0.15, '#ffd700');
  goldGrad2.addColorStop(0.85, '#ffd700');
  goldGrad2.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.strokeStyle = goldGrad2;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, footerY); ctx.lineTo(WIDTH, footerY); ctx.stroke();

  const footerLogoH = 180;
  const footerLogoW = logoImg ? Math.round(logoImg.naturalWidth / logoImg.naturalHeight * footerLogoH) : 0;
  const logoTopY = footerY + 35;
  if (logoImg) {
    ctx.drawImage(logoImg, (WIDTH - footerLogoW) / 2, logoTopY, footerLogoW, footerLogoH);
  } else {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillText("PEOPLE'S LACROSSE", WIDTH / 2, logoTopY + 70);
  }

  const urlY = logoTopY + footerLogoH + 75;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px system-ui, sans-serif';
  ctx.fillText('bracket.peopleslacrosse.com', WIDTH / 2, urlY);

  const subtitleY = urlY + 50;
  ctx.fillStyle = '#8899aa';
  ctx.font = '30px system-ui, sans-serif';
  ctx.fillText('🥍 Confidence Picks · Compete with Friends · Create a Group', WIDTH / 2, subtitleY);

  if (displayName) {
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText(`— ${displayName}'s picks —`, WIDTH / 2, subtitleY + 45);
  }

  ctx.fillStyle = '#ffd700';
  ctx.fillRect(0, HEIGHT - 5, WIDTH, 5);

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