import React, { useState } from 'react';
import { Match, Team } from '../types';
import { Calendar, MapPin, Clock, Search, ChevronRight, Trophy } from 'lucide-react';

interface SchedulesProps {
  matches: Match[];
  onBookShortcut: (matchId: string) => void;
  teams: Team[];
}

export default function Schedules({ matches, onBookShortcut, teams }: SchedulesProps) {
  const [filter, setFilter] = useState<'all' | 'Upcoming' | 'Live' | 'Completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const filteredMatches = matches.filter((m) => {
    const matchesFilter = filter === 'all' || m.status === filter;
    const matchesSearch = 
      m.teamA.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.teamB.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.date.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = selectedCity === 'all' || m.venue.includes(selectedCity);

    return matchesFilter && matchesSearch && matchesCity;
  });

  const venuesMap = [
    { city: 'Shangla', name: 'Khursheed Khan Volleyball Ground, Taja Maira, Bisham, Shangla', capacity: '15,000' },
    { city: 'Peshawar', name: 'Qayyum Stadium, Peshawar', capacity: '8,500' },
    { city: 'Islamabad', name: 'Liaquat Gymnasium, Islamabad', capacity: '10,000' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800" id="schedules_container">
      
      {/* Header and overview banners */}
      <div className="mb-8 pb-4 border-b border-slate-205">
        <span className="bg-emerald-55 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
          📅 Tournament Fixtures
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          Match Schedules & Venues
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Explore complete rosters, past sets, and book reserve tickets instantly for court-side volleyball games.
        </p>
      </div>

      {/* Roster filter rails */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Side: Filter and search side-panel */}
        <div className="md:col-span-1 space-y-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider mb-3">Sort & Align</h3>
            
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-655 text-slate-400" />
              <input
                type="text"
                placeholder="Search teams or venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-850 transition"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-col space-y-2">
              {(['all', 'Live', 'Upcoming', 'Completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    filter === status
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-55 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {status === 'all' ? 'All Fixtures' : `${status} Matches`}
                </button>
              ))}
            </div>
          </div>

          {/* Venues sidebar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider mb-3">Venue Locations</h3>
            <div className="space-y-3">
              {venuesMap.map((venue, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-750">
                  <div className="font-bold text-slate-900 flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                    <span>{venue.city} Arena</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono leading-normal font-semibold">{venue.name}</p>
                  <p className="text-[9px] text-emerald-700 font-extrabold mt-1">Capacity: {venue.capacity} Seats</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Central Match schedules list */}
        <div className="md:col-span-3 space-y-4">
          
          {filteredMatches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-sm shadow-sm">
              No tournament fixtures match your active filters or query.
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div 
                key={match.id} 
                className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-slate-300 transition shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-bold">{match.date}</span>
                    <Clock className="h-3.5 w-3.5 text-emerald-600 ml-2" />
                    <span className="font-bold">{match.time}</span>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide w-max ${
                    match.status === 'Live'
                      ? 'bg-red-100 text-red-650 border border-red-250 animate-pulse'
                      : match.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-250'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {match.status}
                  </span>
                </div>

                <div className="py-5 grid grid-cols-1 sm:grid-cols-3 items-center justify-between gap-4">
                  {/* Team A block */}
                  <div className="flex items-center space-x-3.5">
                    <div className="h-11 w-11 rounded-full bg-slate-50 flex items-center justify-center text-2xl border-2 border-slate-200 shadow-xs">
                      {match.teamA.logo}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">{match.teamA.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{match.teamA.city}</p>
                    </div>
                  </div>

                  {/* VS and Sets container */}
                  <div className="flex flex-col items-center justify-center text-center">
                    {match.status === 'Upcoming' ? (
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center font-extrabold text-xs text-slate-400 font-mono border border-slate-200">
                        VS
                      </div>
                    ) : (
                      <div className="bg-slate-55 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200 flex items-center space-x-2 text-sm font-extrabold font-mono text-emerald-700">
                        <span>{match.score.setsA}</span>
                        <span className="text-slate-300">-</span>
                        <span>{match.score.setsB}</span>
                      </div>
                    )}
                    
                    {match.status === 'Completed' && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">Final Score</p>
                    )}
                  </div>

                  {/* Team B block */}
                  <div className="flex items-center space-x-3.5 sm:justify-end">
                    <div className="sm:text-right">
                      <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">{match.teamB.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{match.teamB.city}</p>
                    </div>
                    <div className="h-11 w-11 rounded-full bg-slate-50 flex items-center justify-center text-2xl border-2 border-slate-200 shadow-xs">
                      {match.teamB.logo}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 font-extrabold">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>{match.venue}</span>
                  </div>

                  {match.status === 'Upcoming' ? (
                    <button
                      onClick={() => onBookShortcut(match.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs tracking-wide transition flex items-center space-x-1 shadow-xs cursor-pointer"
                    >
                      <span>Reserve Seats</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 uppercase tracking-wider text-[9px] font-extrabold">
                      {match.status === 'Live' ? '🎥 TV broadcast live' : '📊 Analysis reports compiled'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}
