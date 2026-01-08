import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPostJson, getToken, type Me, type Trip } from "../api";
import { Alert, Button, Card, Container, Divider, H1, Muted, Row, Spacer } from "../ui";

type Filters = {
  origin: string;
  destination: string;
  date: string;
};

function matches(hay: string, needle: string) {
  const a = (hay || "").trim().toLowerCase();
  const b = (needle || "").trim().toLowerCase();
  if (!b) return true;
  return a.includes(b);
}

export default function Home({ me }: { me: Me | null }) {
  const nav = useNavigate();

  const [items, setItems] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyTripId, setBusyTripId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    origin: "",
    destination: "",
    date: "",
  });

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const trips = await apiGet<Trip[]>("/trips"); // OPEN
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
    return items.filter((t) => {
      const okOrigin = matches(t.origin, filters.origin);
      const okDest = matches(t.destination, filters.destination);
      const okDate = filters.date ? (t.date ?? "") === filters.date : true;
      return okOrigin && okDest && okDate;
    });
  }, [items, filters]);

  const canReserve = me?.role === "DRIVER";

  async function onReserve(tripId: number) {
    if (!getToken()) {
      nav(`/auth?next=/trips/${tripId}`);
      return;
    }
    try {
      setBusyTripId(tripId);
      setErr(null);
      await apiPostJson(`/trips/${tripId}/reserve`, {});
      await load();
      nav("/mine"); // känns naturligt efter paxning
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusyTripId(null);
    }
  }

  return (
    <div>
      {/* Hero (Hertz-känsla: stor bild + overlay + sök) */}
      <div
        style={{
          borderRadius: 18,
          overflow: "hidden",
          background:
            "linear-gradient(0deg, rgba(15,23,42,0.55), rgba(15,23,42,0.55)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=60') center/cover",
          boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ padding: "34px 18px" }}>
          <Container maxWidth={980}>
            <Row style={{ alignItems: "flex-end", gap: 14 }}>
              <div style={{ maxWidth: 680 }}>
                <H1 style={{ color: "white", marginBottom: 10 }}>Hitta en resa på din rutt</H1>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.5 }}>
                  Sök bland tillgängliga körningar. Klicka på en körning för detaljer.
                  <br />
                  För att <b>paxa</b> behöver du logga in.
                </div>
              </div>
              <Spacer />
              <div>
                {!me ? (
                  <Button onClick={() => nav("/auth")} style={{ boxShadow: "0 14px 28px rgba(0,0,0,0.25)" }}>
                    Logga in / Registrera
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => nav(me.role === "COMPANY" ? "/create" : "/mine")}
                    style={{ boxShadow: "0 14px 28px rgba(0,0,0,0.18)" }}
                  >
                    Gå till {me.role === "COMPANY" ? "Skapa körning" : "Mina körningar"}
                  </Button>
                )}
              </div>
            </Row>

            <div style={{ marginTop: 18 }}>
              <Card
                style={{
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px 160px", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Från</div>
                    <input
                      value={filters.origin}
                      onChange={(e) => setFilters((p) => ({ ...p, origin: e.target.value }))}
                      placeholder="t.ex. Stockholm"
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid rgba(15,23,42,0.14)" }}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Till</div>
                    <input
                      value={filters.destination}
                      onChange={(e) => setFilters((p) => ({ ...p, destination: e.target.value }))}
                      placeholder="t.ex. Uppsala"
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid rgba(15,23,42,0.14)" }}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Datum</div>
                    <input
                      value={filters.date}
                      onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))}
                      placeholder="YYYY-MM-DD"
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid rgba(15,23,42,0.14)" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                    <Button variant="secondary" onClick={load} loading={loading} style={{ width: "100%" }}>
                      Uppdatera
                    </Button>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <Muted>
                    Visar <b>{filtered.length}</b> av <b>{items.length}</b> tillgängliga körningar (OPEN).
                  </Muted>
                </div>
              </Card>
            </div>
          </Container>
        </div>
      </div>

      <div style={{ height: 16 }} />

      {/* Lista */}
      <Container maxWidth={980}>
        {err && (
          <div style={{ marginBottom: 12 }}>
            <Alert tone="danger">Error: {err}</Alert>
          </div>
        )}

        {filtered.length === 0 && !loading ? (
          <Card>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>Inga matcher just nu</div>
            <Muted>Testa att ta bort datumfilter eller ändra från/till.</Muted>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map((t) => {
              const isBusy = busyTripId === t.id;

              return (
                <Card key={t.id}>
                  <Row style={{ alignItems: "flex-start", gap: 14 }}>
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

                      <div style={{ marginTop: 10 }}>
                        <Link to={`/trips/${t.id}`}>Visa detaljer →</Link>
                      </div>
                    </div>

                    <Spacer />

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                      {canReserve ? (
                        <Button onClick={() => onReserve(t.id)} loading={isBusy} disabled={busyTripId !== null && !isBusy}>
                          Paxa
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => nav(`/auth?next=/trips/${t.id}`)}>
                          Logga in för att paxa
                        </Button>
                      )}

                      <Muted>
                        Status: <b>{t.status}</b>
                      </Muted>
                    </div>
                  </Row>

                  {!getToken() && (
                    <>
                      <Divider />
                      <Muted>
                        Du kan läsa detaljer utan login. För att paxa blir du ombedd att logga in.
                      </Muted>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
