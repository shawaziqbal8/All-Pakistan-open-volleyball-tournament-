import { Team, Match, FanPost, TournamentNotification, TrafficMetric } from '../types';

// Placeholder TBD Teams to prevent null errors in match fixtures before real clubs register
export const TBD_TEAM_A: Team = {
  id: 'tbd_1',
  name: 'TBD Team Alpha',
  city: 'Bisham',
  logo: '⏳',
  color: '#cbd5e1',
  bgColor: 'bg-slate-50 text-slate-500 border-slate-205',
  stats: { played: 0, won: 0, lost: 0, points: 0 },
  players: []
};

export const TBD_TEAM_B: Team = {
  id: 'tbd_2',
  name: 'TBD Team Beta',
  city: 'Shangla',
  logo: '⏳',
  color: '#cbd5e1',
  bgColor: 'bg-slate-50 text-slate-500 border-slate-205',
  stats: { played: 0, won: 0, lost: 0, points: 0 },
  players: []
};

// Initial teams are set to empty so only newly approved registrations populate rosters
export const INITIAL_TEAMS: Team[] = [];

// Matches are rescheduled to show upcoming qualifiers on and after July 2nd, 2026
export const INITIAL_MATCHES: Match[] = [
  {
    id: 'match_upcoming_1',
    teamA: TBD_TEAM_A,
    teamB: TBD_TEAM_B,
    status: 'Upcoming',
    venue: 'Khursheed Khan Volleyball Ground, Shangla',
    date: '2026-07-02',
    time: '18:30',
    score: {
      setsA: 0,
      setsB: 0,
      currentScore: [0, 0],
      setsHistory: []
    },
    server: 'B',
    liveActionLog: []
  },
  {
    id: 'match_upcoming_2',
    teamA: TBD_TEAM_A,
    teamB: TBD_TEAM_B,
    status: 'Upcoming',
    venue: 'Khursheed Khan Volleyball Ground, Shangla',
    date: '2026-07-03',
    time: '17:30',
    score: {
      setsA: 0,
      setsB: 0,
      currentScore: [0, 0],
      setsHistory: []
    },
    server: 'A',
    liveActionLog: []
  },
  {
    id: 'match_upcoming_3',
    teamA: TBD_TEAM_A,
    teamB: TBD_TEAM_B,
    status: 'Upcoming',
    venue: 'Khursheed Khan Volleyball Ground, Shangla',
    date: '2026-07-04',
    time: '18:00',
    score: {
      setsA: 0,
      setsB: 0,
      currentScore: [0, 0],
      setsHistory: []
    },
    server: 'B',
    liveActionLog: []
  }
];

export const INITIAL_NOTIFICATIONS: TournamentNotification[] = [
  {
    id: 'notif_1',
    title: 'Warm Welcome Fans!',
    message: 'Welcome to the All Pakistan Open Volleyball Tournament portal. The first match kicks off on July 2nd, 2026 at Khursheed Khan Ground!',
    timestamp: 'Just now',
    type: 'system',
    isRead: false
  },
  {
    id: 'notif_2',
    title: 'Host Club Registration Open',
    message: 'Participating clubs must pay PKR 5,000 Easypaisa fee and submit their registration receipt code online!',
    timestamp: '3 hours ago',
    type: 'schedule',
    isRead: false
  },
  {
    id: 'notif_3',
    title: 'Complimentary Beverage Policy',
    message: 'Fans who book Gold (Rs. 300) get complimentary cold drinks, and Premium (Rs. 200) gets mineral water. Reserve yours now!',
    timestamp: '5 hours ago',
    type: 'schedule',
    isRead: true
  }
];

export const INITIAL_FAN_FEED: FanPost[] = [
  {
    id: 'post_1',
    author: 'Shawaz Iqbal',
    avatar: 'bg-emerald-600 text-white',
    content: 'The countdown has officially begun! Extremely excited to host all district champions this July in Shangla. Let the games begin! 🏐✨',
    cheeringFor: 'Tournament Board',
    likes: 85,
    commentsCount: 2,
    time: '1 hour ago',
    userLiked: false,
    isAdminPost: true,
    comments: [
      { id: 'c1_1', author: 'Fawad Khan', content: 'Shangla is ready! Safe travels to all incoming players.', time: '40m ago' },
      { id: 'c1_2', author: 'Hamid Anjum', content: 'Top tier planning, looking forward to outstanding court actions.', time: '15m ago' }
    ]
  },
  {
    id: 'post_2',
    author: 'Raham Iqbal Khan',
    avatar: 'bg-yellow-600 font-extrabold text-slate-900',
    content: 'All safety layouts and seating systems are officially primed. Register your club early to align roster matchups correctly.',
    cheeringFor: 'Chief Organizers',
    likes: 49,
    commentsCount: 1,
    time: '3 hours ago',
    userLiked: true,
    isAdminPost: true,
    comments: [
      { id: 'c2_1', author: 'Bakht Zeb', content: 'Indeed. Registrations will close 24 hours prior to standard kickoff lines.', time: '1h ago' }
    ]
  }
];

export const HOURLY_TRAFFIC: TrafficMetric[] = [
  { hour: '14:00', visitors: 110, interactions: 280 },
  { hour: '15:00', visitors: 145, interactions: 410 },
  { hour: '16:00', visitors: 260, interactions: 690 },
  { hour: '17:00', visitors: 480, interactions: 1050 },
  { hour: '18:00', visitors: 910, interactions: 3100 },
  { hour: '19:00', visitors: 1400, interactions: 4800 },
  { hour: '20:00', visitors: 1850, interactions: 6150 },
];

export const STAND_DISTRIBUTION = [
  { label: 'Gold Stand (Rs. 300)', value: 10, color: '#f59e0b' },
  { label: 'Premium Stand (Rs. 200)', value: 25, color: '#10b981' },
  { label: 'General Stand (Rs. 100)', value: 50, color: '#3b82f6' }
];
