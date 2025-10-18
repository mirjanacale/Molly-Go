console.log("✅ chatbot.js loaded successfully");

// MOLLY ChatBot Functionality
let chatbotOpen = false;
let conversationHistory = [];

// ✅ Environment setup - fetch from server
let LITEAPI_KEY = "sand_f3a10xxxxxxxxxxxxx"; // fallback for local testing
let BASE_URL = "https://api.liteapi.travel/v3.0";

// Production optimization: Enhanced API configuration loading with retry and fallback
async function loadAPIConfig() {
  const maxRetries = 2;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch("/api/config", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add timeout for production reliability
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const config = await response.json();
      LITEAPI_KEY = config.LITEAPI_KEY;
      BASE_URL = config.LITEAPI_URL;
      console.log(" API configuration loaded from server successfully");
      return true;
    } catch (error) {
      retryCount++;
      console.warn(
        ` API config attempt ${retryCount}/${maxRetries} failed:`,
        error.message
      );

      if (retryCount >= maxRetries) {
        console.log(
          "⚠️ Using fallback API configuration after all retries failed"
        );
        showAPIKeyWarning();
        return false;
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
    }
  }
}

// Production optimization: Visual API key warning for missing configuration
function showAPIKeyWarning() {
  const chatbotPanel = document.getElementById("mollychat-panel");
  if (!chatbotPanel) return;

  // Create warning banner
  const warningBanner = document.createElement("div");
  warningBanner.style.cssText = `
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    color: white;
    padding: 10px;
    margin: 10px;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  `;
  warningBanner.innerHTML = `
    ⚠️ API Configuration Issue<br>
    <small>Using fallback settings. Hotel search may be limited.</small>
  `;

  // Insert at top of panel
  const header = chatbotPanel.querySelector(".chatbot-header");
  if (header) {
    chatbotPanel.insertBefore(warningBanner, header.nextSibling);
  }
}

// Debug: Test if chatbot functions are loaded
console.log("🤖 MOLLY ChatBot initialized!");
console.log(
  "🔑 LiteAPI Key loaded:",
  LITEAPI_KEY && LITEAPI_KEY == "your_liteapi_sandbox_key_here"
    ? "Yes"
    : "✅ No"
);
console.log("🌐 Base URL:", BASE_URL);

// Create connection status badge
function createStatusBadge() {
  const chatbotPanel = document.getElementById("mollychat-panel");
  if (!chatbotPanel) return;

  const badge = document.createElement("div");
  badge.id = "liteapi-status-badge";
  badge.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: linear-gradient(135deg, #f2a908 0%, #a24d23 100%);
    color: white;
    font-weight: bold;
    font-size: 13px;
    padding: 6px 12px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(242, 169, 8, 0.3);
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
    z-index: 1000;
  `;
  badge.textContent = "⏳ Testing...";

  chatbotPanel.appendChild(badge);

  // Fade in animation
  setTimeout(() => {
    badge.style.opacity = "1";
  }, 100);
}

// Update status badge
function updateStatusBadge(success) {
  const badge = document.getElementById("liteapi-status-badge");
  if (!badge) return;

  if (success) {
    badge.textContent = "✅ Connected";
    badge.style.boxShadow =
      "0 2px 8px rgba(34, 197, 94, 0.4), 0 0 12px rgba(34, 197, 94, 0.2)";
  } else {
    badge.textContent = " Offline";
    badge.style.boxShadow =
      "0 2px 8px rgba(239, 68, 68, 0.4), 0 0 12px rgba(239, 68, 68, 0.2)";
    badge.style.animation = "pulse 2s infinite";
  }
}

// Production optimization: Enhanced LiteAPI connectivity test with retry mechanism
async function testLiteAPIConnection() {
  console.log("🔧 Testing LiteAPI connection...");

  const maxRetries = 2;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const testUrl = `${BASE_URL}/data/hotels?countryCode=US&cityName=Miami&limit=1`;

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LITEAPI_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Add timeout for production reliability
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        console.log("✅ LiteAPI connection successful!");
        updateStatusBadge(true);

        const data = await response.json();
        if (data && data.data && data.data.length > 0) {
          console.log("🏨 First hotel found:", data.data[0].name);
        } else {
          console.log("📋 No hotels found in test response");
        }
        return true; // Success
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      retryCount++;
      console.warn(
        `⚠️ LiteAPI test attempt ${retryCount}/${maxRetries} failed:`,
        error.message
      );

      if (retryCount >= maxRetries) {
        console.error("❌ LiteAPI connection failed after all retries");
        updateStatusBadge(false);
        return false;
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount));
    }
  }
}

// Add pulse animation CSS
const pulseAnimationCSS = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = pulseAnimationCSS;
document.head.appendChild(styleSheet);

// Fixed: Initialize badge and run connectivity test with proper DOM readiness
document.addEventListener("DOMContentLoaded", async function () {
  console.log("🔧 DOM Content Loaded - Initializing MOLLY ChatBot");

  // Load API configuration first
  await loadAPIConfig();

  // Ensure DOM elements exist before proceeding
  const chatbotPanel = document.getElementById("mollychat-panel");
  if (!chatbotPanel) {
    console.warn(" mollychat-panel not found, retrying in 100ms");
    setTimeout(() => initializeChatbot(), 100);
    return;
  }

  // Initialize chatbot components with proper timing
  setTimeout(() => {
    createStatusBadge();
    testLiteAPIConnection();
  }, 500);
});

// Fixed: Separate initialization function for retry logic
function initializeChatbot() {
  const chatbotPanel = document.getElementById("mollychat-panel");
  if (chatbotPanel) {
    setTimeout(() => {
      createStatusBadge();
      testLiteAPIConnection();
    }, 500);
  }
}

// Fixed: Toggle ChatBot panel with enhanced DOM validation
function toggleMollyChat() {
  console.log("🔧 toggleMollyChat called"); // Debug log

  const panel = document.getElementById("mollychat-panel");
  const toggle = document.getElementById("mollychat-toggle");

  // Enhanced DOM element validation with retry logic
  if (!panel) {
    console.error("❌ mollychat-panel element not found!");
    // Retry after a short delay in case DOM is still loading
    setTimeout(() => {
      const retryPanel = document.getElementById("mollychat-panel");
      if (retryPanel) {
        console.log("✅ mollychat-panel found on retry");
        toggleMollyChat();
      } else {
        console.error("❌ mollychat-panel still not found after retry");
      }
    }, 100);
    return;
  }
  if (!toggle) {
    console.error("❌ mollychat-toggle element not found!");
    return;
  }

  console.log("✅ Both elements found, toggling chatbot state");
  chatbotOpen = !chatbotOpen;

  if (chatbotOpen) {
    panel.classList.add("open");
    toggle.textContent = "💬 Hide Chat";
    toggle.style.background =
      "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)";
    console.log("✅ Chatbot opened");
  } else {
    panel.classList.remove("open");
    toggle.textContent = "💬 Chat with MOLLY";
    toggle.style.background =
      "linear-gradient(135deg, #f2a908 0%, #a24d23 100%)";
    console.log("✅ Chatbot closed");
  }
}

// Handle Enter key in chat input
function handleChatInputKeypress(event) {
  if (event.key === "Enter") {
    sendMollyMessage();
  }
}

// Fixed: Send chat message with DOM validation
async function sendMollyMessage() {
  const input = document.getElementById("mollychat-input-field");

  // Enhanced DOM element validation
  if (!input) {
    console.error(" mollychat-input-field element not found!");
    return;
  }

  const message = input.value.trim();

  if (!message) return;

  // Add user message to chat
  addMessageToChat("user", message);

  // Clear input
  input.value = "";

  // Show typing indicator
  const typingId = addTypingIndicator();

  try {
    // Process message for travel-related keywords and city detection
    const processedResponse = await processTravelMessage(message);

    // Remove typing indicator
    removeTypingIndicator(typingId);

    // Add natural delay for realistic conversation feel
    setTimeout(() => {
      addMessageToChat("assistant", processedResponse.reply);

      // Update conversation history
      conversationHistory.push(
        { role: "user", content: message },
        { role: "assistant", content: processedResponse.reply }
      );

      // Keep only last 10 messages to manage context
      if (conversationHistory.length > 10) {
        conversationHistory = conversationHistory.slice(-10);
      }

      // If a city was detected, trigger hotel search
      if (processedResponse.city) {
        setTimeout(() => {
          searchMollyChatHotels(processedResponse.city);
        }, 1000);
      }
    }, 1500); // 1.5 second delay for natural feel
  } catch (error) {
    console.error("Chat error:", error);
    removeTypingIndicator(typingId);
    addMessageToChat(
      "assistant",
      "Oops! I'm having a little trouble right now. Please try again in a moment! 🤖"
    );
  }
}

// Process travel-related messages and detect cities
async function processTravelMessage(message) {
  const lowerMessage = message.toLowerCase();

  // Improved city detection with more comprehensive patterns
  const cityPatterns = [
    /\b(in|at|to|near|visiting|going to|stay in|hotels in)\s+([A-Za-z\s]+?)(?:\s|$|[.!?])/i,
    /\b([A-Za-z\s]+?)\s+(?:city|town|place|destination|hotels?)/i,
    /\b(?:want to go to|looking for|interested in|search for|find)\s+([A-Za-z\s]+)/i,
    /\b(?:hotels?|stay|accommodation|places to stay)\s+(?:in|at|near|around)\s+([A-Za-z\s]+)/i,
  ];

  let detectedCity = null;

  // Try pattern matching first
  for (const pattern of cityPatterns) {
    const match = message.match(pattern);
    if (match) {
      detectedCity = (match[1] || match[2]).trim();
      break;
    }
  }

  // If no city detected via patterns, check for common city/country names
  if (!detectedCity) {
    const words = message.split(/\s+/);
    const commonPlaces = [
      "Paris",
      "London",
      "Tokyo",
      "New York",
      "Los Angeles",
      "Chicago",
      "Boston",
      "Miami",
      "Seattle",
      "San Francisco",
      "Las Vegas",
      "Rome",
      "Barcelona",
      "Amsterdam",
      "Berlin",
      "Madrid",
      "Vienna",
      "Prague",
      "Bangkok",
      "Singapore",
      "Sydney",
      "Melbourne",
      "Toronto",
      "Vancouver",
      "Montreal",
      "Dubai",
      "Istanbul",
      "Mumbai",
      "Delhi",
      "Beijing",
      "Shanghai",
      "Italy",
      "France",
      "Spain",
      "Germany",
      "Japan",
      "Australia",
      "Canada",
      "Mexico",
      "Brazil",
      "Thailand",
      "India",
      "China",
      "United Kingdom",
      "UK",
      "USA",
      "America",
    ];

    for (const word of words) {
      const cleanWord = word.replace(/[.,!?]/g, "");
      if (
        commonPlaces.some(
          (place) =>
            place.toLowerCase() === cleanWord.toLowerCase() ||
            cleanWord.toLowerCase().includes(place.toLowerCase()) ||
            place.toLowerCase().includes(cleanWord.toLowerCase())
        )
      ) {
        detectedCity = cleanWord;
        break;
      }
    }
  }

  // Default to New York if no city found
  if (!detectedCity) {
    detectedCity = "New York";
  }

  // Always trigger hotel search
  return {
    reply: `Got it! Let me look up some great hotels in ${detectedCity} for you 🏨✨`,
    city: detectedCity,
  };
}

// Fixed: Add message to chat with DOM validation
function addMessageToChat(role, content) {
  const messagesContainer = document.getElementById("mollychat-messages");

  // Enhanced DOM element validation
  if (!messagesContainer) {
    console.error("❌ mollychat-messages element not found!");
    return;
  }

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

// Fixed: Add typing indicator with DOM validation
function addTypingIndicator() {
  const messagesContainer = document.getElementById("mollychat-messages");

  // Enhanced DOM element validation
  if (!messagesContainer) {
    console.error("❌ mollychat-messages element not found!");
    return null;
  }

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

// Production optimization: Enhanced hotel search with robust error handling
async function searchMollyChatHotels(city) {
  const maxRetries = 2;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Enhanced debugging with retry context
      console.log(
        `🔍 Searching for hotels in: ${city} (attempt ${
          retryCount + 1
        }/${maxRetries})`
      );
      console.log(
        "🔑 LiteAPI Key present:",
        !!LITEAPI_KEY && LITEAPI_KEY !== "your_liteapi_sandbox_key_here"
      );
      console.log(
        "🔑 LiteAPI Key value:",
        LITEAPI_KEY && LITEAPI_KEY !== "your_liteapi_sandbox_key_here"
          ? `${LITEAPI_KEY.substring(0, 10)}...`
          : "NOT SET"
      );

      if (!LITEAPI_KEY || LITEAPI_KEY === "your_liteapi_sandbox_key_here") {
        addMessageToChat(
          "assistant",
          "🏨 I'd love to search for hotels, but I need a LiteAPI key to be configured. Please add VITE_LITEAPI_KEY to your environment variables. For now, here are some sample hotels in " +
            city +
            ":\n\n🏨 Sample Hotel Plaza - 123 Main Street\n🏨 Grand Hotel Sample - 456 Oak Avenue\n🏨 Central Inn Sample - 789 Broadway\n\n🌟 Add your LiteAPI key to get real hotel data!"
        );
        return;
      }

      // Show typing indicator for hotel search
      const typingId = addTypingIndicator();

      // Call LiteAPI hotel search endpoint with exact parameters
      const url = `${BASE_URL}/data/hotels?countryCode=US&cityName=${encodeURIComponent(
        city
      )}&limit=5`;

      console.log("🌐 Making request to:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LITEAPI_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Add timeout for production reliability
        signal: AbortSignal.timeout(10000),
      });

      // Remove typing indicator
      removeTypingIndicator(typingId);

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(
          `LiteAPI Error: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("📊 API Response:", data);

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
        return true; // Success
      } else {
        addMessageToChat(
          "assistant",
          `No hotels found in ${city}. Try another destination!`
        );
        return true; // Success (no results is not an error)
      }
    } catch (error) {
      retryCount++;
      console.warn(
        `⚠️ Hotel search attempt ${retryCount}/${maxRetries} failed:`,
        error.message
      );

      // Remove typing indicator if it exists
      const typingElements = document.querySelectorAll('[id^="typing-"]');
      typingElements.forEach((el) => el.remove());

      if (retryCount >= maxRetries) {
        console.error("❌ Hotel search failed after all retries");
        addMessageToChat(
          "assistant",
          `Sorry, I couldn't find hotels in ${city} right now. Please try again later or check another destination! 🏨`
        );
        return false;
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount));
    }
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
    searchMollyChatHotels(city);
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

// Fixed: Make chatbot functions available to HTML buttons with safety checks
window.toggleMollyChat = toggleMollyChat;
window.sendMollyMessage = sendMollyMessage;
window.handleChatInputKeypress = handleChatInputKeypress;

// Enhanced logging for debugging
console.log("✅ MOLLY ChatBot functions are now global!");
console.log("🔧 Available functions:", {
  toggleMollyChat: typeof window.toggleMollyChat,
  sendMollyMessage: typeof window.sendMollyMessage,
  handleChatInputKeypress: typeof window.handleChatInputKeypress,
});

// Test function to verify button functionality
window.testButtonClick = function () {
  console.log("🧪 Test button click function called");
  const button = document.getElementById("mollychat-toggle");
  if (button) {
    console.log("✅ Button element found:", button);
    console.log("🔧 Button onclick attribute:", button.getAttribute("onclick"));
    console.log("🔧 Button style:", button.style.cssText);
    console.log("🔧 Button computed style:", window.getComputedStyle(button));

    // Test if the function exists
    if (typeof window.toggleMollyChat === "function") {
      console.log("✅ toggleMollyChat function is available");
      // Try calling it directly
      try {
        window.toggleMollyChat();
        console.log("✅ toggleMollyChat called successfully");
      } catch (error) {
        console.error("❌ Error calling toggleMollyChat:", error);
      }
    } else {
      console.error("❌ toggleMollyChat function is not available");
    }
  } else {
    console.error("❌ Button element not found");
  }
};

// Auto-test when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("🔧 DOM Content Loaded - Initializing MOLLY ChatBot");
  console.log("🔧 DOM Content Loaded - Running button test");
  
  setTimeout(() => {
    window.testButtonClick();
    
    // Add alternative event listener as backup
    const button = document.getElementById("mollychat-toggle");
    if (button) {
      console.log("🔧 Adding alternative click event listener");
      button.addEventListener("click", function (event) {
        console.log("🔧 Alternative click event listener triggered");
        event.preventDefault();
        event.stopPropagation();
        toggleMollyChat();
      });
      
      // Test if button is clickable
      const rect = button.getBoundingClientRect();
      console.log("🔧 Button position:", {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0,
      });
      
      // Check if button is covered by other elements
      const elementAtPoint = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
      console.log("🔧 Element at button center:", elementAtPoint);
      console.log("🔧 Is button covered?", elementAtPoint !== button);
    }
  }, 1000);
});
