import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, type Me, type Trip, type TripStatus } from "../api";
import { Badge, Button, Card, Container, Divider, H1, Muted, Row, Spacer } from "../ui";

function statusTone(status: TripStatus) {
  if (status === "COMPLETED") return "success";
  if (status === "RESERVED") return "warning";
  if (status === "CANCELLED") return "danger";
  return "neutral";
}

export default function Home({ me }: { me: Me | null }) {
  const nav = useNavigate();

  const [mine, setMine] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadMine() {
    if (!me) return;
    try {
      setLoading(true);
      setErr(null);
      const data = await apiGet<Trip[]>("/trips/mine");
      setMine(data);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  const counts = useMemo(() => {
    const c: Record<TripStatus, number> = {
      OPEN: 0,
      RESERVED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const t of mine) c[t.status] += 1;
    return c;
  }, [mine]);

  return (
    <Container maxWidth={920}>
      <Row style={{ marginBottom: 12 }}>
        <H1>Transport Match</H1>
        <Spacer />
        {me ? (
          <Button variant="secondary" onClick={() => nav("/mine")}>
            Mina körningar
          </Button>
        ) : (
          <Link to="/auth" style={{ textDecoration: "none" }}>
            Logga in / Skapa konto
          </Link>
        )}
      </Row>

      <Muted>
        Kopplar företag som behöver fordonstransport med privatpersoner som ändå ska köra samma rutt.
      </Muted>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {!me ? (
          <Card>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>Kom igång</div>
            <Muted>Välj roll för att skapa konto snabbare.</Muted>

            <Divider />

            <Row gap={12}>
              <Link to="/auth?role=COMPANY" style={{ textDecoration: "none" }}>
                <Button>Jag är företag</Button>
              </Link>
              <Link to="/auth?role=DRIVER" style={{ textDecoration: "none" }}>
                <Button variant="secondary">Jag är förare</Button>
              </Link>
            </Row>
          </Card>
        ) : (
          <Card>
            <Row gap={12} align="center">
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Välkommen, {me.name} 👋</div>
                <Muted>
                  Du är inloggad som <b>{me.role}</b>
                </Muted>
              </div>

              <Spacer />

              <Badge tone={me.role === "DRIVER" ? "warning" : "neutral"}>{me.role}</Badge>
            </Row>

            <Divider />

            {/* Snabbknappar */}
            <Row gap={10} wrap={true}>
              {me.role === "DRIVER" ? (
                <>
                  <Button onClick={() => nav("/explore")}>Explore</Button>
                  <Button variant="secondary" onClick={() => nav("/mine")}>
                    Mina körningar
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => nav("/create")}>Create Trip</Button>
                  <Button variant="secondary" onClick={() => nav("/mine")}>
                    Mina körningar
                  </Button>
                </>
              )}

              <Button variant="ghost" onClick={loadMine} loading={loading}>
                Uppdatera översikt
              </Button>
            </Row>

            {err && (
              <div style={{ marginTop: 12, color: "crimson" }}>
                <b>Error:</b> {err}
              </div>
            )}

            {/* Mini dashboard */}
            <div
              style={{
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {(["OPEN", "RESERVED", "COMPLETED", "CANCELLED"] as TripStatus[]).map((s) => (
                <div
                  key={s}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Row>
                    <Badge tone={statusTone(s)}>{s}</Badge>
                    <Spacer />
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{counts[s]}</div>
                  </Row>

                  <div style={{ marginTop: 6 }}>
                    <Muted>Antal i dina körningar</Muted>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>Hur funkar det?</div>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Företag skapar en körning (A → B, datum, ersättning).</li>
            <li>Förare går till Explore och paxar en ledig körning.</li>
            <li>Körningen blir “RESERVED”.</li>
            <li>Företaget kan markera “COMPLETED” när allt är klart.</li>
          </ol>
        </Card>
      </div>
    </Container>
  );
}