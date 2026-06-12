import { TournamentConfig } from '../types/bracket';
import { olympicSixes2028 } from './olympic-sixes-2028';

// PLL 2026 Season — 8 teams
export const pll2026: TournamentConfig = {
  id: 'pll-2026',
  name: 'PLL 2026 Season — Bracket Predictions',
  shortName: 'PLL 2026',
  year: 2026,
  slug: 'pll-2026',
  type: 'pll',
  status: 'active',
  startDate: '2026-05-03',
  endDate: '2026-09-07',
  groups: [
    {
      id: 'east',
      name: 'East Division',
      teams: [
        { id: 'pll-atlas', name: 'New York Atlas', shortName: 'Atlas', flag: '🗽', lucideIcon: 'Longhorns', group: 'east', seed: 3, record: '4-2' },
        { id: 'pll-cannons', name: 'Boston Cannons', shortName: 'Cannons', flag: '💥', lucideIcon: 'Cannon', group: 'east', seed: 6, record: '1-5' },
        { id: 'pll-waterdogs', name: 'Philadelphia Waterdogs', shortName: 'Waterdogs', flag: '🐕', lucideIcon: 'Dog', group: 'east', seed: 7, record: '2-4' },
        { id: 'pll-redwoods', name: 'DC Redwoods', shortName: 'Redwoods', flag: '🌲', lucideIcon: 'TreePine', group: 'east', seed: 8, record: '1-5' },
      ],
    },
    {
      id: 'west',
      name: 'West Division',
      teams: [
        { id: 'pll-outlaws', name: 'Denver Outlaws', shortName: 'Outlaws', flag: '🐎', lucideIcon: 'Lasso', group: 'west', seed: 1, record: '5-1' },
        { id: 'pll-archers', name: 'Utah Archers', shortName: 'Archers', flag: '🏹', lucideIcon: 'BowArrow', group: 'west', seed: 2, record: '3-3' },
        { id: 'pll-whipsnakes', name: 'Maryland Whipsnakes', shortName: 'Whipsnakes', flag: '🐍', lucideIcon: 'Snake', group: 'west', seed: 4, record: '3-2' },
        { id: 'pll-chaos', name: 'Carolina Chaos', shortName: 'Chaos', flag: '🌪️', lucideIcon: 'Tornado', group: 'west', seed: 5, record: '2-4' },
      ],
    },
  ],
  knockoutMatches: [
    { id: 'qf1', round: 'quarterfinal', slot1: { type: 'group_position', groupId: 'east', position: 1 }, slot2: { type: 'group_position', groupId: 'west', position: 4 } },
    { id: 'qf2', round: 'quarterfinal', slot1: { type: 'group_position', groupId: 'west', position: 1 }, slot2: { type: 'group_position', groupId: 'east', position: 4 } },
    { id: 'qf3', round: 'quarterfinal', slot1: { type: 'group_position', groupId: 'east', position: 2 }, slot2: { type: 'group_position', groupId: 'west', position: 3 } },
    { id: 'qf4', round: 'quarterfinal', slot1: { type: 'group_position', groupId: 'west', position: 2 }, slot2: { type: 'group_position', groupId: 'east', position: 3 } },
    { id: 'sf1', round: 'semifinal', slot1: { type: 'match_winner', matchId: 'qf1' }, slot2: { type: 'match_winner', matchId: 'qf2' } },
    { id: 'sf2', round: 'semifinal', slot1: { type: 'match_winner', matchId: 'qf3' }, slot2: { type: 'match_winner', matchId: 'qf4' } },
    { id: 'bronze', round: 'bronze', slot1: { type: 'match_loser', matchId: 'sf1' }, slot2: { type: 'match_loser', matchId: 'sf2' } },
    { id: 'gold', round: 'gold', slot1: { type: 'match_winner', matchId: 'sf1' }, slot2: { type: 'match_winner', matchId: 'sf2' } },
  ],
  scoring: {
    groupPosition: 1,
    quarterfinal: 2,
    semifinal: 4,
    bronze: 3,
    gold: 8,
    upsetBonusPercent: 50,
  },
};

// WLL 2026 Inaugural Season — 4 teams
export const wll2026: TournamentConfig = {
  id: 'wll-2026',
  name: 'WLL 2026 Inaugural Season — Bracket Predictions',
  shortName: 'WLL 2026',
  year: 2026,
  slug: 'wll-2026',
  type: 'pll',
  status: 'active',
  startDate: '2026-05-16',
  endDate: '2026-08-15',
  groups: [
    {
      id: 'wll',
      name: 'WLL Teams',
      teams: [
        { id: 'wll-guard', name: 'Boston Guard', shortName: 'Guard', flag: '🛡️', lucideIcon: 'Shield', group: 'wll', seed: 1, record: '0-1' },
        { id: 'wll-charging', name: 'New York Charging', shortName: 'Charging', flag: '⚡', lucideIcon: 'Bolt', group: 'wll', seed: 2, record: '1-0' },
        { id: 'wll-charm', name: 'Maryland Charm', shortName: 'Charm', flag: '🦀', lucideIcon: 'Star', group: 'wll', seed: 3, record: '0-0' },
        { id: 'wll-palms', name: 'California Palms', shortName: 'Palms', flag: '🌴', lucideIcon: 'TreePalm', group: 'wll', seed: 4, record: '0-0' },
      ],
    },
  ],
  knockoutMatches: [
    { id: 'wll-sf1', round: 'semifinal', slot1: { type: 'group_position', groupId: 'wll', position: 1 }, slot2: { type: 'group_position', groupId: 'wll', position: 4 } },
    { id: 'wll-sf2', round: 'semifinal', slot1: { type: 'group_position', groupId: 'wll', position: 2 }, slot2: { type: 'group_position', groupId: 'wll', position: 3 } },
    { id: 'wll-bronze', round: 'bronze', slot1: { type: 'match_loser', matchId: 'wll-sf1' }, slot2: { type: 'match_loser', matchId: 'wll-sf2' } },
    { id: 'wll-gold', round: 'gold', slot1: { type: 'match_winner', matchId: 'wll-sf1' }, slot2: { type: 'match_winner', matchId: 'wll-sf2' } },
  ],
  scoring: {
    groupPosition: 1,
    quarterfinal: 0,
    semifinal: 3,
    bronze: 2,
    gold: 5,
    upsetBonusPercent: 50,
  },
};

export const tournaments: Record<string, TournamentConfig> = {
  'olympic-sixes-2028': olympicSixes2028,
  'pll-2026': pll2026,
  'wll-2026': wll2026,
};

export function getTournament(slug: string): TournamentConfig | undefined {
  return tournaments[slug] || Object.values(tournaments).find(t => t.slug === slug);
}

export function getAllTournaments(): TournamentConfig[] {
  return Object.values(tournaments);
}