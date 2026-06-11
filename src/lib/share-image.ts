'use client';

import { TournamentConfig, Team, GroupPick, KnockoutPick } from '@/types/bracket';

interface ShareImageOptions {
  tournament: TournamentConfig;
  groupPicks: GroupPick[];
  knockoutPicks: KnockoutPick[];
  championTeam: Team | null;
  bronzeTeam: Team | null;
  displayName: string;
}

/**
 * Generate a shareable bracket image using Canvas API.
 * Entirely client-side — no server storage needed.
 * User downloads or copies the PNG to their device.
 */
export function generateShareImage(options: ShareImageOptions): Promise<Blob> {
  const { tournament, groupPicks, championTeam } = options;

  const WIDTH = 1080;
  const HEIGHT = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(0.5, '#0f2035');
  bg.addColorStop(1, '#0a1628');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.fillText('🥍 Lacrosse Bracket Predictor', WIDTH / 2, 70);

  ctx.fillStyle = '#8899aa';
  ctx.font = '20px system-ui, -apple-system, sans-serif';
  ctx.fillText(tournament.shortName, WIDTH / 2, 100);

  // PL branding
  ctx.fillStyle = '#4a5a6a';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('bracket.peopleslacrosse.com', WIDTH / 2, HEIGHT - 30);

  // Group stage
  let y = 140;
  const getTeam = (teamId: string) =>
    tournament.groups.flatMap(g => g.teams).find(t => t.id === teamId)!;

  for (const group of tournament.groups) {
    const gp = groupPicks.find(p => p.groupId === group.id)!;

    // Group header
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${group.name}`, 60, y);
    y += 10;

    // Team rankings
    for (let i = 0; i < gp.positions.length; i++) {
      const team = getTeam(gp.positions[i]);
      const isAdvancing = i < 2;

      ctx.fillStyle = isAdvancing ? '#4ade80' : '#6b7b8b';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${i + 1}.`, 80, y + 25 * (i + 1));

      ctx.fillStyle = isAdvancing ? '#ffffff' : '#6b7b8b';
      ctx.fillText(`${team.flag} ${team.name}`, 110, y + 25 * (i + 1));

      if (isAdvancing) {
        ctx.fillStyle = '#4ade80';
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        ctx.fillText('✓', 360, y + 25 * (i + 1));
      }
    }
    y += gp.positions.length * 25 + 20;
  }

  // Knockout rounds
  y += 10;
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Knockout Rounds', 60, y);
  y += 35;

  const roundNames: Record<string, string> = {
    quarterfinal: 'Quarterfinals',
    semifinal: 'Semifinals',
    bronze: 'Bronze Medal',
    gold: 'Gold Medal',
  };

  for (const [round, name] of Object.entries(roundNames)) {
    const matches = tournament.knockoutMatches.filter(m => m.round === round);
    if (matches.length === 0) continue;

    ctx.fillStyle = '#8899aa';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(name, 80, y);
    y += 22;

    for (const match of matches) {
      const pick = options.knockoutPicks.find(kp => kp.matchId === match.id);
      const winner = pick ? getTeam(pick.winnerId) : null;

      if (winner) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '18px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${winner.flag} ${winner.name}`, 100, y);
      } else {
        ctx.fillStyle = '#4a5a6a';
        ctx.font = '16px system-ui, -apple-system, sans-serif';
        ctx.fillText(`TBD`, 100, y);
      }
      y += 24;
    }
    y += 10;
  }

  // Champion highlight
  if (championTeam) {
    y += 20;
    // Gold box
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    const boxX = 60;
    const boxY = y;
    const boxW = WIDTH - 120;
    const boxH = 100;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('PICKED TO WIN', WIDTH / 2, boxY + 30);

    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${championTeam.flag} ${championTeam.name}`, WIDTH / 2, boxY + 70);
  }

  // Display name
  if (options.displayName) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`— ${options.displayName}'s bracket —`, WIDTH / 2, HEIGHT - 55);
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
 * Download the share image to the user's device.
 */
export async function downloadShareImage(options: ShareImageOptions): Promise<void> {
  const blob = await generateShareImage(options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lacrosse-bracket-${options.tournament.slug}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy the share image to clipboard (if supported).
 */
export async function copyShareImageToClipboard(options: ShareImageOptions): Promise<boolean> {
  try {
    const blob = await generateShareImage(options);
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}