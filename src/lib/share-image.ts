'use client';

import { TournamentConfig, Team, GroupPick, KnockoutPick } from '@/types/bracket';
import { drawTeamIconAsync, drawTeamLabelAsync, getTeamCanvasLabel, getTeamLabelWidth, preloadTeamIcons } from '@/lib/canvas-team';

interface ShareImageOptions {
  tournament: TournamentConfig;
  groupPicks: GroupPick[];
  knockoutPicks: KnockoutPick[];
  championTeam: Team | null;
  bronzeTeam: Team | null;
  displayName: string;
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Draw a subtle horizontal section divider with label
function drawSectionDivider(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, label?: string, fontSize: number = 16) {
  if (label) {
    ctx.save();
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    const labelW = ctx.measureText(label).width + 28;
    const midX = (x1 + x2) / 2;
    // Left line
    ctx.strokeStyle = '#2a3a54';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(midX - labelW / 2, y);
    ctx.stroke();
    // Right line
    ctx.beginPath();
    ctx.moveTo(midX + labelW / 2, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    // Label
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7b8b';
    ctx.fillText(label, midX, y - 7);
    ctx.restore();
  } else {
    ctx.strokeStyle = '#2a3a54';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }
}

/**
 * Generate a shareable bracket image using Canvas API.
 * Entirely client-side — no server storage needed.
 *
 * Layout (top to bottom):
 * 1. Header — logo + tournament name
 * 2. 🥇 CHAMPION — hero section, large & dominant
 * 3. Group Stage
 * 4. Knockout Rounds
 * 5. 🥉 Bronze Medal
 * 6. Footer
 */
export async function generateShareImage(options: ShareImageOptions): Promise<Blob> {
  const { tournament, groupPicks, championTeam, bronzeTeam } = options;

  // Preload team icons for Canvas rendering
  const allTeams = tournament.groups.flatMap(g => g.teams);
  await preloadTeamIcons(allTeams);

  // Load logo
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadImage('/pl-logo-gold-sm.png');
  } catch {
    // Logo not available — continue without it
  }

  const WIDTH = 1080;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Content margins
  const MX = 56;
  const CW = WIDTH - MX * 2;

  // ── FIRST PASS: measure content height ──
  // We need to know total height before drawing, so calculate layout first
  const getTeam = (teamId: string) =>
    tournament.groups.flatMap(g => g.teams).find(t => t.id === teamId)!;

  // Calculate heights for each section
  let measureY = 0;

  // Header: logo (140) + tournament name (40) + display name (30) = ~230
  measureY += 230;

  // Champion hero section (if exists)
  if (championTeam) {
    measureY += 260; // Large hero area
  }

  // Bronze medal section (if exists, shown after knockouts)
  // Will be placed after knockout rounds

  // Group stage
  measureY += 30; // divider
  const ROW_H = 42;
  const GROUP_PAD = 18;
  const GROUP_GAP = 20;
  for (const group of tournament.groups) {
    const gp = groupPicks.find(p => p.groupId === group.id)!;
    const groupH = GROUP_PAD * 2 + 28 + ROW_H * gp.positions.length; // header + rows
    measureY += groupH + GROUP_GAP;
  }

  // Knockout rounds
  measureY += 30; // divider
  const roundNames: Record<string, string> = {
    quarterfinal: 'Quarterfinals',
    semifinal: 'Semifinals',
    bronze: 'Bronze Medal',
    gold: 'Gold Medal',
  };
  const knockoutRounds = Object.entries(roundNames).filter(([round]) =>
    tournament.knockoutMatches.some(m => m.round === round)
  );

  // Exclude gold from knockout section (it's the hero) and bronze (shown separately)
  const displayKnockoutRounds = knockoutRounds.filter(([round]) => round !== 'gold');

  for (const [round, name] of displayKnockoutRounds) {
    const matches = tournament.knockoutMatches.filter(m => m.round === round);
    measureY += 34; // sub-header
    measureY += matches.length * 50 + (matches.length - 1) * 10 + 16; // match rows + gaps + padding
  }

  // Bronze medal (separate from knockout)
  if (bronzeTeam) {
    measureY += 30 + 130; // divider + bronze box
  }

  // Footer
  measureY += 340;

  const HEIGHT = Math.max(1920, measureY + 40);
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // ── BACKGROUND ──
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(0.3, '#0f2035');
  bg.addColorStop(0.7, '#0f2035');
  bg.addColorStop(1, '#0a1628');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle background grid
  ctx.strokeStyle = 'rgba(42, 58, 84, 0.12)';
  ctx.lineWidth = 0.5;
  for (let gy = 0; gy < HEIGHT; gy += 60) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(WIDTH, gy); ctx.stroke();
  }
  for (let gx = 0; gx < WIDTH; gx += 60) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, HEIGHT); ctx.stroke();
  }

  // Top accent bar
  const topAccent = ctx.createLinearGradient(0, 0, WIDTH, 0);
  topAccent.addColorStop(0, '#ffd700');
  topAccent.addColorStop(0.5, '#ffed4a');
  topAccent.addColorStop(1, '#ffd700');
  ctx.fillStyle = topAccent;
  ctx.fillRect(0, 0, WIDTH, 8);

  // ── HEADER with logo ──
  let y = 28;
  if (logoImg) {
    const logoH = 140;
    const logoW = Math.round(logoImg.naturalWidth / logoImg.naturalHeight * logoH);
    ctx.drawImage(logoImg, (WIDTH - logoW) / 2, y, logoW, logoH);
    y += logoH + 20;
  } else {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.fillText("PEOPLE'S LACROSSE", WIDTH / 2, y + 60);
    y += 80;
  }

  // Tournament name
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c0c8d0';
  ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
  ctx.fillText(tournament.shortName, WIDTH / 2, y);
  y += 48;

  // Display name
  if (options.displayName) {
    ctx.fillStyle = '#8899aa';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${options.displayName}'s Bracket`, WIDTH / 2, y);
    y += 38;
  }

  // ── 🥇 CHAMPION HERO SECTION ──
  if (championTeam) {
    y += 12;

    // Large gold gradient card
    const heroH = 240;
    const heroGrad = ctx.createLinearGradient(0, y, 0, y + heroH);
    heroGrad.addColorStop(0, 'rgba(255, 215, 0, 0.12)');
    heroGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.06)');
    heroGrad.addColorStop(1, 'rgba(255, 215, 0, 0.02)');
    ctx.fillStyle = heroGrad;
    roundRect(ctx, MX, y, CW, heroH, 16);
    ctx.fill();

    // Gold border
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 3;
    roundRect(ctx, MX, y, CW, heroH, 16);
    ctx.stroke();

    // Inner glow effect at top
    const innerGlow = ctx.createLinearGradient(0, y, 0, y + 60);
    innerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
    innerGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = innerGlow;
    roundRect(ctx, MX + 3, y + 3, CW - 6, 57, 14);
    ctx.fill();

    // Trophy emoji + label
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('🏆 GOLD MEDAL CHAMPION', WIDTH / 2, y + 42);

    // Champion team icon — large
    const iconSize = 72;
    await drawTeamIconAsync(ctx, championTeam, WIDTH / 2 - iconSize / 2, y + 58, iconSize);

    // Champion team name — LARGE
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
    ctx.fillText(getTeamCanvasLabel(championTeam), WIDTH / 2, y + 168);

    // Decorative stars
    ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillText('★  ★  ★', WIDTH / 2, y + 210);

    y += heroH + 24;
  }

  // ── GROUP STAGE ──
  drawSectionDivider(ctx, MX, WIDTH - MX, y, 'GROUP STAGE', 18);
  y += 22;

  for (const group of tournament.groups) {
    const gp = groupPicks.find(p => p.groupId === group.id)!;
    const groupH = GROUP_PAD * 2 + 28 + ROW_H * gp.positions.length;

    // Group card background
    ctx.fillStyle = 'rgba(26, 42, 68, 0.5)';
    roundRect(ctx, MX, y, CW, groupH, 12);
    ctx.fill();
    ctx.strokeStyle = '#2a3a54';
    ctx.lineWidth = 1;
    roundRect(ctx, MX, y, CW, groupH, 12);
    ctx.stroke();

    // Group header
    let rowY = y + GROUP_PAD + 24;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(group.name, MX + GROUP_PAD, rowY);
    rowY += 28;

    // Team rows
    for (let i = 0; i < gp.positions.length; i++) {
      const team = getTeam(gp.positions[i]);
      const isAdvancing = i < 2;

      // Row background for advancing teams
      if (isAdvancing) {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
        roundRect(ctx, MX + GROUP_PAD - 4, rowY - 16, CW - GROUP_PAD * 2 + 8, ROW_H, 6);
        ctx.fill();
      }

      // Position number
      ctx.textAlign = 'left';
      ctx.fillStyle = isAdvancing ? '#4ade80' : '#6b7b8b';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${i + 1}.`, MX + GROUP_PAD + 4, rowY);

      // Team logo + name
      await drawTeamLabelAsync(ctx, team, MX + GROUP_PAD + 48, rowY, {
        fontSize: 20,
        bold: isAdvancing,
        color: isAdvancing ? '#ffffff' : '#8899aa',
      });

      // Advances badge
      if (isAdvancing) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('✓ ADVANCES', WIDTH - MX - GROUP_PAD, rowY);
      }

      rowY += ROW_H;
    }

    y += groupH + GROUP_GAP;
  }

  // ── KNOCKOUT ROUNDS ──
  y += 10;
  drawSectionDivider(ctx, MX, WIDTH - MX, y, 'KNOCKOUT ROUNDS', 18);
  y += 26;

  for (const [round, name] of displayKnockoutRounds) {
    const matches = tournament.knockoutMatches.filter(m => m.round === round);
    if (matches.length === 0) continue;

    // Round sub-header
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c0c8d0';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(name, MX + 8, y);
    y += 28;

    const MATCH_ROW_H = 48;
    const MATCH_GAP = 10;

    for (const match of matches) {
      const pick = options.knockoutPicks.find(kp => kp.matchId === match.id);
      const winner = pick ? getTeam(pick.winnerId) : null;

      // Match card background
      ctx.fillStyle = 'rgba(26, 42, 68, 0.45)';
      roundRect(ctx, MX, y, CW, MATCH_ROW_H, 10);
      ctx.fill();
      ctx.strokeStyle = '#2a3a54';
      ctx.lineWidth = 1;
      roundRect(ctx, MX, y, CW, MATCH_ROW_H, 10);
      ctx.stroke();

      // Match ID badge
      ctx.textAlign = 'left';
      ctx.fillStyle = '#4a5a6a';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(match.id.toUpperCase(), MX + 16, y + 30);

      if (winner) {
        // Winner with logo
        ctx.textAlign = 'left';
        await drawTeamLabelAsync(ctx, winner, MX + 80, y + 30, {
          fontSize: 20,
          bold: true,
          color: '#ffd700',
        });

        // Winner arrow
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('→ WINNER', WIDTH - MX - 16, y + 30);
      } else {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#4a5a6a';
        ctx.font = '20px system-ui, -apple-system, sans-serif';
        ctx.fillText('TBD', MX + 80, y + 30);
      }

      y += MATCH_ROW_H + MATCH_GAP;
    }
    y += 12;
  }

  // ── 🥉 BRONZE MEDAL ──
  if (bronzeTeam) {
    y += 10;
    drawSectionDivider(ctx, MX, WIDTH - MX, y, 'BRONZE MEDAL', 18);
    y += 20;

    const bronzeBoxH = 110;

    // Bronze gradient card
    const bronzeGrad = ctx.createLinearGradient(0, y, 0, y + bronzeBoxH);
    bronzeGrad.addColorStop(0, 'rgba(205, 127, 50, 0.1)');
    bronzeGrad.addColorStop(1, 'rgba(205, 127, 50, 0.03)');
    ctx.fillStyle = bronzeGrad;
    roundRect(ctx, MX, y, CW, bronzeBoxH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(205, 127, 50, 0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, MX, y, CW, bronzeBoxH, 14);
    ctx.stroke();

    // Medal label
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cd7f32';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('🥉 BRONZE MEDAL', WIDTH / 2, y + 34);

    // Bronze team
    const bronzeLabelWidth = getTeamLabelWidth(ctx, bronzeTeam, { fontSize: 30, bold: true });
    const bronzeLabelX = WIDTH / 2 - bronzeLabelWidth / 2;
    await drawTeamLabelAsync(ctx, bronzeTeam, bronzeLabelX, y + 74, {
      fontSize: 30,
      bold: true,
      color: '#cd7f32',
    });

    y += bronzeBoxH + 16;
  }

  // ── FOOTER ──
  const FOOTER_HEIGHT = 320;
  const footerY = HEIGHT - FOOTER_HEIGHT;

  // Dark background strip
  ctx.fillStyle = 'rgba(8, 16, 30, 0.94)';
  ctx.fillRect(0, footerY, WIDTH, FOOTER_HEIGHT);

  // Gold separator line
  const goldGrad = ctx.createLinearGradient(0, 0, WIDTH, 0);
  goldGrad.addColorStop(0, 'rgba(255, 215, 0, 0)');
  goldGrad.addColorStop(0.1, '#ffd700');
  goldGrad.addColorStop(0.9, '#ffd700');
  goldGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(WIDTH, footerY);
  ctx.stroke();

  // PL Logo
  const footerLogoH = 150;
  const footerLogoW = logoImg ? Math.round(logoImg.naturalWidth / logoImg.naturalHeight * footerLogoH) : 0;
  const logoTopY = footerY + 30;
  if (logoImg) {
    ctx.drawImage(logoImg, (WIDTH - footerLogoW) / 2, logoTopY, footerLogoW, footerLogoH);
  } else {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
    ctx.fillText("PEOPLE'S LACROSSE", WIDTH / 2, logoTopY + 80);
  }

  // URL
  const urlY = logoTopY + footerLogoH + 55;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
  ctx.fillText('bracket.peopleslacrosse.com', WIDTH / 2, urlY);

  // Subtitle
  const subtitleY = urlY + 40;
  ctx.fillStyle = '#8899aa';
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillText('🥍 Make Your Picks · Compete with Friends · Create a Group', WIDTH / 2, subtitleY);

  // Bottom accent line
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(0, HEIGHT - 6, WIDTH, 6);

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
 * NOTE: On many mobile browsers, navigator.clipboard.write() for images
 * requires a recent user gesture and may not be available in all contexts.
 * Callers should always provide a download fallback.
 */
export async function copyShareImageToClipboard(options: ShareImageOptions): Promise<boolean> {
  if (typeof ClipboardItem === 'undefined') {
    return false;
  }
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