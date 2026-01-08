import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPostJson, getToken, type Me, type Trip } from "../api";
import { Alert, Button, Card, Container, Divider, H1, Muted, Row, Spacer } from "../ui";

function includesInsensitive(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

export default function Explore() {
  const nav = useNavigate();

  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyTripId, setBusyTripId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // "Hertz-style" search
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD (valfritt filter)

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      // Trips är publikt (OPEN)
      const trips = await apiGet<Trip[]>("/trips");
      setItems(trips);

      // Me är bara om man har token
      if (getToken()) {
        try {
          const m = await apiGet<Me>("/me");
          setMe(m);
        } catch {
          setMe(null);
        }
      } else {
        setMe(null);
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return items.filter((t) => {
      const okFrom = !from.trim() || includesInsensitive(t.origin, from.trim());
      const okTo = !to.trim() || includesInsensitive(t.destination, to.trim());
      const okDate = !date.trim() || (t.date ?? "") === date.trim();
      return okFrom && okTo && okDate;
    });
  }, [items, from, to, date]);

  const isLoggedIn = !!me;
  const canReserve = me?.role === "DRIVER";

  async function onReserve(tripId: number) {
    // om inte inloggad: skicka till auth och kom tillbaka till trip-sidan
    if (!isLoggedIn) {
      nav(`/auth?role=DRIVER&next=${encodeURIComponent(`/trips/${tripId}`)}`);
      return;
    }

    // om fel roll: visa tydligt
    if (!canReserve) {
      setErr("Endast DRIVER kan paxa körningar. Logga in med ett driver-konto.");
      return;
    }

    try {
      setErr(null);
      setBusyTripId(tripId);
      await apiPostJson(`/trips/${tripId}/reserve`, {});
      await load();
      nav(`/trips/${tripId}`);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusyTripId(null);
    }
  }

  return (
    <Container maxWidth={1100}>
      {/* HERO + SEARCH (Home + Explore i samma sida) */}
      <Card>
        <Row align="flex-start" style={{ gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <H1 style={{ marginTop: 0 }}>Hitta en körning</H1>
            <Muted>
              Sök bland tillgängliga körningar. Du kan se allt utan konto — men för att paxa behöver du logga in.
            </Muted>
          </div>
          <Spacer />
          <Button variant="secondary" onClick={load} loading={loading}>
            Uppdatera
          </Button>
        </Row>

        <Divider />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 220px auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          <label>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Från</div>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="t.ex. Stockholm"
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
            />
          </label>

          <label>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Till</div>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="t.ex. Uppsala"
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
            />
          </label>

          <label>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Datum</div>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
            />
          </label>

          <Button
            variant="ghost"
            onClick={() => {
              setFrom("");
              setTo("");
              setDate("");
            }}
            disabled={loading}
          >
            Rensa
          </Button>
        </div>

        {!isLoggedIn ? (
          <div style={{ marginTop: 12 }}>
            <Alert tone="neutral">
              Du är inte inloggad. Du kan fortfarande se alla resor.
              <Divider />
              <Link to="/auth">Logga in / Registrera</Link>
            </Alert>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <Alert tone="success">
              Inloggad som <b>{me.name}</b> — <b>{me.role}</b>
            </Alert>
          </div>
        )}

        {err && (
          <div style={{ marginTop: 12 }}>
            <Alert tone="danger">Error: {err}</Alert>
          </div>
        )}
      </Card>

      {/* LIST */}
      <div style={{ marginTop: 14 }}>
        <Row style={{ marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Tillgängliga körningar</div>
            <Muted>
              Visar <b>OPEN</b>. Klicka på en körning för detaljer.
            </Muted>
          </div>
          <Spacer />
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            Visar: <b>{filtered.length}</b> / {items.length}
          </div>
        </Row>

        {filtered.length === 0 && !loading ? (
          <Card>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Inga matchningar</div>
            <Muted>Testa att rensa filtret eller ändra sökningen.</Muted>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map((t) => {
              const isBusy = busyTripId === t.id;

              return (
                <Card key={t.id}>
                  <Row align="flex-start" style={{ gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>
                        <Link to={`/trips/${t.id}`} style={{ textDecoration: "none" }}>
                          {t.origin} → {t.destination}
                        </Link>
                      </div>

                      <Muted style={{ marginTop: 6 }}>
                        Datum: {t.date ?? "-"} • Tid: {t.time_window ?? "-"}
                      </Muted>

                      <div style={{ marginTop: 8 }}>
                        Ersättning: <b>{t.compensation_sek} SEK</b>
                      </div>

                      {t.vehicle_info && <div style={{ marginTop: 4 }}>Bil: {t.vehicle_info}</div>}
                    </div>

                    <Spacer />

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>#{t.id} • {t.status}</div>

                      <Button
                        onClick={() => onReserve(t.id)}
                        loading={isBusy}
                        disabled={busyTripId !== null && !isBusy}
                      >
                        Paxa
                      </Button>

                      <Link to={`/trips/${t.id}`} style={{ fontSize: 13 }}>
                        Visa detaljer →
                      </Link>
                    </div>
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
