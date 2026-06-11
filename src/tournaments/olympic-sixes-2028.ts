import { TournamentConfig } from '../types/bracket';

// LA 2028 Olympic Sixes — projected teams and format
// 8 teams, 2 groups of 4, round-robin → knockout
// Will be updated as qualifiers are confirmed
export const olympicSixes2028: TournamentConfig = {
  id: 'olympic-sixes-2028',
  name: 'LA 2028 Olympic Lacrosse — Sixes',
  shortName: 'Olympic Sixes 2028',
  year: 2028,
  slug: 'olympic-sixes-2028',
  type: 'olympic_sixes',
  status: 'upcoming',
  startDate: '2028-07-27', // Projected — Olympic window
  endDate: '2028-08-12',
  groups: [
    {
      id: 'A',
      name: 'Group A',
      teams: [
        { id: 'usa', name: 'United States', shortName: 'USA', flag: '🇺🇸', group: 'A', seed: 1 },
        { id: 'aus', name: 'Australia', shortName: 'AUS', flag: '🇦🇺', group: 'A', seed: 4 },
        { id: 'isr', name: 'Israel', shortName: 'ISR', flag: '🇮🇱', group: 'A', seed: 5 },
        { id: 'ger', name: 'Germany', shortName: 'GER', flag: '🇩🇪', group: 'A', seed: 8 },
      ],
    },
    {
      id: 'B',
      name: 'Group B',
      teams: [
        { id: 'can', name: 'Canada', shortName: 'CAN', flag: '🇨🇦', group: 'B', seed: 2 },
        { id: 'gbr', name: 'England', shortName: 'GBR', flag: '🇬🇧', group: 'B', seed: 3 },
        { id: 'jpn', name: 'Japan', shortName: 'JPN', flag: '🇯🇵', group: 'B', seed: 6 },
        { id: 'jam', name: 'Jamaica', shortName: 'JAM', flag: '🇯🇲', group: 'B', seed: 7 },
      ],
    },
  ],
  knockoutMatches: [
    // Quarterfinals
    {
      id: 'qf1',
      round: 'quarterfinal',
      slot1: { type: 'group_position', groupId: 'A', position: 1 },
      slot2: { type: 'group_position', groupId: 'B', position: 2 },
    },
    {
      id: 'qf2',
      round: 'quarterfinal',
      slot1: { type: 'group_position', groupId: 'A', position: 2 },
      slot2: { type: 'group_position', groupId: 'B', position: 1 },
    },
    {
      id: 'qf3',
      round: 'quarterfinal',
      slot1: { type: 'group_position', groupId: 'A', position: 3 },
      slot2: { type: 'group_position', groupId: 'B', position: 3 }, // Best 3rd place
    },
    {
      id: 'qf4',
      round: 'quarterfinal',
      slot1: { type: 'group_position', groupId: 'A', position: 4 },
      slot2: { type: 'group_position', groupId: 'B', position: 4 }, // Could be 4th or 3rd from other group
    },
    // Semifinals
    {
      id: 'sf1',
      round: 'semifinal',
      slot1: { type: 'match_winner', matchId: 'qf1' },
      slot2: { type: 'match_winner', matchId: 'qf2' },
    },
    {
      id: 'sf2',
      round: 'semifinal',
      slot1: { type: 'match_winner', matchId: 'qf3' },
      slot2: { type: 'match_winner', matchId: 'qf4' },
    },
    // Bronze medal
    {
      id: 'bronze',
      round: 'bronze',
      slot1: { type: 'match_loser', matchId: 'sf1' },
      slot2: { type: 'match_loser', matchId: 'sf2' },
    },
    // Gold medal
    {
      id: 'gold',
      round: 'gold',
      slot1: { type: 'match_winner', matchId: 'sf1' },
      slot2: { type: 'match_winner', matchId: 'sf2' },
    },
  ],
  scoring: {
    groupPosition: 1,    // 1 point per correct position
    quarterfinal: 2,
    semifinal: 4,
    bronze: 3,
    gold: 8,
    upsetBonusPercent: 50, // +50% for correct underdog picks
  },
};

// Registry moved to index.ts