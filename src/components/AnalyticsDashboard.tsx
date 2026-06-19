import React from 'react';
import { TicketBooking, Team, Match } from '../types';
import { Users, Ticket, Wallet, Activity, LineChart, PieChart, ExternalLink, Trophy, Award, Download, Download as DownloadIcon } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  Hover,
  Legend
} from 'recharts';

interface AnalyticsProps {
  bookings: TicketBooking[];
  teams: Team[];
  matches: Match[];
}

// Custom tooltip renderer for Player Scores chart
const PlayerTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-750 p-4 rounded-2xl shadow-xl font-sans text-xs text-white space-y-1.5 z-50">
        <p className="font-extrabold text-sm text-yellow-400 flex items-center gap-1.5">
          <span>🥇</span>
          <span>{data.name}</span>
        </p>
        <div className="space-y-1 text-slate-300">
          <p>Club: <strong className="text-white font-bold">{data.teamName}</strong></p>
          <p>Role: <span className="text-slate-150">{data.role}</span></p>
        </div>
        <div className="border-t border-white/10 pt-2 mt-2 grid grid-cols-3 gap-2 text-[10px] font-mono">
          <div className="bg-white/5 px-1.5 py-1 rounded text-center">
            <span className="block text-slate-450 uppercase text-[8px] font-bold">Points</span>
            <span className="text-yellow-300 font-extrabold text-sm">{data.points}</span>
          </div>
          <div className="bg-white/5 px-1.5 py-1 rounded text-center">
            <span className="block text-slate-450 uppercase text-[8px] font-bold">Spikes</span>
            <span className="text-emerald-400 font-extrabold text-xs">{data.spikes}</span>
          </div>
          <div className="bg-white/5 px-1.5 py-1 rounded text-center">
            <span className="block text-slate-450 uppercase text-[8px] font-bold">Blocks</span>
            <span className="text-blue-400 font-extrabold text-xs">{data.blocks}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsDashboard({ bookings, teams, matches }: AnalyticsProps) {
  
  const handleDownloadCSV = () => {
    const headers = ['Booking ID', 'Match', 'Customer Name', 'Customer Email', 'Category', 'Seats', 'Total Price (PKR)', 'Payment Status', 'Timestamp'];
    const rows = bookings.map(b => [
      b.id,
      b.matchName,
      b.customerName,
      b.customerEmail,
      b.category,
      b.seats.join(';'),
      b.totalPrice,
      b.paymentStatus,
      new Date(b.bookingTime).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ticket_bookings_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate dynamic metrics from bookings
  const localBookingsCount = bookings.length;
  const totalTicketsSold = bookings.reduce((sum, b) => sum + b.seats.length, 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // Default values combined with custom ones
  const finalBookings = 12 + localBookingsCount;
  const finalTickets = 38 + totalTicketsSold;
  const finalRevenue = 41200 + totalRevenue;

  // Stand distributions updated dynamically
  const goldSeats = bookings.filter(b => b.category === 'Gold').reduce((sum, b) => sum + b.seats.length, 0);
  const premiumSeats = bookings.filter(b => b.category === 'Premium').reduce((sum, b) => sum + b.seats.length, 0);
  const generalSeats = bookings.filter(b => b.category === 'General').reduce((sum, b) => sum + b.seats.length, 0);

  const standsData = [
    { label: 'Gold VIP Stands', count: 14 + goldSeats, color: '#f59e0b', max: 40 },
    { label: 'Premium Stands', count: 26 + premiumSeats, color: '#10b981', max: 60 },
    { label: 'General Gallery', count: 58 + generalSeats, color: '#3b82f6', max: 100 }
  ];

  // Dynamically calculate top 5 players based on total points scored
  const topPlayers = React.useMemo(() => {
    if (!teams || teams.length === 0) return [];

    // Map all players across all teams
    const allPlayersList = teams.flatMap(team => {
      const players = team.players || [];
      return players.map(p => ({
        name: p.name,
        role: p.role,
        teamName: team.name,
        points: p.stats?.points || 0,
        spikes: p.stats?.spikes || 0,
        blocks: p.stats?.blocks || 0,
        aces: p.stats?.aces || 0,
        teamColor: team.color || '#10b981'
      }));
    });

    // Sort by points scored, descending and pick top 5
    return [...allPlayersList]
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [teams]);

  const teamWinLossData = React.useMemo(() => {
    if (!teams || teams.length === 0) return [];
    
    const data: Record<string, { name: string; wins: number; losses: number; color?: string }> = {};
    
    teams.forEach(t => {
      data[t.id] = { name: t.name, wins: 0, losses: 0, color: t.color || '#3b82f6' };
    });
    
    matches?.forEach(m => {
      if (m.status === 'Completed') {
        const teamA = m.teamA.id;
        const teamB = m.teamB.id;
        if (m.score.setsA > m.score.setsB) {
          if (data[teamA]) data[teamA].wins += 1;
          if (data[teamB]) data[teamB].losses += 1;
        } else if (m.score.setsB > m.score.setsA) {
          if (data[teamB]) data[teamB].wins += 1;
          if (data[teamA]) data[teamA].losses += 1;
        }
      }
    });
    
    return Object.values(data);
  }, [teams, matches]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800" id="analytics_container">
      
      {/* Header element */}
      <div className="mb-8 pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-250 border-emerald-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
            📊 Host Monitoring Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Tournament Analytics & Traffic Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time event analytics telemetry, registration distribution ratios, portal active sessions, and sheets transaction writes.
          </p>
        </div>

        <button 
          onClick={handleDownloadCSV}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold transition shadow-sm self-start md:self-auto cursor-pointer"
        >
          <DownloadIcon className="h-4.5 w-4.5" />
          <span>Download Report</span>
        </button>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-105 bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Active Portal Traffic</span>
            <span className="text-2xl font-black text-slate-900 font-mono">1,890 <strong className="text-xs text-emerald-600 font-semibold font-sans">+18%</strong></span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Passes Confirmed</span>
            <span className="text-2xl font-black text-slate-900 font-mono">{finalTickets}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Revenue Generated</span>
            <span className="text-2xl font-black text-emerald-700 font-mono">Rs.{finalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Synced Sheets Rows</span>
            <span className="text-2xl font-black text-slate-900 font-mono">{finalBookings}</span>
          </div>
        </div>

      </div>

      {/* Visual Charts Layout - Two Column splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Hourly visitors traffic area graph */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-extrabold text-xs uppercase text-slate-850 tracking-wider mb-6 flex items-center space-x-2">
            <LineChart className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />
            <span>Hourly traffic & network system load</span>
          </h3>

          {/* SVG Area graph */}
          <div className="w-full h-64 bg-slate-50 p-4 rounded-2xl border border-slate-150 relative">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              
              {/* Grids */}
              <line x1="30" y1="20" x2="480" y2="20" className="stroke-slate-200 stroke-dashed stroke-[0.5]" />
              <line x1="30" y1="70" x2="480" y2="70" className="stroke-slate-200 stroke-dashed stroke-[0.5]" />
              <line x1="30" y1="120" x2="480" y2="120" className="stroke-slate-200 stroke-dashed stroke-[0.5]" />
              <line x1="30" y1="170" x2="480" y2="170" className="stroke-slate-250 stroke-[0.8]" />

              {/* Gradient fills definitions */}
              <defs>
                <linearGradient id="visitorAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Data paths */}
              <path 
                d="M 30 170 L 105 160 L 180 150 L 255 130 L 330 110 L 405 80 L 480 30 L 480 170 Z" 
                className="fill-[url(#visitorAreaGrad)]"
              />
              <path 
                d="M 30 170 L 105 160 L 180 150 L 255 130 L 330 110 L 405 80 L 480 30" 
                className="fill-none stroke-emerald-655 stroke-emerald-600 stroke-[2.5]" 
              />
              
              {/* Dots */}
              <circle cx="105" cy="160" r="3.5" className="fill-emerald-600 stroke-white stroke-2" />
              <circle cx="255" cy="130" r="3.5" className="fill-emerald-600 stroke-white stroke-2" />
              <circle cx="405" cy="80" r="3.5" className="fill-emerald-600 stroke-white stroke-2" />
              <circle cx="480" cy="30" r="3.5" className="fill-emerald-700 stroke-white stroke-2" />

              {/* Bottom labels (X Axis) */}
              <text x="30" y="185" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="middle">14:00</text>
              <text x="180" y="185" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="middle">16:00</text>
              <text x="330" y="185" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="middle">18:00</text>
              <text x="480" y="185" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="middle">20:00</text>

              {/* Side guides labels (Y Axis) */}
              <text x="25" y="170" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="end">0</text>
              <text x="25" y="120" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="end">500</text>
              <text x="25" y="70" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="end">1,000</text>
              <text x="25" y="20" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="end">2,000</text>
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-center space-x-5 text-[10px] uppercase tracking-wider font-extrabold font-mono text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1.5 bg-emerald-600 rounded"></span>
              <span>Unique Visitors (Hits)</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Seating Category Occupancy distribution bars */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
          <h3 className="font-extrabold text-xs uppercase text-slate-850 tracking-wider flex items-center space-x-2">
            <PieChart className="h-4.5 w-4.5 text-emerald-655 text-emerald-700" />
            <span>Seating stands booking utilization rates</span>
          </h3>

          <div className="space-y-4">
            {standsData.map((stand, idx) => {
              const occupancyPercentage = Math.min(100, Math.floor((stand.count / stand.max) * 100));
              
              return (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <div className="flex justify-between items-center text-xs mb-2 text-slate-600">
                    <span className="font-bold text-slate-800">{stand.label}</span>
                    <span className="font-mono text-slate-400">
                      <strong className="text-slate-800 font-extrabold">{stand.count}</strong> / {stand.max} seats reserved (<strong className="text-emerald-700 font-bold">{occupancyPercentage}%</strong>)
                    </span>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full rounded-full transition-all duration-700"
                      style={{ 
                        width: `${occupancyPercentage}%`,
                        backgroundColor: stand.color 
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick recommendations box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 text-[11px] text-slate-500 leading-normal flex items-start space-x-2.5">
            <span className="text-emerald-700 font-extrabold flex shrink-0">💡 Strategy Alert:</span>
            <p className="font-medium">General stands are experiencing high spikes. We recommend increasing gold and premium promotional banners to push revenue metrics further.</p>
          </div>

        </div>

      </div>

      {/* 🏆 Top 5 Scorers Bar Chart Section */}
      <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500 animate-bounce" />
              <span>Tournament Top 5 Scorers (Points Leaderboard)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Live statistics comparison across all active registered teams. Hover or tap on the score bars to view detail spikes, blocks, and roles.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-105 rounded-2xl px-4 py-2 flex items-center gap-2 shrink-0 md:self-start">
            <Award className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] uppercase font-bold text-emerald-850 tracking-wider">Scoring Efficiency Live</span>
          </div>
        </div>

        {topPlayers && topPlayers.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Recharts Bar Chart */}
            <div className="xl:col-span-2 bg-slate-50/50 rounded-2xl border border-slate-100 p-4 min-h-[320px] flex flex-col justify-between">
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topPlayers}
                    margin={{ top: 20, right: 15, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <Tooltip content={<PlayerTooltip />} cursor={{ fill: 'rgba(5, 150, 105, 0.04)' }} />
                    <Bar 
                      dataKey="points" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={40}
                    >
                      {topPlayers.map((entry, index) => {
                        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
                        return <Cell key={`cell-${index}`} fill={entry.teamColor || colors[index % colors.length]} />;
                      })}
                      <LabelList 
                        dataKey="points" 
                        position="top" 
                        fill="#0f172a" 
                        fontSize={10} 
                        fontWeight={800} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] uppercase tracking-wider font-extrabold text-slate-400 border-t border-slate-100 pt-3">
                {topPlayers.map((player, index) => (
                  <div key={index} className="flex items-center space-x-1.5 bg-white px-2 py-1 rounded-md border border-slate-100">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: player.teamColor || '#10b981' }} 
                    />
                    <span className="text-slate-600 font-sans font-bold">{player.name} ({player.teamName})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Side leaderboard lists card details */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">🎖️ Leaderboard Cards</h4>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {topPlayers.map((player, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-800">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">{player.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{player.role} • <strong className="text-slate-600 font-extrabold">{player.teamName}</strong></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-700 font-bold text-xs font-mono">{player.points} pts</span>
                      <span className="text-[9px] text-slate-400 block">spikes: {player.spikes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 text-center gap-1.5 flex flex-col justify-center items-center">
            <span className="text-2xl">⏳</span>
            <p className="text-xs text-slate-600 font-extrabold">Leaderboard Awaiting Registrations</p>
            <p className="text-[10px] text-slate-400 max-w-xs leading-normal">Once clubs are approved and live rosters details are synchronised, the scoring profiles visualization will load automatically here.</p>
          </div>
        )}
      </div>

      {/* 🏅 Team Win/Loss Recharts Graph */}
      <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-blue-500" />
              <span>Team Win & Loss Records</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Visual breakdown of wins vs losses for each active tournament club based on completed matches.
            </p>
          </div>
        </div>

        {teamWinLossData && teamWinLossData.length > 0 ? (
          <div className="w-full h-80 bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teamWinLossData}
                margin={{ top: 20, right: 30, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }} />
                <Bar dataKey="wins" name="Wins" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="losses" name="Losses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 text-center gap-1.5 flex flex-col justify-center items-center">
            <span className="text-2xl">⏳</span>
            <p className="text-xs text-slate-600 font-extrabold">Awaiting Match Completion</p>
            <p className="text-[10px] text-slate-400 max-w-xs leading-normal">Teams' win metrics will populate here automatically once initial matchups are finalized.</p>
          </div>
        )}
      </div>

    </div>
  );
}
