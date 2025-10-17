// AI Features for MOLLY Go

// Show/hide quota notification
function showQuotaNotification() {
  document.getElementById("quota-notification").style.display = "block";
}

function hideQuotaNotification() {
  document.getElementById("quota-notification").style.display = "none";
}

// Show AI features section
function showAIFeatures() {
  document.querySelector(".hero-section").style.display = "none";
  document.getElementById("ai-features").style.display = "block";
  document.getElementById("ai-features").scrollIntoView({ behavior: "smooth" });
}

// Hide AI features section
function hideAIFeatures() {
  document.getElementById("ai-features").style.display = "none";
  document.querySelector(".hero-section").style.display = "flex";
  document
    .querySelector(".hero-section")
    .scrollIntoView({ behavior: "smooth" });
}

// Get AI travel recommendations
async function getRecommendations() {
  const mood = document.getElementById("mood-input").value;
  const interests = document.getElementById("interests-input").value;
  const budget = document.getElementById("budget-input").value;
  const duration = document.getElementById("duration-input").value;

  if (!mood || !interests) {
    alert(
      "Please fill in your mood and interests to get personalized recommendations!"
    );
    return;
  }

  const resultsContainer = document.getElementById("recommendations-results");
  resultsContainer.innerHTML =
    '<div class="loading">🤖 AI is finding your perfect destinations...</div>';

  try {
    const response = await fetch("/api/travel-recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mood: mood,
        interests: interests,
        budget: budget,
        duration: duration,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get recommendations");
    }

    const data = await response.json();
    displayRecommendations(data.recommendations, data.message);

    // Show quota notification if message indicates quota limit
    if (data.message && data.message.includes("quota exceeded")) {
      showQuotaNotification();
    }
  } catch (error) {
    console.error("Error:", error);
    resultsContainer.innerHTML =
      '<div class="error">Sorry, there was an error getting your recommendations. Please try again.</div>';
  }
}

// Display AI recommendations
function displayRecommendations(recommendations, message = null) {
  const resultsContainer = document.getElementById("recommendations-results");

  if (!recommendations || recommendations.length === 0) {
    resultsContainer.innerHTML =
      '<div class="error">No recommendations found. Please try different inputs.</div>';
    return;
  }

  let html =
    '<h3 style="color: #44322a; margin-bottom: 20px;">🌟 Your Personalized Travel Recommendations</h3>';

  // Display quota limit message if present
  if (message) {
    html += `<div style="background: #f2a908; color: #44322a; padding: 15px; border-radius: 10px; margin-bottom: 20px; font-weight: 600; text-align: center;">${message}</div>`;
  }

  recommendations.forEach((rec, index) => {
    html += `
      <div class="recommendation-card">
        <h3>${rec.destination}, ${rec.country}</h3>
        <p><strong>Why it's perfect for you:</strong> ${rec.description}</p>
        <p><span class="highlight">Best time to visit:</span> ${
          rec.bestTime
        }</p>
        <p><span class="highlight">Must-do experiences:</span> ${
          rec.experiences
        }</p>
        <p><span class="highlight">Estimated cost:</span> ${rec.costRange}</p>
        <button class="btn-primary" onclick="getItinerary('${
          rec.destination
        }', '${document.getElementById("mood-input").value}', '${
      document.getElementById("interests-input").value
    }')" style="margin-top: 10px;">
          Create Itinerary
        </button>
      </div>
    `;
  });

  resultsContainer.innerHTML = html;
}

// Get detailed itinerary for a destination
async function getItinerary(destination, mood, interests) {
  const duration = document.getElementById("duration-input").value;
  const resultsContainer = document.getElementById("recommendations-results");

  resultsContainer.innerHTML =
    '<div class="loading">🗺️ AI is creating your personalized itinerary...</div>';

  try {
    const response = await fetch("/api/generate-itinerary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination: destination,
        duration: duration,
        interests: interests,
        mood: mood,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate itinerary");
    }

    const data = await response.json();
    displayItinerary(data.itinerary, destination);
  } catch (error) {
    console.error("Error:", error);
    resultsContainer.innerHTML =
      '<div class="error">Sorry, there was an error generating your itinerary. Please try again.</div>';
  }
}

// Display generated itinerary
function displayItinerary(itinerary, destination) {
  const resultsContainer = document.getElementById("recommendations-results");

  let html = `<h3 style="color: #44322a; margin-bottom: 20px;">🗺️ Your ${destination} Itinerary</h3>`;

  if (itinerary.days && itinerary.days.length > 0) {
    itinerary.days.forEach((day, index) => {
      html += `
        <div class="recommendation-card">
          <h3>Day ${index + 1}</h3>
          <p><strong>Activities:</strong> ${day.activities}</p>
          <p><strong>Highlights:</strong> ${day.highlights}</p>
          <p><strong>Tips:</strong> ${day.tips}</p>
          <p><span class="highlight">Estimated cost:</span> ${
            day.estimatedCost
          }</p>
        </div>
      `;
    });
  } else {
    html +=
      '<div class="recommendation-card"><p>Itinerary details will be displayed here.</p></div>';
  }

  html += `
    <button class="btn-secondary" onclick="getRecommendations()" style="margin-top: 20px;">
      Back to Recommendations
    </button>
  `;

  resultsContainer.innerHTML = html;
}

// Simple travel recommendations based on destination input
async function getTravelRecommendations() {
  const destination = document.getElementById("destination-input").value;

  if (!destination) {
    alert("Please enter a destination to explore events!");
    return;
  }

  // For now, redirect to AI features with the destination pre-filled
  document.getElementById("mood-input").value = "excited";
  document.getElementById("interests-input").value =
    "local events and festivals";
  showAIFeatures();

  // Auto-trigger recommendations
  setTimeout(() => {
    getRecommendations();
  }, 500);
}

// Get local events for a destination
async function getLocalEvents(
  destination,
  date = new Date().toISOString().split("T")[0]
) {
  try {
    const response = await fetch("/api/local-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination: destination,
        date: date,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get local events");
    }

    const data = await response.json();
    return data.events;
  } catch (error) {
    console.error("Error getting local events:", error);
    return [];
  }
}

// Hotel Search Functions

// Show hotel search section
function showHotelSearch() {
  document.querySelector(".hero-section").style.display = "none";
  document.getElementById("hotel-search").style.display = "block";
  document
    .getElementById("hotel-search")
    .scrollIntoView({ behavior: "smooth" });

  // Set default dates (today + 1 week)
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  document.getElementById("when-checkin").value = today
    .toISOString()
    .split("T")[0];
  document.getElementById("when-checkout").value = nextWeek
    .toISOString()
    .split("T")[0];
}

// Hide hotel search section
function hideHotelSearch() {
  document.getElementById("hotel-search").style.display = "none";
  document.querySelector(".hero-section").style.display = "flex";
  document
    .querySelector(".hero-section")
    .scrollIntoView({ behavior: "smooth" });
}

// Search for hotels using the existing LiteAPI endpoint
async function searchHotels() {
  const city = document.getElementById("where-input").value;
  const countryCode = document.getElementById("country-code").value;
  const checkin = document.getElementById("when-checkin").value;
  const checkout = document.getElementById("when-checkout").value;
  const adults = document.getElementById("guests-input").value.replace("+", "");
  const environment = document.getElementById("environment-select").value;

  // Validation
  if (!city || !countryCode || !checkin || !checkout) {
    alert(
      "Please fill in all required fields: Where, Country Code, Check-in, and Check-out dates!"
    );
    return;
  }

  const resultsContainer = document.getElementById("hotel-results");
  resultsContainer.innerHTML =
    '<div class="loading">🏨 Searching for hotels...</div>';

  try {
    const response = await fetch(
      `/search-hotels?city=${encodeURIComponent(
        city
      )}&countryCode=${encodeURIComponent(
        countryCode
      )}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&environment=${environment}`
    );

    if (!response.ok) {
      throw new Error("Failed to search hotels");
    }

    const data = await response.json();
    displayHotelResults(data.rates, data.message);
  } catch (error) {
    console.error("Error:", error);
    resultsContainer.innerHTML =
      '<div class="error">Sorry, there was an error searching for hotels. Please try again.</div>';
  }
}

// Display hotel search results
function displayHotelResults(rates, message = null) {
  const resultsContainer = document.getElementById("hotel-results");

  if (!rates || rates.length === 0) {
    resultsContainer.innerHTML =
      '<div class="error">No hotels found for your search criteria. Please try different dates or location.</div>';
    return;
  }

  let html =
    '<h3 style="color: #44322a; margin-bottom: 20px;">🏨 Available Hotels</h3>';

  if (message) {
    html += `<div style="background: #f2a908; color: #44322a; padding: 15px; border-radius: 10px; margin-bottom: 20px; font-weight: 600; text-align: center;">${message}</div>`;
  }

  rates.forEach((rate, index) => {
    if (rate.hotel) {
      html += `
        <div class="hotel-card">
          <h3>${rate.hotel.name || "Hotel Name Not Available"}</h3>
          <p><strong>Location:</strong> ${
            rate.hotel.address || "Address not available"
          }</p>
          <p><strong>Rating:</strong> ${rate.hotel.rating || "Not rated"}</p>
          <p><strong>Description:</strong> ${
            rate.hotel.description || "No description available"
          }</p>
          
          ${
            rate.roomTypes && rate.roomTypes.length > 0
              ? `
            <div style="margin-top: 15px;">
              <h4 style="color: #7dc0b5; margin-bottom: 10px;">Available Rooms:</h4>
              ${rate.roomTypes
                .map(
                  (roomType) => `
                <div style="background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 8px;">
                  <p><strong>Room Type:</strong> ${
                    roomType.name || "Standard Room"
                  }</p>
                  ${
                    roomType.rates && roomType.rates.length > 0
                      ? `
                    <p><span class="highlight">Price:</span> $${
                      roomType.rates[0].retailRate.total.amount
                    } ${roomType.rates[0].retailRate.total.currency}</p>
                    <p><strong>Rate Type:</strong> ${
                      roomType.rates[0].name || "Standard Rate"
                    }</p>
                    <button class="btn-primary" onclick="bookHotel('${
                      roomType.offerId
                    }', '${roomType.rates[0].name}', '${
                          roomType.rates[0].retailRate.total.amount
                        }')" style="margin-top: 8px;">
                      Book This Room
                    </button>
                  `
                      : "<p>No rates available</p>"
                  }
                </div>
              `
                )
                .join("")}
            </div>
          `
              : "<p>No room information available</p>"
          }
        </div>
      `;
    }
  });

  resultsContainer.innerHTML = html;
}

// Book a hotel (placeholder function - would integrate with booking system)
function bookHotel(offerId, rateName, price) {
  alert(
    `Booking initiated for:\nOffer ID: ${offerId}\nRate: ${rateName}\nPrice: $${price}\n\nThis would normally redirect to the booking system.`
  );
}

// NEW SEARCH FUNCTIONS FOR ENHANCED MOLLY GO FUNCTIONALITY

// Search for experiences by mood
async function searchExperiences(mood, location, budget, duration) {
  try {
    const response = await fetch("/api/experience-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mood: mood,
        location: location,
        budget: budget,
        duration: duration,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to search experiences");
    }

    const data = await response.json();
    return data.experiences;
  } catch (error) {
    console.error("Error searching experiences:", error);
    return [];
  }
}

// Get destination insights
async function getDestinationInsights(destination) {
  try {
    const response = await fetch(
      `/api/destination-insights/${encodeURIComponent(destination)}`
    );

    if (!response.ok) {
      throw new Error("Failed to get destination insights");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting destination insights:", error);
    return null;
  }
}

// Search accommodations by mood and type
async function searchAccommodations(accommodationType, mood, location, budget) {
  try {
    const response = await fetch("/api/accommodation-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accommodationType: accommodationType,
        mood: mood,
        location: location,
        budget: budget,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to search accommodations");
    }

    const data = await response.json();
    return data.accommodations;
  } catch (error) {
    console.error("Error searching accommodations:", error);
    return [];
  }
}

// Get weather insights for destination
async function getWeatherInsights(destination, month = null) {
  try {
    const url = month
      ? `/api/weather-insights/${encodeURIComponent(
          destination
        )}?month=${encodeURIComponent(month)}`
      : `/api/weather-insights/${encodeURIComponent(destination)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to get weather insights");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting weather insights:", error);
    return null;
  }
}

// Enhanced travel recommendations with all data
async function getComprehensiveRecommendations(
  mood,
  interests,
  budget,
  duration,
  destination = null
) {
  try {
    // Get basic travel recommendations
    const recommendations = await getRecommendations();

    if (destination) {
      // Get additional insights for specific destination
      const [insights, weather, events] = await Promise.all([
        getDestinationInsights(destination),
        getWeatherInsights(destination),
        getLocalEvents(destination),
      ]);

      return {
        recommendations,
        insights,
        weather,
        events,
      };
    }

    return { recommendations };
  } catch (error) {
    console.error("Error getting comprehensive recommendations:", error);
    return { recommendations: [] };
  }
}

// Display comprehensive travel data
function displayComprehensiveResults(data) {
  const resultsContainer = document.getElementById("recommendations-results");

  let html =
    '<h3 style="color: #44322a; margin-bottom: 20px;">🌟 Your Complete Travel Guide</h3>';

  // Display recommendations
  if (data.recommendations && data.recommendations.length > 0) {
    html += '<div class="recommendations-section">';
    data.recommendations.forEach((rec) => {
      html += `
        <div class="recommendation-card">
          <h3>${rec.destination}, ${rec.country}</h3>
          <p><strong>Why it's perfect:</strong> ${rec.description}</p>
          <p><span class="highlight">Best time:</span> ${rec.bestTime}</p>
          <p><span class="highlight">Experiences:</span> ${rec.experiences}</p>
          <p><span class="highlight">Cost:</span> ${rec.costRange}</p>
        </div>
      `;
    });
    html += "</div>";
  }

  // Display destination insights
  if (data.insights) {
    html += `
      <div class="insights-section" style="margin-top: 30px;">
        <h4 style="color: #f2a908;">🎯 Local Insights</h4>
        <div class="insight-card">
          <h5>Best Time to Visit:</h5>
          <p>${data.insights.bestTime}</p>
          
          <h5>Local Tips:</h5>
          <ul>${data.insights.localTips
            ?.map((tip) => `<li>${tip}</li>`)
            .join("")}</ul>
          
          <h5>Hidden Gems:</h5>
          <ul>${data.insights.hiddenGems
            ?.map((gem) => `<li>${gem}</li>`)
            .join("")}</ul>
        </div>
      </div>
    `;
  }

  // Display weather insights
  if (data.weather) {
    html += `
      <div class="weather-section" style="margin-top: 30px;">
        <h4 style="color: #7dc0b5;">🌤️ Weather & Seasonal Info</h4>
        <div class="weather-card">
          <p><strong>Temperature:</strong> ${data.weather.temperature}</p>
          <p><strong>Conditions:</strong> ${data.weather.weather}</p>
          
          <h5>Packing Tips:</h5>
          <ul>${data.weather.packingTips
            ?.map((tip) => `<li>${tip}</li>`)
            .join("")}</ul>
          
          <h5>Seasonal Activities:</h5>
          <ul>${data.weather.seasonalActivities
            ?.map((activity) => `<li>${activity}</li>`)
            .join("")}</ul>
        </div>
      </div>
    `;
  }

  resultsContainer.innerHTML = html;
}
