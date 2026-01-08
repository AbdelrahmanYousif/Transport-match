import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiDelete, apiGet, apiPostJson, getToken, type Me, type Trip, type TripDetail } from "../api";
import { Alert, Button, Card, Container, Divider, H1, Muted, Row, Spacer } from "../ui";

export default function TripDetailPage({ me }: { me: Me | null }) {
  const { id } = useParams();
  const tripId = Number(id);
  const nav = useNavigate();

  const [data, setData] = useState<TripDetail | null>(null);
  const [fallbackTrip, setFallbackTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<null | "reserve" | "unreserve" | "complete" | "cancel">(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      if (getToken()) {
        const d = await apiGet<TripDetail>(`/trips/${tripId}`);
        setData(d);
        setFallbackTrip(null);
        return;
      }

      const openTrips = await apiGet<Trip[]>("/trips");
      const t = openTrips.find((x) => x.id === tripId) ?? null;
      setFallbackTrip(t);
      setData(null);
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

  async function runAction(key: typeof action, fn: () => Promise<void>) {
    if (!getToken()) {
      nav(`/auth?next=/trips/${tripId}`);
      return;
    }

    try {
      setErr(null);
      setAction(key);
      await fn();
      await load();
    } catch (e) {
      setErr(String(e));
    } finally {
      setAction(null);
    }
  }

  if (!Number.isFinite(tripId)) {
    return (
      <Container>
        <Alert tone="danger">Ogiltigt trip-id.</Alert>
      </Container>
    );
  }

  const trip = data?.trip ?? fallbackTrip;

  return (
    <Container>
      <Row style={{ marginBottom: 12 }}>
        <Button variant="secondary" onClick={() => nav(-1)}>
          ← Tillbaka
        </Button>

        <Link to="/">Hem</Link>
        <Link to="/mine">Mina körningar</Link>

        <Spacer />
      </Row>

      <H1>Trip #{tripId}</H1>

      {loading && <Muted>Laddar...</Muted>}

      {err && (
        <div style={{ marginBottom: 12 }}>
          <Alert tone="danger">Error: {err}</Alert>
        </div>
      )}

      {!trip && !loading && (
        <Card>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Trippen hittades inte</div>
          <Muted>Om du är utloggad visas bara OPEN-resor. Logga in för fler detaljer.</Muted>
          <Divider />
          <Button onClick={() => nav(`/auth?next=/trips/${tripId}`)}>Logga in</Button>
        </Card>
      )}

      {trip && (
        <Card>
          <Row style={{ alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {trip.origin} → {trip.destination}
              </div>
              <Muted>
                Datum: {trip.date ?? "-"} • Tid: {trip.time_window ?? "-"}
              </Muted>
              <div style={{ marginTop: 8 }}>
                Ersättning: <b>{trip.compensation_sek} SEK</b>
              </div>
              {trip.vehicle_info && <div>Bil: {trip.vehicle_info}</div>}
              <div style={{ marginTop: 6 }}>
                Status: <b>{trip.status}</b>
              </div>
            </div>

            <Spacer />
          </Row>

          <Divider />

          {data?.reserved_driver ? (
            <Card style={{ padding: 12, borderRadius: 12, boxShadow: "none" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Paxad av</div>
              <div>{data.reserved_driver.name}</div>
              <Muted>{data.reserved_driver.email}</Muted>
            </Card>
          ) : (
            <Muted>
              {getToken()
                ? "Ingen driver synlig (OPEN eller så är du inte företaget som äger trippen)."
                : "Logga in för att paxa eller se mer detaljer."}
            </Muted>
          )}

          <Divider />

          <Row>
            {me?.role === "DRIVER" && trip.status === "OPEN" && (
              <Button
                onClick={() => runAction("reserve", () => apiPostJson(`/trips/${tripId}/reserve`, {}))}
                loading={action === "reserve"}
              >
                Paxa denna trip
              </Button>
            )}

            {me?.role === "DRIVER" && trip.status === "RESERVED" && (
              <Button
                variant="secondary"
                onClick={() => runAction("unreserve", () => apiDelete(`/trips/${tripId}/reserve`))}
                loading={action === "unreserve"}
              >
                Avboka min paxning
              </Button>
            )}

            {me?.role === "COMPANY" && trip.status === "RESERVED" && (
              <Button
                onClick={() => runAction("complete", () => apiPostJson(`/trips/${tripId}/complete`, {}))}
                loading={action === "complete"}
              >
                Markera Completed
              </Button>
            )}

            {me?.role === "COMPANY" && (trip.status === "OPEN" || trip.status === "RESERVED") && (
              <Button
                variant="ghost"
                onClick={() => runAction("cancel", () => apiPostJson(`/trips/${tripId}/cancel`, {}))}
                loading={action === "cancel"}
              >
                Avboka (Cancel)
              </Button>
            )}

            {!getToken() && (
              <Button onClick={() => nav(`/auth?next=/trips/${tripId}`)}>Logga in för att paxa</Button>
            )}
          </Row>

          <div style={{ marginTop: 10 }}>
            <Muted>Knapparna visas bara när de är relevanta (roll + status).</Muted>
          </div>
        </Card>
      )}
    </Container>
  );
}
