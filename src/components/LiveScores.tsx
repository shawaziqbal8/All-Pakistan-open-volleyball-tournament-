import React, { useState, useEffect, useRef } from 'react';
import { Match, Team, PendingClubRegistration } from '../types';
import { saveToFirebase, subscribeToCollection } from '../services/storeSync';
import { ChevronRight, Trophy, MapPin, Phone, Users, Calendar, Award, Clock, Flame, ShieldAlert, ArrowRight, Video, Sparkles, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface LiveScoresProps {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  addNotification: (title: string, message: string, type: 'score' | 'schedule' | 'stat') => void;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
}

export default function LiveScores({
  matches,
  setMatches,
  addNotification,
  teams,
  setTeams
}: LiveScoresProps) {
  // States for Club Registration
  const [pendingRegs, setPendingRegs] = useState<PendingClubRegistration[]>([]);
  const [regClubName, setRegClubName] = useState('');
  const [regClubCity, setRegClubCity] = useState('');
  const [regClubLogo, setRegClubLogo] = useState('🔥');
  const [regCaptainName, setRegCaptainName] = useState('');
  const [regContactPhone, setRegContactPhone] = useState('');
  const [regTxnId, setRegTxnId] = useState('');
  
  const [regSuccess, setRegSuccess] = useState(false);
  const [submittedRegDetails, setSubmittedRegDetails] = useState<PendingClubRegistration | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Status Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<PendingClubRegistration | null>(null);
  const [searchExecuted, setSearchExecuted] = useState(false);

  // Live countdown states
  const [days, setDays] = useState('00');
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  const [isTournamentLive, setIsTournamentLive] = useState(false);

  // Sponsor Ad States
  const [adsList, setAdsList] = useState<{id?: string, url: string, type: 'image'|'video', name: string}[]>([]);

  // Synchronize and load registrations and ads on mount
  useEffect(() => {
    // Subscribe to Firebase Collections
    const unsubscribeRegistrations = subscribeToCollection<PendingClubRegistration>('registrations', (data) => {
      setPendingRegs(data);
    }, 'submittedAt', 'desc');
    
    const unsubscribeAds = subscribeToCollection<any>('ads', (data) => {
      setAdsList(data);
    });
    
    return () => {
      unsubscribeRegistrations();
      unsubscribeAds();
    };
  }, []);

  // Countdown timer thread
  useEffect(() => {
    // 1st Match is exactly July 2, 2026 @ 18:30 (PKT)
    const targetTime = new Date('2026-07-02T18:30:00').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        clearInterval(timer);
        setIsTournamentLive(true);
        setDays('00');
        setHours('00');
        setMinutes('00');
        setSeconds('00');
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        setDays(d < 10 ? `0${d}` : `${d}`);
        setHours(h < 10 ? `0${h}` : `${h}`);
        setMinutes(m < 10 ? `0${m}` : `${m}`);
        setSeconds(s < 10 ? `0${s}` : `${s}`);
        setIsTournamentLive(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Submit Club Registration mapping
  const handleRegisterClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regClubName.trim() || !regClubCity.trim() || !regCaptainName.trim() || !regContactPhone.trim() || !regTxnId.trim()) {
      alert('Please fill out all fields and enter your Easypaisa Transaction ID.');
      return;
    }

    const newReg: PendingClubRegistration = {
      id: `reg_${Date.now()}`,
      clubName: regClubName.trim(),
      city: regClubCity.trim(),
      captainName: regCaptainName.trim(),
      contactPhone: regContactPhone.trim(),
      logoEmoji: regClubLogo,
      easypaisaTxnId: regTxnId.trim(),
      paymentAmount: 5000,
      status: 'Pending',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    try {
      await saveToFirebase('registrations', newReg);
    } catch (err) {
      console.warn('Failed to sync registration to Firebase:', err);
    }

    setSubmittedRegDetails(newReg);
    setRegSuccess(true);

    addNotification(
      'Registration Submitted! ⏳',
      `Registration for "${regClubName}" has been submitted with Txn ID ${regTxnId}. Awaiting review by organizers.`,
      'schedule'
    );

    // clear fields
    setRegClubName('');
    setRegClubCity('');
    setRegCaptainName('');
    setRegContactPhone('');
    setRegTxnId('');
  };

  // Status lookup handler
  const handleSearchStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const queryLower = searchQuery.toLowerCase().trim();
    const found = pendingRegs.find(
      reg => reg.clubName.toLowerCase().includes(queryLower) || 
             reg.captainName.toLowerCase().includes(queryLower) || 
             reg.easypaisaTxnId.toLowerCase() === queryLower
    );
    
    setSearchResult(found || null);
    setSearchExecuted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800" id="live_scores_container">
      
      {/* Page Title Header */}
      <div className="mb-8 pb-4 border-b border-slate-200">
        <span className="bg-emerald-100 text-emerald-850 border border-emerald-202 text-xs px-3 py-1 rounded-full font-bold inline-flex items-center space-x-1.5 uppercase tracking-wide">
          <Clock className="h-3.5 w-3.5 text-emerald-700 animate-spin" />
          <span>Tournament Entry Live Desk</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          Volleyball Match Center & Portal Hub
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Monitor tournament starting clocks, dynamic team rosters lists, or apply for club entries.
        </p>
      </div>

      {/* 🏆 ALL PAKISTAN OPEN TOURNAMENT OFFICIAL BULLETIN HEADER */}
      <div className="mb-8 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800 shadow-xl overflow-hidden relative" id="official-tournament-flyer">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 -mb-10 w-44 h-44 bg-yellow-500/5 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10 w-full">
          
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center space-x-1.5 bg-yellow-405 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] sm:text-xs px-3 py-1 rounded-full font-extrabold uppercase tracking-widest leading-none">
              <Sparkles className="h-3 w-3 text-yellow-300 animate-bounce" />
              <span>SPONSORED BY FGC (FAWAD GROUP OF COMPANIES)</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none uppercase">
              🏆 ALL PAKISTAN OPEN <span className="text-emerald-400">VOLLEYBALL</span> TOURNAMENT 🏆
            </h1>

            <p className="text-sm text-emerald-200 font-medium max-w-xl">
              Registration is active. Submit your team, copy the verified Easypaisa code, and book spectator seats court-side!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm">
              <div className="flex items-start space-x-2.5">
                <MapPin className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Tournament Venue</span>
                  <span className="font-bold text-white">Khursheed Khan Volleyball Ground, Taja Maira, Bisham, Shangla</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Calendar className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Starting Date</span>
                  <span className="font-bold text-white text-base text-yellow-400">July 2nd, 2026</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Award className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Chief Organizers</span>
                  <span className="font-bold text-white">Raham Iqbal Khan, Hamid Anjum & Bakht Zeb</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Phone className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Official Hotline</span>
                  <a href="tel:03060888584" className="font-mono font-extrabold text-white text-base hover:text-emerald-305 hover:text-emerald-300 transition flex items-center space-x-1">
                    <span>0306-0888584</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons for Registering and Status Checker */}
          <div className="shrink-0 w-full lg:w-auto self-stretch lg:self-center flex flex-col gap-3 justify-center items-stretch font-sans min-w-[240px]">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setRegSuccess(false);
                setSubmittedRegDetails(null);
              }}
              className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition duration-200 flex items-center justify-center space-x-2 cursor-pointer w-full"
            >
              <span>🏐 REGISTER YOUR CLUB</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${isRegistering ? 'rotate-90' : ''}`} />
            </button>

            <a
              href="#status-checker"
              className="px-5 py-3 bg-slate-900 border border-emerald-700/50 text-center hover:bg-slate-850 text-white font-extrabold text-[11px] tracking-wider uppercase rounded-2xl transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              Check Status
            </a>
          </div>

        </div>

      </div>

      {/* Grid: Countdown Timer Bento + Advertisement Billboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8" id="matchday-clock-spot">
        
        {/* Countdown clock (2/3 col) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden h-full min-h-[300px]">
          {/* Decorative court net background */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>
          
          <div className="relative z-10">
            <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block mb-3 animate-pulse">
              ⏱️ Matchday countdown clock
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
              1st Match of the Tournament
            </h3>
            <p className="text-xs text-slate-450 text-slate-500 mt-1.5 font-medium leading-relaxed">
              Spectator seat passes and live team fixtures will synchronize as we tick-down to the Grand Kickoff at court-side ground in Shangla.
            </p>
          </div>

          {/* Large Countdown numbers */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 my-6 select-none relative z-10 w-full max-w-xl self-center">
            
            {/* Days block */}
            <div className="bg-slate-950 text-white border-2 border-emerald-900/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-center flex flex-col items-center justify-center aspect-square shadow-sm">
              <span className="text-xl sm:text-4xl font-black font-mono block tracking-tight text-emerald-400">{days}</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mt-1">Days</span>
            </div>

            {/* Hours block */}
            <div className="bg-slate-950 text-white border-2 border-emerald-900/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-center flex flex-col items-center justify-center aspect-square shadow-sm">
              <span className="text-xl sm:text-4xl font-black font-mono block tracking-tight text-emerald-400">{hours}</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mt-1">Hours</span>
            </div>

            {/* Minutes block */}
            <div className="bg-slate-950 text-white border-2 border-emerald-900/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-center flex flex-col items-center justify-center aspect-square shadow-sm">
              <span className="text-xl sm:text-4xl font-black font-mono block tracking-tight text-emerald-400">{minutes}</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mt-1">Mins</span>
            </div>

            {/* Seconds block */}
            <div className="bg-slate-950 text-white border-2 border-emerald-900/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-center flex flex-col items-center justify-center aspect-square shadow-sm">
              <span className="text-xl sm:text-4xl font-black font-mono block tracking-tight text-yellow-400">{seconds}</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mt-1">Secs</span>
            </div>

          </div>

          <p className="text-[10px] font-mono text-slate-450 text-center font-bold relative z-10 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-150 border-slate-200 self-center">
            📅 KICKOFF INSTANT: <span className="text-emerald-700">JULY 2ND, 2026 AT 18:30 PKT (Local Time)</span>
          </p>

        </div>

        {/* Sponsor Advertisement Billboard portion (1/3 col) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[300px]">
          <div>
            <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block mb-3">
              📢 Sponsor Spotlight
            </span>
            <h4 className="font-extrabold text-sm text-slate-850 uppercase tracking-wider leading-none">
              Official Media Space
            </h4>
          </div>

          {/* Advertisement View Container */}
          <div className="my-4 flex-1 flex flex-col gap-4 bg-black h-[200.68px]">
            {adsList.length > 0 ? (
              adsList.map((ad, idx) => (
                <div key={idx} className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative aspect-video shadow-sm">
                  {ad.type === 'video' ? (
                    <video
                      src={ad.url}
                      controls
                      autoPlay
                      muted
                      loop
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <img
                      src={ad.url}
                      alt="Official Sponsor Billboard"
                      className="w-full h-full object-cover select-none"
                    />
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">
                    AD
                  </div>
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-mono truncate max-w-[150px]">
                    {ad.name}
                  </div>
                </div>
              ))
            ) : (
              /* Fallback Advertisement placeholder graphic */
              <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative min-h-[140px] flex items-center justify-center p-4 text-center space-y-2">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-extrabold text-[11px] text-white tracking-tight">Your Custom Advertisement Here</p>
                  <p className="text-[9px] text-slate-400 max-w-[180px] mx-auto mt-1 leading-normal">
                    Target over 10,000 sports spectators. Contact organization panel at <strong>0306-0888584</strong> to upload banner!
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 🔴 LIVE SCOREBOARD SECTION */}
      <div className="mb-8 border border-slate-200 bg-white rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden relative">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-widest mb-4 flex items-center space-x-2">
          <Activity className="h-4.5 w-4.5 text-red-500 animate-pulse" />
          <span>Real-time Match Scores</span>
        </h3>
        {matches.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded-2xl text-center border border-dashed border-slate-200">
            <span className="text-2xl text-slate-400">📅</span>
            <p className="mt-2 text-xs font-bold text-slate-600">No scheduled matches yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.filter(m => m.status === 'Live').length === 0 && matches.some(m => m.status === 'Completed') && (
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Recent Results</p>
            )}
            {matches.map(match => (
              <motion.div 
                key={`${match.id}-${match.score.setsA}-${match.score.setsB}`}
                initial={{ backgroundColor: "rgba(16, 185, 129, 0.4)" }}
                animate={{ backgroundColor: "rgba(248, 250, 252, 1)" }} // Back to slate-50 colors
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="border border-slate-150 p-4 rounded-2xl flex items-center justify-between hover:border-emerald-300 transition duration-150"
              >
                <div className="flex items-center gap-3 w-[30%]">
                  <div className="h-10 w-10 min-w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm">
                    {match.teamA.logo}
                  </div>
                  <span className="font-extrabold text-xs text-slate-800 line-clamp-2 leading-tight">
                    {match.teamA.name}
                  </span>
                </div>
                
                <div className="flex flex-col items-center justify-center gap-1 w-[40%]">
                  <div className="flex items-center space-x-3 font-mono text-2xl font-black bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200/50">
                    <span className="text-emerald-700">{match.score.setsA}</span>
                    <span className="text-slate-300 text-sm align-top">-</span>
                    <span className="text-emerald-700">{match.score.setsB}</span>
                  </div>
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    match.status === 'Live' ? 'bg-red-100 text-red-600 animate-pulse' : 
                    match.status === 'Completed' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {match.status} {match.status === 'Live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 ml-1"></span>}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 w-[30%] text-right">
                  <span className="font-extrabold text-xs text-slate-800 line-clamp-2 leading-tight">
                    {match.teamB.name}
                  </span>
                  <div className="h-10 w-10 min-w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm">
                    {match.teamB.logo}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Accordion Club Registration Entry Form */}
      {isRegistering && (
        <div className="mb-8 border border-slate-200 bg-white rounded-3xl p-5 sm:p-6 shadow-sm animate-fade-in font-sans relative">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-widest mb-4 flex items-center space-x-2">
            <Users className="h-4.5 w-4.5 text-emerald-600" />
            <span>Official Tournament Club Registration Panel</span>
          </h3>

          {regSuccess && submittedRegDetails ? (
            <div className="bg-slate-50 border border-emerald-500 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-4 animate-fade-in text-slate-800">
              <div className="text-center space-y-1">
                <span className="text-3xl">📝</span>
                <p className="text-emerald-700 font-black text-base uppercase tracking-wider">Registration Code Generated!</p>
                <p className="text-xs text-slate-500">Wait for verified approval from Raham Iqbal Khan & organizers board.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 font-mono text-xs text-left divide-y divide-slate-100 space-y-2">
                <div className="flex justify-between pb-2 text-[10px] text-slate-400 uppercase font-extrabold">
                  <span>Reference ID:</span>
                  <span className="text-slate-900 font-bold">{submittedRegDetails.id}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Club Name:</span>
                  <span className="text-slate-900 font-extrabold">{submittedRegDetails.logoEmoji} {submittedRegDetails.clubName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>City Representing:</span>
                  <span className="text-slate-950 font-bold">{submittedRegDetails.city}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Captain Name:</span>
                  <span className="text-slate-950 font-bold">{submittedRegDetails.captainName} ({submittedRegDetails.contactPhone})</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Fee Level Amount:</span>
                  <span className="text-emerald-700 font-extrabold">PKR 5,000 (Easypaisa)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Payment Txn ID:</span>
                  <span className="text-slate-950 font-bold bg-slate-100 px-1 rounded block truncate font-mono">{submittedRegDetails.easypaisaTxnId}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span>System Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded font-black bg-yellow-105 bg-yellow-50 text-yellow-800 text-[9px] uppercase font-sans animate-pulse">
                    ⏳ Awaiting Verified Code Review
                  </span>
                </div>
              </div>

              <div className="text-center pt-2 space-y-2">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  ⚠️ Organizers will audit your submitted transaction ID against the official statement records of Easypaisa account title <strong>Shawaz Iqbal (03416000758)</strong>. Duplicate references will instantly invalidate the team portfolio entry.
                </p>
                <button 
                  onClick={() => {
                    setRegSuccess(false);
                    setSubmittedRegDetails(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition uppercase cursor-pointer"
                >
                  Submit Another Club
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Payment Instructions Board */}
              <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
                <div className="flex items-center space-x-2 text-slate-900 font-black tracking-wider uppercase text-[11px] border-b border-slate-200 pb-2">
                  <Trophy className="h-4.5 w-4.5 text-yellow-500 shrink-0" />
                  <span>Secure Payment Guide</span>
                </div>
                
                <p className="text-slate-500 leading-relaxed font-semibold">
                  Participating clubs are required to register and pay a mandatory PKR 5,000 sports fee via Easypaisa below:
                </p>

                <div className="p-3.5 bg-slate-950 text-white rounded-xl space-y-2">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Easypaisa Title</span>
                    <span className="text-white font-extrabold text-sm uppercase">Shawaz Iqbal</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Easypaisa Number</span>
                    <span className="text-yellow-400 font-extrabold text-sm font-mono tracking-widest">0341-6000758</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Fee Level</span>
                    <span className="text-emerald-400 font-extrabold">PKR 5,000</span>
                  </div>
                </div>

                <div className="space-y-1.5 block text-slate-500 leading-relaxed font-medium">
                  <p className="font-extrabold text-slate-800">Quick Guide Checklist:</p>
                  <p>1. Send exactly Rs. 5,000 on Easypaisa address <strong>0341-6000758</strong>.</p>
                  <p>2. Copy the receipt Transaction Confirmation Code (Txn ID).</p>
                  <p>3. Submit the form on the right. Once verified by admin, your official team roster goes live automatically!</p>
                </div>
              </div>

              {/* Registration Form Inputs */}
              <form onSubmit={handleRegisterClub} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-205 text-xs text-slate-800">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-555 font-black uppercase">Club / Team Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shangla Spiker Kings"
                    value={regClubName}
                    onChange={(e) => setRegClubName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-555 font-black uppercase">Home District / City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bisham, Shangla"
                    value={regClubCity}
                    onChange={(e) => setRegClubCity(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-555 font-black uppercase">Captain or Manager Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fawad Ali Khan"
                    value={regCaptainName}
                    onChange={(e) => setRegCaptainName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-555 font-black uppercase">Captain Mobile Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0341-6000000"
                    value={regContactPhone}
                    onChange={(e) => setRegContactPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[10px] text-slate-900 font-black uppercase text-emerald-800">Easypaisa Transaction ID (Txn ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 11 or 12-digit transaction ID..."
                    value={regTxnId}
                    onChange={(e) => setRegTxnId(e.target.value)}
                    className="w-full bg-white border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-600 text-slate-900 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[10px] text-slate-900 font-black uppercase text-emerald-800">Upload Payment Slip / Screenshot</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Please also <strong className="text-emerald-600">Send this payment screenshot on WhatsApp to 03416000758</strong>.
                  </p>
                </div>

                <div className="space-y-1.5 md:col-span-2 flex items-end">
                  <div className="flex gap-2 w-full">
                    <div className="w-1/3 space-y-1">
                      <label className="block text-[9px] text-slate-400 uppercase font-bold truncate">Logo Style</label>
                      <select
                        value={regClubLogo}
                        onChange={(e) => setRegClubLogo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-emerald-600 text-slate-900"
                      >
                        {['🔥', '🚀', '⚡', '🦅', '👑', '🛡️', '🦁', '🐯', '🏔️', '🏆', '⭐', '🌊', '⚓', '⚔️'].map(emoji => (
                          <option key={emoji} value={emoji}>{emoji}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      Submit Club Form <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Grid splits for status check and verified competitors list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-800">
        
        {/* Left/Middle Column (2 cols) - Approved Registered Teams list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
              <Trophy className="h-5 w-5 text-yellow-500 animate-bounce" />
              <span>Participating Certified Contenders</span>
            </h3>
            
            <p className="text-xs text-slate-500">
              Only verified teams approved by organizers are legally admitted and displayed to this public portal.
            </p>

            {teams.length === 0 ? (
              <div className="bg-slate-50 p-10 rounded-2xl text-center border border-dashed border-slate-200 space-y-2.5">
                <span className="text-3xl block">🏐</span>
                <p className="text-xs text-slate-800 font-extrabold">Awaiting Approved Registrations</p>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-normal font-semibold">
                  Clubs that applied are pending verify action. The list will dynamically show sanctioned team blocks as soon as organizers review code.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl flex items-center justify-between hover:border-emerald-300 transition duration-150">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-2xl select-none">
                        {team.logo}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{team.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{team.city}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-extrabold uppercase">
                      ✓ Sanctioned
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Verification Search Card on right (1 col) */}
        <div className="space-y-6" id="status-checker">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider flex items-center space-x-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
              <span>Verify Registration Status</span>
            </h3>

            <p className="text-[11px] text-slate-500 leading-normal">
              Enter details below to trace receipt clearance, payment approvals, or rejection notifications.
            </p>

            <form onSubmit={handleSearchStatus} className="space-y-2.5">
              <input 
                type="text"
                required
                placeholder="Club name, captain name or txn id..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-605 focus:border-emerald-605"
              />
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs uppercase py-2.5 rounded-xl transition cursor-pointer"
              >
                Search Status
              </button>
            </form>

            {searchExecuted && (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-normal font-sans animate-fade-in">
                {searchResult ? (
                  <div className="space-y-2">
                    <p className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{searchResult.logoEmoji}</span>
                      <span>{searchResult.clubName}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Captain: <strong className="text-slate-800">{searchResult.captainName}</strong> | Ref ID: <span className="font-mono bg-white border px-1 rounded text-emerald-800 font-bold">{searchResult.easypaisaTxnId}</span>
                    </p>
                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] uppercase tracking-wider font-extrabold">
                      <span>Status:</span>
                      {searchResult.status === 'Verified' ? (
                        <span className="text-emerald-700 font-black">✅ Approved & Active</span>
                      ) : searchResult.status === 'Rejected' ? (
                        <span className="text-red-650 font-black text-red-600">❌ Payment Invalid / Rejected</span>
                      ) : (
                        <span className="text-yellow-700 font-black animate-pulse">⏳ Awaiting Verification</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-red-650 text-red-600 font-bold text-[10px]">
                    ⚠️ No record matched transaction query "{searchQuery}". Please verify character codes.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
