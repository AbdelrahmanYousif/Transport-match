import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiDelete, apiGet, apiPost, type TripDetail, type Me } from "../api";
import { Alert, Badge, Button, Card, Container, Divider, H1, Muted, Row, Spacer } from "../ui";

function statusTone(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "RESERVED") return "warning";
  if (status === "CANCELLED") return "danger";
  return "neutral"; // OPEN
}

export default function TripDetailPage() {
  const { id } = useParams();
  const tripId = Number(id);
  const nav = useNavigate();

  const [data, setData] = useState<TripDetail | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<null | "reserve" | "unreserve" | "complete" | "cancel">(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const [d, m] = await Promise.all([
        apiGet<TripDetail>(`/trips/${tripId}`),
        apiGet<Me>("/me"),
      ]);

      setData(d);
      setMe(m);
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
        <Alert>Ogiltigt trip-id.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={880}>
      <Row style={{ marginBottom: 12 }}>
        <Button variant="secondary" onClick={() => nav(-1)}>
          ← Tillbaka
        </Button>

        <Link to="/mine">Mina körningar</Link>
        <Link to="/explore">Explore</Link>

        <Spacer />
      </Row>

      <H1>Trip #{tripId}</H1>

      {loading && <Muted>Laddar...</Muted>}

      {err && (
        <div style={{ marginBottom: 12 }}>
          <Alert tone="danger">Error: {err}</Alert>
        </div>
      )}

      {data && (
        <Card>
          <Row gap={12} align="flex-start">
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {data.trip.origin} → {data.trip.destination}
              </div>
              <Muted>
                Datum: {data.trip.date ?? "-"} • Tid: {data.trip.time_window ?? "-"}
              </Muted>
              <div style={{ marginTop: 8 }}>Ersättning: <b>{data.trip.compensation_sek} SEK</b></div>
              {data.trip.vehicle_info && <div>Bil: {data.trip.vehicle_info}</div>}
            </div>

            <Spacer />

            <Badge tone={statusTone(data.trip.status)}>{data.trip.status}</Badge>
          </Row>

          <Divider />

          {data.reserved_driver ? (
            <Card style={{ padding: 12, borderRadius: 12, boxShadow: "none" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Paxad av</div>
              <div>{data.reserved_driver.name}</div>
              <Muted>{data.reserved_driver.email}</Muted>
            </Card>
          ) : (
            <Muted>
              Ingen driver synlig (antingen OPEN eller så är du inte företaget som äger trippen).
            </Muted>
          )}

          <Divider />

          <Row gap={10}>
            {/* DRIVER actions */}
            {me?.role === "DRIVER" && data.trip.status === "OPEN" && (
              <Button
                onClick={() => runAction("reserve", () => apiPost(`/trips/${tripId}/reserve`, {}))}
                loading={action === "reserve"}
              >
                Paxa denna trip
              </Button>
            )}

            {me?.role === "DRIVER" && data.trip.status === "RESERVED" && (
              <Button
                variant="secondary"
                onClick={() => runAction("unreserve", () => apiDelete(`/trips/${tripId}/reserve`))}
                loading={action === "unreserve"}
              >
                Avboka min paxning
              </Button>
            )}

            {/* COMPANY actions */}
            {me?.role === "COMPANY" && data.trip.status === "RESERVED" && (
              <Button
                onClick={() => runAction("complete", () => apiPost(`/trips/${tripId}/complete`, {}))}
                loading={action === "complete"}
              >
                Markera Completed
              </Button>
            )}

            {me?.role === "COMPANY" && (data.trip.status === "OPEN" || data.trip.status === "RESERVED") && (
              <Button
                variant="danger"
                onClick={() => runAction("cancel", () => apiPost(`/trips/${tripId}/cancel`, {}))}
                loading={action === "cancel"}
              >
                Avboka (Cancel)
              </Button>
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
