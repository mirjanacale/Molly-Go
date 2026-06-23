import { useState } from "react";

const STEPS = { DATES: 0, RATES: 1, GUEST: 2, CONFIRM: 3 };

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function dayAfter() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

export default function BookingModal({ hotel, onClose }) {
  const [step, setStep] = useState(STEPS.DATES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [checkin, setCheckin] = useState(tomorrow());
  const [checkout, setCheckout] = useState(dayAfter());
  const [adults, setAdults] = useState(2);

  const [rates, setRates] = useState([]);
  const [hotelInfo, setHotelInfo] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);

  const [guest, setGuest] = useState({
    firstName: "", lastName: "", email: "",
  });

  const [booking, setBooking] = useState(null);

  async function searchRates() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        hotelId: hotel.id,
        checkin,
        checkout,
        adults: String(adults),
        environment: "sandbox",
      });
      const res = await fetch(`/search-rates?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setHotelInfo(data.hotelInfo || null);

      const flatRates = (data.rateInfo || []).flat().filter(Boolean);
      if (flatRates.length === 0) {
        setError("No rooms available for these dates. Try different dates.");
        return;
      }

      setRates(flatRates);
      setStep(STEPS.RATES);
    } catch (err) {
      setError("Could not fetch rates. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePrebook() {
    if (!selectedRate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/prebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateId: selectedRate.offerId,
          environment: "sandbox",
        }),
      });
      const data = await res.json();

      if (data.error || !data.success?.data) {
        setError(data.error || "Prebook failed. Please try again.");
        return;
      }

      const pb = data.success.data;
      await completeBooking(pb.prebookId, pb.transactionId);
    } catch (err) {
      setError("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function completeBooking(prebookId, transactionId) {
    try {
      const params = new URLSearchParams({
        prebookId,
        guestFirstName: guest.firstName,
        guestLastName: guest.lastName,
        guestEmail: guest.email,
        transactionId: transactionId || "sandbox_txn",
        environment: "sandbox",
      });

      const res = await fetch(`/book?${params}`);
      const text = await res.text();

      let confirmationId = null;
      const match = text.match(/Booking ID:\s*([^\s<]+)/);
      if (match) confirmationId = match[1];

      setBooking({
        confirmationId: confirmationId || prebookId,
        hotelName: hotel.name,
        city: hotel.city,
        checkin,
        checkout,
        guests: adults,
        guestName: `${guest.firstName} ${guest.lastName}`,
        guestEmail: guest.email,
      });
      setStep(STEPS.CONFIRM);
    } catch (err) {
      setError("Could not complete booking. Please try again.");
    }
  }

  function handleGuestSubmit(e) {
    e.preventDefault();
    if (!guest.firstName || !guest.lastName || !guest.email) return;
    handlePrebook();
  }

  const hotelName = hotelInfo?.name || hotel.name;
  const hotelImage = hotel.image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg
                      max-h-[90vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>

        {/* Hotel header */}
        <div className="relative h-40 overflow-hidden rounded-t-2xl">
          {hotelImage ? (
            <img src={hotelImage} alt={hotelName}
                 className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-molly-amber to-molly-orange" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-lg font-poppins leading-tight">
              {hotelName}
            </h3>
            <p className="text-white/80 text-sm">
              📍 {hotel.city}{hotel.country ? `, ${hotel.country.toUpperCase()}` : ""}
            </p>
          </div>
          <button onClick={onClose}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/30 hover:bg-black/50
                             rounded-full flex items-center justify-center text-white
                             transition-colors text-lg leading-none">
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-3 bg-orange-50 border-b border-orange-100">
          {["Dates", "Rates", "Details", "Confirmed"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${step >= i
                  ? "bg-gradient-to-r from-molly-amber to-molly-orange text-white"
                  : "bg-gray-200 text-gray-400"}`}>
                {step > i ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline
                ${step >= i ? "text-molly-orange" : "text-gray-400"}`}>
                {label}
              </span>
              {i < 3 && <div className={`w-6 h-0.5 ${step > i ? "bg-molly-amber" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="p-5">

          {/* ===== STEP 1: DATES ===== */}
          {step === STEPS.DATES && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 font-poppins">
                Select your dates
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Check-in
                  </label>
                  <input type="date" value={checkin}
                         onChange={(e) => setCheckin(e.target.value)}
                         min={tomorrow()}
                         className="w-full px-3 py-2.5 border border-gray-300 rounded-xl
                                    text-sm focus:outline-none focus:ring-2
                                    focus:ring-molly-amber focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Check-out
                  </label>
                  <input type="date" value={checkout}
                         onChange={(e) => setCheckout(e.target.value)}
                         min={checkin}
                         className="w-full px-3 py-2.5 border border-gray-300 rounded-xl
                                    text-sm focus:outline-none focus:ring-2
                                    focus:ring-molly-amber focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Guests
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-10 h-10 rounded-xl border border-gray-300
                                     flex items-center justify-center text-lg
                                     hover:bg-gray-50 transition-colors">
                    −
                  </button>
                  <span className="text-lg font-semibold w-8 text-center">{adults}</span>
                  <button onClick={() => setAdults(Math.min(6, adults + 1))}
                          className="w-10 h-10 rounded-xl border border-gray-300
                                     flex items-center justify-center text-lg
                                     hover:bg-gray-50 transition-colors">
                    +
                  </button>
                  <span className="text-sm text-gray-500">
                    {adults === 1 ? "adult" : "adults"}
                  </span>
                </div>
              </div>

              <button onClick={searchRates} disabled={loading}
                      className="w-full py-3 rounded-xl text-white font-semibold
                                 bg-gradient-to-r from-molly-amber to-molly-orange
                                 hover:shadow-lg hover:shadow-amber-200
                                 hover:-translate-y-0.5 active:translate-y-0
                                 disabled:opacity-50 transition-all">
                {loading ? "Searching..." : "Search Availability"}
              </button>
            </div>
          )}

          {/* ===== STEP 2: RATES ===== */}
          {step === STEPS.RATES && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 font-poppins">
                  Available Rooms
                </h4>
                <button onClick={() => { setStep(STEPS.DATES); setError(null); }}
                        className="text-xs text-molly-orange hover:underline">
                  ← Change dates
                </button>
              </div>

              <p className="text-xs text-gray-500">
                {checkin} → {checkout} · {adults} {adults === 1 ? "guest" : "guests"}
              </p>

              <div className="space-y-3">
                {rates.map((rate, i) => (
                  <div key={i}
                       onClick={() => setSelectedRate(rate)}
                       className={`p-4 rounded-xl border-2 cursor-pointer transition-all
                         ${selectedRate?.offerId === rate.offerId
                           ? "border-molly-amber bg-orange-50 shadow-md"
                           : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/50"}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {rate.rateName || "Standard Room"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{rate.board}</p>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full
                          ${rate.refundableTag === "RFN"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"}`}>
                          {rate.refundableTag === "RFN" ? "Free cancellation" : "Non-refundable"}
                        </span>
                      </div>
                      <div className="text-right">
                        {rate.originalRate !== rate.retailRate && (
                          <p className="text-xs text-gray-400 line-through">
                            ${rate.originalRate}
                          </p>
                        )}
                        <p className="text-lg font-bold text-molly-orange">
                          ${rate.retailRate}
                        </p>
                        <p className="text-xs text-gray-500">total</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => { if (selectedRate) { setStep(STEPS.GUEST); setError(null); } }}
                      disabled={!selectedRate}
                      className="w-full py-3 rounded-xl text-white font-semibold
                                 bg-gradient-to-r from-molly-amber to-molly-orange
                                 hover:shadow-lg hover:shadow-amber-200
                                 hover:-translate-y-0.5 active:translate-y-0
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-all">
                Continue to Guest Details
              </button>
            </div>
          )}

          {/* ===== STEP 3: GUEST DETAILS ===== */}
          {step === STEPS.GUEST && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 font-poppins">
                  Guest Details
                </h4>
                <button type="button"
                        onClick={() => { setStep(STEPS.RATES); setError(null); }}
                        className="text-xs text-molly-orange hover:underline">
                  ← Change room
                </button>
              </div>

              {/* Booking summary */}
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{selectedRate?.rateName}</span>
                  <span className="font-bold text-molly-orange">
                    ${selectedRate?.retailRate}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {checkin} → {checkout} · {adults} {adults === 1 ? "guest" : "guests"}
                  · {selectedRate?.board}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    First Name
                  </label>
                  <input type="text" required value={guest.firstName}
                         onChange={(e) => setGuest({ ...guest, firstName: e.target.value })}
                         placeholder="John"
                         className="w-full px-3 py-2.5 border border-gray-300 rounded-xl
                                    text-sm focus:outline-none focus:ring-2
                                    focus:ring-molly-amber focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Last Name
                  </label>
                  <input type="text" required value={guest.lastName}
                         onChange={(e) => setGuest({ ...guest, lastName: e.target.value })}
                         placeholder="Doe"
                         className="w-full px-3 py-2.5 border border-gray-300 rounded-xl
                                    text-sm focus:outline-none focus:ring-2
                                    focus:ring-molly-amber focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input type="email" required value={guest.email}
                       onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                       placeholder="john@example.com"
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-xl
                                  text-sm focus:outline-none focus:ring-2
                                  focus:ring-molly-amber focus:border-transparent" />
              </div>

              <button type="submit" disabled={loading}
                      className="w-full py-3 rounded-xl text-white font-semibold
                                 bg-gradient-to-r from-molly-amber to-molly-orange
                                 hover:shadow-lg hover:shadow-amber-200
                                 hover:-translate-y-0.5 active:translate-y-0
                                 disabled:opacity-50 transition-all">
                {loading ? "Processing Booking..." : `Confirm & Pay $${selectedRate?.retailRate}`}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Secure booking powered by LiteAPI
              </p>
            </form>
          )}

          {/* ===== STEP 4: CONFIRMATION ===== */}
          {step === STEPS.CONFIRM && booking && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full
                              flex items-center justify-center">
                <span className="text-3xl">✅</span>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 text-lg font-poppins">
                  Booking Confirmed!
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Your trip to {booking.city} is booked
                </p>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 text-left space-y-2
                              border border-orange-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Confirmation</span>
                  <span className="font-mono font-semibold text-molly-orange">
                    {booking.confirmationId}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hotel</span>
                  <span className="font-medium text-gray-800">{booking.hotelName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Dates</span>
                  <span className="text-gray-800">{booking.checkin} → {booking.checkout}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Guest</span>
                  <span className="text-gray-800">{booking.guestName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-800">{booking.guestEmail}</span>
                </div>
              </div>

              <button onClick={onClose}
                      className="w-full py-3 rounded-xl text-white font-semibold
                                 bg-gradient-to-r from-molly-amber to-molly-orange
                                 hover:shadow-lg hover:shadow-amber-200
                                 hover:-translate-y-0.5 active:translate-y-0
                                 transition-all">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
