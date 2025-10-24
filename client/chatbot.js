console.log("✅ MOLLY ChatBot (AI-LiteAPI edition) loaded");

let chatbotOpen = false;
let conversationHistory = [];
let thinkingMessageId = null;
let thinkingTimeout = null;

async function loadAPIConfig() {
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    console.log("🔑 Keys loaded from server");
  } catch (err) {
    console.warn("⚠️ Fallback mode:", err.message);
  }
}

function toggleMollyChat() {
  const panel = document.getElementById("mollychat-panel");
  const toggle = document.getElementById("mollychat-toggle");
  const input = document.getElementById("chatInput");
  chatbotOpen = !chatbotOpen;
  panel.classList.toggle("open", chatbotOpen);
  toggle.textContent = chatbotOpen ? "💬 Hide Chat" : "💬 Chat with MOLLY";

  // Console logging for debugging
  if (chatbotOpen) {
    console.log("💬 Chat opened");
  } else {
    console.log("💬 Chat closed");
  }

  // Focus the input field when chat opens
  if (chatbotOpen && input) {
    setTimeout(() => input.focus(), 100);
  }
}

function handleChatInputKeypress(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMollyMessage();
  }
}

function addMessage(role, text, messageId = null) {
  const container = document.getElementById("mollychat-messages");
  const msg = document.createElement("div");
  msg.className = `message ${role}`;
  if (messageId) {
    msg.id = messageId;
  }
  msg.innerHTML = `<div class="message-content">${text}</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  return msg;
}

function removeThinkingMessage() {
  if (thinkingMessageId) {
    const thinkingMsg = document.getElementById(thinkingMessageId);
    if (thinkingMsg) {
      thinkingMsg.remove();
    }
    thinkingMessageId = null;
  }
  if (thinkingTimeout) {
    clearTimeout(thinkingTimeout);
    thinkingTimeout = null;
  }
}

function showThinkingMessage() {
  // Remove any existing thinking message first
  removeThinkingMessage();

  // Create new thinking message with unique ID
  thinkingMessageId = `thinking-${Date.now()}`;
  addMessage("assistant", "✈️ Thinking...", thinkingMessageId);

  // Set timeout fallback (10 seconds)
  thinkingTimeout = setTimeout(() => {
    removeThinkingMessage();
    addMessage("assistant", "⏰ Sorry, that took too long. Please try again!");
  }, 10000);
}

// Abort Controller Wrapper
const REQUEST_TIMEOUT = 8000;

function abortableFetch(input, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout)
  );
}

// Intent Detection
function detectIntent(text) {
  if (/(hotel|stay|accommodation|room|book)/i.test(text)) return "hotels";
  if (/(event|festival|concert|show|activity|things? to do)/i.test(text))
    return "events";
  if (/(guide|what to do|tips|itinerary|best time|recommend)/i.test(text))
    return "guide";
  if (/(hello|hi|hey|help|how are you)/i.test(text)) return "greeting";
  return "unknown";
}

// Helper function to fetch hotels for chat using shared functions
async function fetchHotelsForChat(city) {
  try {
    console.log("🏨 Fetching hotels for chat in:", city);
    const { fetchHotels } = window.sharedFetch || {};

    if (fetchHotels) {
      const hotels = await fetchHotels(city);
      console.log("🏨 Chatbot received hotels:", hotels.length);
      if (hotels && hotels.length > 0) {
        return hotels.slice(0, 3); // Return top 3 hotels
      }
    } else {
      // Fallback to direct fetch if shared functions not available
      const res = await abortableFetch(
        `/api/hotels?city=${encodeURIComponent(city)}`
      );
      const data = await res.json();
      console.log("🏨 Chatbot fallback response:", data);
      if (data.items && data.items.length > 0) {
        return data.items.slice(0, 3);
      }
    }
    return [];
  } catch (err) {
    console.error("❌ Chatbot hotel fetch failed:", err);
    return [];
  }
}

// Display hotels in chat with compact cards
function displayHotelsInChat(hotels, city) {
  if (!hotels || hotels.length === 0) {
    addMessage(
      "assistant",
      `😔 Sorry, I couldn't find hotels in ${city}. Try a different city!`
    );
    return;
  }

  const hotelCards = hotels
    .map((hotel) => {
      const bookingLink =
        hotel.bookingUrl && hotel.bookingUrl !== "#"
          ? `<a href="${hotel.bookingUrl}" target="_blank" class="chat-hotel-link">Book Now</a>`
          : `<span class="chat-hotel-unavailable">Booking unavailable</span>`;

      // Unified image fallback chain for hotels
      const img =
        hotel.main_photo ||
        hotel.thumbnail ||
        hotel.image ||
        hotel.imageUrl ||
        hotel.media?.[0]?.url ||
        hotel.photos?.[0]?.url ||
        "https://source.unsplash.com/featured/?hotel," +
          encodeURIComponent(hotel.city || "destination");

      console.log("🖼️ Chat hotel image chosen for:", hotel.name, "=>", img);

      return `
      <div class="chat-hotel-card">
        <img src="${img}" alt="${hotel.name}" class="chat-hotel-image" 
             onerror="this.src='/images/hotel-placeholder.jpg'">
        <div class="chat-hotel-info">
          <div class="chat-hotel-name">🏨 ${hotel.name}</div>
          <div class="chat-hotel-location">📍 ${hotel.city}</div>
          <div class="chat-hotel-price">${hotel.price}</div>
          <div class="chat-hotel-booking">${bookingLink}</div>
        </div>
      </div>
    `;
    })
    .join("");

  const moreResults =
    hotels.length === 3
      ? `<div class="chat-more-results">See more results on page →</div>`
      : "";

  const hotelMessage = `
    <div class="chat-hotels-container">
      <div class="chat-hotels-title">🏨 Hotels in ${city}</div>
      ${hotelCards}
      ${moreResults}
    </div>
  `;

  addMessage("assistant", hotelMessage);
}

// Display events in chat with compact cards
function displayEventsInChat(events, city) {
  if (!events || events.length === 0) {
    addMessage(
      "assistant",
      `😔 No events found in ${city}. Try a different city!`
    );
    return;
  }

  const eventCards = events
    .slice(0, 3)
    .map((event) => {
      // Unified image fallback chain for events
      const img =
        event.image ||
        event.imageUrl ||
        event.media?.[0]?.url ||
        event.photos?.[0]?.url ||
        "/images/event-placeholder.svg";

      console.log("🖼️ Chat event image chosen for:", event.name, "=>", img);

      return `
    <div class="chat-event-card">
      <img src="${img}" 
           alt="${event.name}" 
           class="chat-event-image"
           onerror="this.src='/images/event-placeholder.svg'">
      <div class="chat-event-info">
        <div class="chat-event-name">🎉 ${event.name}</div>
        <div class="chat-event-location">📍 ${event.city}</div>
        <div class="chat-event-date">${event.startDate || "Date TBA"}</div>
        ${
          event.url
            ? `<a href="${event.url}" target="_blank" class="chat-event-link">Details</a>`
            : ""
        }
      </div>
    </div>
  `;
    })
    .join("");

  addMessage(
    "assistant",
    `
    <div class="chat-events-container">
      <div class="chat-events-title">🎉 Events in ${city}</div>
      ${eventCards}
    </div>
  `
  );
}

// Display guide in chat
function displayGuideInChat(guide) {
  const blocksHTML = guide.blocks
    .map(
      (block) => `
    <div class="chat-guide-block">
      <h4>${block.title}</h4>
      <ul>${block.items.map((item) => `<li>${item}</li>`).join("")}</ul>
    </div>
  `
    )
    .join("");

  addMessage(
    "assistant",
    `
    <div class="chat-guide-container">
      <div class="chat-guide-title">🧭 Travel Guide for ${guide.city}</div>
      ${blocksHTML}
    </div>
  `
  );
}

async function sendMollyMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  addMessage("user", msg);
  input.value = "";

  const intent = detectIntent(msg);
  const city = extractCity(msg);

  console.log("User query:", msg);
  console.log("Extracted city:", city);

  showThinkingMessage();

  try {
    if (intent === "hotels" && city) {
      const res = await abortableFetch(
        `/api/hotels?city=${encodeURIComponent(city)}`
      );
      const data = await res.json();
      removeThinkingMessage();
      displayHotelsInChat(data.items || [], city);
      return;
    }

    if (intent === "events" && city) {
      const res = await abortableFetch(
        `/api/events?city=${encodeURIComponent(city)}`
      );
      const data = await res.json();
      removeThinkingMessage();
      displayEventsInChat(data.items || [], city);
      return;
    }

    if (intent === "guide" || intent === "greeting") {
      const res = await abortableFetch(
        `/api/guide?city=${encodeURIComponent(city || "your destination")}`
      );
      const data = await res.json();
      removeThinkingMessage();
      displayGuideInChat(data);
      return;
    }

    // Fallback for unclear intent
    removeThinkingMessage();
    addMessage(
      "assistant",
      "I can help you find hotels, explore events, or get travel tips. What would you like to know?"
    );
  } catch (err) {
    removeThinkingMessage();
    if (err.name === "AbortError") {
      addMessage("assistant", "⏰ Request took too long. Please try again.");
    } else {
      addMessage("assistant", "😅 Something went wrong. Please try again!");
    }
  }
}

// Extract city from message
function extractCity(msg) {
  const patterns = [
    /find hotels? in (.+)/i,
    /show me hotels? in (.+)/i,
    /hotels? in (.+)/i,
    /book hotels? in (.+)/i,
    /hotel in (.+)/i,
    /events? in (.+)/i,
    /find events? in (.+)/i,
    /guide for (.+)/i,
    /travel guide for (.+)/i,
  ];

  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // If no pattern matches, check if the message itself is a city name
  const singleWord = msg.trim().match(/^[A-Za-z\s]+$/);
  if (singleWord && singleWord[0].length > 2) {
    return singleWord[0].trim();
  }

  return null;
}

// Send button click handler
function handleSendClick() {
  sendMollyMessage();
}

// Function to check if chatbot is active
function isChatbotActive() {
  const panel = document.getElementById("mollychat-panel");
  return panel && panel.classList.contains("open");
}

window.toggleMollyChat = toggleMollyChat;
window.sendMollyMessage = sendMollyMessage;
window.handleChatInputKeypress = handleChatInputKeypress;
window.handleSendClick = handleSendClick;
window.isChatbotActive = isChatbotActive;

document.addEventListener("DOMContentLoaded", loadAPIConfig);
