import React, { useState } from 'react';
import { Player, Team, Match } from '../types';
import { 
  Shield, 
  Medal, 
  Swords, 
  Trophy, 
  Activity, 
  Zap, 
  Target, 
  Percent, 
  MapPin, 
  Users, 
  Sparkles, 
  Award,
  GitCompare,
  ArrowRight
} from 'lucide-react';

const TEAM_PROFILES: { [key: string]: {
  tacticalStyle: string;
  historicalContext: string;
  coachingPhilosophy: string;
  stadiumHome: string;
  founded: string;
} } = {
  army: {
    tacticalStyle: "Heavy triple-net blocking. Focuses on physical stamina and neutralizing high-speed spikes at the front court.",
    historicalContext: "Formed in Rawalpindi with rich military athletic discipline. The spikers are multiple-times champions known for relentless drills.",
    coachingPhilosophy: "Flawless physical readiness and aggressive transition from block recovery to diagonal spike.",
    stadiumHome: "Army Sports Gymnasium, Rawalpindi",
    founded: "1968"
  },
  wapda: {
    tacticalStyle: "Service line dominance and extreme high-velocity spikes. Heavily relies on aggressive playmaking and Aimal Khan's serves.",
    historicalContext: "The reigning giants of national volleyball, WAPDA holds record consecutive championship points and international-standard players.",
    coachingPhilosophy: "Continuous pressure. Give opponents zero breathing room on serve receives.",
    stadiumHome: "WAPDA Sports Complex, Lahore",
    founded: "1974"
  },
  navy: {
    tacticalStyle: "Strategic crossing maneuvers. Focuses on tactical set placement to breach multi-block walls.",
    historicalContext: "Based out of Karachi, the Navy Anchors are known for strategic patience, high-spin serves, and superb receiving precision.",
    coachingPhilosophy: "Mental composure under extreme pressure, minimizing unforced service set errors.",
    stadiumHome: "Navy Athletic Terminal, Karachi",
    founded: "1981"
  },
  paf: {
    tacticalStyle: "Ultra rapid, low-trajectory set passes. Focuses on quick tempo attacks with high athletic vertical velocity.",
    historicalContext: "Hailing from Peshawar, the Falcons possess the youngest squad average age, representing exceptional speed and energetic fan stands.",
    coachingPhilosophy: "Pace over height. Out-speed the block setups before they can lock onto targets.",
    stadiumHome: "Qayyum Stadium, Peshawar",
    founded: "1995"
  },
  police: {
    tacticalStyle: "Scrappy defensive recoveries and deep digs. Maximizes court coverage using elite Libero reflexes.",
    historicalContext: "The Khyber Spikers represent resilient regional talent, known for playing high-endurance tie-breaker sets with great grit.",
    coachingPhilosophy: "Nothing hits the floor. Every spike must be contested with a diving dig.",
    stadiumHome: "Police Sports Gymnasium, Peshawar",
    founded: "1988"
  },
  hec: {
    tacticalStyle: "Collegiate high-stamina jump tactics and aggressive frontcourt spikes. Highly modern experimental playstyles.",
    historicalContext: "Comprising top university players across Pakistan, HEC represents the incubator of tomorrow's international national squad prospects.",
    coachingPhilosophy: "Fearless technical innovation. Willingness to adjust blocker rotations on the fly.",
    stadiumHome: "Liaquat Gymnasium Hall B, Islamabad",
    founded: "2002"
  }
};

interface TeamsProps {
  teams: Team[];
  matches?: Match[];
}

export default function Teams({ teams, matches = [] }: TeamsProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || 'army');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareTeamId, setCompareTeamId] = useState<string | null>(null);

  if (!teams || teams.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800" id="teams_container">
        
        {/* Title Header */}
        <div className="mb-8 pb-4 border-b border-slate-200">
          <span className="bg-emerald-100 text-emerald-850 text-emerald-805 border border-emerald-250 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
            👥 TEAM PROFILES & PLAYER STATS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Rosters & Athlete Performance Index
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Explore comprehensive tactical profiles of competing clubs, view rosters, and inspect player metrics including points scored, assists, blocks, and serving accuracy.
          </p>
        </div>

        {/* Empty State Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500 shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
          <span className="text-4xl block mb-2.5">🏐</span>
          <h3 className="font-extrabold text-sm text-slate-850 uppercase tracking-wider mb-1">Awaiting Approved Club Registrations</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-normal font-semibold mb-4 text-center">
            Once teams submit their sign-up portfolio with payment receipts, organizers will review and approve them. Certified roster profiles will launch here instantly.
          </p>
        </div>
      </div>
    );
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
  const selectedPlayer = selectedTeam?.players?.find((p) => p.id === selectedPlayerId) || selectedTeam?.players?.[0];

  const handlePlayerClick = (pId: string) => {
    setSelectedPlayerId(pId);
    setIsPlayerModalOpen(true);
  };

  // Calculate aggregated team statistics for the detailed profiles
  const totalTeamSpikes = (selectedTeam.players || []).reduce((sum, p) => sum + p.stats.spikes, 0);
  const totalTeamBlocks = (selectedTeam.players || []).reduce((sum, p) => sum + p.stats.blocks, 0);
  const totalTeamAces = (selectedTeam.players || []).reduce((sum, p) => sum + p.stats.aces, 0);
  const totalTeamPoints = (selectedTeam.players || []).reduce((sum, p) => sum + (p.stats.points || 0), 0);
  const totalTeamAssists = (selectedTeam.players || []).reduce((sum, p) => sum + (p.stats.assists || 0), 0);

  const activeProfile = TEAM_PROFILES[selectedTeam.id] || {
    tacticalStyle: "High-power offensive spikes & solid backline drills.",
    historicalContext: "A premier Pakistan volleyball squad competing for the national trophy.",
    coachingPhilosophy: "Relentless team-work and defensive positioning.",
    stadiumHome: "Liaquat Gymnasium, Islamabad",
    founded: "N/A"
  };

  const renderComparisonView = () => {
    const compareTeam = teams.find(t => t.id === compareTeamId) || null;
    
    // Find head-to-head matches
    const h2hMatches = matches?.filter(m => 
      (m.teamA.id === selectedTeamId && m.teamB.id === compareTeamId) ||
      (m.teamB.id === selectedTeamId && m.teamA.id === compareTeamId)
    ).sort((a, b) => b.time.localeCompare(a.time)) || [];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 leading-none">Head-to-Head Analysis</h3>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Compare Club Strategies & Stats</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsComparing(false);
              setCompareTeamId(null);
            }} 
            className="px-4 py-2 border border-slate-200 bg-white shadow-sm rounded-xl text-slate-700 font-extrabold hover:bg-slate-50 text-xs flex items-center space-x-2"
          >
            <span>Exit Compare</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Team */}
          {(() => {
            const team = selectedTeam;
            const tPoints = (team.players || []).reduce((sum, p) => sum + p.stats.points, 0);
            const tAssists = (team.players || []).reduce((sum, p) => sum + p.stats.assists, 0);
            const tBlocks = (team.players || []).reduce((sum, p) => sum + p.stats.blocks, 0);
            const tSpikes = (team.players || []).reduce((sum, p) => sum + p.stats.spikes, 0);
            const winPct = team.stats.played > 0 ? Math.round((team.stats.won / team.stats.played) * 100) : 0;
            return (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm relative">
                <div className="p-6 bg-slate-50 border-b border-slate-200 text-center relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 text-9xl opacity-5">{team.logo}</div>
                  <div className="text-5xl drop-shadow mb-3 relative z-10">{team.logo}</div>
                  <h3 className="text-2xl font-black text-slate-900 relative z-10">{team.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 tracking-widest uppercase relative z-10">{team.city}</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Tournament Win Rate</span>
                     <span className="text-emerald-700 text-2xl font-black font-mono">{winPct}%</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matches Played</span>
                      <strong className="text-slate-800 font-mono text-sm">{team.stats.played}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Points</span>
                      <strong className="text-emerald-700 font-mono text-sm font-bold">{team.stats.points} pts</strong>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest mb-3 text-center">Aggregated Positional Output</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-slate-150 p-3 rounded-2xl text-center shadow-sm">
                        <span className="text-[9px] text-red-400 uppercase block font-bold tracking-wider mb-1">Total Spikes</span>
                        <strong className="text-base font-black text-red-600 font-mono">{tSpikes}</strong>
                      </div>
                      <div className="bg-white border border-slate-150 p-3 rounded-2xl text-center shadow-sm">
                        <span className="text-[9px] text-emerald-500 uppercase block font-bold tracking-wider mb-1">Net Blocks</span>
                        <strong className="text-base font-black text-emerald-600 font-mono">{tBlocks}</strong>
                      </div>
                      <div className="bg-white border border-slate-150 p-3 rounded-2xl text-center shadow-sm">
                        <span className="text-[9px] text-blue-400 uppercase block font-bold tracking-wider mb-1">Set Assists</span>
                        <strong className="text-base font-black text-blue-600 font-mono">{tAssists}</strong>
                      </div>
                      <div className="bg-white border border-slate-150 p-3 rounded-2xl text-center shadow-sm">
                        <span className="text-[9px] text-indigo-400 uppercase block font-bold tracking-wider mb-1">Roster Size</span>
                        <strong className="text-base font-black text-indigo-600 font-mono">{team.players.length}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Secondary Team (Opponent) */}
          {compareTeam ? (() => {
            const team = compareTeam;
            const tPoints = (team.players || []).reduce((sum, p) => sum + p.stats.points, 0);
            const tAssists = (team.players || []).reduce((sum, p) => sum + p.stats.assists, 0);
            const tBlocks = (team.players || []).reduce((sum, p) => sum + p.stats.blocks, 0);
            const tSpikes = (team.players || []).reduce((sum, p) => sum + p.stats.spikes, 0);
            const winPct = team.stats.played > 0 ? Math.round((team.stats.won / team.stats.played) * 100) : 0;
            return (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm relative">
                <div className="p-6 bg-slate-50 border-b border-slate-200 text-center relative overflow-hidden">
                  <div className="absolute -top-10 -left-10 text-9xl opacity-5">{team.logo}</div>
                  <button 
                    onClick={() => setCompareTeamId(null)}
                    className="absolute top-4 right-4 text-[10px] text-slate-500 hover:text-slate-700 font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm hover:shadow z-20 cursor-pointer"
                  >
                    Change
                  </button>
                  <div className="text-5xl drop-shadow mb-3 relative z-10">{team.logo}</div>
                  <h3 className="text-2xl font-black text-slate-900 relative z-10">{team.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 tracking-widest uppercase relative z-10">{team.city}</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Tournament Win Rate</span>
                     <span className="text-emerald-700 text-2xl font-black font-mono">{winPct}%</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matches Played</span>
                      <strong className="text-slate-800 font-mono text-sm">{team.stats.played}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Points</span>
                      <strong className="text-emerald-700 font-mono text-sm font-bold">{team.stats.points} pts</strong>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest mb-3 text-center">Aggregated Positional Output</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-slate-150 p-3 rounded-2xl text-center shadow-sm">
                        <span className="text-[9px] text-red-400 uppercase block font-bold tracking-wider mb-1">Total Spikes</span>
                        <strong className="text-base font-black text-red-600 font-mono">{tSpikes}</strong>
                      </div>
                      <div className="bg-white border border-slate-150 p-3 rounded-2xl text-center shadow-sm">
                        <span className="text-[9px] text-emerald-500 uppercase block font-bold tracking-wider mb-1">Net Blocks</span>
                        <strong className="text-base font-black text-emerald-600 font-mono">{tBlocks}</strong>
                      </div>
                      <div className="bg-white border border-slate-150 p-3 rounded-2xl text-center shadow-sm">
                        <span className="text-[9px] text-blue-400 uppercase block font-bold tracking-wider mb-1">Set Assists</span>
                        <strong className="text-base font-black text-blue-600 font-mono">{tAssists}</strong>
                      </div>
                      <div className="bg-white border border-slate-150 p-3 rounded-2xl text-center shadow-sm">
                        <span className="text-[9px] text-indigo-400 uppercase block font-bold tracking-wider mb-1">Roster Size</span>
                        <strong className="text-base font-black text-indigo-600 font-mono">{team.players.length}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-2xl text-slate-300 mb-4 shadow-sm">
                VS
              </div>
              <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-6">Select Opponent to Compare</h4>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm px-4">
                {teams.filter(t => t.id !== selectedTeamId).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setCompareTeamId(t.id)}
                    className="p-3 bg-white border border-slate-200 text-center hover:bg-emerald-50 hover:border-emerald-200 rounded-2xl transition shadow-sm cursor-pointer"
                  >
                    <div className="text-3xl mb-1">{t.logo}</div>
                    <div className="text-[10px] font-bold text-slate-700">{t.name.split(' ')[0]}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Head to Head History Block */}
        {compareTeam && (
          <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
             <h4 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider flex items-center space-x-2 mb-6">
               <Trophy className="w-5 h-5 text-amber-500" />
               <span>Recent Encounter History</span>
             </h4>
             {h2hMatches.length === 0 ? (
               <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-xs text-slate-500 font-medium">No recorded head-to-head matches found for these two clubs in the current dataset.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {h2hMatches.map((m) => (
                   <div key={m.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="text-[10px] font-mono text-slate-400 font-bold tracking-wider">{m.date} - {m.time}</div>
                     <div className="flex items-center justify-center space-x-4 md:space-x-8 w-full md:w-auto overflow-hidden">
                       <div className={`flex flex-col items-center flex-1 md:flex-none ${m.score.setsA > m.score.setsB ? 'opacity-100' : 'opacity-50'}`}>
                         <span className="text-2xl">{m.teamA.logo}</span>
                         <span className="font-bold text-[10px] mt-1 text-center truncate w-max max-w-[80px]">{m.teamA.name.split(' ')[0]}</span>
                       </div>
                       <div className="flex items-center space-x-2 font-mono pb-2">
                         <span className={`text-2xl font-black ${m.score.setsA > m.score.setsB ? 'text-emerald-700' : 'text-slate-400'}`}>{m.score.setsA}</span>
                         <span className="text-slate-300 font-bold">-</span>
                         <span className={`text-2xl font-black ${m.score.setsB > m.score.setsA ? 'text-emerald-700' : 'text-slate-400'}`}>{m.score.setsB}</span>
                       </div>
                       <div className={`flex flex-col items-center flex-1 md:flex-none ${m.score.setsB > m.score.setsA ? 'opacity-100' : 'opacity-50'}`}>
                         <span className="text-2xl">{m.teamB.logo}</span>
                         <span className="font-bold text-[10px] mt-1 text-center truncate w-max max-w-[80px]">{m.teamB.name.split(' ')[0]}</span>
                       </div>
                     </div>
                     <div className="text-[9px] uppercase font-bold text-slate-400 border border-slate-200 px-3 py-1.5 rounded-full bg-white text-center">
                       {m.status}
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800" id="teams_container">
      
      {/* Title Header */}
      <div className="mb-8 pb-4 border-b border-slate-200">
        <span className="bg-emerald-100 text-emerald-850 text-emerald-800 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
          👥 TEAM PROFILES & PLAYER STATS
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          Rosters & Athlete Performance Index
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Explore comprehensive tactical profiles of competing clubs, view rosters, and inspect player metrics including points scored, assists, blocks, and serving accuracy.
        </p>
      </div>

      {/* Grid selector of all teams */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {teams.map((team) => {
          const winPercentage = team.stats.played > 0 ? (team.stats.won / team.stats.played) * 100 : 0;
          return (
            <div
              key={team.id}
              onClick={() => {
                setSelectedTeamId(team.id);
                setSelectedPlayerId(null); // Reset player selection on team switch
              }}
              className={`p-4 rounded-3xl border text-center cursor-pointer transition-all ${
                selectedTeamId === team.id
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500/10'
                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="text-3xl filter drop-shadow-sm">{team.logo}</div>
              <h4 className="font-extrabold text-xs text-slate-850 truncate mt-2">{team.name.split(' ')[0]}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 tracking-widest uppercase font-mono">{team.city}</p>
              
              <div className="mt-3 w-full">
                <div className="flex justify-between text-[9px] font-bold mb-1">
                  <span className="text-slate-500">Win Rate</span>
                  <span className="text-emerald-700">{Math.round(winPercentage)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700" 
                    style={{ width: `${winPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conditional Layout: Team Details vs Side-by-Side Comparison */}
      {isComparing ? renderComparisonView() : (
      <div className="grid grid-cols-1 gap-8">
        
        {/* Main Column: Team overview + Detailed Profile Dossier + Roster List */}
        <div className="space-y-6">
          
          {/* Team Overview metrics banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-sm relative">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{selectedTeam.logo}</div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedTeam.name}</h3>
                <p className="text-xs text-slate-500">Headquarters City: {selectedTeam.city}, Pakistan</p>
              </div>
            </div>

            {/* Standings quick mini stats */}
            <div className="flex items-center space-x-4 text-center border-t xl:border-t-0 xl:border-l border-slate-200 pt-3 xl:pt-0 xl:pl-4 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-150">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block font-mono">Wins</span>
                <span className="text-sm font-black text-slate-800">{selectedTeam.stats.won}</span>
              </div>
              <div className="border-l border-slate-200 h-6"></div>
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block font-mono">Losses</span>
                <span className="text-sm font-black text-slate-800">{selectedTeam.stats.lost}</span>
              </div>
              <div className="border-l border-slate-200 h-6"></div>
              <div className="w-20 text-left">
                <div className="flex justify-between text-[10px] font-extrabold uppercase font-mono mb-1">
                  <span className="text-slate-400">Win %</span>
                  <span className="text-emerald-700">{selectedTeam.stats.played > 0 ? Math.round((selectedTeam.stats.won / selectedTeam.stats.played) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700" 
                    style={{ width: `${selectedTeam.stats.played > 0 ? (selectedTeam.stats.won / selectedTeam.stats.played) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="border-l border-slate-200 h-6"></div>
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block font-mono">Pts</span>
                <span className="text-sm font-black text-emerald-700 font-mono">{selectedTeam.stats.points}</span>
              </div>
              <div className="border-l border-slate-200 h-6"></div>
              <button 
                onClick={() => setIsComparing(!isComparing)}
                className={`ml-2 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isComparing 
                    ? 'bg-slate-800 text-white hover:bg-slate-700' 
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>{isComparing ? 'Exit Compare' : 'Compare'}</span>
              </button>
            </div>
          </div>

          {/* Detailed Team Profile Dossier Card */}
          <div className="bg-slate-905 bg-slate-900 rounded-3xl p-6 text-white border border-slate-850 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 font-bold text-9xl pointer-events-none select-none font-mono">
              {selectedTeam.logo}
            </div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-550/30 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" />
                  <span>Club Tactical Profile</span>
                </span>
                <span className="text-slate-600 text-xs">•</span>
                <span className="text-slate-400 text-[11px] font-mono flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>{activeProfile.stadiumHome}</span>
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center space-x-1.5">
                    <Swords className="h-3 w-3 text-emerald-400" />
                    <span>Tactical Strategy & Attack Vectors</span>
                  </h4>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {activeProfile.tacticalStyle}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center space-x-1.5">
                    <Award className="h-3 w-3 text-orange-400" />
                    <span>Club Heritage & Background</span>
                  </h4>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {activeProfile.historicalContext}
                  </p>
                </div>
              </div>

              {/* Aggregated Team Athletics Stats Grid */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest mb-3">
                  Accumulated Squad Volleyball Statistics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="bg-slate-850/60 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold font-mono">Total Points</span>
                    <strong className="text-xs font-black text-indigo-300 font-mono mt-0.5 block">{totalTeamPoints} pts</strong>
                  </div>
                  <div className="bg-slate-850/60 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold font-mono">Assists Logged</span>
                    <strong className="text-xs font-black text-blue-300 font-mono mt-0.5 block">{totalTeamAssists} ast</strong>
                  </div>
                  <div className="bg-slate-850/60 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold font-mono">Net Blocks</span>
                    <strong className="text-xs font-black text-emerald-400 font-mono mt-0.5 block">{totalTeamBlocks} blk</strong>
                  </div>
                  <div className="bg-slate-850/60 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold font-mono">Attack Spikes</span>
                    <strong className="text-xs font-black text-red-300 font-mono mt-0.5 block">{totalTeamSpikes} spk</strong>
                  </div>
                  <div className="bg-slate-850/60 p-2.5 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold font-mono">Aces Scored</span>
                    <strong className="text-xs font-black text-yellow-300 font-mono mt-0.5 block">{totalTeamAces} aces</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-mono text-slate-400">
                <div>
                  Founded: <span className="text-slate-200 font-bold">{activeProfile.founded}</span>
                </div>
                <div className="hidden sm:block">•</div>
                <div>
                  Coaching Ethos: <span className="text-slate-200 italic font-medium">"{activeProfile.coachingPhilosophy}"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Roster players list table */}
          <div className="bg-white border border-slate-205 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider flex items-center space-x-1.5">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>Athletes Roster Grid • Selected Squad</span>
              </h4>
              <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                {selectedTeam.players.length} Registered Players
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {selectedTeam.players.map((player) => (
                <div
                  key={player.id}
                  onClick={() => handlePlayerClick(player.id)}
                  className={`p-4 flex items-center justify-between transition cursor-pointer ${
                    selectedPlayer?.id === player.id
                      ? 'bg-emerald-50/50 text-slate-900 font-medium border-l-4 border-l-emerald-600 pl-3'
                      : 'hover:bg-slate-50/80 text-slate-705 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-emerald-750 shrink-0">
                      #{player.number}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{player.name}</h4>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] text-slate-450 font-mono italic">{player.role}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-500 font-medium">{player.height}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:space-x-4 text-[11px] font-mono">
                    {/* Points highlight */}
                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-center min-w-[58px] hidden sm:block">
                      <span className="text-[8px] text-indigo-400 block font-bold uppercase tracking-wide">Points</span>
                      <strong className="font-bold">{player.stats.points}</strong>
                    </div>

                    {/* Assists highlight */}
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-center min-w-[58px] hidden sm:block">
                      <span className="text-[8px] text-blue-400 block font-bold uppercase tracking-wide">Assists</span>
                      <strong className="font-bold">{player.stats.assists}</strong>
                    </div>

                    {/* Blocks highlight */}
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-center min-w-[58px] hidden sm:block font-bold">
                      <span className="text-[8px] text-emerald-400 block font-bold uppercase tracking-wide">Blocks</span>
                      <strong className="font-bold">{player.stats.blocks}</strong>
                    </div>

                    {/* Serving Accuracy highlight */}
                    <div className="bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-center min-w-[58px] hidden sm:block">
                      <span className="text-[8px] text-amber-500 block font-bold uppercase tracking-wide">Serve %</span>
                      <strong className="font-bold">
                        {player.role === 'Libero' ? 'N/A' : `${player.stats.servingAccuracy}%`}
                      </strong>
                    </div>

                    {/* Mobile compact stat: Points */}
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg text-[10px] font-bold block sm:hidden">
                      {player.role === 'Libero' ? `${player.stats.digs} digs` : `${player.stats.points} pts`}
                    </div>

                    <span className="text-slate-400 text-xs sm:text-sm">➔</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Overlay: Player Profile Radar + Detailed Bio metrics */}
        {isPlayerModalOpen && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPlayerModalOpen(false)}></div>
          
          <div className="bg-white rounded-3xl max-w-md w-full relative shadow-2xl overflow-y-auto max-h-[90vh] text-slate-800 isolate animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsPlayerModalOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 transition-colors z-20 font-bold"
            >
               ✕
            </button>

            <div className="p-6">
              <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider mb-5 flex items-center space-x-2">
                <Medal className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span>Athlete Performance Card</span>
              </h3>

            {/* Profile Avatar summary */}
            <div className="text-center pb-5 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-650 to-emerald-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow border border-slate-200 relative">
                #{selectedPlayer.number}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-white text-[10px] flex items-center justify-center font-bold">
                  ⚡
                </span>
              </div>
              <h4 className="font-black text-base text-slate-900 mt-3">{selectedPlayer.name}</h4>
              <p className="text-xs text-emerald-700 font-bold font-mono uppercase tracking-widest mt-0.5">{selectedPlayer.role}</p>
              
              <div className="flex justify-center items-center space-x-3 text-[10px] font-mono text-slate-400 mt-2">
                <span>Height: <strong className="text-slate-650 font-bold">{selectedPlayer.height}</strong></span>
                <span>•</span>
                <span>Squad: <strong className="text-slate-650 font-bold">{selectedTeam.name.split(' ')[0]}</strong></span>
              </div>
            </div>

            {/* Biography details desk */}
            <div className="py-4 border-b border-slate-100 space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed italic text-center font-semibold text-slate-600">
                "{selectedPlayer.bio}"
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Age</span>
                  <strong className="text-slate-700 font-extrabold">{selectedPlayer.age} Years</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Dominant Hand</span>
                  <strong className="text-slate-700 font-extrabold">{selectedPlayer.hand}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Origin / Town</span>
                  <strong className="text-slate-700 font-extrabold truncate block text-[10px]" title={selectedPlayer.homeTown}>{selectedPlayer.homeTown}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Experience</span>
                  <strong className="text-slate-700 font-extrabold">{selectedPlayer.experience}</strong>
                </div>
              </div>
            </div>

            {/* PRIMARY TRACKED VOLLEYBALL STATISTICS (User-Requested Highlight Grid) */}
            <div className="pt-4 pb-1">
              <h4 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest mb-3 flex items-center space-x-1">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                <span>Primary Performance Tracker</span>
              </h4>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Points Scored Block */}
                <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-1 right-2 opacity-10 text-xl font-bold">🎖️</div>
                  <span className="text-[9px] text-indigo-400 block font-bold uppercase tracking-wider font-mono">Points Scored</span>
                  <strong className="text-xl font-black text-indigo-900 font-mono mt-1 block">{selectedPlayer.stats.points}</strong>
                  <span className="text-[8px] text-slate-400 block font-semibold leading-tight mt-1">Total offensive score contributions</span>
                </div>

                {/* Assists Block */}
                <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-1 right-2 opacity-10 text-xl font-bold">🎯</div>
                  <span className="text-[9px] text-blue-400 block font-bold uppercase tracking-wider font-mono">Assists</span>
                  <strong className="text-xl font-black text-blue-900 font-mono mt-1 block">{selectedPlayer.stats.assists}</strong>
                  <span className="text-[8px] text-slate-400 block font-semibold leading-tight mt-1">Critical set passes delivered</span>
                </div>

                {/* Blocks Block */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-1 right-2 opacity-10 text-xl font-bold">🛡️</div>
                  <span className="text-[9px] text-emerald-500 block font-bold uppercase tracking-wider font-mono">Wall Blocks</span>
                  <strong className="text-xl font-black text-emerald-950 font-mono mt-1 block">{selectedPlayer.stats.blocks}</strong>
                  <span className="text-[8px] text-slate-400 block font-semibold leading-tight mt-1">Direct defensive net denials</span>
                </div>

                {/* Serving Accuracy Block */}
                <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-1 right-2 opacity-10 text-xl font-bold">⚡</div>
                  <span className="text-[9px] text-amber-500 block font-bold uppercase tracking-wider font-mono">Serve Accuracy</span>
                  <strong className="text-xl font-black text-amber-950 font-mono mt-1 block">
                    {selectedPlayer.role === 'Libero' ? '0%' : `${selectedPlayer.stats.servingAccuracy}%`}
                  </strong>
                  <span className="text-[8px] text-slate-400 block font-semibold leading-tight mt-1">In-bounds service placement</span>
                </div>
              </div>
            </div>

            {/* Stat visual progress grids (Supplementary metrics) */}
            <div className="border-t border-slate-100 pt-4 space-y-3.5">
              <h5 className="text-[9px] text-slate-400 uppercase font-black tracking-widest block font-mono">Supplementary Raw Stats</h5>

              {/* Spikes metric */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-500 font-bold flex items-center space-x-1.5">
                    <Swords className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span>Attack Spikes / Kills</span>
                  </span>
                  <span className="font-bold text-slate-850 font-mono">{selectedPlayer.stats.spikes}</span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-650 bg-emerald-600 transition-all duration-500" 
                    style={{ width: `${Math.min(100, (selectedPlayer.stats.spikes / 120) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Aces stats */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-550 font-bold flex items-center space-x-1.5">
                    <Zap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Direct Serve Aces</span>
                  </span>
                  <span className="font-bold text-slate-850 font-mono">{selectedPlayer.stats.aces}</span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, (selectedPlayer.stats.aces / 30) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Digs stats */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-550 font-bold flex items-center space-x-1.5">
                    <Activity className="h-3.5 w-3.5 text-fuchsia-500 shrink-0" />
                    <span>Agile Ground Digs</span>
                  </span>
                  <span className="font-bold text-slate-850 font-mono">{selectedPlayer.stats.digs}</span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-fuchsia-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, (selectedPlayer.stats.digs / 110) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Custom Interactive Radar map */}
            <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-150">
              <h4 className="text-[10px] font-extrabold text-slate-405 text-slate-400 uppercase tracking-widest text-center mb-3">
                Dynamic Skill Geometry Match
              </h4>
              <div className="flex justify-center items-center h-28 relative">
                <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-slate-200 stroke-1 fill-none overflow-visible">
                  {/* Outer ring */}
                  <polygon points="50,10 90,50 50,90 10,50" className="stroke-slate-200 stroke-[1]" />
                  {/* Mid ring */}
                  <polygon points="50,30 70,50 50,70 30,50" className="stroke-slate-300 stroke-[1] stroke-dashed" />
                  
                  {/* Grid Lines */}
                  <line x1="50" y1="10" x2="50" y2="90" className="stroke-slate-200 stroke-[0.8]" />
                  <line x1="10" y1="50" x2="90" y2="50" className="stroke-slate-200 stroke-[0.8]" />

                  {/* Text Guides */}
                  <text x="50" y="6" className="fill-slate-400 font-mono text-[5.5px] font-extrabold" textAnchor="middle">PTS</text>
                  <text x="94" y="52" className="fill-slate-400 font-mono text-[5.5px] font-extrabold" textAnchor="start">BLK</text>
                  <text x="50" y="97" className="fill-slate-400 font-mono text-[5.5px] font-extrabold" textAnchor="middle">AST</text>
                  <text x="6" y="52" className="fill-slate-400 font-mono text-[5.5px] font-extrabold" textAnchor="end">ACC%</text>

                  {/* Player Skill Polygon (Calculated based on max stats) */}
                  {(() => {
                    const pointsPct = Math.min(100, (selectedPlayer.stats.points / 180) * 100) / 100;
                    const blockPct = Math.min(100, (selectedPlayer.stats.blocks / 60) * 100) / 100;
                    const assistPct = Math.min(100, (selectedPlayer.stats.assists / 250) * 100) / 100;
                    const accPct = Math.min(100, selectedPlayer.stats.servingAccuracy) / 100;

                    // Vertices: Top (Points), Right (Blocks), Bottom (Assists), Left (Accuracy)
                    const p1 = `50,${50 - (40 * pointsPct)}`;
                    const p2 = `${50 + (40 * blockPct)},50`;
                    const p3 = `50,${50 + (40 * assistPct)}`;
                    const p4 = `${50 - (40 * accPct)},50`;

                    return (
                      <polygon 
                        points={`${p1} ${p2} ${p3} ${p4}`} 
                        className="fill-emerald-600/10 stroke-emerald-600 stroke-[1.8]"
                      />
                    );
                  })()}
                </svg>
              </div>
            </div>

            </div>
          </div>
        </div>
        )}

      </div>
      )}

    </div>
  );
}
