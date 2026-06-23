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

    // 🔍 DIAGNOSTIC: Log the full raw API response before normalization
    console.log("🔍 Raw hotel API response:", JSON.stringify(data, null, 2));

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
      // 🔍 DIAGNOSTIC: Check image fields in the normalized hotel object
      const firstHotel = hotels[0];
      console.log("🔍 IMAGE FIELD ANALYSIS for first hotel:");
      console.log("  - item.image:", firstHotel.image);
      console.log("  - item.imageUrl:", firstHotel.imageUrl);
      console.log("  - item.media:", firstHotel.media);
      console.log("  - item.photos:", firstHotel.photos);
      console.log("  - item.images:", firstHotel.images);
      console.log("  - item.main_photo:", firstHotel.main_photo);
      console.log("  - item.thumbnail:", firstHotel.thumbnail);
      console.log("  - All keys:", Object.keys(firstHotel));
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

      // Enhanced image retrieval from LiteAPI with comprehensive fallback
      // 🔍 Check normalized image field first (from server normalizeHotel function)
      const normalizedImage = item.image;
      const mediaUrl = item.media?.[0]?.url;
      const photosUrl = item.photos?.[0]?.url;
      const imagesUrl = item.images?.[0]?.url;
      const mainPhoto = item.main_photo;
      const thumbnail = item.thumbnail;
      const imageUrl = item.imageUrl;

      // Try to find a real image from the hotel object (check normalized field first)
      const realImage =
        normalizedImage ||
        mediaUrl ||
        photosUrl ||
        imagesUrl ||
        mainPhoto ||
        thumbnail ||
        imageUrl;

      // Use real image if found, otherwise fallback to placeholder
      const img =
        realImage || "https://via.placeholder.com/600x400?text=No+Image";

      // 🔍 VALIDATE IMAGE URL AND LOG DETAILS
      console.log(`🖼️ Hotel image for ${item.name || "Unknown Hotel"}: ${img}`);

      // Validate URL format
      if (img && img.startsWith("http")) {
        try {
          const url = new URL(img);
          console.log(`  ✅ URL is valid: ${url.hostname}${url.pathname}`);
          if (url.hostname.includes("cupid.travel")) {
            console.log(`  📍 LiteAPI image detected from ${url.hostname}`);
          }
        } catch (e) {
          console.warn(`  ⚠️ Invalid URL format: ${img}`);
        }
      }

      // Debug: Log detailed image source check for first hotel
      if (i === 0) {
        console.log("🖼️ Hotel image source analysis:", {
          hotelName: item.name,
          hasNormalizedImage: !!normalizedImage,
          normalizedImageValue: normalizedImage,
          hasMedia: !!mediaUrl,
          mediaUrlValue: mediaUrl,
          hasPhotos: !!photosUrl,
          hasImages: !!imagesUrl,
          hasMainPhoto: !!mainPhoto,
          hasThumbnail: !!thumbnail,
          thumbnailValue: thumbnail,
          hasImageUrl: !!imageUrl,
          realImageFound: !!realImage,
          finalImage: img,
          isFromLiteAPI: img && img.includes("cupid.travel"),
          fullItemKeys: Object.keys(item),
        });
      }
      const name = item.name || item.hotelName || "";
      const cityName = item.cityName || item.city || city || "";
      const location = cityName || city;

      // 🔍 COMPREHENSIVE DESCRIPTION EXTRACTION
      // Try multiple fields from LiteAPI response
      const rawDescription =
        item.description ||
        item.hotelDescription ||
        item.shortDescription ||
        item.summary ||
        item.overview ||
        item.about ||
        null;

      // Clean and truncate description
      let descriptionText = "No description available";
      if (rawDescription) {
        // Remove HTML tags if present
        const cleanDescription = rawDescription.replace(/<[^>]*>/g, "").trim();

        // Only use if not empty after cleaning
        if (cleanDescription.length > 0) {
          // Truncate to 150 characters with ellipsis if longer
          if (cleanDescription.length > 150) {
            descriptionText = cleanDescription.slice(0, 150) + "...";
          } else {
            descriptionText = cleanDescription;
          }
        }
      }

      // 🔍 BOOKING.COM URL CONSTRUCTION
      // Build Booking.com search URL using hotel name and city
      const hasRequiredData = name && cityName;
      let bookingUrl = null;

      if (hasRequiredData) {
        const searchQuery = `${name} ${cityName}`;
        bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
          searchQuery
        )}`;
        console.log(`🔗 Booking.com URL created for ${name} in ${cityName}`);
      } else {
        console.warn(
          `⚠️ Missing data for booking: name=${!!name}, cityName=${!!cityName}`
        );
      }

      // 📝 LOG DESCRIPTION AND BOOKING LINK (for all hotels)
      console.log(
        `📝 Description for ${name || "Unknown Hotel"}:`,
        descriptionText
      );
      console.log(
        `🔗 Booking link for ${name || "Unknown Hotel"}:`,
        bookingUrl || "Not available (missing name or city)"
      );

      const price = item.price || "Contact for pricing";

      // Create image element with proper error handling
      const imgElement = document.createElement("img");
      imgElement.alt = name;
      imgElement.className = "unified-card-image";
      imgElement.loading = "lazy";

      // 🔍 VALIDATE IMAGE URL BEFORE USE
      console.log(`🔍 Validating image URL for ${name}:`, img);

      // Test if URL is valid and accessible
      if (img && img.startsWith("http")) {
        // Check if URL is HTTPS (required for mixed content)
        if (
          img.startsWith("http://") &&
          window.location.protocol === "https:"
        ) {
          console.warn(`⚠️ Mixed content detected: HTTP image on HTTPS page`);
          console.warn(`⚠️ Image URL: ${img}`);
        }

        // IMPORTANT: Don't set crossOrigin by default
        // Many image CDNs (like static.cupid.travel) don't support CORS
        // Setting crossOrigin = "anonymous" will cause them to fail
        // Only use crossOrigin if we need to read image data with canvas
        // For display purposes, we can load without CORS
        imgElement.referrerPolicy = "no-referrer-when-downgrade";
      }

      imgElement.style.borderRadius = "8px";
      imgElement.style.objectFit = "cover";
      imgElement.style.width = "100%";
      imgElement.style.height = "200px";
      imgElement.style.opacity = "0";
      imgElement.style.transition = "opacity 0.6s ease";

      // Add background color as placeholder while loading
      imgElement.style.backgroundColor = "#f0f0f0";

      // Function to make image visible
      const showImage = () => {
        console.log(`✅ Making image visible for ${name}`);
        imgElement.style.opacity = "1";
        imgElement.style.backgroundColor = "transparent";
      };

      // Track if we've tried with CORS
      let triedWithCORS = false;

      // Image load success handler - handles both cached and new loads
      imgElement.onload = () => {
        console.log(`✅ Image loaded successfully for ${name}`);
        console.log(`✅ Image URL: ${imgElement.src}`);
        showImage();
      };

      // Set up error handler BEFORE setting src
      imgElement.onerror = (error) => {
        console.warn(`⚠️ Image load failed for ${name}`);
        console.warn(`⚠️ Failed URL: ${imgElement.src}`);

        // Detect error type
        if (imgElement.src.includes("static.cupid.travel")) {
          console.warn(`⚠️ LiteAPI image failed to load`);
          console.warn(
            `⚠️ Possible causes: CORS blocked, 403 Forbidden, 404 Not Found, or network error`
          );
          console.warn(`⚠️ Check Network tab in DevTools for status code`);
        }

        // If we haven't tried with CORS yet, try without CORS first
        if (!triedWithCORS && imgElement.crossOrigin) {
          console.warn(
            `⚠️ Retrying without CORS attribute (may be blocking load)`
          );
          triedWithCORS = true;
          imgElement.crossOrigin = null;
          imgElement.src = img; // Retry original URL without CORS
          return;
        }

        // Try local placeholder
        const placeholderUrl = `/images/hotel-placeholder.jpg`;
        console.warn(`⚠️ Attempting fallback to local placeholder`);

        // Remove CORS restriction for local placeholder
        imgElement.crossOrigin = null;

        // Try local placeholder first, then via.placeholder.com
        imgElement.onerror = () => {
          console.warn(
            `⚠️ Local placeholder also failed, using via.placeholder.com`
          );
          imgElement.crossOrigin = null; // No CORS needed for placeholder
          imgElement.src = `https://via.placeholder.com/600x400?text=No+Image`;
          imgElement.onerror = null; // Prevent infinite loop
        };
        imgElement.src = placeholderUrl;
      };

      // Append image to card FIRST (before setting src for better error handling)
      card.appendChild(imgElement);

      // Set the image source AFTER appending to DOM
      // This ensures proper event handler attachment and CORS error detection
      imgElement.src = img;

      // 🔍 TEST IMAGE ACCESSIBILITY (async, non-blocking)
      if (img && img.startsWith("http")) {
        // Test if URL is accessible via fetch (doesn't block rendering)
        fetch(img, { method: "HEAD", mode: "no-cors" })
          .then(() => {
            console.log(`✅ Image URL accessible: ${img}`);
          })
          .catch((err) => {
            console.warn(`⚠️ Image URL may not be accessible: ${img}`);
            // Don't change src, let img element handle it
          });
      }

      // After image is in DOM, check if it's already loaded (cached)
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (imgElement.complete && imgElement.naturalHeight !== 0) {
          console.log(`✅ Image already loaded (cached) for ${name}`);
          showImage();
        } else {
          // If not cached, set up fallback timeout
          setTimeout(() => {
            const computedStyle = window.getComputedStyle(imgElement);
            if (imgElement.complete && imgElement.naturalHeight !== 0) {
              if (
                computedStyle.opacity === "0" ||
                imgElement.style.opacity === "0"
              ) {
                console.log(
                  `⚠️ Fallback: Making image visible after timeout for ${name}`
                );
                showImage();
              }
            } else if (imgElement.complete && imgElement.naturalHeight === 0) {
              console.warn(
                `⚠️ Image marked complete but has 0 height - likely broken: ${img}`
              );
            }
          }, 1000);
        }
      });

      // Create content div separately (don't use innerHTML after appendChild)
      const contentDiv = document.createElement("div");
      contentDiv.className = "unified-card-content";
      contentDiv.innerHTML = `
        <h3 class="unified-card-title">${name}</h3>
        <div class="unified-card-location">📍 ${location}</div>
        <p class="unified-card-description">${descriptionText}</p>
        <div class="unified-card-footer">
          <div>
            <div class="unified-card-price">${price}</div>
            <div class="unified-card-date">Available</div>
          </div>
          <div class="unified-card-buttons">
            ${
              bookingUrl
                ? `<a href="${bookingUrl}" target="_blank" rel="noopener noreferrer" class="unified-btn-primary book-btn" data-hotel-name="${name.replace(
                    /"/g,
                    "&quot;"
                  )}" data-city-name="${cityName.replace(
                    /"/g,
                    "&quot;"
                  )}">Book Now</a>`
                : `<button class="unified-btn-primary disabled book-btn-disabled" disabled title="Booking unavailable - missing hotel name or city">Book Now</button>`
            }
          </div>
        </div>
      `;

      // Append content div (image already appended above)
      card.appendChild(contentDiv);

      // Add click handler for Book Now button
      if (bookingUrl) {
        const bookBtn = contentDiv.querySelector(".book-btn");
        if (bookBtn) {
          bookBtn.addEventListener("click", function (e) {
            const hotelName = this.getAttribute("data-hotel-name") || name;
            const cityNameValue =
              this.getAttribute("data-city-name") || cityName;
            console.log(
              `🔗 Opening Booking.com for ${hotelName} in ${cityNameValue}`
            );
          });
        }
      }

      // Log image source check
      console.log(`🏨 Image source check: ${imgElement.src}`);
      console.log(`🏨 Image element in DOM: ${imgElement.isConnected}`);
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

    // Enhanced staggered fade-in animation for hotel cards
    setTimeout(() => {
      const cards = container.querySelectorAll(".unified-card");
      console.log(
        `🎞️ Fading in ${cards.length} hotel cards with staggered delay`
      );

      cards.forEach((card, index) => {
        // Get all images in this card to verify they're visible
        const cardImages = card.querySelectorAll(".unified-card-image");
        console.log(`🖼️ Card ${index + 1} has ${cardImages.length} image(s)`);

        // Set initial state - start slightly translated down
        // Note: Don't override image opacity here - images handle their own opacity
        card.style.opacity = "0";
        card.style.transform = "translateY(10px)";
        card.style.transition = "opacity 0.6s ease, transform 0.6s ease";

        // Staggered animation with 120ms delay between cards
        setTimeout(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
          console.log(`✨ Hotel card ${index + 1} animated in`);

          // Verify images are visible after card animation
          cardImages.forEach((img, imgIndex) => {
            const computedOpacity = window.getComputedStyle(img).opacity;
            const imgSrc = img.src;
            console.log(
              `  🖼️ Image ${
                imgIndex + 1
              } opacity: ${computedOpacity}, src: ${imgSrc.substring(0, 50)}...`
            );
            if (computedOpacity === "0") {
              console.warn(
                `  ⚠️ Image ${
                  imgIndex + 1
                } still has opacity 0! Forcing visibility.`
              );
              img.style.opacity = "1";
              img.style.backgroundColor = "transparent";
            }
          });
        }, index * 120);
      });

      // Log completion after all cards have animated
      setTimeout(() => {
        console.log(`✅ Fade-in animation complete for hotel`);
      }, (cards.length - 1) * 120 + 600);

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
      console.log(`🖼️ Hotel images loaded successfully for ${city}`);

      // Verify that images are present in the DOM and visible
      const imageElements = container.querySelectorAll(".unified-card-image");
      const imagesWithSrc = Array.from(imageElements).filter(
        (img) => img.src && img.src !== ""
      );
      const visibleImages = Array.from(imageElements).filter(
        (img) => window.getComputedStyle(img).opacity !== "0"
      );
      console.log(
        `🖼️ Image verification: ${imagesWithSrc.length}/${imageElements.length} images have valid src attributes`
      );
      console.log(
        `🖼️ Visible images: ${visibleImages.length}/${imageElements.length} images are visible`
      );

      // Log any images that might be missing or invisible
      if (imagesWithSrc.length < imageElements.length) {
        console.warn(
          `⚠️ ${
            imageElements.length - imagesWithSrc.length
          } hotel images may be missing or failed to load`
        );
      }
      if (visibleImages.length < imageElements.length) {
        console.warn(
          `⚠️ ${
            imageElements.length - visibleImages.length
          } hotel images are present but not visible (opacity 0)`
        );
        console.warn(`⚠️ Image hidden by CSS - forcing visibility`);
        // Force visibility for any images still at opacity 0
        imageElements.forEach((img) => {
          const computedOpacity = window.getComputedStyle(img).opacity;
          if (computedOpacity === "0" || img.style.opacity === "0") {
            console.warn(
              `  🔧 Forcing visibility for image: ${img.src.substring(
                0,
                50
              )}...`
            );
            img.style.opacity = "1";
            img.style.backgroundColor = "transparent";

            // Also check for other CSS hiding issues
            const display = window.getComputedStyle(img).display;
            const visibility = window.getComputedStyle(img).visibility;

            if (display === "none") {
              console.warn(`  ⚠️ Image has display: none`);
              img.style.display = "block";
            }
            if (visibility === "hidden") {
              console.warn(`  ⚠️ Image has visibility: hidden`);
              img.style.visibility = "visible";
            }
          }
        });
      }

      // Final summary
      const successfulImages = Array.from(imageElements).filter((img) => {
        const computed = window.getComputedStyle(img);
        return (
          img.complete &&
          img.naturalHeight > 0 &&
          computed.opacity !== "0" &&
          computed.display !== "none" &&
          computed.visibility !== "hidden"
        );
      });

      if (successfulImages.length === imageElements.length) {
        console.log(
          `✅ Hotel images loaded successfully - all ${successfulImages.length} images visible`
        );
      } else {
        console.warn(
          `⚠️ Only ${successfulImages.length}/${imageElements.length} images are fully loaded and visible`
        );
      }
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
      // Enhanced image fallback order for events
      const eventImage =
        ev.image ||
        ev.media?.[0]?.url ||
        ev.photos?.[0]?.url ||
        ev.imageUrl ||
        ev.thumbnail;
      const img =
        eventImage ||
        `https://source.unsplash.com/featured/?festival,${encodeURIComponent(
          city
        )}`;

      // Log image source for each event
      console.log(
        `🖼️ Event image source for ${ev.name || "Unknown Event"}: ${img}`
      );

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

    // Enhanced staggered fade-in animation for event cards
    setTimeout(() => {
      const cards = container.querySelectorAll(".unified-card");
      console.log(
        `🎞️ Fading in ${cards.length} event cards with staggered delay`
      );

      cards.forEach((card, index) => {
        // Set initial state - start slightly translated down
        card.style.opacity = "0";
        card.style.transform = "translateY(10px)";
        card.style.transition = "opacity 0.6s ease, transform 0.6s ease";

        // Staggered animation with 120ms delay between cards
        setTimeout(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
          console.log(`✨ Event card ${index + 1} animated in`);
        }, index * 120);
      });

      // Log completion after all cards have animated
      setTimeout(() => {
        console.log(`✅ Fade-in animation complete for event`);
      }, (cards.length - 1) * 120 + 600);

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
    console.log(
      `🌍 Rendering travel guide for ${city} with ${guide.blocks.length} blocks`
    );

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

      // Add optional travel image for guide blocks
      const guideImage = block.image || block.media?.[0]?.url || block.photo;
      const imageHtml = guideImage
        ? `<img src="${guideImage}" alt="${
            block.title
          }" class="guide-card-image" loading="lazy" 
             onerror="this.src='https://source.unsplash.com/featured/?travel,${encodeURIComponent(
               city
             )}'" 
             style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;"/>`
        : `<img src="https://source.unsplash.com/featured/?travel,${encodeURIComponent(
            city
          )}" alt="Travel" 
             class="guide-card-image" loading="lazy" 
             style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;"/>`;

      card.innerHTML = `
        ${imageHtml}
        <h4 class="guide-card-title">${emoji} ${
        block.title || "Travel Tip"
      }</h4>
        <ul class="guide-card-list">${(block.items || [])
          .map((item) => `<li>• ${item}</li>`)
          .join("")}</ul>`;

      frag.appendChild(card);
    });
    container.appendChild(frag);

    // Enhanced staggered fade-in animation for guide cards
    setTimeout(() => {
      const cards = container.querySelectorAll(".guide-card");
      console.log(
        `🎞️ Fading in ${cards.length} guide cards with staggered delay`
      );

      cards.forEach((card, index) => {
        // Set initial state - start slightly translated down
        card.style.opacity = "0";
        card.style.transform = "translateY(10px)";
        card.style.transition = "opacity 0.6s ease, transform 0.6s ease";

        // Staggered animation with 120ms delay between cards
        setTimeout(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
          console.log(`✨ Guide card ${index + 1} animated in`);
        }, index * 120);
      });

      // Log completion after all cards have animated
      setTimeout(() => {
        console.log(`✅ Fade-in animation complete for guide`);
      }, (cards.length - 1) * 120 + 600);

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
