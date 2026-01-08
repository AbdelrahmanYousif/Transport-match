import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPostJson, getToken, type Me, type Trip } from "../api";
import { Alert, Button, Card, Container, Divider, H1, Muted, Row, Spacer } from "../ui";

export default function Landing({ me }: { me: Me | null }) {
  const nav = useNavigate();

  const [items, setItems] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyTripId, setBusyTripId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // enkel sök/filter (frontend-only)
  const [qOrigin, setQOrigin] = useState("");
  const [qDestination, setQDestination] = useState("");
  const [qDate, setQDate] = useState("");

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const trips = await apiGet<Trip[]>("/trips"); // backend returnerar OPEN
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

  const filtered = useMemo(() => {
    const o = qOrigin.trim().toLowerCase();
    const d = qDestination.trim().toLowerCase();
    const dt = qDate.trim();
    return items.filter((t) => {
      if (o && !t.origin.toLowerCase().includes(o)) return false;
      if (d && !t.destination.toLowerCase().includes(d)) return false;
      if (dt && (t.date ?? "") !== dt) return false;
      return true;
    });
  }, [items, qOrigin, qDestination, qDate]);

  const canReserve = me?.role === "DRIVER";

  async function onReserve(tripId: number) {
    // om utloggad → till auth och tillbaka till trippen
    if (!getToken()) {
      nav(`/auth?next=/trips/${tripId}`);
      return;
    }

    // inloggad men fel roll
    if (!canReserve) {
      setErr("Endast DRIVER kan paxa körningar.");
      return;
    }

    try {
      setErr(null);
      setBusyTripId(tripId);
      await apiPostJson(`/trips/${tripId}/reserve`, {});
      await load();
      nav("/mine"); // efter paxning: dina körningar
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusyTripId(null);
    }
  }

  return (
    <Container>
      {/* HERO / Startsida */}
      <Card style={{ padding: 18 }}>
        <Row style={{ alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <H1 style={{ marginTop: 0 }}>Transport Match</H1>
            <Muted>
              Kopplar företag som behöver fordonstransport med privatpersoner som ändå ska köra samma rutt.
            </Muted>

            <div style={{ marginTop: 12 }}>
              {!me ? (
                <Row>
                  <Button onClick={() => nav("/auth?role=COMPANY")}>Jag är företag</Button>
                  <Button variant="secondary" onClick={() => nav("/auth?role=DRIVER")}>
                    Jag är förare
                  </Button>
                </Row>
              ) : (
                <Row>
                  <Muted>
                    Inloggad som <b>{me.role}</b>
                  </Muted>
                  <Spacer />
                  <Button
                    variant="secondary"
                    onClick={() => nav(me.role === "COMPANY" ? "/create" : "/mine")}
                  >
                    Gå vidare →
                  </Button>
                </Row>
              )}
            </div>
          </div>

          <Spacer />
        </Row>

        <Divider />

        {/* SÖK */}
        <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
          <Row>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Origin</div>
              <input
                value={qOrigin}
                onChange={(e) => setQOrigin(e.target.value)}
                placeholder="t.ex. Stockholm"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Destination</div>
              <input
                value={qDestination}
                onChange={(e) => setQDestination(e.target.value)}
                placeholder="t.ex. Uppsala"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ width: 180 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Date</div>
              <input
                value={qDate}
                onChange={(e) => setQDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </div>
          </Row>

          <Row>
            <Button variant="secondary" onClick={load} loading={loading}>
              Uppdatera resor
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setQOrigin("");
                setQDestination("");
                setQDate("");
              }}
              disabled={loading}
            >
              Rensa sök
            </Button>
          </Row>
        </div>

        {err && (
          <div style={{ marginTop: 12 }}>
            <Alert tone="danger">{err}</Alert>
          </div>
        )}
      </Card>

      {/* LISTA */}
      <div style={{ marginTop: 16 }}>
        <Row style={{ marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Alla tillgängliga resor</div>
            <Muted>Visar OPEN-körningar. Klicka på en resa för detaljer.</Muted>
          </div>
          <Spacer />
          <Link to={me ? "/mine" : "/auth?next=/mine"}>Mina körningar</Link>
        </Row>

        {filtered.length === 0 && !loading ? (
          <Card>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Inga träffar</div>
            <Muted>Testa att rensa sök eller be ett företag skapa en ny körning.</Muted>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map((t) => {
              const isBusy = busyTripId === t.id;
              return (
                <Card key={t.id}>
                  <Row style={{ alignItems: "flex-start" }}>
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

                    <Button
                      onClick={() => onReserve(t.id)}
                      loading={isBusy}
                      disabled={busyTripId !== null && !isBusy}
                    >
                      {!getToken() ? "Logga in för att paxa" : "Paxa"}
                    </Button>
                  </Row>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
