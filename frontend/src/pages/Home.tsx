import { Link, useNavigate } from "react-router-dom";
import type { Me } from "../api";

export default function Home({ me }: { me: Me | null }) {
  const nav = useNavigate();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Transport Match</h1>
      <p>
        Kopplar företag som behöver fordonstransport med privatpersoner som ändå ska köra samma rutt.
      </p>

      {!me ? (
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <Link to="/auth?role=COMPANY">
            <button>Jag är företag</button>
          </Link>
          <Link to="/auth?role=DRIVER">
            <button>Jag är förare</button>
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <p>
            Du är inloggad som <b>{me.role}</b>.
          </p>
          <button onClick={() => nav(me.role === "DRIVER" ? "/explore" : "/create")}>
            Gå vidare →
          </button>
        </div>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h3>Hur funkar det?</h3>
      <ol>
        <li>Företag skapar en körning (A → B, datum, ersättning).</li>
        <li>Förare går till Explore och paxar en ledig körning.</li>
        <li>Efter paxning blir körningen “RESERVED”.</li>
      </ol>
    </div>
  );
}