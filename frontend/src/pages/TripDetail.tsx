import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiDelete, apiGet, apiPost, type TripDetail } from "../api";

export default function TripDetailPage() {
  const { id } = useParams();
  const tripId = Number(id);
  const nav = useNavigate();

  const [data, setData] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const d = await apiGet<TripDetail>(`/trips/${tripId}`);
      setData(d);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(tripId)) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function onComplete() {
    try {
      setErr(null);
      await apiPost(`/trips/${tripId}/complete`, {});
      await load();
    } catch (e) {
      setErr(String(e));
    }
  }

  async function onCancel() {
    try {
      setErr(null);
      await apiPost(`/trips/${tripId}/cancel`, {});
      await load();
    } catch (e) {
      setErr(String(e));
    }
  }

  async function onUnreserve() {
    try {
      setErr(null);
      await apiDelete(`/trips/${tripId}/reserve`);
      await load();
    } catch (e) {
      setErr(String(e));
    }
  }

  if (!Number.isFinite(tripId)) return <p>Ogiltigt trip-id.</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => nav(-1)}>← Tillbaka</button>
        <Link to="/mine">Mina körningar</Link>
        <Link to="/explore">Explore</Link>
      </div>

      <h1 style={{ marginTop: 0 }}>Trip #{tripId}</h1>

      {loading && <p>Laddar...</p>}
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

      {data && (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {data.trip.origin} → {data.trip.destination}
          </div>

          <div style={{ marginTop: 6 }}>
            Datum: {data.trip.date ?? "-"} | Tid: {data.trip.time_window ?? "-"}
          </div>

          <div>Ersättning: {data.trip.compensation_sek} SEK</div>
          <div>
            Status: <b>{data.trip.status}</b>
          </div>
          {data.trip.vehicle_info && <div>Bil: {data.trip.vehicle_info}</div>}

          <hr style={{ margin: "14px 0" }} />

          {data.reserved_driver ? (
            <div style={{ padding: 10, border: "1px solid #eee", borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>Paxad av:</div>
              <div>{data.reserved_driver.name}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{data.reserved_driver.email}</div>
            </div>
          ) : (
            <p style={{ opacity: 0.8 }}>Ingen driver synlig (antingen OPEN eller inte ditt företag).</p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={onComplete}>Markera Completed</button>
            <button onClick={onCancel}>Avboka (Cancel)</button>
            <button onClick={onUnreserve}>Avboka min paxning</button>
          </div>

          <p style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            Obs: Om du inte har rättighet för en knapp får du 403. Nästa steg kan vi gömma knappar baserat på roll.
          </p>
        </div>
      )}
    </div>
  );
}