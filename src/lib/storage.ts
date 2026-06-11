/**
 * Client-side bracket storage using localStorage.
 * Will be migrated to D1 + Workers API when Cloudflare is fully configured.
 * 
 * Email collection pushes to Google Sheets via service account.
 */

import { BracketPick, GroupPick, KnockoutPick } from '../types/bracket';
import { generateBracketId } from './bracket-engine';

const STORAGE_KEY_PREFIX = 'pl_bracket_';
const EMAIL_SHEETS_URL = '/api/emails'; // Will be a Worker endpoint

/**
 * Save a bracket to localStorage
 */
export function saveBracketToLocal(pick: BracketPick): void {
  const key = `${STORAGE_KEY_PREFIX}${pick.id}`;
  localStorage.setItem(key, JSON.stringify(pick));
  
  // Also save to index for listing
  const index = getBracketIndex();
  if (!index.includes(pick.id)) {
    index.push(pick.id);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}index`, JSON.stringify(index));
  }
}

/**
 * Load a bracket from localStorage
 */
export function loadBracketFromLocal(bracketId: string): BracketPick | null {
  const key = `${STORAGE_KEY_PREFIX}${bracketId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Get all bracket IDs from localStorage
 */
export function getBracketIndex(): string[] {
  const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}index`);
  return data ? JSON.parse(data) : [];
}

/**
 * Get all brackets for a tournament from localStorage
 */
export function getBracketsForTournament(tournamentId: string): BracketPick[] {
  const index = getBracketIndex();
  const brackets: BracketPick[] = [];
  for (const id of index) {
    const bracket = loadBracketFromLocal(id);
    if (bracket && bracket.tournamentId === tournamentId) {
      brackets.push(bracket);
    }
  }
  return brackets;
}

/**
 * Create and save a new bracket
 */
export function createBracket(
  tournamentId: string,
  email: string,
  displayName: string,
  groupPicks: GroupPick[],
  knockoutPicks: KnockoutPick[],
  thirdPlacePicks: string[] = []
): BracketPick {
  const bracket: BracketPick = {
    id: generateBracketId(),
    tournamentId,
    email,
    displayName: displayName || email.split('@')[0],
    groupPicks,
    knockoutPicks,
    thirdPlacePicks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  saveBracketToLocal(bracket);
  return bracket;
}

/**
 * Collect email — pushes to Google Sheets via service account.
 * For now, saves locally. Sheets integration will be added as a Worker.
 */
export async function collectEmail(
  email: string,
  tournamentId: string,
  displayName: string,
  bracketId: string
): Promise<{ success: boolean }> {
  // Local backup
  const emails = JSON.parse(localStorage.getItem('pl_emails') || '[]');
  emails.push({ email, tournamentId, displayName, bracketId, timestamp: new Date().toISOString() });
  localStorage.setItem('pl_emails', JSON.stringify(emails));

  // TODO: Push to Google Sheets via Worker endpoint
  // const response = await fetch(EMAIL_SHEETS_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, tournamentId, displayName, bracketId }),
  // });
  // return response.json();

  return { success: true };
}

/**
 * Generate shareable link for a bracket
 */
export function getShareUrl(bracketId: string): string {
  return `${window.location.origin}/bracket/${bracketId}`;
}

/**
 * Export bracket data for sharing (JSON)
 */
export function exportBracketAsJson(pick: BracketPick): string {
  return JSON.stringify(pick, null, 2);
}

/**
 * Import bracket from shared JSON
 */
export function importBracketFromJson(json: string): BracketPick | null {
  try {
    const pick = JSON.parse(json);
    if (pick.id && pick.tournamentId && pick.groupPicks && pick.knockoutPicks) {
      return pick as BracketPick;
    }
    return null;
  } catch {
    return null;
  }
}