import { useEffect, useState } from "react";
import { apiGet, apiPostJson, type Trip } from "../api";

export default function CreateTrip() {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [origin, setOrigin] = useState("Stockholm");
  const [destination, setDestination] = useState("Uppsala");
  const [date, setDate] = useState("2025-12-23");
  const [timeWindow, setTimeWindow] = useState("08-12");
  const [compensationSek, setCompensationSek] = useState(500);
  const [vehicleInfo, setVehicleInfo] = useState("Volvo V60");

  const [openTrips, setOpenTrips] = useState<Trip[]>([]);

  async function loadOpenTrips() {
    try {
      const data = await apiGet<Trip[]>("/trips");
      setOpenTrips(data);
    } catch (e) {
      setErr(String(e));
    }
  }

  async function createTrip() {
    try {
      setBusy(true);
      setErr(null);

      const payload = {
        origin,
        destination,
        date,
        time_window: timeWindow,
        compensation_sek: Number(compensationSek),
        vehicle_info: vehicleInfo,
      };

      await apiPostJson<Trip>("/trips", payload);
      await loadOpenTrips();
      alert("Trip skapad ✅");
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadOpenTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Create Trip</h1>
      <p>Här skapar företag en körning som förare kan paxa.</p>

      <div style={{ maxWidth: 520 }}>
        <label>
          Origin
          <input value={origin} onChange={(e) => setOrigin(e.target.value)} style={{ width: "100%" }} />
        </label>

        <label>
          Destination
          <input value={destination} onChange={(e) => setDestination(e.target.value)} style={{ width: "100%" }} />
        </label>

        <label>
          Date (YYYY-MM-DD)
          <input value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%" }} />
        </label>

        <label>
          Time window
          <input value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)} style={{ width: "100%" }} />
        </label>

        <label>
          Compensation (SEK)
          <input
            type="number"
            value={compensationSek}
            onChange={(e) => setCompensationSek(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Vehicle info
          <input value={vehicleInfo} onChange={(e) => setVehicleInfo(e.target.value)} style={{ width: "100%" }} />
        </label>

        <button onClick={createTrip} disabled={busy} style={{ marginTop: 12 }}>
          {busy ? "Skapar..." : "Skapa trip"}
        </button>

        {err && <p style={{ color: "crimson", marginTop: 12 }}>Error: {err}</p>}
      </div>

      <hr style={{ margin: "24px 0" }} />

      <h3>OPEN trips (för test)</h3>
      <button onClick={loadOpenTrips}>Uppdatera</button>

      <div style={{ marginTop: 12 }}>
        {openTrips.length === 0 ? (
          <p>Inga OPEN trips just nu.</p>
        ) : (
          openTrips.map((t) => (
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}