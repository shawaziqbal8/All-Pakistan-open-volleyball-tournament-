import React, { useState, useEffect } from 'react';
import { User, initAuth, googleSignIn, logoutUser } from './services/firebaseService';
import { Match, FanPost, TournamentNotification, TicketBooking, Team, Toast } from './types';
import { INITIAL_TEAMS, INITIAL_MATCHES, INITIAL_FAN_FEED, INITIAL_NOTIFICATIONS } from './data/tournamentData';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Component imports
import Navbar from './components/Navbar';
import LiveScores from './components/LiveScores';
import Schedules from './components/Schedules';
import Teams from './components/Teams';
import TicketBookingComponent from './components/TicketBooking';
import SocialFeed from './components/SocialFeed';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminPortal from './components/AdminPortal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('live');

  // Tournament Database State
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [posts, setPosts] = useState<FanPost[]>(INITIAL_FAN_FEED);
  const [notifications, setNotifications] = useState<TournamentNotification[]>(INITIAL_NOTIFICATIONS);
  const [bookings, setBookings] = useState<TicketBooking[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    import('./services/storeSync').then(({ initializeFirestoreWithDefaults, subscribeToCollection }) => {
      initializeFirestoreWithDefaults();

      const unsubTeams = subscribeToCollection<Team>('teams', setTeams);
      const unsubMatches = subscribeToCollection<Match>('matches', setMatches);
      const unsubPosts = subscribeToCollection<FanPost>('posts', setPosts);
      const unsubBookings = subscribeToCollection<TicketBooking>('bookings', setBookings, 'bookingTime', 'desc');

      return () => {
        unsubTeams();
        unsubMatches();
        unsubPosts();
        unsubBookings();
      };
    }).catch(err => console.warn('Sync init failed', err));
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback((message: string, type: 'info' | 'success' | 'error' | 'loading' = 'info', duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    return id;
  }, [dismissToast]);

  const updateToast = React.useCallback((id: string, message: string, type: 'info' | 'success' | 'error' | 'loading', duration = 4000) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, message, type, duration } : t))
    );

    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  // Init Auth states
  useEffect(() => {
    // Removed firebase auth observer
  }, []);

  // Add notification broadcaster
  const addNotification = React.useCallback((title: string, message: string, type: 'score' | 'schedule' | 'stat') => {
    const newNotif: TournamentNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      type,
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // Google sign in trigger
  // Removed Google authentication as requested

  // Shortcut routing to ticket purchasing
  const handleBookShortcut = React.useCallback((matchId: string) => {
    setActiveTab('tickets');
  }, []);

  // Dynamic analytic appends
  const handleAddBookingToMetrics = React.useCallback((newBooking: TicketBooking) => {
    setBookings((prev) => {
      // In Firestore sync mode, this local update is just optimistic.
      if (!prev.find(b => b.id === newBooking.id)) {
        return [newBooking, ...prev];
      }
      return prev;
    });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans transition-colors duration-200 text-slate-900">
      
      {/* Navigation Headers */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        setNotifications={setNotifications}
      />

      {/* Main core content viewport */}
      <main className="flex-1 bg-slate-50 pb-16">
        
        {activeTab === 'live' && (
          <LiveScores
            matches={matches}
            setMatches={setMatches}
            addNotification={addNotification}
            teams={teams}
            setTeams={setTeams}
          />
        )}

        {activeTab === 'schedule' && (
          <Schedules
            matches={matches}
            onBookShortcut={handleBookShortcut}
            teams={teams}
          />
        )}

        {activeTab === 'teams' && (
          <Teams
            teams={teams}
            matches={matches}
          />
        )}

        {activeTab === 'tickets' && (
          <TicketBookingComponent
            matches={matches}
            addNotification={addNotification}
            teams={teams}
            onAddBookingToMetrics={handleAddBookingToMetrics}
            showToast={showToast}
            updateToast={updateToast}
          />
        )}

        {activeTab === 'social' && (
          <SocialFeed
            posts={posts}
            setPosts={setPosts}
            teams={teams}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            bookings={bookings}
            teams={teams}
            matches={matches}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            teams={teams}
            setTeams={setTeams}
            matches={matches}
            setMatches={setMatches}
            addNotification={addNotification}
          />
        )}

      </main>

      {/* Elegant minimalist footer */}
      <footer className="bg-white border-t border-slate-200 text-center py-6 text-slate-500 text-[11px] font-mono select-none">
        <p>© 2026 All Pakistan Open Volleyball Tournament Board. All Rights Reserved.</p>
        <p className="mt-1 text-slate-400">Enterprise Operations Control System Connected • Portal Version 1.4.0 • Bento Grid Theme</p>
      </footer>

      {/* Dynamic Toast Notifications (Floating Overlay) */}
      <div className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.15 } }}
              className={`p-3.5 rounded-2xl border text-xs shadow-xl pointer-events-auto flex items-center gap-3 w-full backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500/30 text-white'
                  : toast.type === 'error'
                    ? 'bg-red-950/95 border-red-500/30 text-white'
                    : toast.type === 'loading'
                      ? 'bg-slate-900/95 border-slate-705 border-slate-700 text-white font-medium'
                      : 'bg-white/95 border-slate-200 text-slate-800'
              }`}
            >
              <div className="shrink-0">
                {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                {toast.type === 'loading' && <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />}
                {toast.type === 'info' && <Info className="h-5 w-5 text-sky-500" />}
              </div>
              <div className="flex-1 font-sans font-bold leading-relaxed pr-2">
                {toast.message}
              </div>
              {toast.type !== 'loading' && (
                <button
                  onClick={() => dismissToast(toast.id)}
                  className={`shrink-0 p-1 rounded-lg transition ${
                    toast.type === 'success' || toast.type === 'error'
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  aria-label="Dismiss toast notification"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
