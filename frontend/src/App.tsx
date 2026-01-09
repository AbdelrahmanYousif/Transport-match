import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { apiGet, getToken, setToken, type Me, type UserRole } from "./api";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import CreateTrip from "./pages/CreateTrip";
import MyTrips from "./pages/MyTrips";
import TripDetailPage from "./pages/TripDetail";
import Faq from "./pages/Faq";

function Logo() {
  return (
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
          boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
        }}
      />
      <span style={{ fontWeight: 900, letterSpacing: 0.2, color: "#0f172a" }}>Transport Match</span>
    </Link>
  );
}

function TopNav({ me, onLogout }: { me: Me | null; onLogout: () => void }) {
  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    textDecoration: "none",
    fontWeight: 800 as const,
    color: isActive ? "#0f172a" : "rgba(15, 23, 42, 0.75)",
    padding: "10px 12px",
    borderRadius: 12,
    background: isActive ? "rgba(15, 23, 42, 0.06)" : "transparent",
  });

  const linkLike = {
    textDecoration: "none",
    fontWeight: 800,
    color: "rgba(15,23,42,0.75)",
    padding: "10px 12px",
    borderRadius: 12,
  } as const;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Logo />

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 6 }}>
          <NavLink to="/" style={navLinkStyle} end>
            Hem
          </NavLink>

          {/* Ska gå till auth om utloggad */}
          <Link to={me ? "/mine" : "/auth?next=/mine"} style={linkLike}>
            Mina körningar
          </Link>

          <NavLink to="/faq" style={navLinkStyle}>
            FAQ
          </NavLink>
        </div>

        <div style={{ flex: 1 }} />

        {me ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "rgba(15,23,42,0.75)" }}>
              {me.name} • <b style={{ color: "#0f172a" }}>{me.role}</b>
            </span>

            {me.role === "COMPANY" && (
              <Link
                to="/create"
                style={{
                  textDecoration: "none",
                  fontWeight: 900,
                  color: "#0f172a",
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "rgba(15,23,42,0.06)",
                  boxShadow: "0 10px 22px rgba(0,0,0,0.08)",
                }}
              >
                Skapa körning
              </Link>
            )}

            <button
              onClick={onLogout}
              style={{
                cursor: "pointer",
                border: "1px solid rgba(15,23,42,0.12)",
                background: "white",
                padding: "10px 14px",
                borderRadius: 14,
                fontWeight: 900,
                boxShadow: "0 10px 22px rgba(0,0,0,0.08)",
              }}
            >
              Logga ut
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            style={{
              textDecoration: "none",
              fontWeight: 900,
              color: "white",
              padding: "10px 14px",
              borderRadius: 14,
              background: "#0f172a",
              boxShadow: "0 14px 28px rgba(15,23,42,0.18)",
            }}
          >
            Logga in / Registrera
          </Link>
        )}
      </div>
    </div>
  );
}

function RequireAuth({ me, children }: { me: Me | null; children: React.ReactNode }) {
  const loc = useLocation();
  if (!me) return <Navigate to="/auth" state={{ from: loc.pathname + loc.search }} replace />;
  return <>{children}</>;
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
  if (!me) return <Navigate to="/auth" state={{ from: loc.pathname + loc.search }} replace />;
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
    <div style={{ fontFamily: "system-ui", color: "#0f172a" }}>
      <TopNav me={me} onLogout={onLogout} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "22px 16px" }}>
        <Routes>
          {/* ✅ Home + Explore i samma sida */}
          <Route path="/" element={<Landing me={me} />} />

          {/* Auth sköter redirect själv (next/from) */}
          <Route path="/auth" element={<Auth onAuthed={(m) => setMe(m)} />} />

          {/* Skyddade routes */}
          <Route
            path="/mine"
            element={
              <RequireAuth me={me}>
                <MyTrips />
              </RequireAuth>
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

          {/* Publik: Trip detail */}
          <Route path="/trips/:id" element={<TripDetailPage me={me} />} />

          <Route path="/faq" element={<Faq />} />

          {/* ✅ Backwards compat: /explore → / */}
          <Route path="/explore" element={<Navigate to="/" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
