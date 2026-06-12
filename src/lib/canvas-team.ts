'use client';

import { Team } from '@/types/bracket';

// Lucide SVG path data for each team icon (gold line icons)
const ICON_PATHS: Record<string, string> = {
  Building2: 'M6 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v18M6 12H5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1M18 12h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1M10 12h4M10 16h4M10 8h4',
  Flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  Dog: 'M10 5.5A2.5 2.5 0 0 1 7.5 3 2.5 2.5 0 0 0 5 5.5 2.5 2.5 0 0 0 7.5 8h2A2.5 2.5 0 0 0 12 5.5a2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 1 2 2.5A2.5 2.5 0 0 1 13.5 8M5 13v6M7 13v6M9 13v6M13 13v6M15 13v6M12 21H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1M16 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM22 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM22 16H12a2 2 0 0 0-2 2v2',
  TreePine: 'm10 2 7.5 10H16l5.5 8H2.5L8 12H5.5ZM10 20v2M8 22h4',
  Lasso: 'm7 16 3-7 3 7M6 11a6 6 0 0 0 12 0M9 8a3 3 0 1 1 6 0',
  Zap: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  Tornado: 'M21 4H3M21 8H8M3 12h10M17 12h.01M3 16h6M21 8h.01M15 16h.01M21 20H10M3 20h.01',
  Shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  Bolt: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  Star: 'm12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z',
  TreePalm: 'M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h11ZM2 8c0 2.76 2.46 5 5.5 5S13 10.76 13 8H2ZM22 8c0-2.76-2.46-5-5.5-5S11 5.24 11 8h11ZM11 8c0 2.76 2.46 5 5.5 5S22 10.76 22 8H11ZM12 22v-6M12 8v2M9.5 2A6.5 6.5 0 0 0 4 5.5M14.5 2A6.5 6.5 0 0 1 20 5.5',
  Longhorns: 'M2 10h5M2 10c0-3 1-5 3-7M22 10h-5M22 10c0-3-1-5-3-7M7 10c0 2 2 4 5 4s5-2 5-4M10 14v3M14 14v3',
  // Cannon — rectangular barrel on round wagon wheel
  Cannon: 'M3 8h14M17 8l2-1M3 12h14M3 8v4M17 8v4',
  // Snake — S-curve with head and forked tongue
  Snake: 'M18 4c1 0 2 1 2 2s-1 2-2 2c-2 0-3 1-3 3s1 3 3 3c1 0 2 1 2 2s-1 2-2 2c-2 0-3 1-3 2M19 3.5v1.5M20.5 3.5v1.5',
  // BowArrow — bow with nocked arrow for Archers
  BowArrow: 'M6 3c3 4 3 14 0 18M6 3c-2 2-3 5-3 9s1 7 3 9M6 12h13M14 7l5 5-5 5',
};

// Map team IDs to icon names
const TEAM_ICON_MAP: Record<string, string> = {
  'pll-atlas': 'Longhorns',
  'pll-cannons': 'Cannon',
  'pll-waterdogs': 'Dog',
  'pll-redwoods': 'TreePine',
  'pll-outlaws': 'Lasso',
  'pll-archers': 'BowArrow',
  'pll-whipsnakes': 'Snake',
  'pll-chaos': 'Tornado',
  'wll-guard': 'Shield',
  'wll-charging': 'Bolt',
  'wll-charm': 'Star',
  'wll-palms': 'TreePalm',
};

// Cache for rendered SVG→Image conversions
const iconImageCache = new Map<string, HTMLImageElement>();

/**
 * Build an SVG string from Lucide path data for a team icon.
 */
function buildIconSvg(iconName: string, size: number, color: string = '#ffd700'): string {
  const pathData = ICON_PATHS[iconName];
  if (!pathData) return '';

  // Default Lucide viewBox is 24x24, stroke-width 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="${pathData}"/>
  </svg>`;
}

/**
 * Convert an SVG string to an HTMLImageElement for Canvas rendering.
 */
function svgToImage(svg: string, cacheKey: string): Promise<HTMLImageElement | null> {
  const cached = iconImageCache.get(cacheKey);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      iconImageCache.set(cacheKey, img);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Draws a team icon on a Canvas context using Lucide SVG paths.
 * PLL/WLL teams get gold line icons; Olympic teams get flag emojis.
 */
export async function drawTeamIconAsync(
  ctx: CanvasRenderingContext2D,
  team: Team,
  x: number,
  y: number,
  size: number,
  color: string = '#ffd700'
): Promise<void> {
  const iconName = TEAM_ICON_MAP[team.id] || team.lucideIcon;
  const pathData = iconName ? ICON_PATHS[iconName] : null;

  if (pathData) {
    // PLL/WLL team — render Lucide icon via SVG→Image
    const svg = buildIconSvg(iconName!, size, color);
    const cacheKey = `${iconName}-${size}-${color}`;
    const img = await svgToImage(svg, cacheKey);
    if (img) {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    } else {
      // Fallback to shortName initial
      ctx.fillStyle = color;
      ctx.font = `bold ${size * 0.6}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((team.shortName || team.name)[0], x, y);
    }
  } else {
    // Olympic team — draw flag emoji
    ctx.font = `${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(team.flag, x, y);
  }
}

/**
 * Synchronous version — uses cached images if available.
 */
function drawTeamIconSync(
  ctx: CanvasRenderingContext2D,
  team: Team,
  x: number,
  y: number,
  size: number,
  color: string = '#ffd700'
) {
  const iconName = TEAM_ICON_MAP[team.id] || team.lucideIcon;
  const pathData = iconName ? ICON_PATHS[iconName] : null;

  if (pathData) {
    const cacheKey = `${iconName}-${size}-${color}`;
    const cached = iconImageCache.get(cacheKey);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      ctx.drawImage(cached, x - size / 2, y - size / 2, size, size);
      return;
    }
    // Fallback to shortName initial
    ctx.fillStyle = color;
    ctx.font = `bold ${size * 0.6}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((team.shortName || team.name)[0], x, y);
  } else {
    ctx.font = `${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(team.flag, x, y);
  }
}

/**
 * Pre-load all team icon images for a tournament.
 * Call before generating share images to ensure icons are loaded.
 */
export async function preloadTeamIcons(teams: Team[], size: number = 24, color: string = '#ffd700'): Promise<void> {
  const sizes = [size, 20, 24, 28, 32, 36, 44, 56];
  const promises: Promise<HTMLImageElement | null>[] = [];

  for (const s of sizes) {
    for (const team of teams) {
      const iconName = TEAM_ICON_MAP[team.id] || team.lucideIcon;
      if (iconName && ICON_PATHS[iconName]) {
        const svg = buildIconSvg(iconName, s, color);
        promises.push(svgToImage(svg, `${iconName}-${s}-${color}`));
      }
    }
  }

  await Promise.all(promises);
}

/**
 * Renders a team label on Canvas (async version for share images).
 * PLL/WLL: gold Lucide icon + bold name; Olympic: flag emoji + name.
 */
export async function drawTeamLabelAsync(
  ctx: CanvasRenderingContext2D,
  team: Team,
  x: number,
  y: number,
  options?: {
    fontSize?: number;
    bold?: boolean;
    color?: string;
    showRecord?: boolean;
    maxWidth?: number;
    iconColor?: string;
  }
): Promise<number> {
  const {
    fontSize = 18,
    bold = true,
    color = '#ffffff',
    showRecord = false,
    iconColor = '#ffd700',
    maxWidth,
  } = options || {};

  const iconName = TEAM_ICON_MAP[team.id] || team.lucideIcon;
  const hasIcon = iconName ? !!ICON_PATHS[iconName] : false;
  ctx.textAlign = 'left';

  if (!hasIcon) {
    // Olympic teams: render country flag emoji + name
    ctx.fillStyle = color;
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px system-ui, sans-serif`;
    const label = `${team.flag} ${team.shortName || team.name}`;
    ctx.fillText(label, x, y);
    const labelWidth = ctx.measureText(label).width;

    if (showRecord && team.record) {
      ctx.fillStyle = team.record.split('-')[0] > team.record.split('-')[1] ? '#4ade80' : '#ef4444';
      ctx.font = `${Math.round(fontSize * 0.7)}px system-ui, sans-serif`;
      ctx.fillText(`(${team.record})`, x + labelWidth + 8, y);
    }

    return x + labelWidth + (showRecord && team.record ? ctx.measureText(`(${team.record})`).width + 16 : 0);
  } else {
    // PLL/WLL teams: gold Lucide icon + bold name
    const iconSize = Math.round(fontSize * 1.1);

    await drawTeamIconAsync(ctx, team, x + iconSize * 0.5, y - fontSize * 0.35, iconSize, iconColor);

    const nameX = x + iconSize + 6;
    ctx.fillStyle = color;
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px system-ui, sans-serif`;
    ctx.fillText(team.shortName || team.name, nameX, y);
    const nameWidth = ctx.measureText(team.shortName || team.name).width;

    if (showRecord && team.record) {
      ctx.fillStyle = team.record.split('-')[0] > team.record.split('-')[1] ? '#4ade80' : '#ef4444';
      ctx.font = `${Math.round(fontSize * 0.7)}px system-ui, sans-serif`;
      ctx.fillText(`(${team.record})`, nameX + nameWidth + 8, y);
    }

    return nameX + nameWidth + (showRecord && team.record ? ctx.measureText(`(${team.record})`).width + 16 : 0);
  }
}

/**
 * Synchronous team label rendering (uses cached images or falls back to initials).
 */
export function drawTeamLabel(
  ctx: CanvasRenderingContext2D,
  team: Team,
  x: number,
  y: number,
  options?: {
    fontSize?: number;
    bold?: boolean;
    color?: string;
    showRecord?: boolean;
    maxWidth?: number;
    iconColor?: string;
  }
): number {
  const {
    fontSize = 18,
    bold = true,
    color = '#ffffff',
    showRecord = false,
    iconColor = '#ffd700',
    maxWidth,
  } = options || {};

  const iconName = TEAM_ICON_MAP[team.id] || team.lucideIcon;
  const hasIcon = iconName ? !!ICON_PATHS[iconName] : false;
  ctx.textAlign = 'left';

  if (!hasIcon) {
    ctx.fillStyle = color;
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px system-ui, sans-serif`;
    const label = `${team.flag} ${team.shortName || team.name}`;
    ctx.fillText(label, x, y);
    const labelWidth = ctx.measureText(label).width;

    if (showRecord && team.record) {
      ctx.fillStyle = team.record.split('-')[0] > team.record.split('-')[1] ? '#4ade80' : '#ef4444';
      ctx.font = `${Math.round(fontSize * 0.7)}px system-ui, sans-serif`;
      ctx.fillText(`(${team.record})`, x + labelWidth + 8, y);
    }

    return x + labelWidth + (showRecord && team.record ? ctx.measureText(`(${team.record})`).width + 16 : 0);
  } else {
    const iconSize = Math.round(fontSize * 1.1);
    drawTeamIconSync(ctx, team, x + iconSize * 0.5, y - fontSize * 0.35, iconSize, iconColor);

    const nameX = x + iconSize + 6;
    ctx.fillStyle = color;
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px system-ui, sans-serif`;
    ctx.fillText(team.shortName || team.name, nameX, y);
    const nameWidth = ctx.measureText(team.shortName || team.name).width;

    if (showRecord && team.record) {
      ctx.fillStyle = team.record.split('-')[0] > team.record.split('-')[1] ? '#4ade80' : '#ef4444';
      ctx.font = `${Math.round(fontSize * 0.7)}px system-ui, sans-serif`;
      ctx.fillText(`(${team.record})`, nameX + nameWidth + 8, y);
    }

    return nameX + nameWidth + (showRecord && team.record ? ctx.measureText(`(${team.record})`).width + 16 : 0);
  }
}

/**
 * Get the display label for a team in Canvas context.
 */
export function getTeamCanvasLabel(team: Team): string {
  const iconName = TEAM_ICON_MAP[team.id] || team.lucideIcon;
  if (iconName && ICON_PATHS[iconName]) {
    return team.shortName || team.name;
  }
  return `${team.flag} ${team.shortName || team.name}`;
}

/**
 * Get the width of a team label for Canvas layout purposes.
 */
export function getTeamLabelWidth(
  ctx: CanvasRenderingContext2D,
  team: Team,
  options?: { fontSize?: number; bold?: boolean; showRecord?: boolean }
): number {
  const { fontSize = 18, bold = true, showRecord = false } = options || {};

  const iconName = TEAM_ICON_MAP[team.id] || team.lucideIcon;
  const hasIcon = iconName ? !!ICON_PATHS[iconName] : false;

  ctx.font = `${bold ? 'bold ' : ''}${fontSize}px system-ui, sans-serif`;
  let width: number;

  if (!hasIcon) {
    width = ctx.measureText(`${team.flag} ${team.shortName || team.name}`).width;
  } else {
    const iconSize = Math.round(fontSize * 1.1);
    width = iconSize + 6 + ctx.measureText(team.shortName || team.name).width;
  }

  if (showRecord && team.record) {
    ctx.font = `${Math.round(fontSize * 0.7)}px system-ui, sans-serif`;
    width += ctx.measureText(`(${team.record})`).width + 8;
  }

  return width;
}