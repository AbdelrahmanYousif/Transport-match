import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { apiGet, apiPostForm, apiPostJson, setToken, type Me, type UserRole } from "../api";
import { Alert, Button, Card, Container, Muted } from "../ui";

type Mode = "login" | "signup";

type LoginRes = { access_token: string; token_type: string };
type SignupRes = { access_token: string; token_type: string };

// Stabil Unsplash-bild (byt gärna till annan om du vill)
// Tips: om du vill ha 100% kontroll: lägg en bild i /frontend/public/auth-bg.jpg och använd url("/auth-bg.jpg")
const AUTH_BG =
  "linear-gradient(0deg, rgba(15,23,42,0.62), rgba(15,23,42,0.62)), url('/auth-bg.jpg') center/cover";

export default function Auth({ onAuthed }: { onAuthed: (m: Me) => void }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [sp] = useSearchParams();

  // redirect efter login/signup
  const nextFromQuery = sp.get("next"); // ex: /trips/2
  const fromState = (loc.state as { from?: string } | null)?.from;
  const next = nextFromQuery || fromState || "/";

  const presetRole = (sp.get("role") as UserRole | null) ?? "DRIVER";

  const [mode, setMode] = useState<Mode>("login");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // fält
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup extra
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>(presetRole);

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (!password.trim()) return false;
    if (mode === "signup") {
      if (!name.trim()) return false;
      if (!role) return false;
    }
    return true;
  }, [email, password, mode, name, role]);

  async function finishAuth(token: string) {
    setToken(token);
    const me = await apiGet<Me>("/me");
    onAuthed(me);
    nav(next, { replace: true });
  }

  async function onLogin() {
    try {
      setBusy(true);
      setErr(null);
      const res = await apiPostForm<LoginRes>("/auth/login", {
        username: email.trim(),
        password,
      });
      await finishAuth(res.access_token);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onSignup() {
    try {
      setBusy(true);
      setErr(null);
      const res = await apiPostJson<SignupRes>("/auth/signup", {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      await finishAuth(res.access_token);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        // ✅ Full-bleed även om App har maxWidth wrapper
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",

        minHeight: "calc(100vh - 84px)",
        padding: "34px 16px",
        background: AUTH_BG,
        display: "grid",
        alignItems: "center",
      }}
    >
      <style>{`
        .authGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          align-items: center;
        }
        @media (min-width: 980px) {
          .authGrid {
            grid-template-columns: minmax(0, 1fr) 520px;
            gap: 26px;
            align-items: stretch;
          }
        }
      `}</style>

      <Container maxWidth={1100}>
        <div className="authGrid">
          {/* Vänster: hero/text */}
          <div style={{ color: "rgba(255,255,255,0.92)", padding: 8, maxWidth: 560 }}>
            <div style={{ fontWeight: 950, fontSize: 52, lineHeight: 1.02, letterSpacing: 0.2 }}>
              Transport Match
            </div>

            <div style={{ marginTop: 12, fontSize: 16, lineHeight: 1.5, maxWidth: 520 }}>
              Hitta lediga körningar direkt. Logga in för att paxa (DRIVER) eller skapa körningar (COMPANY).
            </div>
          </div>

          {/* Höger: kort */}
          <Card style={{ width: "100%", padding: 22, borderRadius: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 950, fontSize: 34, letterSpacing: 0.2 }}>
                {mode === "login" ? "Logga in" : "Skapa konto"}
              </div>
              <Muted>Logga in med din e-postadress</Muted>
            </div>

            {err && (
              <div style={{ marginBottom: 12 }}>
                <Alert tone="danger">{err}</Alert>
              </div>
            )}

            {/* Växla läge */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
              <button
                onClick={() => setMode("login")}
                style={{
                  cursor: "pointer",
                  border: "2px solid rgba(15,23,42,0.18)",
                  background: mode === "login" ? "rgba(15,23,42,0.06)" : "white",
                  padding: "10px 16px",
                  borderRadius: 999,
                  fontWeight: 900,
                }}
              >
                Logga in
              </button>
              <button
                onClick={() => setMode("signup")}
                style={{
                  cursor: "pointer",
                  border: "2px solid rgba(15,23,42,0.18)",
                  background: mode === "signup" ? "rgba(15,23,42,0.06)" : "white",
                  padding: "10px 16px",
                  borderRadius: 999,
                  fontWeight: 900,
                }}
              >
                Skapa konto
              </button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {mode === "signup" && (
                <>
                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Roll</div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid rgba(15,23,42,0.14)",
                      }}
                    >
                      <option value="DRIVER">DRIVER (paxa)</option>
                      <option value="COMPANY">COMPANY (skapa körningar)</option>
                    </select>
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Namn</div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ditt namn"
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid rgba(15,23,42,0.14)",
                      }}
                    />
                  </div>
                </>
              )}

              <div>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>E-postadress</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="namn@exempel.se"
                  autoComplete="email"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(15,23,42,0.14)",
                  }}
                />
              </div>

              <div>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Lösenord</div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(15,23,42,0.14)",
                  }}
                />
              </div>

              {mode === "login" ? (
                <Button onClick={onLogin} loading={busy} disabled={!canSubmit}>
                  Logga in
                </Button>
              ) : (
                <Button onClick={onSignup} loading={busy} disabled={!canSubmit}>
                  Skapa konto
                </Button>
              )}
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
