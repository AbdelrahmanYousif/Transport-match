import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiDelete, apiGet, apiPostJson, getToken, type Me, type Trip, type TripDetail } from "../api";
import { Alert, Button, Card, Container, Divider, H1, Muted, Row, Spacer } from "../ui";

function statusLabel(status?: string) {
  if (!status) return "-";
  if (status === "OPEN") return "ÖPPEN";
  if (status === "RESERVED") return "RESERVERAD";
  if (status === "COMPLETED") return "KLAR";
  if (status === "CANCELLED") return "AVBOKAD";
  return status;
}

export default function TripDetailPage({ me }: { me: Me | null }) {
  const { id } = useParams();
  const tripId = Number(id);
  const nav = useNavigate();

  const [data, setData] = useState<TripDetail | null>(null);
  const [fallbackTrip, setFallbackTrip] = useState<Trip | null>(null); // utloggad (från /trips)
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<null | "reserve" | "unreserve" | "complete" | "cancel">(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      // Inloggad: detalj-endpoint (kan visa reserved_driver om rätt företag)
      if (getToken()) {
        const d = await apiGet<TripDetail>(`/trips/${tripId}`);
        setData(d);
        setFallbackTrip(null);
        return;
      }

      // Utloggad: bara OPEN finns i listan
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
    // inte inloggad? → auth och tillbaka hit
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
        <Alert tone="danger">Ogiltigt id.</Alert>
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
        <Spacer />
      </Row>

      <H1>Körning #{tripId}</H1>

      {loading && <Muted>Laddar...</Muted>}

      {err && (
        <div style={{ marginBottom: 12 }}>
          <Alert tone="danger">Fel: {err}</Alert>
        </div>
      )}

      {!trip && !loading && (
        <Card>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Körningen hittades inte</div>
          <Muted>
            Om du är utloggad visas bara ÖPPNA körningar. Logga in för att se fler detaljer.
          </Muted>
          <Divider />
          <Button onClick={() => nav(`/auth?next=/trips/${tripId}`)}>Logga in</Button>
        </Card>
      )}

      {trip && (
        <Card>
          <Row style={{ alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
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
                Status: <b>{statusLabel(trip.status)}</b>
              </div>
            </div>

            <Spacer />
          </Row>

          <Divider />

          {/* Paxad av: bara om backend gav det */}
          {data?.reserved_driver ? (
            <Card style={{ padding: 12, borderRadius: 12, boxShadow: "none" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Paxad av</div>
              <div>{data.reserved_driver.name}</div>
              <Muted>{data.reserved_driver.email}</Muted>
            </Card>
          ) : (
            <Muted>
              {getToken()
                ? "Ingen förare visas (körningen är Öppen eller så äger du inte körningen)."
                : "Logga in för att paxa eller se mer detaljer."}
            </Muted>
          )}

          <Divider />

          <Row>
            {/* FÖRARE */}
            {me?.role === "DRIVER" && trip.status === "OPEN" && (
              <Button
                onClick={() => runAction("reserve", () => apiPostJson(`/trips/${tripId}/reserve`, {}))}
                loading={action === "reserve"}
              >
                Paxa körning
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

            {/* FÖRETAG */}
            {me?.role === "COMPANY" && trip.status === "RESERVED" && (
              <Button
                onClick={() => runAction("complete", () => apiPostJson(`/trips/${tripId}/complete`, {}))}
                loading={action === "complete"}
              >
                Markera som klar
              </Button>
            )}

            {me?.role === "COMPANY" && (trip.status === "OPEN" || trip.status === "RESERVED") && (
              <Button
                variant="ghost"
                onClick={() => runAction("cancel", () => apiPostJson(`/trips/${tripId}/cancel`, {}))}
                loading={action === "cancel"}
              >
                Avboka
              </Button>
            )}

            {/* Utloggad CTA */}
            {!getToken() && (
              <Button onClick={() => nav(`/auth?next=/trips/${tripId}`)}>
                Logga in för att paxa
              </Button>
            )}
          </Row>
        </Card>
      )}
    </Container>
  );
}
