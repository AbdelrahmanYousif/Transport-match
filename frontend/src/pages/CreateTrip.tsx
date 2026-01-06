import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPostJson } from "../api";
import { Alert, Button, Card, Container, H1, Muted, Row, Spacer } from "../ui";

function isLikelyISODate(s: string) {
  // enkel check: YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default function CreateTrip() {
  const nav = useNavigate();

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [origin, setOrigin] = useState("Stockholm");
  const [destination, setDestination] = useState("Uppsala");
  const [date, setDate] = useState("2025-12-23");
  const [timeWindow, setTimeWindow] = useState("08-12");
  const [compensationSek, setCompensationSek] = useState<number>(500);
  const [vehicleInfo, setVehicleInfo] = useState("Volvo V60");

  const validationError = useMemo(() => {
    if (!origin.trim()) return "Origin kan inte vara tom.";
    if (!destination.trim()) return "Destination kan inte vara tom.";
    if (!date.trim()) return "Datum krävs.";
    if (!isLikelyISODate(date.trim())) return "Datum måste vara i format YYYY-MM-DD.";
    if (Number.isNaN(Number(compensationSek))) return "Compensation måste vara ett nummer.";
    if (Number(compensationSek) < 0) return "Compensation kan inte vara negativ.";
    return null;
  }, [origin, destination, date, compensationSek]);

  async function createTrip() {
    if (validationError) {
      setErr(validationError);
      return;
    }

    try {
      setBusy(true);
      setErr(null);

      const payload = {
        origin: origin.trim(),
        destination: destination.trim(),
        date: date.trim(),
        time_window: timeWindow.trim() || null,
        compensation_sek: Number(compensationSek),
        vehicle_info: vehicleInfo.trim() || null,
      };

      await apiPostJson("/trips", payload);

      // “riktigt” flöde: efter skapad trip -> mina körningar
      nav("/mine");
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth={880}>
      <Row style={{ marginBottom: 12 }}>
        <H1>Create Trip</H1>
        <Spacer />
        <Button variant="secondary" onClick={() => nav("/mine")}>
          Till Mina körningar
        </Button>
      </Row>

      <Muted>
        Här skapar företag en körning som drivers kan paxa. Fyll i detaljer och skapa.
      </Muted>

      {err && (
        <div style={{ marginTop: 12 }}>
          <Alert tone="danger">Error: {err}</Alert>
        </div>
      )}

      <div style={{ marginTop: 14, maxWidth: 560 }}>
        <Card>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Origin</div>
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Destination</div>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Date (YYYY-MM-DD)</div>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="2025-12-23"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Time window</div>
              <input
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                placeholder="08-12"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                Exempel: 08-12 eller 14-18 (valfritt).
              </div>
            </label>

            <label>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Compensation (SEK)</div>
              <input
                type="number"
                value={compensationSek}
                onChange={(e) => setCompensationSek(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Vehicle info</div>
              <input
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
                placeholder="Volvo V60"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            {validationError && (
              <div style={{ marginTop: 6 }}>
                <Alert tone="warning">{validationError}</Alert>
              </div>
            )}

            <Row style={{ marginTop: 6 }}>
              <Button
                onClick={createTrip}
                loading={busy}
                disabled={!!validationError}
              >
                Skapa trip
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setOrigin("Stockholm");
                  setDestination("Uppsala");
                  setDate("2025-12-23");
                  setTimeWindow("08-12");
                  setCompensationSek(500);
                  setVehicleInfo("Volvo V60");
                  setErr(null);
                }}
                disabled={busy}
              >
                Reset
              </Button>
            </Row>
          </div>
        </Card>
      </div>
    </Container>
  );
}