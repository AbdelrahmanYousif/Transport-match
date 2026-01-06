import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPostJson, type Me, type Trip } from "../api";
import { Alert, Badge, Button, Card, Container, Divider, H1, Muted, Row, Spacer } from "../ui";

function statusTone(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "RESERVED") return "warning";
  if (status === "CANCELLED") return "danger";
  return "neutral"; // OPEN
}

export default function Explore() {
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // per-trip loading
  const [busyTripId, setBusyTripId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const [m, trips] = await Promise.all([
        apiGet<Me>("/me"),
        apiGet<Trip[]>("/trips"), // backend returnerar OPEN
      ]);

      setMe(m);
      setItems(trips);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const canReserve = useMemo(() => me?.role === "DRIVER", [me?.role]);

  async function onReserve(tripId: number) {
    try {
      setErr(null);
      setBusyTripId(tripId);
      // din backend bryr sig inte om body här, men vi skickar tom json
      await apiPostJson(`/trips/${tripId}/reserve`, {});
      await load();
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusyTripId(null);
    }
  }

  return (
    <Container maxWidth={880}>
      <Row style={{ marginBottom: 12 }}>
        <H1>Explore</H1>
        <Spacer />
        <Button variant="secondary" onClick={load} loading={loading}>
          Uppdatera
        </Button>
      </Row>

      <div style={{ marginBottom: 10 }}>
  <Muted>Här visas lediga körningar (OPEN). Drivers kan paxa direkt.</Muted>
</div>

      {err && (
        <div style={{ marginBottom: 12 }}>
          <Alert tone="danger">Error: {err}</Alert>
        </div>
      )}

      {!canReserve && (
        <div style={{ marginBottom: 12 }}>
          <Alert tone="warning">
            Du är inloggad som <b>{me?.role ?? "?"}</b>. Endast <b>DRIVER</b> kan paxa körningar.
            <Divider />
            <Link to="/auth">Logga in / byt konto</Link>
          </Alert>
        </div>
      )}

      {items.length === 0 && !loading ? (
        <Card>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Inga lediga körningar just nu</div>
          <Muted>Kom tillbaka senare eller be ett företag skapa en ny körning.</Muted>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((t) => {
            const isBusy = busyTripId === t.id;
            return (
              <Card key={t.id}>
                <Row gap={12} align="flex-start">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>
                      <Link to={`/trips/${t.id}`} style={{ textDecoration: "none" }}>
                        #{t.id}
                      </Link>{" "}
                      {t.origin} → {t.destination}
                    </div>

                    <Muted>
                      Datum: {t.date ?? "-"} • Tid: {t.time_window ?? "-"}
                    </Muted>

                    <div style={{ marginTop: 8 }}>
                      Ersättning: <b>{t.compensation_sek} SEK</b>
                    </div>

                    {t.vehicle_info && <div>Bil: {t.vehicle_info}</div>}
                  </div>

                  <Spacer />

                  <Row gap={10} wrap={false} align="center">
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>

                    {/* Endast DRIVER kan paxa och bara om OPEN */}
                    {canReserve && t.status === "OPEN" && (
                      <Button onClick={() => onReserve(t.id)} loading={isBusy} disabled={busyTripId !== null && !isBusy}>
                        Paxa
                      </Button>
                    )}
                  </Row>
                </Row>

                <div style={{ marginTop: 10 }}>
                  <Muted>
                    Klicka på #{t.id} för detaljer.
                  </Muted>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
}
