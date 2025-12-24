import { useEffect, useState } from "react";
import { apiGet, type Trip } from "../api";

export default function MyTrips() {
  const [items, setItems] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const data = await apiGet<Trip[]>("/trips/mine");
      setItems(data);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Mina körningar</h1>

      <button onClick={load} disabled={loading}>
        {loading ? "Laddar..." : "Uppdatera"}
      </button>

      {err && <p style={{ color: "crimson", marginTop: 12 }}>Error: {err}</p>}

      <div style={{ marginTop: 12 }}>
        {items.length === 0 ? (
          <p>Inga körningar ännu.</p>
        ) : (
          items.map((t) => (
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
              <div>Status: {t.status}</div>
              {t.vehicle_info && <div>Bil: {t.vehicle_info}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}