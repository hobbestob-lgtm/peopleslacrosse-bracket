'use client';

interface GroupShareImageOptions {
  groupName: string;
  tournamentName: string;
  tournamentEmoji: string;
  memberCount: number;
  leaderboard: { rank: number; name: string; score: number }[];
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

export async function generateGroupShareImage(options: GroupShareImageOptions): Promise<Blob> {
  const { groupName, tournamentName, tournamentEmoji, memberCount, leaderboard } = options;

  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadImage('/pl-logo-gold-sm.png');
  } catch {
    // Continue without logo
  }

  const WIDTH = 1080;
  const MX = 56;
  const CW = WIDTH - MX * 2;

  // Calculate height
  let y = 0;

  // Top accent + logo area
  y += 8; // accent bar
  y += logoImg ? 160 + 20 : 80;

  // Group name + tournament
  y += 48 + 36;

  // Stats bar
  y += 50 + 16;

  // "Share this group" label
  y += 30 + 8;

  // Leaderboard rows
  const topEntries = leaderboard.slice(0, 5);
  y += topEntries.length * 64 + 16;

  // CTA
  y += 70;

  // Footer
  y += 280;

  const HEIGHT = Math.max(1200, y);
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(0.3, '#0f2035');
  bg.addColorStop(0.7, '#0f2035');
  bg.addColorStop(1, '#0a1628');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle grid
  ctx.strokeStyle = 'rgba(42, 58, 84, 0.1)';
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

  // Logo
  y = 28;
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

  // Group name — large
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
  ctx.fillText(groupName, WIDTH / 2, y);
  y += 48;

  // Tournament name
  ctx.fillStyle = '#c0c8d0';
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${tournamentEmoji} ${tournamentName}`, WIDTH / 2, y);
  y += 36;

  // Stats bar
  y += 16;
  const statsY = y;

  // Member count pill
  ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
  roundRect(ctx, WIDTH / 2 - 140, statsY - 20, 280, 40, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
  ctx.lineWidth = 1;
  roundRect(ctx, WIDTH / 2 - 140, statsY - 20, 280, 40, 20);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${memberCount} Member${memberCount !== 1 ? 's' : ''} · Competing Now`, WIDTH / 2, statsY + 6);
  y = statsY + 38;

  // "Leaderboard" label
  y += 8;
  ctx.fillStyle = '#6b7b8b';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('— LEADERBOARD —', WIDTH / 2, y);
  y += 30;

  // Leaderboard entries
  const displayEntries = leaderboard.slice(0, 5);
  for (const entry of displayEntries) {
    const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';
    const isTop3 = entry.rank <= 3;

    // Entry card
    ctx.fillStyle = isTop3 ? 'rgba(255, 215, 0, 0.06)' : 'rgba(26, 42, 68, 0.5)';
    roundRect(ctx, MX, y, CW, 56, 12);
    ctx.fill();
    ctx.strokeStyle = isTop3 ? 'rgba(255, 215, 0, 0.2)' : '#2a3a54';
    ctx.lineWidth = 1;
    roundRect(ctx, MX, y, CW, 56, 12);
    ctx.stroke();

    // Rank / medal
    ctx.textAlign = 'left';
    if (medal) {
      ctx.font = '28px system-ui, -apple-system, sans-serif';
      ctx.fillText(medal, MX + 18, y + 37);
    } else {
      ctx.fillStyle = '#6b7b8b';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${entry.rank}`, MX + 22, y + 37);
    }

    // Name
    ctx.textAlign = 'left';
    ctx.fillStyle = isTop3 ? '#ffd700' : '#ffffff';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    const maxNameWidth = CW - 160;
    let displayName = entry.name;
    while (ctx.measureText(displayName).width > maxNameWidth && displayName.length > 3) {
      displayName = displayName.slice(0, -4) + '…';
    }
    ctx.fillText(displayName, MX + 60, y + 37);

    // Score
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${entry.score}`, WIDTH - MX - 18, y + 37);
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText('pts', WIDTH - MX - 18 - ctx.measureText(`${entry.score} `).width - 24, y + 37);

    y += 64;
  }

  // "More entries" indicator
  if (leaderboard.length > 5) {
    y += 4;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7b8b';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`+ ${leaderboard.length - 5} more · View full leaderboard →`, WIDTH / 2, y);
    y += 24;
  }

  // CTA
  y += 20;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillText('🥍 Join the Competition!', WIDTH / 2, y);
  y += 36;
  ctx.fillStyle = '#8899aa';
  ctx.font = '20px system-ui, -apple-system, sans-serif';
  ctx.fillText('bracket.peopleslacrosse.com', WIDTH / 2, y);

  // Footer
  const FOOTER_HEIGHT = 180;
  const footerY = HEIGHT - FOOTER_HEIGHT;

  ctx.fillStyle = 'rgba(8, 16, 30, 0.94)';
  ctx.fillRect(0, footerY, WIDTH, FOOTER_HEIGHT);

  // Gold separator
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

  // Logo in footer
  const footerLogoH = 100;
  const footerLogoW = logoImg ? Math.round(logoImg.naturalWidth / logoImg.naturalHeight * footerLogoH) : 0;
  const logoTopY = footerY + 25;
  if (logoImg) {
    ctx.drawImage(logoImg, (WIDTH - footerLogoW) / 2, logoTopY, footerLogoW, footerLogoH);
  } else {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("PEOPLE'S LACROSSE", WIDTH / 2, logoTopY + 50);
  }

  // Tagline
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8899aa';
  ctx.font = '20px system-ui, -apple-system, sans-serif';
  ctx.fillText('Make Your Picks · Compete with Friends · Create a Group', WIDTH / 2, footerY + 145);

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