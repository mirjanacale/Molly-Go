// ✅ Shared Fetch and Render Functions - Unified Architecture (Fixed Version)
// LiteAPI + OpenAI unified handler for MOLLY Go
// Improved normalization, mapping, and debug logging

const sharedCache = {};

// 🌍 City-to-country mapping
const cityToCountryMapping = {
  berlin: "DE",
  dublin: "IE",
  paris: "FR",
  rome: "IT",
  london: "GB",
  madrid: "ES",
  lisbon: "PT",
  amsterdam: "NL",
  vienna: "AT",
  prague: "CZ",
  budapest: "HU",
  warsaw: "PL",
  stockholm: "SE",
  copenhagen: "DK",
  oslo: "NO",
  athens: "GR",
  barcelona: "ES",
  munich: "DE",
  milan: "IT",
  florence: "IT",
  venice: "IT",
  dubai: "AE",
  newyork: "US",
  "new york": "US",
  toronto: "CA",
  tokyo: "JP",
  seoul: "KR",
  singapore: "SG",
  bangkok: "TH",
  sydney: "AU",
  melbourne: "AU",
  auckland: "NZ",
};

// 🧠 Helper: Resolve country code
function getCountryCode(city, providedCode = "") {
  if (providedCode) return providedCode;
  if (!city) return "";
  const normalized = city.toLowerCase().trim();
  return cityToCountryMapping[normalized] || "";
}

// ⏳ MOLLY Loading Animation Helper
function showLoading(container, message = "Fetching your next adventure...") {
  container.innerHTML = `
    <div class="molly-loader fade-in">
      <div class="spinner"></div>
      <p>✈️ ${message}</p>
    </div>`;
}

// ------------------------------------------------------------
// 🏨 Fetch Hotels
// ------------------------------------------------------------
async function fetchHotels(city, countryCode = "") {
  console.log("🏨 Fetching hotels for:", city);
  if (!city) return [];

  // Show loading animation
  const container = document.querySelector("#hotels-results");
  if (container) {
    showLoading(container, "🏨 Finding cozy stays...");
    console.log(`⏳ MOLLY loader active for ${city} (hotels)`);
  }

  const finalCountryCode = getCountryCode(city, countryCode) || "DE";
  const url = `/api/hotels?city=${encodeURIComponent(
    city
  )}&countryCode=${finalCountryCode}&limit=10`;

  console.log("🔗 Final URL:", url);

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("📦 Response keys:", Object.keys(data));

    // Detect LiteAPI error object
    if (data.error) {
      console.warn("⚠️ LiteAPI Error:", data.error, data.details || "");
      return [];
    }

    // Normalize hotel arrays
    let hotels = Array.isArray(data.data?.hotels)
      ? data.data.hotels
      : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.results)
      ? data.results
      : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.hotels)
      ? data.hotels
      : Array.isArray(data)
      ? data
      : [];

    // Log helpful debug output
    console.log(`✅ Normalized hotels: ${hotels.length}`);
    if (hotels.length === 0) {
      console.warn(`⚠️ No hotels found for ${city} (${finalCountryCode})`);
      console.log("🕵️ Raw API payload:", JSON.stringify(data, null, 2));
    } else {
      console.log("🏨 Example hotel:", hotels[0]);
    }

    return hotels;
  } catch (err) {
    console.error("💥 fetchHotels error:", err);
    return [];
  }
}

// ------------------------------------------------------------
// 🎪 Fetch Events
// ------------------------------------------------------------
async function fetchEvents(city, countryCode = "") {
  console.log("🎪 Fetching events for:", city);
  if (!city) return [];

  // Show loading animation
  const container = document.querySelector("#events-results");
  if (container) {
    showLoading(container, "🎉 Discovering local vibes...");
    console.log(`⏳ MOLLY loader active for ${city} (events)`);
  }

  const finalCountryCode = getCountryCode(city, countryCode) || "";
  const url = `/api/events?city=${encodeURIComponent(
    city
  )}&countryCode=${finalCountryCode}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    let events = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.results)
      ? data.results
      : Array.isArray(data)
      ? data
      : [];

    console.log(`✅ Normalized events: ${events.length}`);
    return events;
  } catch (err) {
    console.error("💥 fetchEvents error:", err);
    return [];
  }
}

// ------------------------------------------------------------
// 🧭 Fetch Guide
// ------------------------------------------------------------
async function fetchGuide(city, countryCode = "") {
  console.log("🧭 Fetching guide for:", city);

  // Show loading animation
  const container = document.querySelector("#guide-results");
  if (container) {
    showLoading(container, "🗺️ Preparing your travel notes...");
    console.log(`⏳ MOLLY loader active for ${city} (guide)`);
  }

  const finalCountryCode = getCountryCode(city, countryCode);
  const url = `/api/guide?city=${encodeURIComponent(
    city
  )}&countryCode=${finalCountryCode}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    let guide =
      data.blocks && Array.isArray(data.blocks)
        ? data
        : Array.isArray(data.data)
        ? { blocks: data.data }
        : Array.isArray(data.items)
        ? { blocks: data.items }
        : Array.isArray(data.results)
        ? { blocks: data.results }
        : Array.isArray(data)
        ? { blocks: data }
        : { blocks: [] };

    console.log("✅ Normalized guide:", guide.blocks.length, "blocks");
    return guide;
  } catch (err) {
    console.error("💥 fetchGuide error:", err);
    return { blocks: [] };
  }
}

// ------------------------------------------------------------
// 🧱 Rendering Functions
// ------------------------------------------------------------
function renderHotelsInto(container, items, city) {
  if (!container) {
    console.error("❌ renderHotelsInto: No container provided");
    return;
  }

  console.log("🟢 renderHotelsInto called with:", {
    container: container,
    containerId: container.id,
    containerClasses: container.className,
    itemsCount: items?.length || 0,
    city: city,
  });

  // Verify container is visible
  const containerStyle = window.getComputedStyle(container);
  const isVisible =
    containerStyle.display !== "none" &&
    containerStyle.opacity !== "0" &&
    containerStyle.visibility !== "hidden";
  console.log("🟢 Container visibility check:", {
    display: containerStyle.display,
    opacity: containerStyle.opacity,
    visibility: containerStyle.visibility,
    isVisible: isVisible,
  });

  // Clear container and add fade-out effect
  container.style.opacity = "0";
  container.style.transition = "opacity 0.3s ease";

  setTimeout(() => {
    container.innerHTML = "";

    if (!items?.length) {
      container.innerHTML = `
        <div class="empty molly-empty fade-in">
          <img src="/images/molly-empty.png" alt="MOLLY mascot" class="molly-empty-img" 
               onerror="this.src='https://source.unsplash.com/featured/?smile,travel,balloon'" />
          <p class="molly-empty-text">💭 MOLLY says: Hmm... I couldn't find any hotels in <strong>${city}</strong>. Try another city or let me suggest something joyful!</p>
          <button class="unified-btn-primary" onclick="window.sharedFetch.fetchHotels('dublin','IE')">✨ Explore Dublin Instead</button>
        </div>`;
      console.log(`💭 MOLLY empty state displayed for ${city}`);

      // Fade in empty state
      container.style.opacity = "1";
      console.log(`✅ Hotels empty state rendered successfully for ${city}`);
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach((item, i) => {
      const card = document.createElement("div");
      card.className = "unified-card fade-in";
      card.style.animationDelay = `${i * 0.1}s`;
      card.style.opacity = "0";
      card.style.transition = "opacity 0.5s ease";

      const img =
        item.main_photo ||
        item.thumbnail ||
        item.imageUrl ||
        `https://source.unsplash.com/featured/?hotel,${encodeURIComponent(
          city
        )}`;
      const name = item.name || "Hotel";
      const location = item.city || city;
      const description =
        item.hotelDescription?.slice(0, 150) ||
        item.description?.slice(0, 150) ||
        "No description available";
      const price = item.price || "Contact for pricing";
      const bookingUrl = item.url || item.bookingUrl || "#";

      card.innerHTML = `
      <img src="${img}" alt="${name}" class="unified-card-image" loading="lazy"
           onerror="this.src='https://source.unsplash.com/featured/?hotel,${encodeURIComponent(
             city
           )}'"/>
      <div class="unified-card-content">
        <h3 class="unified-card-title">${name}</h3>
        <div class="unified-card-location">📍 ${location}</div>
        <p class="unified-card-description">${description}</p>
        <div class="unified-card-footer">
          <div>
            <div class="unified-card-price">${price}</div>
            <div class="unified-card-date">Available</div>
          </div>
          <div class="unified-card-buttons">
            ${
              bookingUrl && bookingUrl !== "#"
                ? `<a href="${bookingUrl}" target="_blank" rel="noopener" class="unified-btn-primary">Book Now</a>`
                : `<button class="unified-btn-primary disabled" disabled>Book Now</button>`
            }
          </div>
        </div>
      </div>`;
      frag.appendChild(card);
    });
    container.appendChild(frag);

    // Verify cards were appended to the correct container
    const appendedCards = container.querySelectorAll(".unified-card");
    console.log(
      "🟢 Hotel cards inserted into visible container:",
      appendedCards.length > 0
    );
    console.log("🟢 Container after append:", {
      containerId: container.id,
      childCount: container.children.length,
      cardCount: appendedCards.length,
      containerHTML: container.innerHTML.substring(0, 200) + "...",
    });

    // Fade in all cards with staggered timing
    setTimeout(() => {
      const cards = container.querySelectorAll(".unified-card");
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.style.opacity = "1";
        }, index * 100);
      });

      // Fade in container
      container.style.opacity = "1";

      // Final verification that cards are visible
      const finalCards = container.querySelectorAll(".unified-card");
      const visibleCards = Array.from(finalCards).filter(
        (card) => window.getComputedStyle(card).opacity !== "0"
      );
      console.log("🟢 Hotel cards inserted into visible container: true");
      console.log(
        `✅ Hotels loaded successfully: ${items.length} hotels for ${city}`
      );
      console.log(
        `🟢 Final verification: ${finalCards.length} cards, ${visibleCards.length} visible`
      );
    }, 100);
  }, 300);
}

function renderEventsInto(container, items, city) {
  if (!container) return;

  // Clear container and add fade-out effect
  container.style.opacity = "0";
  container.style.transition = "opacity 0.3s ease";

  setTimeout(() => {
    container.innerHTML = "";

    console.log("🎪 Rendering events for", city, "with", items.length, "items");

    if (!items?.length) {
      container.innerHTML = `
        <div class="empty molly-empty fade-in">
          <img src="/images/molly-empty.png" alt="MOLLY mascot" class="molly-empty-img" 
               onerror="this.src='https://source.unsplash.com/featured/?smile,travel,balloon'" />
          <p class="molly-empty-text">💭 MOLLY says: Hmm... I couldn't find any events in <strong>${city}</strong>. Try another city or let me suggest something joyful!</p>
          <button class="unified-btn-primary" onclick="window.sharedFetch.fetchEvents('dublin','IE')">✨ Explore Dublin Instead</button>
        </div>`;
      console.log(`💭 MOLLY empty state displayed for ${city}`);

      // Fade in empty state
      container.style.opacity = "1";
      console.log(`✅ Events empty state rendered successfully for ${city}`);
      return;
    }

    // Detect if these are suggested (fallback) events
    const isSuggested = items.some((ev) => ev.url === "#");
    console.log("✨ Suggested events rendered:", isSuggested);

    // Add MOLLY suggestion note if these are fallback events
    if (isSuggested) {
      container.innerHTML = `<div class="molly-suggestion-note fade-in">💡 Suggested by MOLLY – local experiences we recommend when no live events are available.</div>`;
    }

    // Log example event for debugging
    console.log("🎟️ Example event:", items[0]);

    const frag = document.createDocumentFragment();
    items.forEach((ev, i) => {
      // Improved image fallback order
      const img =
        ev.image ||
        ev.media?.[0]?.url ||
        ev.photos?.[0]?.url ||
        ev.imageUrl ||
        ev.thumbnail ||
        `https://source.unsplash.com/featured/?festival,${encodeURIComponent(
          city
        )}`;

      // Format event date with proper locale
      const eventDate = ev.startDate
        ? new Date(ev.startDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : ev.date || "Date TBD";

      // Event location
      const location = `${ev.city || city}, ${ev.country || ""}`;

      // Short description with ellipsis if longer than 150 chars
      const description = ev.description
        ? ev.description.length > 150
          ? ev.description.slice(0, 150) + "..."
          : ev.description
        : "No description available";

      // Ticket or info link
      const ticketUrl = ev.url || ev.bookingUrl || "#";

      // Check if this is a suggested event
      const isSuggestedEvent = ticketUrl === "#";

      const card = document.createElement("div");
      card.className = "unified-card fade-in";
      card.style.animationDelay = `${i * 0.1}s`;

      card.innerHTML = `
      <img src="${img}" alt="${
        ev.name || "Event"
      }" class="unified-card-image" loading="lazy"
           onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'"/>
      <div class="unified-card-content">
        <h3 class="unified-card-title">${ev.name || "Event"}</h3>
        <div class="unified-card-location">📍 ${location}</div>
        <p class="unified-card-description">${description}</p>
        <div class="unified-card-footer">
          <div>
            <div class="unified-card-price">${
              ev.price || "Contact for pricing"
            }</div>
            <div class="unified-card-date">${eventDate}</div>
          </div>
          <div class="unified-card-buttons">
            ${
              ticketUrl && ticketUrl !== "#"
                ? `<a href="${ticketUrl}" target="_blank" rel="noopener" class="unified-btn-primary">Get Tickets</a>`
                : `<button class="unified-btn-primary disabled" disabled>Get Tickets</button>`
            }
            ${
              isSuggestedEvent
                ? `<div class="suggested-tag">Suggested</div>`
                : ""
            }
          </div>
        </div>
      </div>`;
      frag.appendChild(card);
    });
    container.appendChild(frag);

    // Fade in all cards with staggered timing
    setTimeout(() => {
      const cards = container.querySelectorAll(".unified-card");
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.style.opacity = "1";
        }, index * 100);
      });

      // Fade in container
      container.style.opacity = "1";
      console.log(
        `✅ Events loaded successfully: ${items.length} events for ${city}`
      );
    }, 100);
  }, 300);
}

function renderGuideInto(container, guide) {
  if (!container) return;

  // Clear container and add fade-out effect
  container.style.opacity = "0";
  container.style.transition = "opacity 0.3s ease";

  setTimeout(() => {
    container.innerHTML = "";

    console.log(
      "🧭 Rendering travel guide:",
      guide.blocks?.length || 0,
      "blocks"
    );

    if (!guide?.blocks?.length) {
      container.innerHTML = `<div class="empty">💡 No travel guide available for this city. Try another destination!</div>`;

      // Fade in empty state
      container.style.opacity = "1";
      console.log(`✅ Guide empty state rendered successfully`);
      return;
    }

    // Log example guide block for debugging
    console.log("🗺️ Example guide block:", guide.blocks?.[0]);

    const frag = document.createDocumentFragment();
    guide.blocks.forEach((block, index) => {
      // Determine emoji based on block title keywords
      const title = block.title?.toLowerCase() || "";
      let emoji = "🌍"; // default

      if (
        title.includes("food") ||
        title.includes("dining") ||
        title.includes("restaurant")
      ) {
        emoji = "🍽️";
      } else if (
        title.includes("culture") ||
        title.includes("art") ||
        title.includes("museum")
      ) {
        emoji = "🎨";
      } else if (
        title.includes("transport") ||
        title.includes("getting") ||
        title.includes("travel")
      ) {
        emoji = "🚇";
      } else if (
        title.includes("tips") ||
        title.includes("advice") ||
        title.includes("recommendation")
      ) {
        emoji = "💡";
      }

      const card = document.createElement("div");
      card.className = "guide-card fade-in";
      card.style.animationDelay = `${index * 0.1}s`;

      card.innerHTML = `
      <h4 class="guide-card-title">${emoji} ${block.title || "Travel Tip"}</h4>
      <ul class="guide-card-list">${(block.items || [])
        .map((item) => `<li>• ${item}</li>`)
        .join("")}</ul>`;

      frag.appendChild(card);
    });
    container.appendChild(frag);

    // Fade in all cards with staggered timing
    setTimeout(() => {
      const cards = container.querySelectorAll(".guide-card");
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.style.opacity = "1";
        }, index * 100);
      });

      // Fade in container
      container.style.opacity = "1";
      console.log(
        `✅ Guide loaded successfully: ${guide.blocks.length} blocks`
      );
    }, 100);
  }, 300);
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    fetchHotels,
    fetchEvents,
    fetchGuide,
    renderHotelsInto,
    renderEventsInto,
    renderGuideInto,
  };
} else {
  window.sharedFetch = {
    fetchHotels,
    fetchEvents,
    fetchGuide,
    renderHotelsInto,
    renderEventsInto,
    renderGuideInto,
  };
}
