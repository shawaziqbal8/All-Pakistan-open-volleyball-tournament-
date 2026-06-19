export interface Player {
  id: string;
  name: string;
  role: 'Setter' | 'Libero' | 'Outside Hitter' | 'Opposite' | 'Middle Blocker';
  number: number;
  height: string; // e.g. "194 cm"
  stats: {
    spikes: number;
    blocks: number;
    aces: number;
    digs: number;
    points: number;
    assists: number;
    servingAccuracy: number; // e.g. 88 representing 88% accuracy
  };
  age: number;
  homeTown: string;
  hand: 'Right-handed' | 'Left-handed' | 'Ambidextrous';
  experience: string;
  bio: string;
}

export interface Team {
  id: string;
  name: string;
  city: string;
  logo: string; // Tailwind color class or symbol
  color: string; // Tailwind hex or class name
  bgColor: string;
  players: Player[];
  stats: {
    played: number;
    won: number;
    lost: number;
    points: number;
  };
}

export interface PendingClubRegistration {
  id: string;
  clubName: string;
  city: string;
  captainName: string;
  contactPhone: string;
  logoEmoji: string;
  easypaisaTxnId: string;
  paymentAmount: number; // always 5000 PKR
  status: 'Pending' | 'Verified' | 'Rejected';
  submittedAt: string;
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  status: 'Upcoming' | 'Live' | 'Completed';
  venue: string;
  date: string;
  time: string;
  score: {
    setsA: number;
    setsB: number;
    currentScore: [number, number]; // [pointsA, pointsB]
    setsHistory: [number, number][]; // previous sets e.g. [[25, 21], [22, 25]]
  };
  server: 'A' | 'B';
  liveActionLog: {
    time: string;
    description: string;
  }[];
}

export interface Seat {
  id: string; // e.g. "G-12"
  category: 'Gold' | 'Premium' | 'General';
  row: string;
  col: number;
  status: 'Available' | 'Reserved' | 'Selected';
  price: number;
}

export interface TicketBooking {
  id: string;
  matchId: string;
  matchName: string;
  customerName: string;
  customerEmail: string;
  category: 'Gold' | 'Premium' | 'General';
  seats: string[];
  totalPrice: number;
  paymentStatus: 'Pending' | 'Success' | 'Verified' | 'Rejected';
  easypaisaTxnId?: string;
  bookingTime: string;
  sheetSynced?: boolean;
  paymentScreenshotBase64?: string;
}

export interface FanPost {
  id: string;
  author: string;
  avatar: string; // color or character
  content: string;
  image?: string; // base64 or custom illustration name
  cheeringFor?: string; // teamName
  likes: number;
  commentsCount: number;
  time: string;
  userLiked?: boolean;
  isAdminPost?: boolean;
  comments?: { id: string; author: string; content: string; time: string; isAdminComment?: boolean; }[];
}

export interface TournamentNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'score' | 'schedule' | 'stat' | 'system';
  isRead: boolean;
}

export interface TrafficMetric {
  hour: string;
  visitors: number;
  interactions: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'loading';
  duration?: number;
}
