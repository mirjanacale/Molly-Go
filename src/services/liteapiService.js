/**
 * LiteAPI Service
 * Centralized service for all LiteAPI endpoints
 */

const API_BASE = "https://api.liteapi.travel/v3.0";
const API_KEY = import.meta.env.VITE_LITEAPI_KEY || process.env.LITEAPI_KEY;

/**
 * Fetch hotels by city and country
 * @param {string} cityName - Name of the city
 * @param {string} countryCode - ISO country code (e.g., 'DE', 'US')
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function fetchHotels(cityName, countryCode, limit = 10) {
  try {
    const response = await fetch(
      `${API_BASE}/hotels/search?cityName=${encodeURIComponent(
        cityName
      )}&countryCode=${countryCode}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      `✅ fetchHotels loaded ${data?.data?.length || 0} hotels for ${cityName}`
    );
    return { data, error: null };
  } catch (error) {
    console.error(`❌ fetchHotels error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch detailed information about a specific hotel
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function fetchHotelDetails(hotelId) {
  try {
    const response = await fetch(`${API_BASE}/hotels/${hotelId}`, {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ fetchHotelDetails loaded details for hotel ${hotelId}`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ fetchHotelDetails error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch hotel rates/availability
 * @param {Object} params - Rate search parameters
 * @param {string[]} params.hotelIds - Array of hotel IDs
 * @param {string} params.checkin - Check-in date (YYYY-MM-DD)
 * @param {string} params.checkout - Check-out date (YYYY-MM-DD)
 * @param {string} params.currency - Currency code (e.g., 'USD', 'EUR')
 * @param {Array} params.occupancies - Occupancy details
 * @param {string} params.guestNationality - Guest nationality code
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function fetchRates({
  hotelIds,
  checkin,
  checkout,
  currency,
  occupancies,
  guestNationality,
}) {
  try {
    const response = await fetch(`${API_BASE}/hotels/rates`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hotelIds,
        checkin,
        checkout,
        currency,
        occupancies,
        guestNationality,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ fetchRates loaded rates for ${hotelIds.length} hotel(s)`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ fetchRates error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Prebook a rate (reserve without final payment)
 * @param {Object} params - Prebook parameters
 * @param {string} params.offerId - Offer ID
 * @param {Object} params.guestInfo - Guest information
 * @param {Object} params.paymentInfo - Payment information
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function prebookRate({ offerId, guestInfo, paymentInfo }) {
  try {
    const response = await fetch(`${API_BASE}/hotels/rates/prebook`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offerId,
        guestInfo,
        paymentInfo,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ prebookRate prebooked offer ${offerId}`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ prebookRate error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Book a rate (final booking)
 * @param {Object} params - Booking parameters
 * @param {string} params.prebookId - Prebook ID from prebookRate
 * @param {Object} params.guestInfo - Guest information
 * @param {Object} params.paymentInfo - Payment information
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function bookRate({ prebookId, guestInfo, paymentInfo }) {
  try {
    const response = await fetch(`${API_BASE}/hotels/rates/book`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prebookId,
        guestInfo,
        paymentInfo,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ bookRate booked reservation ${prebookId}`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ bookRate error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch list of countries
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function fetchCountries() {
  try {
    const response = await fetch(`${API_BASE}/location/countries`, {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      `✅ fetchCountries loaded ${data?.data?.length || 0} countries`
    );
    return { data, error: null };
  } catch (error) {
    console.error(`❌ fetchCountries error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch cities by country code
 * @param {string} countryCode - ISO country code (e.g., 'DE', 'US')
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function fetchCities(countryCode) {
  try {
    const response = await fetch(
      `${API_BASE}/location/cities?countryCode=${countryCode}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      `✅ fetchCities loaded ${
        data?.data?.length || 0
      } cities for ${countryCode}`
    );
    return { data, error: null };
  } catch (error) {
    console.error(`❌ fetchCities error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch bookings for a guest
 * @param {string} guestId - Guest ID
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function fetchBookings(guestId) {
  try {
    const response = await fetch(`${API_BASE}/bookings?guestId=${guestId}`, {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ fetchBookings loaded bookings for guest ${guestId}`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ fetchBookings error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch a specific booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function fetchBookingById(bookingId) {
  try {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ fetchBookingById loaded booking ${bookingId}`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ fetchBookingById error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function cancelBooking(bookingId) {
  try {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ cancelBooking cancelled booking ${bookingId}`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ cancelBooking error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch list of guests
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function fetchGuests() {
  try {
    const response = await fetch(`${API_BASE}/guests`, {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ fetchGuests loaded ${data?.data?.length || 0} guests`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ fetchGuests error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch a specific guest by ID
 * @param {string} guestId - Guest ID
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function fetchGuestById(guestId) {
  try {
    const response = await fetch(`${API_BASE}/guests/${guestId}`, {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ fetchGuestById loaded guest ${guestId}`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ fetchGuestById error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Update loyalty program information
 * @param {string} loyaltyId - Loyalty program ID
 * @param {Object} payload - Update payload
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function updateLoyaltyProgram(loyaltyId, payload) {
  try {
    const response = await fetch(`${API_BASE}/loyalty/${loyaltyId}`, {
      method: "PUT",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ updateLoyaltyProgram updated loyalty program ${loyaltyId}`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ updateLoyaltyProgram error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch vouchers
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function fetchVouchers() {
  try {
    const response = await fetch(`${API_BASE}/vouchers`, {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ fetchVouchers loaded ${data?.data?.length || 0} vouchers`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ fetchVouchers error:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Reconcile bookings within a date range
 * @param {Object} params - Reconciliation parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function reconcileBookings({ startDate, endDate }) {
  try {
    const response = await fetch(
      `${API_BASE}/bookings/reconcile?startDate=${startDate}&endDate=${endDate}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      `✅ reconcileBookings reconciled bookings from ${startDate} to ${endDate}`
    );
    return { data, error: null };
  } catch (error) {
    console.error(`❌ reconcileBookings error:`, error);
    return { data: null, error: error.message };
  }
}
