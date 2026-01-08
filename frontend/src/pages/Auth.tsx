import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { apiGet, apiPostForm, apiPostJson, setToken, type Me, type UserRole } from "../api";
import { Alert, Button, Card, Container, Muted } from "../ui";

type Mode = "login" | "signup";
type LoginRes = { access_token: string; token_type: string };
type SignupRes = { access_token: string; token_type: string };

// Hertz-ish: mörk overlay + “väg/bil”-känsla
const AUTH_BG =
  "linear-gradient(0deg, rgba(15,23,42,0.60), rgba(15,23,42,0.60)), url('https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=2400&q=60') center/cover";

export default function Auth({ onAuthed }: { onAuthed: (m: Me) => void }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [sp] = useSearchParams();

  const nextFromQuery = sp.get("next"); // ex: /trips/2
  const fromState = (loc.state as { from?: string } | null)?.from;
  const next = nextFromQuery || fromState || "/";

  const presetRole = (sp.get("role") as UserRole | null) ?? "DRIVER";

  const [mode, setMode] = useState<Mode>("login");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456");

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
        password: password,
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
        minHeight: "calc(100vh - 84px)",
        background: AUTH_BG,
        borderRadius: 18,
        boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
        overflow: "hidden",
      }}
    >
      <Container maxWidth={1100}>
        {/* Split layout: vänster hero, höger kort */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: 18,
            alignItems: "center",
            padding: "26px 16px",
          }}
        >
          {/* LEFT: hero text */}
          <div style={{ color: "white", padding: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 44, lineHeight: 1.05, letterSpacing: 0.2 }}>
              Transport Match
            </div>
            <div style={{ marginTop: 10, fontSize: 16, opacity: 0.92, maxWidth: 520 }}>
              Hitta lediga körningar direkt. Logga in för att paxa (DRIVER) eller skapa körningar (COMPANY).
            </div>

            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color: "white",
                  fontWeight: 900,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.22)",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                ← Till startsidan
              </Link>

              <div
                style={{
                  fontSize: 13,
                  opacity: 0.85,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(15,23,42,0.25)",
                }}
              >
                Next: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{next}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: auth card */}
          <Card style={{ width: "100%", maxWidth: 520, padding: 22, justifySelf: "end" }}>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 28, letterSpacing: 0.2 }}>
                {mode === "login" ? "Sign in" : "Create account"}
              </div>
              <Muted>{mode === "login" ? "Sign in with your email address" : "Create an account to continue"}</Muted>
            </div>

            {err && (
              <div style={{ marginBottom: 12 }}>
                <Alert tone="danger">{err}</Alert>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
              <button
                onClick={() => setMode("login")}
                style={{
                  cursor: "pointer",
                  border: "1px solid rgba(15,23,42,0.12)",
                  background: mode === "login" ? "rgba(15,23,42,0.06)" : "white",
                  padding: "10px 14px",
                  borderRadius: 14,
                  fontWeight: 900,
                  boxShadow: mode === "login" ? "0 10px 20px rgba(0,0,0,0.06)" : "none",
                }}
              >
                Logga in
              </button>
              <button
                onClick={() => setMode("signup")}
                style={{
                  cursor: "pointer",
                  border: "1px solid rgba(15,23,42,0.12)",
                  background: mode === "signup" ? "rgba(15,23,42,0.06)" : "white",
                  padding: "10px 14px",
                  borderRadius: 14,
                  fontWeight: 900,
                  boxShadow: mode === "signup" ? "0 10px 20px rgba(0,0,0,0.06)" : "none",
                }}
              >
                Skapa konto
              </button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {mode === "signup" && (
                <>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Roll</div>
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
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Namn</div>
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
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Email Address</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(15,23,42,0.14)",
                  }}
                />
              </div>

              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Password</div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(15,23,42,0.14)",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13 }}>
                  Forgot your password?
                </a>
                <span style={{ fontSize: 13, opacity: 0.75 }}>Next: {next}</span>
              </div>

              {mode === "login" ? (
                <Button onClick={onLogin} loading={busy} disabled={!canSubmit}>
                  Sign in
                </Button>
              ) : (
                <Button onClick={onSignup} loading={busy} disabled={!canSubmit}>
                  Sign up now
                </Button>
              )}

              <div style={{ textAlign: "center", marginTop: 8 }}>
                <Link to="/" style={{ fontSize: 13 }}>
                  Tillbaka till Hem
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
