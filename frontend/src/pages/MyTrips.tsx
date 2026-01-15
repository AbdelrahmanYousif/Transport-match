import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, setToken, type Trip } from "../api";
import { Alert, Badge, Card, Container, Divider, H1, Muted, Row, Spacer } from "../ui";

function statusTone(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "RESERVED") return "warning";
  if (status === "CANCELLED") return "danger";
  return "neutral"; // OPEN
}

function statusLabel(status: Trip["status"]) {
  if (status === "OPEN") return "ÖPPEN";
  if (status === "RESERVED") return "RESERVERAD";
  if (status === "COMPLETED") return "KLAR";
  if (status === "CANCELLED") return "AVBOKAD";
  return status;
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

      // Om token är expired/ogiltig
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

  const isAuthError = useMemo(() => !!err && err.includes("401"), [err]);

  return (
    <Container maxWidth={880}>
      <Row style={{ marginBottom: 12 }}>
        <H1>Mina körningar</H1>
      </Row>

      {loading && <Muted>Laddar...</Muted>}

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
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              nav("/auth?next=/mine");
            }}
            style={{ fontWeight: 900 }}
          >
            Logga in
          </a>
        </Card>
      )}

      {!isAuthError && items.length === 0 && !loading ? (
        <Card>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Inga körningar ännu</div>
          <Muted>
            Som företag: skapa en körning. Som förare: hitta en körning på startsidan och paxa.
          </Muted>
          <Divider />
          <Row>
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

                <Badge tone={statusTone(t.status)}>{statusLabel(t.status)}</Badge>
              </Row>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
