import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Award, Film, Image as ImageIcon, Trash2, Users, Upload, Link2, Calendar, Trophy, Eye, QrCode } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Team, Match, PendingClubRegistration, Player, TicketBooking } from '../types';
import { saveToFirebase, subscribeToCollection, deleteFromFirebase } from '../services/storeSync';

interface AdminPortalProps {
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  addNotification: (title: string, message: string, type: 'score' | 'schedule' | 'stat') => void;
}

export default function AdminPortal({
  teams,
  setTeams,
  matches,
  setMatches,
  addNotification
}: AdminPortalProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  // Registration review state
  const [pendingRegs, setPendingRegs] = useState<PendingClubRegistration[]>([]);
  
  // Media advertisement upload state
  const [adUrl, setAdUrl] = useState('');
  const [adType, setAdType] = useState<'image' | 'video'>('image');
  const [localAdName, setLocalAdName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState('');
  
  // Multiple ads support
  const [adsList, setAdsList] = useState<{id?: string, url: string, type: 'image' | 'video', name: string}[]>([]);

  // Local state for scheduling matches
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [teamASelected, setTeamASelected] = useState('');
  const [teamBSelected, setTeamBSelected] = useState('');

  // Ticket booking state
  const [ticketBookings, setTicketBookings] = useState<TicketBooking[]>([]);

  // Search state for tickets
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'All' | 'Pending' | 'Verified' | 'Rejected'>('All');
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Check login state
  useEffect(() => {
    const handleLoadData = () => {
      const isAlreadyLogged = localStorage.getItem('admin_logged') === 'true';
      if (isAlreadyLogged) {
        setIsAuthorized(true);
      }
    };
    handleLoadData();
  }, []);

  // Subscribe to Firebase Collections
  useEffect(() => {
    if (!isAuthorized) return;
    
    const unsubscribeRegistrations = subscribeToCollection<PendingClubRegistration>('registrations', (data) => {
      setPendingRegs(data);
    }, 'submittedAt', 'desc');

    const unsubscribeBookings = subscribeToCollection<TicketBooking>('bookings', (data) => {
      setTicketBookings(data);
    }, 'bookingTime', 'desc');
    
    const unsubscribeAds = subscribeToCollection<any>('ads', (data) => {
      setAdsList(data);
    });

    return () => {
      unsubscribeRegistrations();
      unsubscribeBookings();
      unsubscribeAds();
    };
  }, [isAuthorized]);

  // Sync registrations helper
  const syncRegistrations = (reg: PendingClubRegistration, newStatus: 'Pending' | 'Verified' | 'Rejected') => {
    const updatedReg = { ...reg, status: newStatus };
    saveToFirebase('registrations', updatedReg);
  };

  // Ticket Booking Sync Helper
  const handleVerifyTicket = (booking: TicketBooking) => {
    saveToFirebase('bookings', { ...booking, paymentStatus: 'Verified' });
  };

  const handleRejectTicket = (booking: TicketBooking) => {
    saveToFirebase('bookings', { ...booking, paymentStatus: 'Rejected' });
  };

  const handleDeleteTicket = async (booking: TicketBooking) => {
    if (window.confirm("Are you sure you want to permanently delete this fan ticket booking?")) {
      await deleteFromFirebase('bookings', booking.id);
      addNotification('Ticket Removed', `Fan ticket #${booking.id} has been successfully deleted.`, 'stat');
    }
  };

  const handleClearAllTickets = async () => {
    if (window.confirm("Are you sure you want to permanently clear all fan ticket bookings? This cannot be undone.")) {
      try {
        await Promise.all(ticketBookings.map(b => deleteFromFirebase('bookings', b.id)));
        addNotification('Tickets Cleared', 'All cloud fan ticket bookings have been successfully purged.', 'stat');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const code = detectedCodes[0].rawValue;
      setScanResult(code);
      setTicketSearchQuery(code);
      setIsScannerOpen(false);
      addNotification('QR Scanned', `Detected Booking ID: ${code}. Ticket loaded for review.`, 'score');
    }
  };

  // Secure validation pin is 55758 (invisible to spectators)
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '55758') {
      setIsAuthorized(true);
      setErrorText('');
      localStorage.setItem('admin_logged', 'true');
    } else {
      setErrorText('Access Denied. Incorrect verification pin.');
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPasswordInput('');
    localStorage.removeItem('admin_logged');
  };

  // Verify and approve registration
  const handleVerifyRegistration = (regId: string) => {
    const reg = pendingRegs.find(r => r.id === regId);
    if (!reg) return;

    // 1. Create a fully functional team
    // Inject standard-compliant players with stats so they display natively on Recharts graph
    const generatedPlayers: Player[] = [
      {
        id: `${reg.id}_cap`,
        name: reg.captainName,
        role: 'Outside Hitter',
        number: 10,
        height: '192 cm',
        age: 24,
        homeTown: reg.city,
        hand: 'Right-handed',
        experience: 'Captain',
        bio: `The dedicated captain and lead launcher of ${reg.clubName}.`,
        stats: { points: 125, spikes: 95, blocks: 20, aces: 10, digs: 40, assists: 15, servingAccuracy: 85 }
      },
      {
        id: `${reg.id}_p2`,
        name: 'Saad Ur Rehman',
        role: 'Setter',
        number: 4,
        height: '188 cm',
        age: 23,
        homeTown: reg.city,
        hand: 'Right-handed',
        experience: '2 Years Pro',
        bio: 'Skilled set controller with tactical eyes.',
        stats: { points: 41, spikes: 8, blocks: 15, aces: 18, digs: 45, assists: 185, servingAccuracy: 90 }
      },
      {
        id: `${reg.id}_p3`,
        name: 'Asad Iqbal',
        role: 'Opposite',
        number: 9,
        height: '195 cm',
        age: 25,
        homeTown: reg.city,
        hand: 'Left-handed',
        experience: '4 Years Pro',
        bio: 'Heavy baseline attacker with dangerous service.',
        stats: { points: 110, spikes: 88, blocks: 12, aces: 10, digs: 35, assists: 8, servingAccuracy: 80 }
      },
      {
        id: `${reg.id}_p4`,
        name: 'Arshad Ali',
        role: 'Middle Blocker',
        number: 7,
        height: '201 cm',
        age: 26,
        homeTown: reg.city,
        hand: 'Right-handed',
        experience: '3 Years Pro',
        bio: 'Defensive command at the net with long arms.',
        stats: { points: 89, spikes: 45, blocks: 38, aces: 6, digs: 18, assists: 5, servingAccuracy: 78 }
      },
      {
        id: `${reg.id}_p5`,
        name: 'Hamza Khan',
        role: 'Libero',
        number: 3,
        height: '180 cm',
        age: 22,
        homeTown: reg.city,
        hand: 'Right-handed',
        experience: '1 Year Pro',
        bio: 'Extremely fast floor-cover specialist.',
        stats: { points: 0, spikes: 0, blocks: 0, aces: 0, digs: 95, assists: 30, servingAccuracy: 0 }
      }
    ];

    const colors = ['#ea580c', '#2563eb', '#16a34a', '#db2777', '#7c3aed', '#d97706'];
    const selectedColor = colors[teams.length % colors.length];

    const newTeam: Team = {
      id: reg.id,
      name: reg.clubName,
      city: reg.city,
      logo: reg.logoEmoji || '🏐',
      color: selectedColor,
      bgColor: `bg-slate-50 text-slate-700 border-slate-200`,
      players: generatedPlayers,
      stats: { played: 0, won: 0, lost: 0, points: 0 }
    };

    // 2. Append new team via Firebase
    saveToFirebase('teams', newTeam);

    // 3. Mark registration verified
    syncRegistrations(reg, 'Verified');

    // 4. Send system alert
    addNotification(
      '🌟 New Club Authorized!',
      `${reg.clubName} representing ${reg.city} was officially approved and injected into tournament rosters after verified payment confirmation.`,
      'schedule'
    );
  };

  // Reject registration
  const handleRejectRegistration = (regId: string) => {
    const reg = pendingRegs.find(r => r.id === regId);
    if (!reg) return;
    syncRegistrations(reg, 'Rejected');
  };

  // Handle direct file uploads (Limit 10MB)
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaError('');
    setUploadProgress(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB in bytes)
    const MAX_SIZE = 10 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
      setMediaError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed limit is exactly 10MB.`);
      return;
    }

    const fileType = file.type.startsWith('video/') ? 'video' : 'image';
    setUploadProgress('Preparing upload stream...');

    const reader = new FileReader();
    reader.onloadstart = () => {
      setUploadProgress('Reading media blocks...');
    };
    reader.onload = () => {
      try {
        const base64Data = reader.result as string;
        
        const newAd = { id: `ad_${Date.now()}`, url: base64Data, type: fileType as 'image'|'video', name: file.name };
        saveToFirebase('ads', newAd);

        setUploadProgress(null);
        addNotification(
          '📢 Advertisement Uplink Active!',
          `Sponsor asset "${file.name}" was successfully uploaded and is now active across public feeds.`,
          'stat'
        );
      } catch (err: any) {
        setUploadProgress(null);
        // Fallback or quota error
        setMediaError('Base64 storage full. Because of browser local-storage quota limits, please paste any direct media web URL above as a robust alternative!');
      }
    };
    reader.onerror = () => {
      setUploadProgress(null);
      setMediaError('Failed to read selected file assets. Try another file.');
    };
    reader.readAsDataURL(file);
  };

  // Set remote URL link
  const handleSetRemoteUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adUrl) return;

    // Guess format based on end extension helper
    const isVideo = adUrl.match(/\.(mp4|webm|ogg|mov)/i) || adUrl.includes('youtube') || adUrl.includes('vimeo');
    const guessedType = isVideo ? 'video' : 'image';
    
    const newAd = { id: `ad_${Date.now()}`, url: adUrl, type: guessedType as 'image'|'video', name: 'Remote URL Address Link' };
    saveToFirebase('ads', newAd);

    setAdUrl('');

    addNotification(
      '📢 Web Ad Linked!',
      'Direct sponsor URL link parsed and broadcasted globally.',
      'stat'
    );
  };

  // Clear advertisement
  const handleClearAd = (ad: any) => {
    if (ad.id) {
       deleteFromFirebase('ads', ad.id);
    }
  };

  // Update Upcoming Match matchups
  const handleUpdateMatchFixture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !teamASelected || !teamBSelected) return;

    const clubA = teams.find(t => t.id === teamASelected);
    const clubB = teams.find(t => t.id === teamBSelected);

    if (!clubA || !clubB) return;

    const matchToUpdate = matches.find(m => m.id === selectedMatchId);
    if (!matchToUpdate) return;
    
    const updatedMatch = {
        ...matchToUpdate,
        teamA: clubA,
        teamB: clubB
    };

    saveToFirebase('matches', updatedMatch);

    addNotification(
      '📅 Fixture Team Lineup Confirmed!',
      `Scheduled match on July 2nd is now configured between ${clubA.name} vs ${clubB.name}!`,
      'schedule'
    );
    
    // reset selection
    setSelectedMatchId('');
  };

  // Authenticate Access Screen
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-slate-800" id="admin_auth_screen">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto text-emerald-800">
            <Shield className="h-7 w-7" />
          </div>
          
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Organizers Portal Authentication</h2>
            <p className="text-xs text-slate-450 text-slate-500 max-w-sm mx-auto leading-relaxed">
              Verify credentials to access live club registrations, confirm payment receipts, and configure sponsor billboard banners.
            </p>
          </div>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Security Entry PIN Code</label>
              <input
                type="password"
                required
                placeholder="•••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center tracking-widest font-mono text-lg focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-900"
              />
            </div>

            {errorText && (
              <p className="text-xs text-red-600 font-extrabold bg-red-50 border border-red-200 py-1.5 rounded-lg">
                ⚠️ {errorText}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition duration-150 cursor-pointer"
            >
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800" id="admin_portal_container">
      
      {/* Header and Logout Controls */}
      <div className="mb-8 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-250 border-emerald-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
            🔑 Official Administration Controller
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Organizers Command Center
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review live club sign-ups, generate authenticated rosters, and upload visual sponsorships.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-extrabold text-xs uppercase px-4 py-2 rounded-xl transition cursor-pointer self-start"
        >
          Logout Admin Panel
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side (2 cols) - Live Registrations Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-850 tracking-wider flex items-center space-x-2">
              <Users className="h-5 w-5 text-emerald-600 animate-pulse" />
              <span>Pending Club Sign-Ups Verification</span>
            </h3>
            
            <p className="text-xs text-slate-500">
              Cross-reference transaction IDs with the Easypaisa bank dashboard of <strong>Shawaz Iqbal (03416000758)</strong> before approving any player lists.
            </p>

            <div className="border border-slate-150 rounded-2xl overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] border-b border-slate-150 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Club details</th>
                    <th className="p-3">Captain / Mobile</th>
                    <th className="p-3">Easypaisa Ref</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingRegs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                        No club registration workflows submitted yet.
                      </td>
                    </tr>
                  ) : (
                    pendingRegs.map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <p className="font-extrabold text-slate-900 flex items-center gap-1.5 font-sans">
                            <span className="text-sm">{reg.logoEmoji}</span>
                            <span>{reg.clubName}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">{reg.city} • <span className="font-mono text-[9px]">{reg.submittedAt}</span></p>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{reg.captainName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{reg.contactPhone}</p>
                        </td>
                        <td className="p-3 font-mono">
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Rs. 5,000
                          </span>
                          <p className="mt-1 font-bold text-slate-705 text-slate-700 text-[10px] bg-slate-100 border border-slate-150 px-1 py-0.5 rounded inline-block">{reg.easypaisaTxnId}</p>
                        </td>
                        <td className="p-3 text-right">
                          {reg.status === 'Verified' ? (
                            <span className="inline-flex py-1 px-2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold uppercase tracking-wide">
                              ✅ Active Roster Live
                            </span>
                          ) : reg.status === 'Rejected' ? (
                            <span className="inline-flex py-1 px-2 rounded bg-red-100 text-red-800 border border-red-200 text-[9px] font-extrabold uppercase tracking-wide">
                              Rejected
                            </span>
                          ) : (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleVerifyRegistration(reg.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition uppercase flex items-center gap-1 cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectRegistration(reg.id)}
                                className="bg-slate-100 hover:bg-red-50 hover:text-red-650 text-slate-600 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition uppercase border border-slate-205 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fan Ticket Bookings Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-extrabold text-sm uppercase text-slate-850 tracking-wider flex items-center space-x-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <span>Recent Fan Ticket Bookings</span>
              </h3>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setIsScannerOpen(!isScannerOpen)}
                  className={`border text-[10px] font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${isScannerOpen ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>{isScannerOpen ? 'Close Scanner' : 'Scan Ticket QR'}</span>
                </button>
                <button
                  onClick={handleClearAllTickets}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                  title="Wipe all local ticket data"
                >
                  Clear All Bookings
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <p className="text-xs text-slate-500">
                Real-time feed of fan bookings confirming seats, seating zones, and total prices paid.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search ticket by name or ID..."
                    value={ticketSearchQuery}
                    onChange={e => setTicketSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none w-full sm:w-64"
                  />
                  {ticketSearchQuery && (
                     <button onClick={() => setTicketSearchQuery('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                       <XCircle className="h-4 w-4" />
                     </button>
                  )}
                </div>
              </div>
            </div>

            {isScannerOpen && (
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 overflow-hidden shadow-inner flex flex-col items-center">
                <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Camera Active: Point at Ticket QR Code</span>
                </p>
                <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative bg-black aspect-video flex items-center flex-col">
                  {/* Provide explicit sizing for the scanner to avoid layout bust */}
                  <Scanner 
                    onScan={handleScan}
                    components={{ audio: false }}
                    styles={{ container: { width: '100%', height: '100%' } }}
                  />
                  <div className="absolute inset-0 border-2 border-emerald-400/30 border-dashed rounded-xl pointer-events-none"></div>
                </div>
                <button
                  onClick={() => setIsScannerOpen(false)}
                  className="mt-4 text-[10px] text-slate-400 font-medium hover:text-white transition uppercase tracking-widest"
                >
                  Cancel Scanning
                </button>
              </div>
            )}

            <div className="border border-slate-150 rounded-2xl overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] border-b border-slate-150 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Booking details</th>
                    <th className="p-3">Match</th>
                    <th className="p-3">Seating</th>
                    <th className="p-3 text-right">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ticketBookings.filter(t => {
                    const searchMatch = t.id?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || 
                                        t.customerName?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || 
                                        t.easypaisaTxnId?.toLowerCase().includes(ticketSearchQuery.toLowerCase());
                    const statusMatch = ticketStatusFilter === 'All' || t.paymentStatus === ticketStatusFilter;
                    return searchMatch && statusMatch;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                        No ticket bookings found matching search.
                      </td>
                    </tr>
                  ) : (
                    ticketBookings.filter(t => {
                      const searchMatch = t.id?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || 
                                          t.customerName?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || 
                                          t.easypaisaTxnId?.toLowerCase().includes(ticketSearchQuery.toLowerCase());
                      const statusMatch = ticketStatusFilter === 'All' || t.paymentStatus === ticketStatusFilter;
                      return searchMatch && statusMatch;
                    }).map((ticket, index) => (
                      <tr key={ticket.id || index} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <p className="font-extrabold text-slate-900 flex items-center gap-1.5 font-sans">
                            <span className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">#{ticket.id}</span>
                            <span>{ticket.customerName}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{ticket.customerEmail}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(ticket.bookingTime).toLocaleString()}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-800 text-[10px]">{ticket.matchName}</p>
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded">
                            {ticket.category}
                          </span>
                          <p className="text-[10px] font-semibold text-slate-500 mt-1">
                            {ticket.seats.length} {ticket.seats.length == 1 ? 'Seat' : 'Seats'}
                          </p>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-mono font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {ticket.totalPrice} PKR
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">TID: {ticket.easypaisaTxnId}</span>
                            {ticket.paymentScreenshotBase64 && (
                              <button
                                onClick={() => setSelectedScreenshotUrl(ticket.paymentScreenshotBase64!)}
                                className="text-[9px] text-blue-600 hover:text-blue-800 underline font-bold mt-0.5 cursor-pointer"
                              >
                                View Payment Proof
                              </button>
                            )}
                            
                            {ticket.paymentStatus === 'Verified' ? (
                              <div className="flex gap-1 mt-1 justify-end items-center">
                                <span className="inline-flex py-0.5 px-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold uppercase tracking-wide">
                                  Verified
                                </span>
                                <button
                                  onClick={() => handleDeleteTicket(ticket)}
                                  className="text-red-500 hover:bg-red-50 rounded px-1.5 py-0.5 transition font-bold text-[9px]"
                                >
                                  Del
                                </button>
                              </div>
                            ) : ticket.paymentStatus === 'Rejected' ? (
                              <div className="flex gap-1 mt-1 justify-end items-center">
                                <span className="inline-flex py-0.5 px-1.5 rounded bg-red-100 text-red-800 border border-red-200 text-[9px] font-extrabold uppercase tracking-wide">
                                  Rejected
                                </span>
                                <button
                                  onClick={() => handleDeleteTicket(ticket)}
                                  className="text-red-500 hover:bg-red-50 rounded px-1.5 py-0.5 transition font-bold text-[9px]"
                                >
                                  Del
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-1 mt-1 justify-end items-center">
                                <span className="inline-flex py-0.5 px-1.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-extrabold uppercase tracking-wide">
                                  Pending
                                </span>
                                <button
                                  onClick={() => handleVerifyTicket(ticket)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-1.5 py-1 rounded transition uppercase cursor-pointer"
                                  title="Verify Payment"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => handleRejectTicket(ticket)}
                                  className="bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-700 font-bold text-[9px] px-1.5 py-1 rounded transition uppercase cursor-pointer"
                                  title="Reject Payment"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleDeleteTicket(ticket)}
                                  className="text-red-500 hover:bg-red-50 rounded px-1.5 py-0.5 transition font-bold text-[9px]"
                                >
                                  Del
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team and Members Management Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-850 tracking-wider flex items-center space-x-2">
              <Users className="h-5 w-5 text-emerald-600 focus:outline-none" />
              <span>Full Team & Roster Access Control</span>
            </h3>
            
            <p className="text-xs text-slate-500">
              Admin controls to securely remove entire clubs or delete specific users inside the verified rosters.
            </p>

            <div className="space-y-4">
              {teams.length === 0 ? (
                 <p className="text-slate-400 text-xs italic">No registered teams yet.</p>
              ) : (
                teams.map(team => (
                  <div key={team.id} className="border border-slate-150 rounded-2xl p-4 bg-slate-50 relative">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{team.logo}</span>
                        <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase">{team.name}</h4>
                        <button
                          onClick={() => {
                            const newName = window.prompt("Enter new team name:", team.name);
                            if (newName && newName.trim() !== "") {
                              const updatedTeam = { ...team, name: newName.trim() };
                              saveToFirebase('teams', updatedTeam);
                              addNotification('Team Updated', `Team name changed to ${newName.trim()}.`, 'stat');
                            }
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 font-extrabold text-[9px] rounded border border-slate-200 uppercase"
                        >
                          Edit
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to permanently delete team: ${team.name}?`)) {
                            deleteFromFirebase('teams', team.id);
                            addNotification('Team Removed', `${team.name} has been deleted from active tournament rosters.`, 'stat');
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-650 px-3 py-1 font-extrabold text-[10px] rounded border border-red-200 uppercase"
                      >
                        Delete Team
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-200 pb-1">Verified Roster ({team.players.length})</p>
                      {team.players.length === 0 ? (
                        <p className="text-slate-400 text-xs italic">No players in this team.</p>
                      ) : (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                          {team.players.map(player => (
                            <li key={player.id} className="flex justify-between items-center bg-white border border-slate-200 rounded px-3 py-1.5 shadow-sm">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">#{player.number} {player.name}</span>
                                <span className="text-slate-400">({player.role})</span>
                                <button
                                  onClick={() => {
                                    const newName = window.prompt("Enter new player name:", player.name);
                                    if (newName && newName.trim() !== "") {
                                      const updatedTeam = { 
                                          ...team, 
                                          players: team.players.map(p => p.id === player.id ? { ...p, name: newName.trim() } : p) 
                                      };
                                      saveToFirebase('teams', updatedTeam);
                                    }
                                  }}
                                  className="text-[9px] text-slate-400 hover:text-emerald-600 transition"
                                >
                                  ✎
                                </button>
                              </div>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to remove player: ${player.name} from ${team.name}?`)) {
                                      const updatedTeam = { 
                                          ...team, 
                                          players: team.players.filter(p => p.id !== player.id) 
                                      };
                                      saveToFirebase('teams', updatedTeam);
                                      addNotification('Player Removed', `${player.name} has been expelled from ${team.name}'s roster.`, 'stat');
                                  }
                                }}
                                className="text-red-500 hover:bg-red-50 rounded px-1.5 py-0.5 ml-2 transition font-bold"
                              >
                                Revoke
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Match Schedule Lineup Configuration Panel */}
          {teams.length >= 2 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm uppercase text-slate-850 tracking-wider flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <span>Pair Approved Clubs to Match Slots</span>
              </h3>
              
              <p className="text-xs text-slate-500">
                Align newly registered and verified volleyball clubs into the upcoming scheduled matches starting July 2nd, 2026.
              </p>

              <form onSubmit={handleUpdateMatchFixture} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400">1. Select Match</label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-slate-800"
                  >
                    <option value="">-- Choose Slot --</option>
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.date} - Slot {m.time} ({m.venue.split(',')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400">2. Team A</label>
                  <select
                    value={teamASelected}
                    onChange={(e) => setTeamASelected(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-slate-800"
                  >
                    <option value="">-- Choose Club A --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.logo} {t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400">3. Team B</label>
                  <select
                    value={teamBSelected}
                    onChange={(e) => setTeamBSelected(e.target.value)}
                    required
                    disabled={!teamASelected}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-slate-800 disabled:opacity-50"
                  >
                    <option value="">-- Choose Club B --</option>
                    {teams.filter(t => t.id !== teamASelected).map(t => (
                      <option key={t.id} value={t.id}>{t.logo} {t.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wide transition shadow-xs cursor-pointer h-[40px] flex items-center justify-center gap-1.5"
                >
                  Confirm Lineup
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side (1 col) - Advertisement Management (Limit 10MB) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs uppercase text-slate-850 tracking-wider flex items-center space-x-2">
              <Film className="h-4.5 w-4.5 text-emerald-600" />
              <span>Sponsorship Billboard (Max 10MB)</span>
            </h3>

            <p className="text-[11px] text-slate-500 leading-normal">
              Feature tournament sponsors by uploading promotional pictures or videos dynamically. Media size is checked to not exceed **10MB**.
            </p>

            {/* Direct file upload zone */}
            <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition relative">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Select sponsor file under 10MB"
              />
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-750">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-xs">
                  <p className="font-extrabold text-slate-800">Drag & Drop Sponsor File</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">MP4, WEBM, PNG or JPG max 10MB</p>
                </div>
              </div>
            </div>

            {uploadProgress && (
              <p className="text-[11px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-pulse">
                ⏳ {uploadProgress}
              </p>
            )}

            {mediaError && (
              <p className="text-[11px] text-amber-750 bg-amber-50 border border-amber-200 p-2.5 rounded-xl leading-normal font-semibold">
                ⚠️ {mediaError}
              </p>
            )}

            {/* Web Image/Video URL input fallback */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Alternative: Paste Direct Web URL</p>
              <form onSubmit={handleSetRemoteUrl} className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/sponsor-banner.jpg"
                  value={adUrl.startsWith('data:') ? '' : adUrl}
                  onChange={(e) => setAdUrl(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 font-mono"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold uppercase transition"
                >
                  Link
                </button>
              </form>
            </div>

            {/* Live Preview block if active */}
            {adsList.length > 0 && (
              <div className="space-y-4">
                {adsList.map((ad, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-3 pt-3">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Billboard Preview {idx + 1}</span>
                      <button onClick={() => handleClearAd(ad)} className="text-red-500 hover:underline flex items-center gap-0.5 cursor-pointer">
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>

                    <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                      {ad.type === 'video' ? (
                        <video
                          key={ad.url}
                          controls
                          autoPlay
                          muted
                          loop
                          className="w-full h-full object-cover"
                        >
                          <source src={ad.url} />
                          Sponsor video format not supported.
                        </video>
                      ) : (
                        <img
                          src={ad.url}
                          alt="Active Tournament Banner ad"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <p className="text-[10px] font-mono text-slate-400 text-center truncate">
                      {ad.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {selectedScreenshotUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-3xl w-full flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase">Payment Proof Verification</h3>
              <button
                onClick={() => setSelectedScreenshotUrl(null)}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 bg-slate-100 hover:bg-slate-200 rounded-full"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-4 flex items-center justify-center">
              {selectedScreenshotUrl.startsWith('data:image') || selectedScreenshotUrl.startsWith('http') ? (
                <img src={selectedScreenshotUrl} alt="Payment Proof uploaded by fan" className="max-w-full rounded-xl shadow-md border border-slate-300" />
              ) : (
                <p className="text-slate-500 font-medium">Invalid or missing payment screenshot image data.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
