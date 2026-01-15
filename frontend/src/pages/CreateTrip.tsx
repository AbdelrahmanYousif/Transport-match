import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPostJson, type Trip } from "../api";
import { Alert, Button, Card, Container, Divider, H1, Muted, Row } from "../ui";

export default function CreateTrip() {
  const nav = useNavigate();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [timeWindow, setTimeWindow] = useState(""); // t.ex. 10:00-14:00
  const [compensation, setCompensation] = useState<string>(""); // håller string i input
  const [vehicleInfo, setVehicleInfo] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!origin.trim()) return false;
    if (!destination.trim()) return false;
    const c = Number(compensation);
    if (!Number.isFinite(c) || c <= 0) return false;
    return true;
  }, [origin, destination, compensation]);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,0.14)",
    outline: "none",
  };

  function reset() {
    setOrigin("");
    setDestination("");
    setDate("");
    setTimeWindow("");
    setCompensation("");
    setVehicleInfo("");
    setErr(null);
  }

  async function onCreate() {
    try {
      setBusy(true);
      setErr(null);

      const payload = {
        origin: origin.trim(),
        destination: destination.trim(),
        date: date.trim() ? date.trim() : null,
        time_window: timeWindow.trim() ? timeWindow.trim() : null,
        compensation_sek: Number(compensation),
        vehicle_info: vehicleInfo.trim() ? vehicleInfo.trim() : null,
      };

      const created = await apiPostJson<Trip>("/trips", payload);

      // Efter skapad körning: ta dig till Mina körningar
      nav("/mine", { replace: true });

      // (om du hellre vill direkt till detaljsidan:)
      // nav(`/trips/${created.id}`, { replace: true });
      void created;
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth={880}>
      <Row style={{ marginBottom: 12 }}>
        <H1>Skapa körning</H1>
      </Row>

      <Card>
        <Muted>
          Här skapar företag en körning som förare kan paxa. Fyll i uppgifterna och klicka på <b>Skapa</b>.
        </Muted>

        <Divider />

        {err && (
          <div style={{ marginBottom: 12 }}>
            <Alert tone="danger">{err}</Alert>
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Startort</div>
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="t.ex. Stockholm"
              style={inputStyle}
            />
          </div>

          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Slutort</div>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="t.ex. Uppsala"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Datum</div>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Tidsfönster</div>
              <input
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                placeholder="t.ex. 10:00-14:00"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Ersättning (SEK)</div>
              <input
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                placeholder="t.ex. 500"
                inputMode="numeric"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Bil</div>
            <input
              value={vehicleInfo}
              onChange={(e) => setVehicleInfo(e.target.value)}
              placeholder="t.ex. Volvo V70"
              style={inputStyle}
            />
          </div>

          <Row>
            <Button onClick={onCreate} loading={busy} disabled={!canSubmit}>
              Skapa körning
            </Button>

            <Button variant="secondary" onClick={reset} disabled={busy}>
              Nollställ
            </Button>

            <Button variant="ghost" onClick={() => nav(-1)} disabled={busy}>
              Tillbaka
            </Button>
          </Row>
        </div>
      </Card>
    </Container>
  );
}
