import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, setToken, type Trip } from "../api";
import { Alert, Badge, Button, Card, Container, Divider, H1, Muted, Row, Spacer } from "../ui";

function statusTone(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "RESERVED") return "warning";
  if (status === "CANCELLED") return "danger";
  return "neutral"; // OPEN
}

export default function MyTrips() {
  const nav = useNavigate();

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
      const msg = String(e);
      setErr(msg);

      // Om token är expired/ogiltig: skicka till auth på ett snällt sätt
      if (msg.includes("401")) {
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const isAuthError = !!err && err.includes("401");

  return (
    <Container maxWidth={880}>
      <Row style={{ marginBottom: 12 }}>
        <H1>Mina körningar</H1>
        <Spacer />
        <Button variant="secondary" onClick={load} loading={loading}>
          Uppdatera
        </Button>
      </Row>

      {err && (
        <div style={{ marginBottom: 12 }}>
          <Alert tone="danger">Error: {err}</Alert>
        </div>
      )}

      {isAuthError && (
        <Card>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Du behöver logga in igen</div>
          <Muted>Din session kan ha gått ut. Logga in och försök igen.</Muted>
          <Divider />
          <Button onClick={() => nav("/auth")}>Logga in</Button>
        </Card>
      )}

      {!isAuthError && items.length === 0 && !loading ? (
        <Card>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Inga körningar ännu</div>
          <Muted>
            Som företag: skapa en körning på “Create Trip”. Som driver: hitta en körning på startsidan och paxa.
          </Muted>
          <Divider />
          <Row>
            {/* /explore är på väg bort → vi pekar till / */}
            <Link to="/">Hitta körningar</Link>
            <span style={{ opacity: 0.6 }}>•</span>
            <Link to="/create">Skapa körning</Link>
          </Row>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((t) => (
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

                <Badge tone={statusTone(t.status)}>{t.status}</Badge>
              </Row>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
