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
}

/**
 * Generate a shareable confidence pool picks image sized for Instagram/TikTok.
 * 1080x1350 (4:5 ratio) — ideal for IG feed and TikTok video frames.
 */
export function generateConfidenceShareImage(options: ConfidenceShareImageOptions): Promise<Blob> {
  const { tournament, weekSchedule, picks, displayName, maxPoints } = options;

  const WIDTH = 1080;
  const HEIGHT = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const getTeam = (teamId: string): Team | undefined =>
    tournament.groups.flatMap(g => g.teams).find(t => t.id === teamId);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(0.3, '#0f2035');
  bg.addColorStop(1, '#0a1628');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Header bar
  const headerBg = ctx.createLinearGradient(0, 0, WIDTH, 0);
  headerBg.addColorStop(0, '#ffd700');
  headerBg.addColorStop(1, '#ff8c00');
  ctx.fillStyle = headerBg;
  ctx.fillRect(0, 0, WIDTH, 6);

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
  ctx.fillText(`🥍 ${tournament.shortName}`, WIDTH / 2, 70);

  ctx.fillStyle = '#8899aa';
  ctx.font = '22px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Week ${weekSchedule.weekNumber} Confidence Picks`, WIDTH / 2, 100);

  ctx.fillStyle = '#6b7b8b';
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${weekSchedule.venue} · ${formatDate(weekSchedule.startDate)}${weekSchedule.startDate !== weekSchedule.endDate ? ` – ${formatDate(weekSchedule.endDate)}` : ''}`, WIDTH / 2, 126);

  // Separator
  ctx.strokeStyle = '#2a3a54';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 150);
  ctx.lineTo(WIDTH - 60, 150);
  ctx.stroke();

  // Picks (sorted by confidence, highest first)
  const sortedPicks = [...picks].sort((a, b) => b.confidence - a.confidence);
  let y = 180;
  const cardHeight = 100;
  const cardGap = 16;
  const cardX = 50;
  const cardWidth = WIDTH - 100;

  for (let i = 0; i < sortedPicks.length; i++) {
    const pick = sortedPicks[i];
    const matchup = weekSchedule.matchups.find(m => m.id === pick.matchupId);
    const winner = getTeam(pick.winnerId);
    const opponent = matchup ? getTeam(matchup.homeTeam === pick.winnerId ? matchup.awayTeam : matchup.homeTeam) : undefined;

    if (!winner || !matchup) continue;

    // Card background
    const isTop = pick.confidence === Math.max(...picks.map(p => p.confidence));
    ctx.fillStyle = isTop ? 'rgba(255, 215, 0, 0.08)' : 'rgba(26, 42, 68, 0.6)';
    roundRect(ctx, cardX, y, cardWidth, cardHeight, 12);
    ctx.fill();

    // Card border
    ctx.strokeStyle = isTop ? '#ffd700' : '#2a3a54';
    ctx.lineWidth = isTop ? 2 : 1;
    roundRect(ctx, cardX, y, cardWidth, cardHeight, 12);
    ctx.stroke();

    // Confidence number (large, left side)
    ctx.textAlign = 'center';
    ctx.fillStyle = isTop ? '#ffd700' : '#4a8a6a';
    ctx.font = `bold ${isTop ? 52 : 44}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(`${pick.confidence}`, cardX + 55, y + cardHeight / 2 + (isTop ? 6 : 4));

    // "PTS" label
    ctx.fillStyle = isTop ? '#ffd700' : '#6b7b8b';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText('PTS', cardX + 55, y + cardHeight / 2 + 22);

    // Team flag + name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${winner.flag} ${winner.name}`, cardX + 120, y + 38);

    // vs opponent
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.fillText(`vs ${opponent?.flag || ''} ${opponent?.name || 'TBD'}`, cardX + 120, y + 65);

    // Game date on right
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4a5a6a';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatShortDate(matchup.date), cardX + cardWidth - 16, y + 30);

    if (matchup.time) {
      ctx.fillText(matchup.time, cardX + cardWidth - 16, y + 48);
    }

    y += cardHeight + cardGap;
  }

  // Max points summary
  y += 10;
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#2a3a54';
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(WIDTH - 60, y);
  ctx.stroke();
  y += 30;

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Max Possible: ${maxPoints} pts`, WIDTH / 2, y);

  ctx.fillStyle = '#6b7b8b';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${picks.length} games · Higher confidence = more points if correct`, WIDTH / 2, y + 28);

  // PL branding
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText("People's Lacrosse", WIDTH / 2, HEIGHT - 55);

  ctx.fillStyle = '#4a5a6a';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('bracket.peopleslacrosse.com', WIDTH / 2, HEIGHT - 30);

  // Display name
  if (displayName) {
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`— ${displayName}'s picks —`, WIDTH / 2, HEIGHT - 75);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image'));
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Generate an Instagram Story-sized image (1080x1920).
 */
export function generateConfidenceStoryImage(options: ConfidenceShareImageOptions): Promise<Blob> {
  const { tournament, weekSchedule, picks, displayName, maxPoints } = options;

  const WIDTH = 1080;
  const HEIGHT = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const getTeam = (teamId: string): Team | undefined =>
    tournament.groups.flatMap(g => g.teams).find(t => t.id === teamId);

  // Full dark background
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(0.5, '#0f2035');
  bg.addColorStop(1, '#0a1628');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Header gradient bar
  const headerBg = ctx.createLinearGradient(0, 0, WIDTH, 0);
  headerBg.addColorStop(0, '#ffd700');
  headerBg.addColorStop(1, '#ff8c00');
  ctx.fillStyle = headerBg;
  ctx.fillRect(0, 0, WIDTH, 8);

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.fillText(`🥍 ${tournament.shortName}`, WIDTH / 2, 100);

  ctx.fillStyle = '#8899aa';
  ctx.font = '26px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Week ${weekSchedule.weekNumber} Picks`, WIDTH / 2, 140);

  ctx.fillStyle = '#6b7b8b';
  ctx.font = '20px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${weekSchedule.venue}`, WIDTH / 2, 170);

  // Separator
  ctx.strokeStyle = '#2a3a54';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 200);
  ctx.lineTo(WIDTH - 60, 200);
  ctx.stroke();

  // Picks sorted by confidence
  const sortedPicks = [...picks].sort((a, b) => b.confidence - a.confidence);
  let y = 240;
  const cardHeight = 130;
  const cardGap = 20;
  const cardX = 50;
  const cardWidth = WIDTH - 100;

  for (let i = 0; i < sortedPicks.length; i++) {
    const pick = sortedPicks[i];
    const matchup = weekSchedule.matchups.find(m => m.id === pick.matchupId);
    const winner = getTeam(pick.winnerId);
    const opponent = matchup ? getTeam(matchup.homeTeam === pick.winnerId ? matchup.awayTeam : matchup.homeTeam) : undefined;

    if (!winner || !matchup) continue;

    const isTop = pick.confidence === Math.max(...picks.map(p => p.confidence));

    // Card
    ctx.fillStyle = isTop ? 'rgba(255, 215, 0, 0.08)' : 'rgba(26, 42, 68, 0.6)';
    roundRect(ctx, cardX, y, cardWidth, cardHeight, 14);
    ctx.fill();

    ctx.strokeStyle = isTop ? '#ffd700' : '#2a3a54';
    ctx.lineWidth = isTop ? 2 : 1;
    roundRect(ctx, cardX, y, cardWidth, cardHeight, 14);
    ctx.stroke();

    // Confidence number
    ctx.textAlign = 'center';
    ctx.fillStyle = isTop ? '#ffd700' : '#4ade80';
    ctx.font = `bold ${isTop ? 56 : 48}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(`${pick.confidence}`, cardX + 60, y + cardHeight / 2 + 8);

    ctx.fillStyle = isTop ? '#ffd700' : '#6b7b8b';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText('PTS', cardX + 60, y + cardHeight / 2 + 28);

    // Winner
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${winner.flag} ${winner.name}`, cardX + 130, y + 48);

    // Opponent
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillText(`vs ${opponent?.flag || ''} ${opponent?.name || 'TBD'}`, cardX + 130, y + 78);

    // Date/time
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4a5a6a';
    ctx.font = '15px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatShortDate(matchup.date), cardX + cardWidth - 16, y + 38);
    if (matchup.time) {
      ctx.fillText(matchup.time, cardX + cardWidth - 16, y + 58);
    }

    y += cardHeight + cardGap;
  }

  // Summary
  y += 30;
  ctx.strokeStyle = '#2a3a54';
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(WIDTH - 60, y);
  ctx.stroke();
  y += 40;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Max ${maxPoints} points possible`, WIDTH / 2, y);

  ctx.fillStyle = '#6b7b8b';
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${picks.length} games · Confidence pool picks`, WIDTH / 2, y + 32);

  // Bottom branding
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText("People's Lacrosse", WIDTH / 2, HEIGHT - 60);

  ctx.fillStyle = '#4a5a6a';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('bracket.peopleslacrosse.com', WIDTH / 2, HEIGHT - 32);

  if (displayName) {
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`— ${displayName}'s picks —`, WIDTH / 2, HEIGHT - 90);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image'));
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Open the share image in a new tab for easy saving/sharing.
 */
export async function openConfidenceShareImageInNewTab(options: ConfidenceShareImageOptions): Promise<void> {
  const blob = await generateConfidenceShareImage(options);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Clean up after a delay so the browser can load it
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Open the story-sized image in a new tab.
 */
export async function openConfidenceStoryImageInNewTab(options: ConfidenceShareImageOptions): Promise<void> {
  const blob = await generateConfidenceStoryImage(options);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Download the share image.
 */
export async function downloadConfidenceShareImage(options: ConfidenceShareImageOptions, isStory?: boolean): Promise<void> {
  const blob = isStory ? await generateConfidenceStoryImage(options) : await generateShareImage(options);
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

/**
 * Copy the share image to clipboard.
 */
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

// Helper: rounded rectangle
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

// Helper: format date
function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Re-export generateShareImage with the default size for backwards compat
function generateShareImage(options: ConfidenceShareImageOptions): Promise<Blob> {
  return generateConfidenceShareImage(options);
}