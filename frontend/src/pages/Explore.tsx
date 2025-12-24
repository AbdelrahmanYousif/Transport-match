import { useEffect, useState } from "react";
import { apiGet, apiPostJson, type Trip } from "../api";

export default function Explore() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadTrips() {
    try {
      setLoading(true);
      setErr(null);
      const data = await apiGet<Trip[]>("/trips");
      setTrips(data);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function reserveTrip(id: number) {
    try {
      setErr(null);
      await apiPostJson(`/trips/${id}/reserve`);
      await loadTrips();
    } catch (e) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Explore</h1>
      <p>Här ser du lediga körningar (OPEN). Klicka “Paxa” för att reservera.</p>

      <button onClick={loadTrips} disabled={loading}>
        {loading ? "Laddar..." : "Uppdatera"}
      </button>

      {err && <p style={{ color: "crimson", marginTop: 12 }}>Error: {err}</p>}

      <div style={{ marginTop: 12 }}>
        {trips.length === 0 ? (
          <p>Inga lediga trips just nu.</p>
        ) : (
          trips.map((t) => (
            <div
              key={t.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div style={{ fontWeight: 700 }}>
                #{t.id} {t.origin} → {t.destination}
              </div>
              <div>
                Datum: {t.date ?? "-"} | Tid: {t.time_window ?? "-"}
              </div>
              <div>Ersättning: {t.compensation_sek} SEK</div>
              {t.vehicle_info && <div>Info: {t.vehicle_info}</div>}

              <button style={{ marginTop: 8 }} onClick={() => reserveTrip(t.id)}>
                Paxa
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}