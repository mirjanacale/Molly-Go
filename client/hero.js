// Hero Section Search Functionality
console.log("✅ Hero search functionality loaded");
console.log("📁 Script file: hero.js loaded successfully");

// Global error handler to catch any JavaScript errors
window.addEventListener("error", function (e) {
  console.error("🚨 JavaScript Error:", e.error);
  console.error("🚨 Error details:", e.filename, e.lineno, e.colno);
});

// Unhandled promise rejection handler
window.addEventListener("unhandledrejection", function (e) {
  console.error("🚨 Unhandled Promise Rejection:", e.reason);
});

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 DOMContentLoaded fired - initializing hero functionality");
  console.log("📄 Document ready state:", document.readyState);
  console.log(
    "🔍 Total elements in document:",
    document.querySelectorAll("*").length
  );

  const searchInput = document.querySelector(".search-input");
  const exploreBtn = document.getElementById("exploreBtn");
  const guideBtn = document.getElementById("guideBtn");
  const hotelBtn = document.getElementById("hotelsBtn");

  console.log("🔍 DOM elements found:", {
    searchInput: !!searchInput,
    exploreBtn: !!exploreBtn,
    guideBtn: !!guideBtn,
    hotelBtn: !!hotelBtn,
  });

  // Detailed element checking
  console.log("🔍 Detailed element check:");
  console.log("  - searchInput:", searchInput);
  console.log("  - exploreBtn:", exploreBtn);
  console.log("  - guideBtn:", guideBtn);
  console.log("  - hotelBtn:", hotelBtn);

  // Check if elements are null
  if (!exploreBtn) console.error("❌ exploreBtn is NULL!");
  if (!guideBtn) console.error("❌ guideBtn is NULL!");
  if (!hotelBtn) console.error("❌ hotelBtn is NULL!");

  // If elements are not found, try again after a short delay
  if (!exploreBtn || !guideBtn || !hotelBtn) {
    console.log("⏳ Elements not found, retrying in 100ms...");
    setTimeout(() => {
      console.log("🔄 Retrying element selection...");
      const retryExploreBtn = document.getElementById("exploreBtn");
      const retryGuideBtn = document.getElementById("guideBtn");
      const retryHotelBtn = document.getElementById("hotelsBtn");

      console.log("🔍 Retry results:", {
        exploreBtn: !!retryExploreBtn,
        guideBtn: !!retryGuideBtn,
        hotelBtn: !!retryHotelBtn,
      });

      if (retryExploreBtn && retryGuideBtn && retryHotelBtn) {
        console.log(
          "✅ Elements found on retry, setting up event listeners..."
        );
        setupButtonListeners(retryExploreBtn, retryGuideBtn, retryHotelBtn);
      } else {
        console.error("❌ Elements still not found after retry!");
      }
    }, 100);
  } else {
    console.log("✅ All elements found, setting up event listeners...");
    setupButtonListeners(exploreBtn, guideBtn, hotelBtn);
  }

  // Shared state management
  let activeSection = "none";
  let results = {
    hotels: [],
    guide: null,
    events: [],
  };
  let cache = {};
  let isLoading = false;

  // Create results section with smooth transitions
  const resultSection = document.createElement("section");
  resultSection.id = "results-section";
  resultSection.className = "results-container";
  resultSection.style = "display: none;";
  document.body.appendChild(resultSection);

  // Use existing HTML containers instead of creating duplicates
  const hotelsEl = document.getElementById("hotels-results");
  const eventsEl = document.getElementById("events-results");
  const guideEl = document.getElementById("guide-results");

  // Single loader instance
  const loaderEl = document.createElement("div");
  loaderEl.className = "hero-loader";
  loaderEl.innerHTML = '<div class="spinner"></div>';

  function showLoader() {
    if (!resultSection.contains(loaderEl)) {
      resultSection.appendChild(loaderEl);
    }
  }

  function hideLoader() {
    if (loaderEl.parentNode) {
      loaderEl.remove();
    }
  }

  // Show authentication error banner
  function showAuthErrorBanner(message) {
    // Remove existing banner if any
    const existingBanner = document.getElementById("auth-error-banner");
    if (existingBanner) {
      existingBanner.remove();
    }

    const banner = document.createElement("div");
    banner.id = "auth-error-banner";
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #f44336;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10001;
      font-family: Arial, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 500px;
      text-align: center;
    `;
    banner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>⚠️ ${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (banner.parentElement) {
        banner.remove();
      }
    }, 10000);
  }

  // Use shared fetch and render functions from shared-fetch.js
  const {
    fetchHotels,
    fetchEvents,
    fetchGuide,
    renderHotelsInto,
    renderEventsInto,
    renderGuideInto,
  } = window.sharedFetch || {};

  // Verify shared functions are available
  if (!fetchHotels || !fetchEvents || !fetchGuide) {
    console.error(
      "❌ Shared fetch functions not available. Make sure shared-fetch.js is loaded."
    );
  } else {
    console.log("✅ Shared fetch functions loaded successfully");
  }

  // fetchSectionData function removed - now using shared functions directly

  // Section change handler
  async function handleSectionChange(section) {
    const city = searchInput.value.trim() || "Berlin"; // Default to Berlin for demo data

    console.log(`🎯 Switching to ${section} section for ${city}`);

    // Show the main content sections directly
    const eventsSection = document.getElementById("events-section");
    const guideSection = document.getElementById("guide-section");
    const hotelsSection = document.getElementById("hotels-section");

    // Hide all main sections first
    if (eventsSection) eventsSection.classList.add("hidden");
    if (guideSection) guideSection.classList.add("hidden");
    if (hotelsSection) hotelsSection.classList.add("hidden");

    // Show the active section
    if (section === "events" && eventsSection) {
      eventsSection.classList.remove("hidden");
      console.log("✅ Showing events section");
    } else if (section === "guide" && guideSection) {
      guideSection.classList.remove("hidden");
      console.log("✅ Showing guide section");
    } else if (section === "hotels" && hotelsSection) {
      hotelsSection.classList.remove("hidden");
      console.log("✅ Showing hotels section");
    }

    // Update button active states
    document.querySelectorAll(".btn-primary, .btn-secondary").forEach((btn) => {
      btn.classList.remove("active");
    });

    if (section === "events") {
      exploreBtn.classList.add("active");
    } else if (section === "guide") {
      guideBtn.classList.add("active");
    } else if (section === "hotels") {
      hotelBtn.classList.add("active");
    }

    // Always fetch data when switching sections
    console.log(`✅ ${section} button clicked and data fetch triggered`);

    // Show results section with smooth transition
    resultSection.classList.remove("hidden");
    resultSection.classList.add("visible");

    // Scroll to results
    window.scrollTo({ top: resultSection.offsetTop, behavior: "smooth" });

    // Use showSection function to fetch and display data
    showSection(section, city);
  }

  // Update loading state
  function updateLoadingState() {
    const loader = document.getElementById("section-loader");
    if (isLoading) {
      if (!loader) {
        const loaderDiv = document.createElement("div");
        loaderDiv.id = "section-loader";
        loaderDiv.className = "loader";
        resultSection.appendChild(loaderDiv);
      }
    } else {
      if (loader) {
        loader.remove();
      }
    }
  }

  // New section switcher with visibility toggle
  async function showSection(section, city, countryCode = "") {
    activeSection = section;

    // Add unified event log
    console.log("✅ Unified fetch triggered for:", section, "City:", city);

    // Update button active states
    document.querySelectorAll(".btn-primary, .btn-secondary").forEach((btn) => {
      btn.classList.remove("active");
    });

    if (section === "events") {
      exploreBtn.classList.add("active");
    } else if (section === "guide") {
      guideBtn.classList.add("active");
    } else if (section === "hotels") {
      hotelBtn.classList.add("active");
    }

    // Show the main content sections
    const eventsSection = document.getElementById("events-section");
    const guideSection = document.getElementById("guide-section");
    const hotelsSection = document.getElementById("hotels-section");
    const heroSection = document.querySelector(".hero-section");

    // Hide all main sections with exit animation
    if (eventsSection) {
      eventsSection.classList.remove("section-enter", "active");
      eventsSection.classList.add("section-exit");
      setTimeout(() => eventsSection.classList.add("hidden"), 300);
    }
    if (guideSection) {
      guideSection.classList.remove("section-enter", "active");
      guideSection.classList.add("section-exit");
      setTimeout(() => guideSection.classList.add("hidden"), 300);
    }
    if (hotelsSection) {
      hotelsSection.classList.remove("section-enter", "active");
      hotelsSection.classList.add("section-exit");
      setTimeout(() => hotelsSection.classList.add("hidden"), 300);
    }

    // Hide hero section when showing content sections
    if (heroSection) {
      heroSection.classList.add("hidden");
    }

    // Show the active section with enhanced enter animation
    if (section === "events" && eventsSection) {
      eventsSection.classList.remove("hidden", "section-exit");
      eventsSection.classList.add("section-enter", "active");
      // Trigger events slide down animation
      eventsSection.style.animation =
        "eventsSlideIn 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) forwards";
    } else if (section === "guide" && guideSection) {
      guideSection.classList.remove("hidden", "section-exit");
      guideSection.classList.add("section-enter", "active");
      // Trigger guide slide up animation
      guideSection.style.animation =
        "guideSlideIn 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) forwards";
    } else if (section === "hotels" && hotelsSection) {
      hotelsSection.classList.remove("hidden", "section-exit");
      hotelsSection.classList.add("section-enter", "active");
      // Trigger hotels slide up animation
      hotelsSection.style.animation =
        "hotelsSlideIn 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) forwards";
    }

    console.log(`🎬 Transitioned to ${section} section`);

    // Toggle visibility with smooth transitions for results containers
    if (hotelsEl) hotelsEl.classList.toggle("active", section === "hotels");
    if (eventsEl) eventsEl.classList.toggle("active", section === "events");
    if (guideEl) guideEl.classList.toggle("active", section === "guide");

    // Use shared functions directly - same logic as chatbot
    showLoader();
    try {
      let data;
      if (section === "hotels") {
        const hotels = await fetchHotels(city, countryCode);
        console.log("📊 Hotels array received:", hotels);

        // Render into the visible main section only
        const hotelsResultsContainer =
          document.getElementById("hotels-results");
        renderHotelsInto(hotelsResultsContainer, hotels, city);

        // Visual feedback - green highlight flash
        const container = document.getElementById("hotels-section");
        if (container) {
          container.style.boxShadow = "0 0 15px 3px #00c853 inset";
          setTimeout(() => (container.style.boxShadow = "none"), 1500);
        }

        console.log(`✅ ${section} rendered successfully in`, container?.id);
        console.log(`🏨 Rendered ${hotels.length} hotels for ${city}`);

        if (!hotels.length) {
          console.warn("⚠️ No hotels found, displaying message.");
          const hotelsResultsContainer =
            document.getElementById("hotels-results");
          if (hotelsResultsContainer) {
            hotelsResultsContainer.innerHTML = `
              <div class="empty-state">
                <h3>🏨 No Hotels Found</h3>
                <p>Sorry, we couldn't find any hotels in ${city}. Please try another destination.</p>
                <button class="btn-primary" onclick="handleSectionChange('hotels', 'Berlin')">Try Berlin</button>
              </div>
            `;
          }
        }
      } else if (section === "events") {
        const events = await fetchEvents(city, countryCode);
        console.log("📊 Events array received:", events);

        // Render into the visible main section only
        const eventsResultsContainer =
          document.getElementById("events-results");
        renderEventsInto(eventsResultsContainer, events, city);

        // Visual feedback - green highlight flash
        const container = document.getElementById("events-section");
        if (container) {
          container.style.boxShadow = "0 0 15px 3px #00c853 inset";
          setTimeout(() => (container.style.boxShadow = "none"), 1500);
        }

        console.log(`✅ ${section} rendered successfully in`, container?.id);
        console.log(
          "✅ Rendering complete for:",
          section,
          "→",
          items.length,
          "items"
        );

        if (!events.length) {
          console.warn("⚠️ No events found, displaying message.");
          const eventsResultsContainer =
            document.getElementById("events-results");
          if (eventsResultsContainer) {
            eventsResultsContainer.innerHTML = `
              <div class="empty-state">
                <h3>🎪 No Events Found</h3>
                <p>Sorry, we couldn't find any events in ${city}. Please try another destination.</p>
                <button class="btn-primary" onclick="handleSectionChange('events', 'Berlin')">Try Berlin</button>
              </div>
            `;
          }
        }
      } else if (section === "guide") {
        const guide = await fetchGuide(city, countryCode);
        console.log("📊 Guide object received:", guide);

        // Render into the visible main section only
        const guideResultsContainer = document.getElementById("guide-results");
        renderGuideInto(guideResultsContainer, guide);

        // Visual feedback - green highlight flash
        const container = document.getElementById("guide-section");
        if (container) {
          container.style.boxShadow = "0 0 15px 3px #00c853 inset";
          setTimeout(() => (container.style.boxShadow = "none"), 1500);
        }

        console.log(`✅ ${section} rendered successfully in`, container?.id);
        console.log(
          "✅ Rendering complete for:",
          section,
          "→",
          data.blocks?.length || 0,
          "blocks"
        );

        if (!guide.blocks?.length) {
          console.warn("⚠️ No guide content found, displaying message.");
          const guideResultsContainer =
            document.getElementById("guide-results");
          if (guideResultsContainer) {
            guideResultsContainer.innerHTML = `
              <div class="empty-state">
                <h3>🧭 No Travel Guide Available</h3>
                <p>Sorry, we couldn't generate a travel guide for ${city}. Please try another destination.</p>
                <button class="btn-primary" onclick="handleSectionChange('guide', 'Berlin')">Try Berlin</button>
              </div>
            `;
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${section} fetch failed:`, err);
      showError(section, err.message);
    } finally {
      hideLoader();
    }
  }

  // Function to show hero section and hide content sections
  function showHeroSection() {
    const heroSection = document.querySelector(".hero-section");
    const eventsSection = document.getElementById("events-section");
    const guideSection = document.getElementById("guide-section");
    const hotelsSection = document.getElementById("hotels-section");

    // Hide all content sections
    if (eventsSection) {
      eventsSection.classList.remove("active", "section-enter");
      eventsSection.classList.add("hidden");
    }
    if (guideSection) {
      guideSection.classList.remove("active", "section-enter");
      guideSection.classList.add("hidden");
    }
    if (hotelsSection) {
      hotelsSection.classList.remove("active", "section-enter");
      hotelsSection.classList.add("hidden");
    }

    // Show hero section with enhanced animation
    if (heroSection) {
      heroSection.classList.remove("hidden");
      // Trigger hero slide down animation
      heroSection.style.animation =
        "heroSlideIn 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) forwards";
    }

    // Remove active states from buttons
    document.querySelectorAll(".btn-primary, .btn-secondary").forEach((btn) => {
      btn.classList.remove("active");
    });

    console.log("🏠 Hero section shown");
  }

  function setVisible(el, visible) {
    if (el) {
      if (visible) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    }
  }

  function showError(section, message) {
    const container =
      section === "hotels"
        ? hotelsEl
        : section === "events"
        ? eventsEl
        : guideEl;
    if (container) {
      container.innerHTML = `<div class="error">Unable to load data. ${message}</div>`;
    }
  }

  // renderHotelsInto function now provided by shared-fetch.js

  // renderEventsInto function now provided by shared-fetch.js

  // renderGuideInto function now provided by shared-fetch.js

  // Render events section
  function renderEventsSection(events, city) {
    return `
      <h2 class="results-title">Events & Activities in ${city}</h2>
      <div class="results-grid">
        ${events
          .map((event, index) => {
            // Unified image fallback chain for events
            const img =
              event.image ||
              event.imageUrl ||
              event.media?.[0]?.url ||
              event.photos?.[0]?.url ||
              `https://source.unsplash.com/featured/?event,${encodeURIComponent(
                event.city || "festival"
              )}`;

            console.log(
              "🖼️ Event section image chosen for:",
              event.name || "Unknown",
              "=>",
              img
            );

            return `
          <div class="result-card fade-in" style="animation-delay: ${
            index * 0.1
          }s;">
            <img src="${img}" alt="${event.name}" class="card-image" 
                 onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'">
            <div class="card-content">
              <h3 class="card-title">${event.name}</h3>
              <div class="card-city">📍 ${event.city}</div>
              <p class="card-description">${event.description}</p>
              <div class="card-footer">
                <div>
                  <div class="card-price">${event.price}</div>
                  <div class="card-date">${event.date}</div>
                </div>
                <div class="card-buttons">
                  <a href="${
                    event.link
                  }" target="_blank" class="price-btn">Get Tickets</a>
                </div>
              </div>
            </div>
          </div>
        `;
          })
          .join("")}
      </div>
    `;
  }

  // Render guide section
  function renderGuideSection(guide, city) {
    const guideData = guide.items && guide.items[0] ? guide.items[0] : guide;

    // Unified image fallback chain for guides
    const img =
      guideData.image ||
      `https://source.unsplash.com/featured/?${encodeURIComponent(
        city || "travel"
      )},landmark`;

    console.log(
      "🖼️ Guide section image chosen for:",
      city || "Unknown",
      "=>",
      img
    );

    return `
      <h2 class="results-title">AI Travel Guide for ${city}</h2>
      <div class="guide-section fade-in">
        <div class="guide-card">
          <img src="${img}" alt="${city}" class="guide-image" 
               onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'">
          <div class="guide-content">
            <h3 class="guide-title">${guideData.name}</h3>
            <div class="guide-description">${guideData.description}</div>
            <div class="guide-details">
              <div class="guide-section-item">
                <h4 class="guide-section-title">🏛️ Top Attractions</h4>
                <ul class="guide-list">
                  ${
                    guideData.attractions
                      ? guideData.attractions
                          .map((attr) => `<li>${attr}</li>`)
                          .join("")
                      : ""
                  }
                </ul>
              </div>
              <div class="guide-section-item">
                <h4 class="guide-section-title">🍽️ Local Food</h4>
                <ul class="guide-list">
                  ${
                    guideData.food
                      ? guideData.food
                          .map((food) => `<li>${food}</li>`)
                          .join("")
                      : ""
                  }
                </ul>
              </div>
              <div class="guide-section-item">
                <h4 class="guide-section-title">📅 Best Time to Visit</h4>
                <p class="guide-text">${
                  guideData.bestTime || "Year-round destination"
                }</p>
              </div>
              <div class="guide-section-item">
                <h4 class="guide-section-title">💡 Travel Tips</h4>
                <ul class="guide-list">
                  ${
                    guideData.tips
                      ? guideData.tips.map((tip) => `<li>${tip}</li>`).join("")
                      : ""
                  }
                </ul>
              </div>
            </div>
            <div class="guide-footer">
              <button class="regenerate-btn" onclick="regenerateGuide('${city}')">
                🔄 Regenerate Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render hotels section
  function renderHotelsSection(hotels, city) {
    return `
      <h2 class="results-title">Hotels & Accommodations in ${city}</h2>
      <div class="results-grid">
        ${hotels
          .map((hotel, index) => {
            // Unified image fallback chain for hotels
            const img =
              hotel.main_photo ||
              hotel.thumbnail ||
              hotel.image ||
              hotel.imageUrl ||
              hotel.media?.[0]?.url ||
              hotel.photos?.[0]?.url ||
              `https://source.unsplash.com/featured/?hotel,${encodeURIComponent(
                hotel.city || "destination"
              )}`;

            console.log(
              "🖼️ Hotel section image chosen for:",
              hotel.name || "Unknown",
              "=>",
              img
            );

            return `
          <div class="result-card fade-in" style="animation-delay: ${
            index * 0.1
          }s;">
            <img src="${img}" alt="${hotel.name || "Hotel"}" class="card-image" 
                 onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'"
                 onload="console.log('🖼️ Hotel Image loaded:', this.src)">
            <div class="card-content">
              <h3 class="card-title">${hotel.name}</h3>
              <div class="card-city">📍 ${hotel.city}</div>
              <p class="card-description">${hotel.description}</p>
              <div class="card-footer">
                <div>
                  <div class="card-price">${hotel.price}</div>
                  <div class="card-date">${hotel.date}</div>
                </div>
                <div class="card-buttons">
                  <button 
                    class="book-now-btn ${
                      !hotel.bookingUrl || hotel.bookingUrl === "#"
                        ? "disabled"
                        : ""
                    }" 
                    onclick="event.stopPropagation(); handleBooking('${
                      hotel.bookingUrl || ""
                    }')"
                    ${
                      !hotel.bookingUrl || hotel.bookingUrl === "#"
                        ? "disabled"
                        : ""
                    }
                    title="${
                      !hotel.bookingUrl || hotel.bookingUrl === "#"
                        ? "Booking unavailable for this listing"
                        : "Book this hotel"
                    }"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
          })
          .join("")}
      </div>
    `;
  }

  // Render no results section
  function renderNoResultsSection(section, city) {
    const sectionNames = {
      events: "Events & Activities",
      guide: "Travel Guide",
      hotels: "Hotels & Accommodations",
    };

    return `
      <h2 class="results-title">No ${sectionNames[section]} found for ${city}</h2>
      <div class="no-results">
        <h3>😔 No ${section} found</h3>
        <p>We couldn't find any ${section} in ${city}. Try searching for a different city!</p>
      </div>
    `;
  }

  // Create modal overlay
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">&times;</button>
      <img class="modal-image" src="" alt="">
      <div class="modal-body">
        <h2 class="modal-title"></h2>
        <div class="modal-meta">
          <div class="modal-city"></div>
          <div class="modal-date"></div>
        </div>
        <div class="modal-description"></div>
        <div class="modal-footer">
          <div class="modal-price"></div>
          <a href="#" target="_blank" class="modal-btn"></a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalOverlay);

  // Modal functions
  function openModal(item, endpoint) {
    const modal = modalOverlay.querySelector(".modal-content");
    const modalImage = modal.querySelector(".modal-image");
    const modalTitle = modal.querySelector(".modal-title");
    const modalCity = modal.querySelector(".modal-city");
    const modalDate = modal.querySelector(".modal-date");
    const modalDescription = modal.querySelector(".modal-description");
    const modalPrice = modal.querySelector(".modal-price");
    const modalBtn = modal.querySelector(".modal-btn");

    // Set modal content with unified image fallback
    const img =
      item.main_photo ||
      item.thumbnail ||
      item.image ||
      item.imageUrl ||
      item.media?.[0]?.url ||
      item.photos?.[0]?.url ||
      `https://source.unsplash.com/featured/?hotel,${encodeURIComponent(
        item.city || "destination"
      )}`;

    console.log(
      "🖼️ Modal image chosen for:",
      item.name || "Unknown",
      "=>",
      img
    );

    modalImage.src = img;
    modalImage.alt = item.name;
    modalImage.onerror = () => {
      modalImage.src = "https://via.placeholder.com/600x400?text=No+Image";
    };

    modalTitle.textContent = item.name;
    modalCity.innerHTML = `📍 ${item.city}`;
    modalDate.textContent = item.date;
    modalDescription.textContent = item.description;
    modalPrice.textContent = item.price;

    // Set button text and link based on endpoint
    const buttonTexts = {
      events: "Get Tickets",
      guide: "Learn More",
      hotels: "Book Now",
    };
    modalBtn.textContent = buttonTexts[endpoint] || "View Details";
    modalBtn.href = item.link;

    // Show modal
    modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
    document.body.style.overflow = "auto"; // Restore scrolling
  }

  // Modal event listeners
  modalOverlay
    .querySelector(".modal-close")
    .addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
      closeModal();
    }
  });

  function renderLoadingState(city) {
    resultSection.innerHTML = `
      <h2 class="results-title">Searching for ${city}...</h2>
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
    `;
  }

  // Store current search data for View More functionality
  let currentSearchData = null;
  let displayedCount = 6;

  function renderErrorCard(error, details) {
    resultSection.innerHTML = `
      <h2 class="results-title">Search Error</h2>
      <div class="error-card">
        <div class="error-icon">⚠️</div>
        <div class="error-title">Unable to load data</div>
        <div class="error-message">Please check your connection or try again later.</div>
        ${details ? `<div class="error-details">${details}</div>` : ""}
      </div>
    `;
  }

  function renderResults(data, city) {
    const { endpoint, items, error, details } = data;

    // Handle errors
    if (error) {
      renderErrorCard(error, details);
      return;
    }

    if (!items || items.length === 0) {
      resultSection.innerHTML = `
        <h2 class="results-title">No results found for ${city}</h2>
        <div class="no-results">
          <h3>😔 No ${endpoint} found</h3>
          <p>We couldn't find any ${endpoint} in ${city}. Try searching for a different city!</p>
        </div>
      `;
      return;
    }

    // Special handling for travel guide
    if (endpoint === "guide") {
      renderTravelGuide(items[0], city);
      return;
    }

    // Store data for View More functionality
    currentSearchData = { endpoint, items, city };
    displayedCount = 6;

    const endpointTitles = {
      events: "Events & Activities",
      guide: "Travel Guide & Attractions",
      hotels: "Hotels & Accommodations",
    };

    const buttonTexts = {
      events: "Get Tickets",
      guide: "Learn More",
      hotels: "Book Now",
    };

    renderCardsGrid();
  }

  function renderTravelGuide(guide, city) {
    console.log("🧠 Rendering AI Travel Guide for:", city);

    // Unified image fallback chain for guides
    const img =
      guide.image ||
      `https://source.unsplash.com/featured/?${encodeURIComponent(
        city || "travel"
      )},landmark`;

    console.log(
      "🖼️ Travel guide image chosen for:",
      city || "Unknown",
      "=>",
      img
    );

    const guideHTML = `
      <h2 class="results-title">AI Travel Guide for ${city}</h2>
      <div class="guide-section fade-in">
        <div class="guide-card">
          <img src="${img}" alt="${city}" class="guide-image" 
               onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'">
          <div class="guide-content">
            <h3 class="guide-title">${guide.name}</h3>
            <div class="guide-description">
              ${guide.description}
            </div>
            
            <div class="guide-details">
              <div class="guide-section-item fade-in" style="animation-delay: 0.1s;">
                <h4 class="guide-section-title">🏛️ Top Attractions</h4>
                <ul class="guide-list">
                  ${
                    guide.attractions
                      ? guide.attractions
                          .map((attr) => `<li>${attr}</li>`)
                          .join("")
                      : ""
                  }
                </ul>
              </div>
              
              <div class="guide-section-item fade-in" style="animation-delay: 0.2s;">
                <h4 class="guide-section-title">🍽️ Local Food</h4>
                <ul class="guide-list">
                  ${
                    guide.food
                      ? guide.food.map((food) => `<li>${food}</li>`).join("")
                      : ""
                  }
                </ul>
              </div>
              
              <div class="guide-section-item fade-in" style="animation-delay: 0.3s;">
                <h4 class="guide-section-title">📅 Best Time to Visit</h4>
                <p class="guide-text">${
                  guide.bestTime || "Year-round destination"
                }</p>
              </div>
              
              <div class="guide-section-item fade-in" style="animation-delay: 0.4s;">
                <h4 class="guide-section-title">💡 Travel Tips</h4>
                <ul class="guide-list">
                  ${
                    guide.tips
                      ? guide.tips.map((tip) => `<li>${tip}</li>`).join("")
                      : ""
                  }
                </ul>
              </div>
            </div>
            
            <div class="guide-footer">
              <button class="regenerate-btn" onclick="regenerateGuide('${city}')">
                🔄 Regenerate Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    resultSection.innerHTML = guideHTML;
  }

  function renderCardsGrid() {
    if (!currentSearchData) return;

    const { endpoint, items, city } = currentSearchData;
    const itemsToShow = items.slice(0, displayedCount);
    const hasMore = displayedCount < items.length;

    const endpointTitles = {
      events: "Events & Activities",
      guide: "Travel Guide & Attractions",
      hotels: "Hotels & Accommodations",
    };

    const buttonTexts = {
      events: "Get Tickets",
      guide: "Learn More",
      hotels: "Book Now",
    };

    const cardsHTML = itemsToShow
      .map((item, index) => {
        // Unified image fallback chain based on endpoint
        let img;
        if (endpoint === "hotels") {
          img =
            item.main_photo ||
            item.thumbnail ||
            item.image ||
            item.imageUrl ||
            item.media?.[0]?.url ||
            item.photos?.[0]?.url ||
            "https://source.unsplash.com/featured/?hotel," +
              encodeURIComponent(item.city || "destination");
        } else if (endpoint === "events") {
          img =
            item.image ||
            item.imageUrl ||
            item.media?.[0]?.url ||
            item.photos?.[0]?.url ||
            "/images/event-placeholder.svg";
        } else {
          img =
            item.image ||
            item.imageUrl ||
            item.media?.[0]?.url ||
            item.photos?.[0]?.url ||
            "https://via.placeholder.com/600x400?text=No+Image";
        }

        console.log(`🖼️ ${endpoint} image chosen for:`, item.name, "=>", img);

        return `
      <div class="unified-card fade-in" data-item-index="${index}" style="cursor: pointer; animation-delay: ${
          index * 0.1
        }s;">
        <img src="${img}" alt="${
          item.name || "Hotel"
        }" class="unified-card-image" 
             onerror="this.src='/images/hotel-placeholder.jpg'"
             onload="console.log('🖼️ Hotel Image loaded:', this.src)">
        <div class="unified-card-content">
          <h3 class="unified-card-title">${item.name}</h3>
          <div class="unified-card-location">📍 ${item.city}</div>
          <p class="unified-card-description">${item.description}</p>
          <div class="unified-card-footer">
            <div>
              <div class="unified-card-price">${item.price}</div>
              <div class="unified-card-date">${item.date}</div>
            </div>
            <div class="unified-card-buttons">
              ${
                endpoint === "hotels"
                  ? `
              <button 
                class="unified-btn-primary ${
                  !item.bookingUrl || item.bookingUrl === "#" ? "disabled" : ""
                }" 
                onclick="event.stopPropagation(); handleBooking('${
                  item.bookingUrl || ""
                }')"
                ${!item.bookingUrl || item.bookingUrl === "#" ? "disabled" : ""}
                title="${
                  !item.bookingUrl || item.bookingUrl === "#"
                    ? "Booking unavailable for this listing"
                    : "Book this hotel"
                }"
              >
                Book Now
              </button>
              `
                  : `
              <a href="${
                item.link
              }" target="_blank" class="unified-btn-primary" onclick="event.stopPropagation();">
                ${buttonTexts[endpoint] || "View Details"}
              </a>
              `
              }
              ${
                item.link && item.link !== "#"
                  ? `
              <a href="${item.link}" target="_blank" class="unified-btn-secondary" onclick="event.stopPropagation();">
                View Details
              </a>
              `
                  : `
              <span class="unified-btn-secondary disabled">View Details</span>
              `
              }
            </div>
          </div>
        </div>
      </div>
    `;
      })
      .join("");

    const viewMoreHTML = hasMore
      ? `
      <div class="view-more-container">
        <button class="view-more-btn" id="view-more-btn">
          View More → (${items.length - displayedCount} remaining)
        </button>
      </div>
    `
      : "";

    resultSection.innerHTML = `
      <h2 class="results-title">${endpointTitles[endpoint]} in ${city}</h2>
      <div class="results-grid">
        ${cardsHTML}
      </div>
      ${viewMoreHTML}
    `;

    // Add click event listeners to cards
    const cards = resultSection.querySelectorAll(".result-card");
    cards.forEach((card, index) => {
      card.addEventListener("click", () => {
        openModal(itemsToShow[index], endpoint);
      });
    });

    // Add View More button functionality
    const viewMoreBtn = resultSection.querySelector("#view-more-btn");
    if (viewMoreBtn) {
      viewMoreBtn.addEventListener("click", () => {
        displayedCount = Math.min(
          displayedCount + 6,
          currentSearchData.items.length
        );
        renderCardsGrid();
      });
    }
  }

  // Regenerate guide function
  window.regenerateGuide = function (city) {
    console.log("🔄 Regenerating guide for:", city);
    handleSearch("guide", city);
  };

  // Handle booking button clicks
  window.handleBooking = function (url) {
    if (!url || url === "#") {
      alert("Booking link unavailable for this hotel.");
      return;
    }
    console.log("🔗 Opening booking URL:", url);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  async function handleSearch(type, cityOverride = null) {
    const city = cityOverride || searchInput.value.trim();
    if (!city) return alert("Please enter a destination.");

    let message = "";
    if (type === "events") message = `find events in ${city}`;
    if (type === "guide") message = `travel guide for ${city}`;
    if (type === "hotels") message = `find hotels in ${city}`;

    try {
      // Show loading state
      resultSection.classList.remove("hidden");
      renderLoadingState(city);
      window.scrollTo({ top: resultSection.offsetTop, behavior: "smooth" });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      // Check if we have the new format with items array
      if (data.endpoint && Array.isArray(data.items)) {
        renderResults(data, city);
      } else if (data.error) {
        // Handle API errors
        renderErrorCard(data.error, data.details);
      } else {
        // Fallback to old format for backward compatibility
        const reply = data.reply || "No results found.";
        resultSection.innerHTML = `
          <h2 class="results-title">Results for ${city}</h2>
          <div style="max-width:800px; margin:20px auto; background:white; padding:30px; border-radius:15px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
            ${reply.replace(/\n/g, "<br>")}
          </div>
        `;
      }
    } catch (error) {
      console.error("Search error:", error);
      renderErrorCard(
        "Network Error",
        "Unable to connect to the server. Please check your internet connection."
      );
    }
  }

  // Function to set up button event listeners
  function setupButtonListeners(exploreBtn, guideBtn, hotelBtn) {
    console.log("🔧 Setting up button event listeners...");

    if (exploreBtn) {
      exploreBtn.type = "button";
      console.log("✅ Button listener active: Explore Events");
      exploreBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("🎪 Explore Events button clicked");
        handleSectionChange("events");
      });
    } else {
      console.error("❌ Explore Events button not found!");
    }

    if (guideBtn) {
      guideBtn.type = "button";
      console.log("✅ Button listener active: AI Travel Guide");
      guideBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("🧭 AI Travel Guide button clicked");
        handleSectionChange("guide");
      });
    } else {
      console.error("❌ AI Travel Guide button not found!");
    }

    if (hotelBtn) {
      hotelBtn.type = "button";
      console.log("✅ Button listener active: Find Hotels");
      hotelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("🏨 Find Hotels button clicked");
        handleSectionChange("hotels");
      });
    } else {
      console.error("❌ Find Hotels button not found!");
    }

    console.log("🎯 Button event listeners setup complete");
  }

  // Also handle Enter key in search input
  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        handleSearch("events"); // Default to events search on Enter
      }
    });
  }

  // Initialize button states and content sections
  function initializeButtonStates() {
    // Remove any existing active states
    document.querySelectorAll(".btn-primary, .btn-secondary").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Initialize content sections
    const eventsSection = document.getElementById("events-section");
    const guideSection = document.getElementById("guide-section");
    const hotelsSection = document.getElementById("hotels-section");

    // Hide all sections initially
    if (eventsSection) eventsSection.classList.add("hidden");
    if (guideSection) guideSection.classList.add("hidden");
    if (hotelsSection) hotelsSection.classList.add("hidden");

    console.log("🎯 Button states and content sections initialized");
  }

  // Initialize on page load
  initializeButtonStates();

  console.log("🎯 Hero buttons connected to search functionality");
});

// Expose showHeroSection function globally
window.showHeroSection = showHeroSection;
