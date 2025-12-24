import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  apiGet,
  apiPostForm,
  apiPostJson,
  setToken,
  type Me,
  type UserRole,
} from "../api";

type SignupRes = { access_token: string; token_type: string };
type LoginRes = { access_token: string; token_type: string };

export default function Auth({ onAuthed }: { onAuthed: (me: Me) => void }) {
  const nav = useNavigate();
  const loc = useLocation();

  const params = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const roleFromUrl = (params.get("role") as UserRole | null) ?? "DRIVER";

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // fields
  const [name, setName] = useState("Test User");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456");
  const [role, setRole] = useState<UserRole>(roleFromUrl);

  useEffect(() => {
    setRole(roleFromUrl);
  }, [roleFromUrl]);

  async function finishAuth(token: string) {
    setToken(token);
    const me = await apiGet<Me>("/me");
    onAuthed(me);

    // Om man kom från en skyddad sida, gå tillbaka dit
    const from = (loc.state as any)?.from as string | undefined;
    if (from) nav(from, { replace: true });
    else nav(me.role === "DRIVER" ? "/explore" : "/create", { replace: true });
  }

  async function onSignup() {
    try {
      setBusy(true);
      setErr(null);

      const res = await apiPostJson<SignupRes>("/auth/signup", { name, email, password, role });
      await finishAuth(res.access_token);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onLogin() {
    try {
      setBusy(true);
      setErr(null);

      // FastAPI OAuth2PasswordRequestForm: username + password
      const res = await apiPostForm<LoginRes>("/auth/login", {
        username: email,
        password: password,
      });
      await finishAuth(res.access_token);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ marginTop: 0 }}>Auth</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setMode("signup")} disabled={mode === "signup"}>
          Skapa konto
        </button>
        <button onClick={() => setMode("login")} disabled={mode === "login"}>
          Logga in
        </button>
      </div>

      {mode === "signup" && (
        <>
          <label>
            Namn
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
          </label>

          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
          </label>

          <label>
            Lösenord
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              style={{ width: "100%" }}
            />
          </label>

          <label>
            Roll
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} style={{ width: "100%" }}>
              <option value="DRIVER">DRIVER (paxa)</option>
              <option value="COMPANY">COMPANY (skapa trips)</option>
            </select>
          </label>

          <button onClick={onSignup} disabled={busy} style={{ marginTop: 12 }}>
            {busy ? "Jobbar..." : "Skapa konto"}
          </button>
        </>
      )}

      {mode === "login" && (
        <>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
          </label>

          <label>
            Lösenord
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              style={{ width: "100%" }}
            />
          </label>

          <button onClick={onLogin} disabled={busy} style={{ marginTop: 12 }}>
            {busy ? "Jobbar..." : "Logga in"}
          </button>
        </>
      )}

      {err && <p style={{ color: "crimson", marginTop: 16 }}>Error: {err}</p>}
    </div>
  );
}