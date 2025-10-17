// MOLLY ChatBot Functionality
let chatbotOpen = false;
let conversationHistory = [];

// Toggle ChatBot panel
function toggleChatBot() {
  const panel = document.getElementById("chatbot-panel");
  const toggle = document.getElementById("chatbot-toggle");

  chatbotOpen = !chatbotOpen;

  if (chatbotOpen) {
    panel.classList.add("open");
    toggle.textContent = "💬 Hide Chat";
    toggle.style.background =
      "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)";
  } else {
    panel.classList.remove("open");
    toggle.textContent = "💬 Chat with MOLLY";
    toggle.style.background =
      "linear-gradient(135deg, #f2a908 0%, #a24d23 100%)";
  }
}

// Handle Enter key in chat input
function handleChatInputKeypress(event) {
  if (event.key === "Enter") {
    sendChatMessage();
  }
}

// Send chat message
async function sendChatMessage() {
  const input = document.getElementById("chatbot-input-field");
  const message = input.value.trim();

  if (!message) return;

  // Add user message to chat
  addMessageToChat("user", message);

  // Clear input
  input.value = "";

  // Show typing indicator
  const typingId = addTypingIndicator();

  try {
    // Send to backend
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        conversationHistory: conversationHistory,
      }),
    });

    const data = await response.json();

    // Remove typing indicator
    removeTypingIndicator(typingId);

    if (data.reply) {
      // Add assistant response
      addMessageToChat("assistant", data.reply);

      // Update conversation history
      conversationHistory.push(
        { role: "user", content: message },
        { role: "assistant", content: data.reply }
      );

      // Keep only last 10 messages to manage context
      if (conversationHistory.length > 10) {
        conversationHistory = conversationHistory.slice(-10);
      }

      // If a city/destination was detected, trigger hotel search
      if (data.searchTrigger) {
        setTimeout(() => {
          triggerHotelSearch(data.searchTrigger);
        }, 1000);
      }
    } else {
      addMessageToChat(
        "assistant",
        "Sorry, I had trouble understanding that. Could you try again? 😊"
      );
    }
  } catch (error) {
    console.error("Chat error:", error);
    removeTypingIndicator(typingId);
    addMessageToChat(
      "assistant",
      "Oops! I'm having a little trouble right now. Please try again in a moment! 🤖"
    );
  }
}

// Add message to chat
function addMessageToChat(role, content) {
  const messagesContainer = document.getElementById("chatbot-messages");

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.textContent = content;

  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add typing indicator
function addTypingIndicator() {
  const messagesContainer = document.getElementById("chatbot-messages");
  const typingId = "typing-" + Date.now();

  const messageDiv = document.createElement("div");
  messageDiv.id = typingId;
  messageDiv.className = "message assistant";

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.innerHTML =
    '<span class="typing-dots">MOLLY is typing<span>.</span><span>.</span><span>.</span></span>';

  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return typingId;
}

// Remove typing indicator
function removeTypingIndicator(typingId) {
  const typingElement = document.getElementById(typingId);
  if (typingElement) {
    typingElement.remove();
  }
}

// Search hotels using LiteAPI
async function searchHotels(city) {
  try {
    const liteApiKey = import.meta.env.VITE_LITEAPI_KEY;

    if (!liteApiKey) {
      addMessageToChat(
        "assistant",
        "Sorry, I can't search for hotels right now. The LiteAPI key is not configured. Please check your environment variables. 🏨"
      );
      return;
    }

    // Show typing indicator for hotel search
    const typingId = addTypingIndicator();

    // Call LiteAPI hotel search endpoint
    const url = new URL("https://api.liteapi.travel/v3.0/data/hotels");
    url.searchParams.append("countryCode", "US");
    url.searchParams.append("cityName", city);
    url.searchParams.append("limit", "10");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${liteApiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Remove typing indicator
    removeTypingIndicator(typingId);

    if (!response.ok) {
      throw new Error(
        `LiteAPI Error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data && data.data && data.data.length > 0) {
      // Format hotel results
      const hotelList = data.data
        .map(
          (hotel) =>
            `🏨 ${hotel.name} - ${hotel.address || "Address not available"}`
        )
        .join("\n");

      addMessageToChat(
        "assistant",
        `Here are some hotels in ${city}:\n\n${hotelList}\n\nI found ${data.data.length} hotels for you! 🌟`
      );
    } else {
      addMessageToChat(
        "assistant",
        `Sorry, no hotels found in ${city}. Try searching for a different city or check the spelling. 🏨`
      );
    }
  } catch (error) {
    console.error("Hotel search error:", error);

    // Remove typing indicator if it exists
    const typingElements = document.querySelectorAll('[id^="typing-"]');
    typingElements.forEach((el) => el.remove());

    addMessageToChat(
      "assistant",
      `Sorry, I had trouble searching for hotels in ${city}. Please try again later or check if the city name is correct. 🏨`
    );
  }
}

// Trigger hotel search based on chat input
function triggerHotelSearch(city) {
  // Show hotel search section
  showHotelSearch();

  // Fill in the city input
  const whereInput = document.getElementById("where-input");
  if (whereInput) {
    whereInput.value = city;
  }

  // Set default dates (tomorrow to day after tomorrow)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  const checkinInput = document.getElementById("when-checkin");
  const checkoutInput = document.getElementById("when-checkout");

  if (checkinInput) {
    checkinInput.value = tomorrow.toISOString().split("T")[0];
  }
  if (checkoutInput) {
    checkoutInput.value = dayAfter.toISOString().split("T")[0];
  }

  // Call the new LiteAPI search function
  setTimeout(() => {
    searchHotels(city);
  }, 500);

  // Add a message to chat about the search
  setTimeout(() => {
    addMessageToChat(
      "assistant",
      `Perfect! I'm searching for amazing hotels in ${city} for you! 🏨✨`
    );
  }, 2000);
}

// Add typing animation styles
const typingStyles = `
  .typing-dots span {
    animation: typing 1.4s infinite;
  }
  
  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes typing {
    0%, 60%, 100% {
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
  }
`;

// Inject typing styles
const styleSheet = document.createElement("style");
styleSheet.textContent = typingStyles;
document.head.appendChild(styleSheet);
