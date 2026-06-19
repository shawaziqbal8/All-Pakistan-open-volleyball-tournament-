import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { Match, Seat, TicketBooking, Team } from '../types';
import { saveToFirebase } from '../services/storeSync';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, MapPin, CreditCard, CheckCircle2, Table, ExternalLink } from 'lucide-react';

interface TicketBookingProps {
  matches: Match[];
  addNotification: (title: string, message: string, type: 'score' | 'schedule' | 'stat') => void;
  teams: Team[];
  onAddBookingToMetrics: (booking: TicketBooking) => void;
  showToast?: (message: string, type: 'info' | 'success' | 'error' | 'loading', duration?: number) => string;
  updateToast?: (id: string, message: string, type: 'info' | 'success' | 'error' | 'loading', duration?: number) => void;
}

export default function TicketBookingComponent({
  matches,
  addNotification,
  teams,
  onAddBookingToMetrics,
  showToast,
  updateToast,
}: TicketBookingProps) {
  const upcomingMatches = matches.filter((m) => m.status === 'Upcoming');
  const [selectedMatchId, setSelectedMatchId] = useState<string>(upcomingMatches[0]?.id || 'match_upcoming_1');
  
  // Seat state
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  // Checkout flow
  const [checkoutStep, setCheckoutStep] = useState<'seats' | 'payment' | 'success'>('seats');
  
  // Card details (replaced by Easypaisa)
  const [easypaisaTxnId, setEasypaisaTxnId] = useState('');
  const [paymentScreenshotBase64, setPaymentScreenshotBase64] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Synchronization status
  const [syncState, setSyncState] = useState<'Idle' | 'Syncing' | 'Success' | 'Failed'>('Idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TicketBooking | null>(null);

  const syncToastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!showToast || !updateToast) return;

    if (syncState === 'Syncing') {
      const id = showToast('Synchronizing ticket booking with Google Cloud...', 'loading', 0);
      syncToastIdRef.current = id;
    } else if (syncState === 'Success') {
      if (syncToastIdRef.current) {
        updateToast(syncToastIdRef.current, 'Ticket booking synchronized securely in the cloud!', 'success', 4000);
        syncToastIdRef.current = null;
      } else {
        showToast('Ticket booking synchronized securely in the cloud!', 'success', 4000);
      }
    } else if (syncState === 'Failed') {
      const errMsg = syncError ? ` (${syncError})` : '';
      if (syncToastIdRef.current) {
        updateToast(syncToastIdRef.current, `Cloud synchronization failed!${errMsg}`, 'error', 5000);
        syncToastIdRef.current = null;
      } else {
        showToast(`Cloud synchronization failed!${errMsg}`, 'error', 5000);
      }
    }
  }, [syncState, syncError, showToast, updateToast]);

  const activeMatch = matches.find((m) => m.id === selectedMatchId) || matches[1];

  // Initialize Seat Grid (8 rows, 10 columns)
  useEffect(() => {
    const freshSeats: Seat[] = [];
    
    for (let r = 0; r < 8; r++) {
      const rowChar = String.fromCharCode(65 + r); // A, B, C, D...
      const category = r < 2 ? 'Gold' : r < 5 ? 'Premium' : 'General';
      const price = category === 'Gold' ? 300 : category === 'Premium' ? 200 : 100;

      for (let c = 1; c <= 10; c++) {
        // Randomly pre-reserve some seats (25% density)
        const isReserved = Math.random() < 0.25;
        freshSeats.push({
          id: `${rowChar}-${c}`,
          category,
          row: rowChar,
          col: c,
          status: isReserved ? 'Reserved' : 'Available',
          price,
        });
      }
    }
    setSeats(freshSeats);
    setSelectedSeats([]);
    setCheckoutStep('seats');
  }, [selectedMatchId]);

  // No auth syncing since user has been removed

  // Handle seat clicks
  const handleSeatClick = (seatId: string) => {
    const target = seats.find((s) => s.id === seatId);
    if (!target || target.status === 'Reserved') return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats((prev) => prev.filter((id) => id !== seatId));
      setSeats((prev) =>
        prev.map((s) => (s.id === seatId ? { ...s, status: 'Available' } : s))
      );
    } else {
      // Limit to 6 tickets
      if (selectedSeats.length >= 6) {
        alert('You can reserve a maximum of 6 seats per transaction.');
        return;
      }
      setSelectedSeats((prev) => [...prev, seatId]);
      setSeats((prev) =>
        prev.map((s) => (s.id === seatId ? { ...s, status: 'Selected' } : s))
      );
    }
  };

  const selectedSeatsData = seats.filter((s) => selectedSeats.includes(s.id));
  const totalPrice = selectedSeatsData.reduce((sum, s) => sum + s.price, 0);
  const totalQuantity = selectedSeats.length;

  // Process Booking and Payment simulation
  const processCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) {
      alert('Spectator details are required to issue booking tickets.');
      return;
    }
    if (!easypaisaTxnId || easypaisaTxnId.length < 11) {
      alert('Valid 11-digit Easypaisa TRX ID is required to process booking payment.');
      return;
    }

    setSubmittingPayment(true);
    setSyncState('Idle');
    setSyncError(null);

    // Simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const bookingId = `APV-${Math.floor(100000 + Math.random() * 900000)}`;
    const categoryName = selectedSeatsData[0]?.category || 'General';
    const timestamp = Date.now();

    const newBooking: TicketBooking = {
      id: bookingId,
      userId: 'guest', // Using guest since login is not required
      matchId: selectedMatchId,
      matchName: `${activeMatch.teamA.name} vs ${activeMatch.teamB.name}`,
      customerName,
      customerEmail,
      category: categoryName,
      seats: selectedSeats,
      totalPrice,
      paymentStatus: 'Pending',
      easypaisaTxnId,
      bookingTime: timestamp,
      paymentScreenshotBase64,
    } as any;

    setReceipt(newBooking);
    onAddBookingToMetrics(newBooking);

    // Trigger push notification inside app
    addNotification(
      'Booking Request Submitted',
      `Your request for ${totalQuantity} tickets in ${categoryName} stands is placed and pending verification. Receipt ID: ${bookingId}`,
      'schedule'
    );

    setSyncState('Syncing');
    try {
      await saveToFirebase('bookings', newBooking);
      setSyncState('Success');
    } catch (err: any) {
      console.warn('Failed to sync to Google Cloudspace:', err);
      setSyncError(err.message || 'Verification / Cloud API save issue.');
      setSyncState('Failed');
    }

    setSubmittingPayment(false);
    setCheckoutStep('success');

    // Update Seat database to "Closed/Reserved" locally for UX smoothness
    setSeats((prev) =>
      prev.map((s) => (selectedSeats.includes(s.id) ? { ...s, status: 'Reserved' } : s))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800" id="ticket_booking_container">
      
      {/* Title block */}
      <div className="mb-6 pb-4 border-b border-slate-200">
        <span className="bg-emerald-100 text-emerald-800 border border-emerald-250 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
          🎟️ Instant Ticket Booking
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          Stadium Seating Map & Checkout
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Pick precise stands, input credit card details via secure gateway interfaces, and write synchronizations directly into Google Cloud.
        </p>
      </div>

      {checkoutStep === 'seats' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Seating Layout Canvas (2/3 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Match matchup selector card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Select Fixture</label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="bg-slate-50 border border-slate-205 border-slate-200 rounded-xl text-xs font-bold text-slate-800 px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {upcomingMatches.length === 0 ? (
                    <option>No upcoming fixtures scheduled</option>
                  ) : (
                    upcomingMatches.map((m) => (
                      <option key={m.id} value={m.id}>
                        🏐 {m.teamA.name.split(' ')[0]} vs {m.teamB.name.split(' ')[0]} ({m.date})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="text-xs text-slate-655 text-slate-700 flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-150">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span className="font-bold">{activeMatch.venue}</span>
              </div>
            </div>

            {/* Simulated court layout screen */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center shadow-xl">
              
              {/* Volleyball court front projection */}
              <div className="w-full max-w-sm h-8 bg-emerald-500 rounded-xl border border-emerald-400 text-slate-950 flex items-center justify-center font-black text-[10px] uppercase shadow-lg tracking-widest mb-10">
                🏐 Volleyball Court / Stage Area
              </div>

              {/* Grid map of seats */}
              <div className="grid grid-cols-10 gap-2 sm:gap-3 w-full max-w-lg select-none">
                {seats.map((seat) => {
                  const isGold = seat.category === 'Gold';
                  const isPremium = seat.category === 'Premium';
                  
                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat.id)}
                      disabled={seat.status === 'Reserved'}
                      className={`h-8 sm:h-9 rounded-lg text-[10px] flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm ${
                        seat.status === 'Selected'
                          ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300 border border-emerald-300 font-black shadow-emerald-500/50 hover:bg-emerald-300'
                          : seat.status === 'Reserved'
                            ? 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed font-medium'
                            : isGold
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 font-extrabold'
                              : isPremium
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-emerald-50 border border-emerald-500 font-bold'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 font-semibold'
                      }`}
                      title={`${seat.id} (${seat.category} - Rs. ${seat.price})`}
                      aria-label={`Select seat ${seat.id}`}
                    >
                      <span>{seat.id}</span>
                    </button>
                  );
                })}
              </div>

              {/* Legends checklist */}
              <div className="flex flex-wrap items-center justify-center gap-5 mt-10 text-[11px] border-t border-slate-800 pt-5 w-full">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 bg-amber-400 border border-amber-300 rounded"></span>
                  <span className="text-slate-300 font-bold tracking-wide">Cold Drink Gold (PKR 300)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 bg-emerald-600 border border-emerald-500 rounded"></span>
                  <span className="text-slate-300 font-bold tracking-wide">Mineral Water Premium (PKR 200)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 bg-slate-700 border border-slate-600 rounded"></span>
                  <span className="text-slate-300 font-bold tracking-wide">General Sofa (PKR 100)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 bg-slate-800/50 border border-slate-700/50 rounded"></span>
                  <span className="text-slate-500 font-bold tracking-wide">Reserved</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 bg-emerald-400 rounded"></span>
                  <span className="text-white font-extrabold tracking-wide">Chosen</span>
                </div>
              </div>

            </div>

          </div>

          {/* Checkout pricing details card (1/3 col) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">Purchase Summary</h3>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3.5 text-xs text-slate-655 text-slate-600">
                <p className="flex justify-between font-mono">
                  <span>Seats:</span>
                  <strong className="text-slate-805 text-slate-900 font-bold truncate max-w-[150px]">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Match Day Matchup:</span>
                  <strong className="text-slate-900 font-bold text-right truncate max-w-[150px]">{activeMatch.teamA.name.split(' ')[0]} vs {activeMatch.teamB.name.split(' ')[0]}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Subtotal Price:</span>
                  <strong className="text-slate-900 font-bold font-mono">Rs. {totalPrice.toLocaleString()}</strong>
                </p>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs font-extrabold text-slate-900">
                  <span>EST. TOTAL FEE</span>
                  <span className="text-emerald-700 font-black font-mono text-base">Rs. {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setCheckoutStep('payment')}
                disabled={selectedSeats.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs tracking-wide transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Navigate to payment</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Payment checkout step */}
      {checkoutStep === 'payment' && (
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-white">
          
          <div className="pb-5 border-b border-slate-800 flex justify-between items-center mb-6">
            <button
              onClick={() => setCheckoutStep('seats')}
              aria-label="Back to seats selection"
              className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer transition"
            >
              ← Back to seats
            </button>
            <span className="text-xs text-emerald-400 font-mono font-bold tracking-widest uppercase">Secure Gate Hub</span>
          </div>

          {/* Interactive Easypaisa Payment display */}
          <div className="w-full rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-emerald-400 text-slate-950 p-5 flex flex-col justify-between shadow-lg relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full filter blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-950 font-black font-mono tracking-widest uppercase">Spectator Pass Checkout</span>
              <CreditCard className="h-5 w-5 text-slate-950" />
            </div>

            <div className="mt-4 border border-slate-950/20 bg-slate-950/10 rounded-xl p-4">
              <p className="text-[10px] text-slate-900 font-bold mb-2 uppercase tracking-wider">Please transfer ticket amount to:</p>
              
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-800 font-bold">Account Bank</span>
                <span className="font-extrabold text-slate-950 text-sm tracking-wide">Easypaisa</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-800 font-bold">Account Number</span>
                <span className="font-mono font-black text-slate-950 tracking-widest text-sm">03416000758</span>
              </div>
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-950/20">
                <span className="text-[11px] text-slate-800 font-bold">Account Title</span>
                <span className="font-black text-slate-950 text-sm uppercase tracking-wide">Shawaz Iqbal</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Total Due</span>
                <span className="font-mono font-black text-slate-950 text-xl tracking-tighter">PKR {selectedSeatsData.reduce((sum, s) => sum + s.price, 0)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={processCheckout} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shauzi Iqbal"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl text-xs py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600 font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Email / WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="e.g. 03001234567"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl text-xs py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Easypaisa Transaction ID (TID)</label>
              <input
                type="text"
                placeholder="e.g. 15993882733"
                required
                value={easypaisaTxnId}
                onChange={(e) => setEasypaisaTxnId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700/50 rounded-xl text-xs py-2.5 px-3 mb-3 text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono tracking-widest placeholder-slate-600"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Upload Payment Slip / Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPaymentScreenshotBase64(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-900 file:text-emerald-400 hover:file:bg-emerald-800"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                You will be able to send your payment screenshot via <strong className="text-emerald-400">WhatsApp</strong> directly from the next screen.
              </p>
            </div>
            
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <p className="text-xs text-white font-bold mb-2">Important Instructions:</p>
              <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                <li>Transfer the exact amount to the Easypaisa account above.</li>
                <li>Enter the 11-digit TID above to submit your booking for verification.</li>
                <li>Use the generated <strong className="text-emerald-400">WhatsApp link on the receipt screen</strong> to send your transaction screenshot to expedite approval.</li>
              </ul>
            </div>

            {/* Price confirmation */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs text-slate-500 mt-6 font-mono font-medium shadow-inner">
              <span className="uppercase tracking-widest">Estimated Pass Deduction</span>
              <strong className="text-emerald-400 font-black text-sm tracking-tight">Rs. {totalPrice.toLocaleString()} PKR</strong>
            </div>

            <button
              type="submit"
              disabled={submittingPayment}
              aria-label="Submit payment validation"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl text-xs tracking-widest uppercase transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer mt-6"
            >
              {submittingPayment ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying card algorithms...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Execute secure Payment</span>
                </>
              )}
            </button>

          </form>

        </div>
      )}

      {/* Success Receipt Feedback */}
      {checkoutStep === 'success' && receipt && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-6">
          
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-amber-500" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Verification Pending</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-semibold">
              Receipt code {receipt.id} submitted for review. Your seats will be confirmed once the administrator validates the transaction.
            </p>
          </div>

          {/* Cloud synchronization results */}
          <div className="p-4 rounded-2xl border text-xs text-left leading-normal space-y-2 bg-slate-50 border-slate-205 border-slate-200">
            <h4 className="font-extrabold text-slate-800 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <Table className="h-4.5 w-4.5 text-emerald-600" />
              <span>Cloud Sync Log</span>
            </h4>

            {syncState === 'Syncing' && (
              <p className="text-amber-600 animate-pulse font-mono font-bold">🔄 Saving into Google Cloud...</p>
            )}
            
            {syncState === 'Success' && (
              <div className="space-y-1">
                <p className="text-emerald-705 text-emerald-700 font-extrabold flex items-center">
                  <span>🟢 Synced! Pass securely stored online.</span>
                </p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Pass data (Seats: {receipt.seats.join(', ')}, Zone: {receipt.category}) listed safely online inside your active tournament cloud database.
                </p>
              </div>
            )}

            {syncState === 'Failed' && (
              <div className="space-y-1.5">
                <p className="text-red-655 text-red-600 font-semibold">❌ Sync Alert: Database access issue</p>
                <p className="text-[11px] text-slate-500 font-mono leading-relaxed">Error: {syncError || 'Failed to authorize write operations.'}</p>
                <p className="text-[10px] text-slate-400 leading-normal">Ticket is reserved locally, but could not be logged to Drive. Sign in with Google again to authorize database privileges.</p>
              </div>
            )}

            {syncState === 'Idle' && (
              <div className="space-y-2">
                <p className="text-amber-700 font-bold">🟡 Registered locally in core cache</p>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">
                  We saved your ticket locally on this browser. Note that this requires admin approval.
                </p>
              </div>
            )}
          </div>

          {/* Ticket boarding pass graphic receipt in dark emerald */}
          <div className="bg-emerald-950 p-6 rounded-3xl text-left space-y-4 font-mono text-xs text-white relative">
            <div className="absolute left-0 right-0 top-1/2 h-[0.5px] border-b border-dashed border-emerald-800/80 leading-none"></div>
            
            <div className="flex justify-between items-center pb-2 border-b border-emerald-900">
              <span className={`font-extrabold ${receipt.paymentStatus === 'Pending' ? 'text-amber-400' : 'text-emerald-400'}`}>{receipt.paymentStatus === 'Pending' ? 'PENDING TICKET' : 'BOARDING PASS'}</span>
              <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-extrabold">All Pakistan Tournament</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-emerald-900">
              <div>
                <span className="text-[9px] text-emerald-500 uppercase block">SPECTATOR</span>
                <strong className="text-emerald-100 uppercase text-xs">{receipt.customerName}</strong>
              </div>
              <div>
                <span className="text-[9px] text-emerald-500 uppercase block">FIXTURE MATCH</span>
                <strong className="text-emerald-100 truncate block text-xs">{receipt.matchName}</strong>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="grid grid-cols-3 gap-2 flex-grow">
                <div>
                  <span className="text-[9px] text-emerald-500 uppercase block">STAND ZONE</span>
                  <strong className="text-emerald-100">{receipt.category}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-500 uppercase block">SEATS</span>
                  <strong className="text-emerald-400 text-xs font-black">{receipt.seats.join(', ')}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-500 uppercase block">PRICE</span>
                  <strong className="text-emerald-400">Rs.{receipt.totalPrice}</strong>
                </div>
              </div>
              
              {/* QR Code Section */}
              <div className="ml-4 flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-inner">
                {receipt.paymentStatus === 'Verified' ? (
                  <QRCodeSVG value={receipt.id} size={64} level="H" config={{ margin: 0 }} />
                ) : (
                  <div className="w-16 h-16 flex flex-col items-center justify-center text-center opacity-50 bg-slate-100 text-slate-500">
                    <span className="text-[8px] font-bold">QR LOCKED</span>
                    <span className="text-[7px]">Unverified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mock Confirmation Email View */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                  📧 Live Mail Server Dispatch
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">Dispatched to: {receipt.customerEmail}</span>
            </div>

            <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
              {/* Email headers */}
              <div className="p-3 bg-slate-50 border-b border-slate-150 text-[10px] sm:text-[11px] text-slate-650 space-y-1 font-sans">
                <div><strong>From:</strong> All Pakistan Volleyball Federation <code className="text-emerald-700 bg-emerald-50 px-1 rounded text-[9px]">noreply@pakistanvolleyball.org</code></div>
                <div><strong>To:</strong> {receipt.customerName} <code className="text-slate-600 bg-slate-100 px-1 rounded text-[9px]">&lt;{receipt.customerEmail}&gt;</code></div>
                <div><strong>Subject:</strong> 🎟️ Booking Request Received: Spectator Pass for {receipt.matchName} [No. {receipt.id}]</div>
                <div><strong>Date:</strong> {new Date().toLocaleString()} (GMT+5)</div>
              </div>

              {/* Email Body */}
              <div className="p-5 font-sans space-y-5 text-slate-800 text-xs leading-relaxed">
                {/* Header graphic */}
                <div className="text-center pb-4 border-b border-slate-100">
                  <div className="inline-block bg-emerald-700 text-white font-extrabold px-3 py-1 rounded-full text-[9px] uppercase tracking-widest">
                    OFFICIAL VOUCHER
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-2 uppercase">ALL PAKISTAN OPEN CUP</h4>
                  <p className="text-[10px] text-slate-500">Liaquat Gymnasium, Islamabad</p>
                </div>

                {/* Body message */}
                <p>
                  Dear <strong>{receipt.customerName}</strong>,
                </p>
                {receipt.paymentStatus === 'Pending' ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-[11px] mb-2 font-medium">
                    <p>
                      Thank you for submitting your booking! Your payment of <strong>{receipt.seats.length}</strong> spectator ticket(s) is currently <strong>Pending Verification</strong> by tournament admins. You will receive entry clearance once your Easypaisa TID <strong>{receipt.easypaisaTxnId}</strong> is confirmed.
                    </p>
                  </div>
                ) : receipt.paymentStatus === 'Verified' ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-[11px] mb-2 font-medium">
                    <p>
                       Your purchase of <strong>{receipt.seats.length}</strong> spectator ticket(s) has been secured and <strong>Verified</strong>. Show this page or provide your Reference ID at the stadium gate.
                    </p>
                  </div>
                ) : (
                  <p>
                    Thank you for registering. Your request for <strong>{receipt.seats.length}</strong> spectator ticket(s) has been recorded and is currently in {receipt.paymentStatus} status.
                  </p>
                )}

                {/* Ticket parameters */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between border-b border-slate-200/80 pb-1.5 font-mono text-[10px] sm:text-[11px]">
                    <span className="text-slate-400">ORDER REF:</span>
                    <strong className="text-slate-800">#{receipt.id}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-1.5 font-mono text-[10px] sm:text-[11px]">
                    <span className="text-slate-400">STATUS:</span>
                    <strong className={receipt.paymentStatus === 'Pending' ? 'text-amber-600' : receipt.paymentStatus === 'Verified' ? 'text-emerald-600' : 'text-slate-800 uppercase'}>
                      {receipt.paymentStatus}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-1.5 font-mono text-[10px] sm:text-[11px]">
                    <span className="text-slate-400">MATCH:</span>
                    <strong className="text-slate-800 text-right">{receipt.matchName}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-1.5 font-mono text-[10px] sm:text-[11px]">
                    <span className="text-slate-400">ZONE STATUS:</span>
                    <strong className="text-emerald-700">{receipt.category} Ranks</strong>
                  </div>
                  <div className="flex justify-between pb-0.5 font-mono text-[10px] sm:text-[11px]">
                    <span className="text-slate-400">ASSIGNED SEATS:</span>
                    <strong className="text-emerald-700 font-extrabold">{receipt.seats.join(', ')}</strong>
                  </div>
                </div>

                {/* Simulated Barcode */}
                <div className="py-4 flex flex-col items-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200/80">
                  <div className="font-mono text-base text-slate-800 font-bold tracking-[0.25em] select-none">
                    ||| | |||| | || | ||| || |||
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">SCAN AT GATE {receipt.category === 'Gold' ? 'A (VIP)' : receipt.category === 'Premium' ? 'B' : 'C'} ENTRY</span>
                </div>

                {/* Advisory notice */}
                <div className="text-[10px] sm:text-[11px] text-slate-500 bg-amber-50 border border-amber-200/60 p-3 rounded-lg space-y-0.5">
                  <h5 className="font-extrabold text-amber-800">⚠️ Spectator Instructions:</h5>
                  <p>1. Please present either the printout or the digital version of this receipt at the gymnasium gate.</p>
                  <p>2. Gates close exactly 30 minutes before kick-off. Late ticket entries will be waitlisted.</p>
                  <p>3. Photography is permitted for fan feeds; please follow community social guidelines.</p>
                </div>
                
                <div className="flex justify-center mt-3 pt-3">
                  <a
                    href={`https://wa.me/923416000758?text=Hello,%20here%20is%20my%20payment%20screenshot%20for%20Booking%20ID%20${receipt.id}%20with%20Transaction%20ID%20${receipt.easypaisaTxnId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span>Send Payment Screenshot via WhatsApp</span>
                  </a>
                </div>

                {/* Greetings */}
                <div className="pt-3 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-400">
                  <p>Best regards,</p>
                  <p className="font-bold text-slate-500">Ticketing Logistics Division</p>
                  <p>All Pakistan Volleyball Federation</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 mt-4">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition cursor-pointer flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect width="12" height="8" x="6" y="14" rx="1"/></svg>
              <span>Print PDF Version</span>
            </button>
            <button
              onClick={() => {
                setCheckoutStep('seats');
                setSelectedSeats([]);
                setReceipt(null);
              }}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-6 rounded-xl transition cursor-pointer"
            >
              Issue Another Pass
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
