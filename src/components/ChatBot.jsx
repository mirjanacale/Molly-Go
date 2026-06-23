import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import BookingModal from "./BookingModal.jsx";

const COUNTRY_HINTS = {
  berlin: "DE", dublin: "IE", paris: "FR", rome: "IT",
  london: "GB", madrid: "ES", lisbon: "PT", amsterdam: "NL",
  vienna: "AT", prague: "CZ", budapest: "HU", barcelona: "ES",
  munich: "DE", milan: "IT", florence: "IT", venice: "IT",
  dubai: "AE", "new york": "US", tokyo: "JP", seoul: "KR",
  singapore: "SG", bangkok: "TH", sydney: "AU", toronto: "CA",
  zagreb: "HR", marrakech: "MA", kyoto: "JP", osaka: "JP",
};

function getCountryCode(city) {
  if (!city) return "";
  return COUNTRY_HINTS[city.toLowerCase().trim()] || "";
}

function extractCity(message) {
  const patterns = [
    /(?:hotels?|stay|accommodation|events?|festivals?|guide)\s+(?:in|at|near)\s+([A-Za-z\s]+)/i,
    /(?:in|at|to|near|visiting)\s+([A-Za-z\s]+?)(?:\s|$|[.!?])/i,
    /(?:trip to|go to|explore)\s+([A-Za-z\s]+)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function getHotelDescription(hotel) {
  const raw = hotel.description || hotel.hotelDescription
    || hotel.shortDescription || hotel.summary || "";
  const text = stripHtml(raw);
  if (!text) return null;
  return text.length > 120 ? text.slice(0, 120) + "…" : text;
}

const PLACEHOLDER_GRADIENTS = [
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-teal-400 to-cyan-500",
  "from-violet-400 to-purple-500",
  "from-emerald-400 to-green-500",
];

const HotelCard = ({ hotel, index = 0, onBookHotel }) => {
  const [imgError, setImgError] = useState(false);
  const description = getHotelDescription(hotel);
  const hasImage = hotel.image && !imgError;
  const gradient = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-3
                    border border-gray-100 hover:shadow-xl transition-all
                    hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative h-36 overflow-hidden">
        {hasImage ? (
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}
                          flex items-center justify-center`}>
            <span className="text-4xl drop-shadow-lg">🏨</span>
          </div>
        )}
        {/* Price badge */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm
                        rounded-lg px-2 py-1 shadow-sm">
          <span className="text-xs font-bold text-molly-orange">
            {hotel.price || "Check price"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-semibold text-gray-800 text-sm leading-tight
                       line-clamp-1">
          {hotel.name}
        </h4>

        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-molly-orange text-xs">📍</span>
          <span className="text-xs text-gray-500 line-clamp-1">
            {[hotel.address, hotel.city, hotel.country?.toUpperCase()]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>

        {description && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Book Now */}
        <button
          onClick={() => onBookHotel?.(hotel)}
          className="mt-3 w-full text-center text-sm font-semibold
                     py-2 rounded-lg text-white
                     bg-gradient-to-r from-molly-amber to-molly-orange
                     hover:shadow-lg hover:shadow-amber-200
                     hover:-translate-y-0.5
                     active:translate-y-0
                     transition-all"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

const ChatBot = forwardRef((props, ref) => {
  const [messages, setMessages] = useState([
    {
      id: 1, role: "assistant",
      content: "Hi there! 🌍 I'm MOLLY, your travel buddy!\n\n"
        + "Tell me a city and I'll find hotels, events, or a travel guide for you.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bookingHotel, setBookingHotel] = useState(null);
  const messagesEndRef = useRef(null);
  const pendingMessageRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role, content, hotelResults = null) => {
    setMessages((prev) => [...prev, {
      id: Date.now(), role, content,
      timestamp: new Date(), hotelResults,
    }]);
  };

  useEffect(() => {
    if (pendingMessageRef.current && !isLoading) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      processMessage(msg);
    }
  }, [isLoading]);

  useImperativeHandle(ref, () => ({
    sendMessage(text) {
      if (isLoading) {
        pendingMessageRef.current = text;
        return;
      }
      processMessage(text);
    },
  }));

  function processMessage(text) {
    if (!text.trim()) return;
    setInput("");
    setIsLoading(true);
    addMessage("user", text);
    doSearch(text);
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    addMessage("user", userMessage);
    doSearch(userMessage);
  };

  async function doSearch(userMessage) {
    try {
      const city = extractCity(userMessage);
      const countryCode = city ? getCountryCode(city) : "";

      const isHotelQuery = /\b(hotels?|accommodation|stay|book|room|where to stay|lodging)\b/i
        .test(userMessage);
      const isEventQuery = /\b(events?|festivals?|concerts?|show|entertainment|things? to do)\b/i
        .test(userMessage);

      if (isHotelQuery && city) {
        const params = new URLSearchParams({ city, countryCode });
        const res = await fetch(`/api/hotels?${params}`);
        const data = await res.json();
        const hotels = data.items || [];

        if (hotels.length > 0) {
          addMessage("assistant",
            `Found ${hotels.length} hotels in ${city}! 🏨`,
            hotels.slice(0, 5));
        } else {
          addMessage("assistant",
            `I couldn't find hotels in ${city} right now. Try a different city or check the spelling.`);
        }
      } else if (isEventQuery && city) {
        const params = new URLSearchParams({ city, countryCode });
        const res = await fetch(`/api/events?${params}`);
        const data = await res.json();
        const events = data.data || data.items || [];

        if (events.length > 0) {
          const eventList = events.slice(0, 3)
            .map((e) => `• ${e.name}`)
            .join("\n");
          addMessage("assistant",
            `Found ${events.length} events in ${city}! 🎪\n\n${eventList}`);
        } else {
          addMessage("assistant",
            `No events found in ${city} right now. Try another destination!`);
        }
      } else if (city) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        });
        const data = await res.json();

        if (data.hotels && data.hotels.length > 0) {
          addMessage("assistant", data.reply || `Here's what I found in ${city}:`,
            data.hotels.slice(0, 5));
        } else if (data.reply) {
          addMessage("assistant", data.reply);
        } else {
          addMessage("assistant",
            `I'd love to help you explore ${city}! Try asking for:\n`
            + `• "Hotels in ${city}"\n`
            + `• "Events in ${city}"\n`
            + `• "Travel guide for ${city}"`);
        }
      } else {
        addMessage("assistant",
          "I can help you find hotels, events, and travel tips! "
          + "Just mention a city — like \"hotels in Paris\" or \"events in Tokyo\".");
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessage("assistant",
        "Oops! I'm having trouble connecting right now. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasResults = messages.some((m) => m.hotelResults?.length);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className={`overflow-y-auto ${hasResults ? "flex-1" : ""}`}>
        <div className="max-w-4xl mx-auto px-6 py-5 space-y-4">
        {messages.map((message) => (
          <div key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`${message.hotelResults?.length ? "w-full" : "max-w-[75%]"}`}>
              <div className={`px-4 py-3 rounded-2xl backdrop-blur-sm ${
                message.role === "user"
                  ? "bg-molly-amber/85 text-white rounded-br-md shadow-lg"
                  : "bg-white/80 text-gray-800 shadow-lg rounded-bl-md border border-white/50"
              }`}>
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>

              {message.hotelResults && message.hotelResults.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {message.hotelResults.map((hotel, i) => (
                    <HotelCard key={hotel.id || i} hotel={hotel} index={i}
                               onBookHotel={setBookingHotel} />
                  ))}
                </div>
              )}

              <div className={`text-xs text-gray-400 mt-1 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl rounded-bl-md border border-white/50 px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-molly-amber rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-molly-amber rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-molly-amber rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }} />
                </div>
                <span className="text-sm text-gray-500">MOLLY is searching...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/30 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask MOLLY about any destination..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full
                         focus:outline-none focus:ring-2 focus:ring-molly-amber
                         focus:border-transparent text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-molly-amber to-molly-orange
                         text-white rounded-full font-semibold text-sm
                         hover:opacity-90 disabled:opacity-50
                         disabled:cursor-not-allowed transition-all shadow-md"
            >
              Send
            </button>
          </div>

          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {[
              "Art workshops in Florence",
              "Cherry blossoms in Kyoto",
              "Festivals in Marrakech",
              "Hotels in Santorini",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="px-3 py-1 bg-orange-50 text-molly-orange rounded-full
                           text-xs font-medium hover:bg-orange-100 transition-colors
                           border border-orange-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingHotel && (
        <BookingModal
          hotel={bookingHotel}
          onClose={() => setBookingHotel(null)}
        />
      )}
    </div>
  );
});

export default ChatBot;
