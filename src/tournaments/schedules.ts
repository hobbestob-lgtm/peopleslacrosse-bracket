import { WeeklySchedule } from '../types/confidence-pool';

// PLL 2026 Weekly Schedules
// 13 weeks, 4 games per week, rotating venues
// Teams: Outlaws, Archers, Whipsnakes, Chaos (West) | Atlas, Cannons, Waterdogs, Redwoods (East)
// Each team plays 12 games: in-conference 2x, out-of-conference 1x
// One team on bye each week (plays only 3 games that week = one weekend off)

export const pll2026Schedule: WeeklySchedule[] = [
  // Week 1 — May 8-9, Salt Lake City, UT (completed)
  {
    weekNumber: 1,
    tournamentId: 'pll-2026',
    startDate: '2026-05-08',
    endDate: '2026-05-09',
    venue: 'Salt Lake City, UT',
    matchups: [
      { id: 'pll-w1-g1', weekNumber: 1, round: 'regular', homeTeam: 'pll-archers', awayTeam: 'pll-outlaws', homeScore: 10, awayScore: 7, date: '2026-05-08', time: '7:00 PM ET', venue: 'Salt Lake City, UT', status: 'completed' },
      { id: 'pll-w1-g2', weekNumber: 1, round: 'regular', homeTeam: 'pll-chaos', awayTeam: 'pll-cannons', homeScore: 14, awayScore: 10, date: '2026-05-08', time: '9:30 PM ET', venue: 'Salt Lake City, UT', status: 'completed' },
      { id: 'pll-w1-g3', weekNumber: 1, round: 'regular', homeTeam: 'pll-archers', awayTeam: 'pll-redwoods', homeScore: 8, awayScore: 11, date: '2026-05-09', time: '5:00 PM ET', venue: 'Salt Lake City, UT', status: 'completed' },
      { id: 'pll-w1-g4', weekNumber: 1, round: 'regular', homeTeam: 'pll-chaos', awayTeam: 'pll-waterdogs', homeScore: 11, awayScore: 13, date: '2026-05-09', time: '7:30 PM ET', venue: 'Salt Lake City, UT', status: 'completed' },
    ],
  },
  // Week 2 — May 15-16, Providence, RI (completed)
  {
    weekNumber: 2,
    tournamentId: 'pll-2026',
    startDate: '2026-05-15',
    endDate: '2026-05-16',
    venue: 'Providence, RI',
    matchups: [
      { id: 'pll-w2-g1', weekNumber: 2, round: 'regular', homeTeam: 'pll-whipsnakes', awayTeam: 'pll-atlas', homeScore: 12, awayScore: 6, date: '2026-05-15', time: '7:00 PM ET', venue: 'Providence, RI', status: 'completed' },
      { id: 'pll-w2-g2', weekNumber: 2, round: 'regular', homeTeam: 'pll-chaos', awayTeam: 'pll-cannons', homeScore: 14, awayScore: 10, date: '2026-05-15', time: '9:30 PM ET', venue: 'Providence, RI', status: 'completed' },
      { id: 'pll-w2-g3', weekNumber: 2, round: 'regular', homeTeam: 'pll-whipsnakes', awayTeam: 'pll-redwoods', date: '2026-05-16', time: '5:00 PM ET', venue: 'Providence, RI', status: 'completed' },
      { id: 'pll-w2-g4', weekNumber: 2, round: 'regular', homeTeam: 'pll-outlaws', awayTeam: 'pll-archers', date: '2026-05-16', time: '7:30 PM ET', venue: 'Providence, RI', status: 'completed' },
    ],
  },
  // Week 3 — May 29-30, Baltimore, MD (completed)
  {
    weekNumber: 3,
    tournamentId: 'pll-2026',
    startDate: '2026-05-29',
    endDate: '2026-05-30',
    venue: 'Baltimore, MD',
    matchups: [
      { id: 'pll-w3-g1', weekNumber: 3, round: 'regular', homeTeam: 'pll-chaos', awayTeam: 'pll-atlas', date: '2026-05-29', time: '7:00 PM ET', venue: 'Baltimore, MD', status: 'completed' },
      { id: 'pll-w3-g2', weekNumber: 3, round: 'regular', homeTeam: 'pll-whipsnakes', awayTeam: 'pll-archers', date: '2026-05-29', time: '9:30 PM ET', venue: 'Baltimore, MD', status: 'completed' },
      { id: 'pll-w3-g3', weekNumber: 3, round: 'regular', homeTeam: 'pll-outlaws', awayTeam: 'pll-cannons', date: '2026-05-30', time: '5:00 PM ET', venue: 'Baltimore, MD', status: 'completed' },
      { id: 'pll-w3-g4', weekNumber: 3, round: 'regular', homeTeam: 'pll-waterdogs', awayTeam: 'pll-redwoods', date: '2026-05-30', time: '7:30 PM ET', venue: 'Baltimore, MD', status: 'completed' },
    ],
  },
  // Week 4 — June 5-6, Charlotte, NC (completed)
  {
    weekNumber: 4,
    tournamentId: 'pll-2026',
    startDate: '2026-06-05',
    endDate: '2026-06-06',
    venue: 'Charlotte, NC',
    matchups: [
      { id: 'pll-w4-g1', weekNumber: 4, round: 'regular', homeTeam: 'pll-chaos', awayTeam: 'pll-archers', homeScore: 7, awayScore: 15, date: '2026-06-05', time: '6:00 PM ET', venue: 'Charlotte, NC', status: 'completed' },
      { id: 'pll-w4-g2', weekNumber: 4, round: 'regular', homeTeam: 'pll-redwoods', awayTeam: 'pll-atlas', homeScore: 12, awayScore: 11, date: '2026-06-05', time: '8:30 PM ET', venue: 'Charlotte, NC', status: 'completed' },
      { id: 'pll-w4-g3', weekNumber: 4, round: 'regular', homeTeam: 'pll-chaos', awayTeam: 'pll-outlaws', homeScore: 12, awayScore: 11, date: '2026-06-06', time: '5:30 PM ET', venue: 'Charlotte, NC', status: 'completed' },
      { id: 'pll-w4-g4', weekNumber: 4, round: 'regular', homeTeam: 'pll-waterdogs', awayTeam: 'pll-cannons', homeScore: 17, awayScore: 10, date: '2026-06-06', time: '8:00 PM ET', venue: 'Charlotte, NC', status: 'completed' },
    ],
  },
  // Week 5 — June 19-21, Long Island, NY (upcoming)
  {
    weekNumber: 5,
    tournamentId: 'pll-2026',
    startDate: '2026-06-19',
    endDate: '2026-06-21',
    venue: 'Long Island, NY',
    matchups: [
      { id: 'pll-w5-g1', weekNumber: 5, round: 'regular', homeTeam: 'pll-atlas', awayTeam: 'pll-whipsnakes', date: '2026-06-19', time: '7:00 PM ET', venue: 'Long Island, NY', status: 'upcoming' },
      { id: 'pll-w5-g2', weekNumber: 5, round: 'regular', homeTeam: 'pll-outlaws', awayTeam: 'pll-cannons', date: '2026-06-19', time: '9:30 PM ET', venue: 'Long Island, NY', status: 'upcoming' },
      { id: 'pll-w5-g3', weekNumber: 5, round: 'regular', homeTeam: 'pll-atlas', awayTeam: 'pll-redwoods', date: '2026-06-20', time: '5:00 PM ET', venue: 'Long Island, NY', status: 'upcoming' },
      { id: 'pll-w5-g4', weekNumber: 5, round: 'regular', homeTeam: 'pll-outlaws', awayTeam: 'pll-archers', date: '2026-06-20', time: '7:30 PM ET', venue: 'Long Island, NY', status: 'upcoming' },
    ],
  },
  // Week 6 — June 26-28, Dallas, TX
  {
    weekNumber: 6,
    tournamentId: 'pll-2026',
    startDate: '2026-06-26',
    endDate: '2026-06-28',
    venue: 'Dallas, TX',
    matchups: [
      { id: 'pll-w6-g1', weekNumber: 6, round: 'regular', homeTeam: 'pll-cannons', awayTeam: 'pll-chaos', date: '2026-06-26', time: '7:00 PM ET', venue: 'Dallas, TX', status: 'upcoming' },
      { id: 'pll-w6-g2', weekNumber: 6, round: 'regular', homeTeam: 'pll-waterdogs', awayTeam: 'pll-whipsnakes', date: '2026-06-26', time: '9:30 PM ET', venue: 'Dallas, TX', status: 'upcoming' },
      { id: 'pll-w6-g3', weekNumber: 6, round: 'regular', homeTeam: 'pll-redwoods', awayTeam: 'pll-archers', date: '2026-06-27', time: '5:00 PM ET', venue: 'Dallas, TX', status: 'upcoming' },
      { id: 'pll-w6-g4', weekNumber: 6, round: 'regular', homeTeam: 'pll-cannons', awayTeam: 'pll-atlas', date: '2026-06-27', time: '7:30 PM ET', venue: 'Dallas, TX', status: 'upcoming' },
    ],
  },
  // Week 7 — July 3-5, Philadelphia, PA
  {
    weekNumber: 7,
    tournamentId: 'pll-2026',
    startDate: '2026-07-03',
    endDate: '2026-07-05',
    venue: 'Philadelphia, PA',
    matchups: [
      { id: 'pll-w7-g1', weekNumber: 7, round: 'regular', homeTeam: 'pll-waterdogs', awayTeam: 'pll-archers', date: '2026-07-03', time: '7:00 PM ET', venue: 'Philadelphia, PA', status: 'upcoming' },
      { id: 'pll-w7-g2', weekNumber: 7, round: 'regular', homeTeam: 'pll-whipsnakes', awayTeam: 'pll-chaos', date: '2026-07-03', time: '9:30 PM ET', venue: 'Philadelphia, PA', status: 'upcoming' },
      { id: 'pll-w7-g3', weekNumber: 7, round: 'regular', homeTeam: 'pll-waterdogs', awayTeam: 'pll-atlas', date: '2026-07-04', time: '5:00 PM ET', venue: 'Philadelphia, PA', status: 'upcoming' },
      { id: 'pll-w7-g4', weekNumber: 7, round: 'regular', homeTeam: 'pll-whipsnakes', awayTeam: 'pll-outlaws', date: '2026-07-04', time: '7:30 PM ET', venue: 'Philadelphia, PA', status: 'upcoming' },
    ],
  },
  // Weeks 8-13: TBD — will be added as schedule is confirmed
];

// WLL 2026 Weekly Schedules
// 8 games over the season, 1-2 games per weekend
export const wll2026Schedule: WeeklySchedule[] = [
  // WLL Week 1 — May 16, Providence RI (completed)
  {
    weekNumber: 1,
    tournamentId: 'wll-2026',
    startDate: '2026-05-16',
    endDate: '2026-05-16',
    venue: 'Providence, RI',
    matchups: [
      { id: 'wll-w1-g1', weekNumber: 1, round: 'regular', homeTeam: 'wll-charging', awayTeam: 'wll-guard', homeScore: 17, awayScore: 12, date: '2026-05-16', time: '5:30 PM ET', venue: 'Providence, RI', status: 'completed' },
    ],
  },
  // WLL Week 2 — May 29-30, Baltimore MD (completed)
  {
    weekNumber: 2,
    tournamentId: 'wll-2026',
    startDate: '2026-05-29',
    endDate: '2026-05-30',
    venue: 'Baltimore, MD',
    matchups: [
      { id: 'wll-w2-g1', weekNumber: 2, round: 'regular', homeTeam: 'wll-charm', awayTeam: 'wll-palms', date: '2026-05-29', time: '7:00 PM ET', venue: 'Baltimore, MD', status: 'completed' },
    ],
  },
  // WLL Week 3 — June 5-6, Charlotte NC (with PLL)
  {
    weekNumber: 3,
    tournamentId: 'wll-2026',
    startDate: '2026-06-05',
    endDate: '2026-06-06',
    venue: 'Charlotte, NC',
    matchups: [
      { id: 'wll-w3-g1', weekNumber: 3, round: 'regular', homeTeam: 'wll-charging', awayTeam: 'wll-charm', date: '2026-06-06', time: '12:00 PM ET', venue: 'Charlotte, NC', status: 'upcoming' },
    ],
  },
  // WLL Week 4 — June 19-21, Long Island NY (with PLL)
  {
    weekNumber: 4,
    tournamentId: 'wll-2026',
    startDate: '2026-06-19',
    endDate: '2026-06-21',
    venue: 'Long Island, NY',
    matchups: [
      { id: 'wll-w4-g1', weekNumber: 4, round: 'regular', homeTeam: 'wll-guard', awayTeam: 'wll-palms', date: '2026-06-20', time: '12:00 PM ET', venue: 'Long Island, NY', status: 'upcoming' },
    ],
  },
  // WLL Weeks 5-8: TBD
];

export function getCurrentWeek(schedule: WeeklySchedule[]): number {
  const now = new Date();
  for (const week of schedule) {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    end.setHours(23, 59, 59);
    if (now >= start && now <= end) return week.weekNumber;
  }
  // Find next upcoming week
  const upcoming = schedule
    .filter(w => new Date(w.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  return upcoming.length > 0 ? upcoming[0].weekNumber : schedule[schedule.length - 1].weekNumber;
}

export function getWeekSchedule(schedule: WeeklySchedule[], weekNumber: number): WeeklySchedule | undefined {
  return schedule.find(w => w.weekNumber === weekNumber);
}

export function getUpcomingWeeks(schedule: WeeklySchedule[]): WeeklySchedule[] {
  const now = new Date();
  return schedule.filter(w => new Date(w.startDate) > now || w.matchups.some(m => m.status === 'upcoming'));
}