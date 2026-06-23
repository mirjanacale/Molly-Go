import { useEffect, useState } from "react";
import { fetchHotels } from "../services/liteapiService.js";

function Hotels() {
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await fetchHotels("Berlin", "DE");
      if (error) console.error(error);
      else setHotels(data);
    }
    load();
  }, []);

  return (
    <div>
      <h2>Hotels in Berlin</h2>
      <ul>
        {hotels?.data?.map((h) => (
          <li key={h.id}>
            {h.name} — {h.cityName}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Hotels;
