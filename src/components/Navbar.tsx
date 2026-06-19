import React, { useState } from 'react';
import { User } from '../services/firebaseService';
import { Bell, Trophy, LogOut, ChevronDown } from 'lucide-react';
import { TournamentNotification } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: TournamentNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<TournamentNotification[]>>;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  notifications,
  setNotifications,
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const navItems = [
    { id: 'live', label: 'Live Arena', icon: '🏐' },
    { id: 'schedule', label: 'Matches', icon: '📅' },
    { id: 'teams', label: 'Rosters', icon: '👥' },
    { id: 'tickets', label: 'Ticket Booking', icon: '🎟️' },
    { id: 'social', label: 'Fan Feed', icon: '💬' },
    { id: 'analytics', label: 'Traffic Hub', icon: '📊' },
    { id: 'admin', label: 'Admin Portal', icon: '🔑' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-950 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Title Section */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('live')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-md">
              <Trophy className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase leading-none">
                ALL PAKISTAN <span className="text-emerald-400">VOLLEYBALL</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                Khursheed Khan Ground • Bisham
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs transition-all uppercase tracking-wider font-bold shadow-sm ${
                  activeTab === item.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* User Profile & Notification Center */}
          <div className="flex items-center space-x-3">
            
            {/* Notification Dropdown Container */}
            <div className="relative">
              <button
                id="notif_bell"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 sm:p-2 rounded-full text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none transition relative"
                aria-label="Toggle notifications"
              >
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-red-500 text-white font-bold text-[10px] leading-none px-1.5 py-0.5 rounded-full ring-2 ring-emerald-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 text-slate-800 overflow-hidden ring-1 ring-black/5 divide-y divide-slate-100">
                  <div className="p-3 bg-slate-50/90 flex justify-between items-center text-slate-700">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-slate-650">Tourney Broadcasts</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-emerald-700 font-bold hover:underline transition"
                      >
                        Mark read
                      </button>
                      <span className="text-slate-300 text-xs">|</span>
                      <button
                        onClick={clearNotifications}
                        className="text-[10px] text-slate-500 font-semibold hover:underline transition"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No active announcements or score notifications at this time.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3.5 text-xs transition-all flex space-x-2.5 ${
                            notif.isRead ? 'bg-slate-50/40 text-slate-500' : 'bg-white text-slate-800 font-medium'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0 text-sm">
                            {notif.type === 'score' && '🏐'}
                            {notif.type === 'schedule' && '📅'}
                            {notif.type === 'stat' && '📊'}
                            {notif.type === 'system' && '⚙️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold text-slate-900 text-[12px]">{notif.title}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{notif.timestamp}</span>
                            </div>
                            <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">{notif.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden flex items-center justify-around bg-emerald-950 border-t border-emerald-900 h-14 text-emerald-250">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition ${
              activeTab === item.id ? 'text-white bg-emerald-900 border-t-2 border-white font-extrabold' : 'text-emerald-300 hover:text-white'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="text-[9px] font-bold tracking-wider mt-0.5 truncate max-w-[55px] uppercase">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
