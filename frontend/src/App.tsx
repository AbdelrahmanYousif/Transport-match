import React, { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { apiGet, getToken, setToken, type Me, type UserRole } from "./api";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import CreateTrip from "./pages/CreateTrip";

function Nav({ me, onLogout }: { me: Me | null; onLogout: () => void }) {
  return (
    <div style={{ padding: 16, borderBottom: "1px solid #eee", display: "flex", gap: 12, alignItems: "center" }}>
      <Link to="/" style={{ fontWeight: 700, textDecoration: "none" }}>
        Transport Match
      </Link>

      <div style={{ flex: 1 }} />

      {me ? (
        <>
          <span style={{ fontSize: 14 }}>
            {me.name} — <b>{me.role}</b>
          </span>

          {me.role === "DRIVER" && <Link to="/explore">Explore</Link>}
          {me.role === "COMPANY" && <Link to="/create">Create Trip</Link>}

          <button onClick={onLogout}>Logga ut</button>
        </>
      ) : (
        <Link to="/auth">Logga in / Skapa konto</Link>
      )}
    </div>
  );
}

function RequireRole({
  me,
  role,
  children,
}: {
  me: Me | null;
  role: UserRole;
  children: React.ReactNode;
}) {
  const loc = useLocation();
  if (!me) return <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
  if (me.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  async function refreshMe() {
    try {
      const data = await apiGet<Me>("/me");
      setMe(data);
    } catch {
      setMe(null);
      setToken(null);
    } finally {
      setLoadingMe(false);
    }
  }

  useEffect(() => {
    if (getToken()) refreshMe();
    else setLoadingMe(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onLogout() {
    setToken(null);
    setMe(null);
  }

  if (loadingMe) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <p>Laddar...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui" }}>
      <Nav me={me} onLogout={onLogout} />

      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <Routes>
          <Route path="/" element={<Home me={me} />} />
          <Route path="/auth" element={<Auth onAuthed={(m) => setMe(m)} />} />

          <Route
            path="/explore"
            element={
              <RequireRole me={me} role="DRIVER">
                <Explore />
              </RequireRole>
            }
          />

          <Route
            path="/create"
            element={
              <RequireRole me={me} role="COMPANY">
                <CreateTrip />
              </RequireRole>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}