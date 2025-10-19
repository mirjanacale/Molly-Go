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

async function sendMollyMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  addMessage("user", msg);
  input.value = "";

  // Re-focus the input field after sending
  setTimeout(() => input.focus(), 50);

  // Show thinking message with proper management
  showThinkingMessage();

  try {
    console.log("✅ Chat request received:", msg);
    console.log("🛰 Sending chat request to /api/chat");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, conversationHistory }),
    });
    const data = await res.json();
    console.log("✅ Chat response received:", data);
    const reply = data.reply || "🌍 Let's find your next trip!";

    // Remove the thinking message and add the response
    removeThinkingMessage();
    addMessage("assistant", reply);

    // Update conversation history
    conversationHistory.push({ role: "user", content: msg });
    conversationHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    console.error("❌ Chat request failed:", err);
    console.error("❌ Error details:", err.message, err.stack);

    // Remove the thinking message and show error
    removeThinkingMessage();
    addMessage(
      "assistant",
      "⚠️ The travel service didn't respond. Let's imagine Joy Inn, Dream Hotel, and Sunrise Suites in New York 🏨✨"
    );
  }
}

// Send button click handler
function handleSendClick() {
  sendMollyMessage();
}

window.toggleMollyChat = toggleMollyChat;
window.sendMollyMessage = sendMollyMessage;
window.handleChatInputKeypress = handleChatInputKeypress;
window.handleSendClick = handleSendClick;

document.addEventListener("DOMContentLoaded", loadAPIConfig);
