import { Container, Card, H1, Muted, Divider } from "../ui";

export default function Faq() {
  return (
    <Container maxWidth={900}>
      <H1 style={{ marginTop: 0 }}>FAQ</H1>
      <Muted>Vanliga frågor om Transport Match.</Muted>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        <Card>
          <div style={{ fontWeight: 900 }}>Hur funkar det?</div>
          <Divider />
          <Muted>
            Företag skapar en körning. Förare kan se OPEN-körningar och paxa. När en körning paxas blir den RESERVED.
          </Muted>
        </Card>

        <Card>
          <div style={{ fontWeight: 900 }}>Måste jag ha konto för att se körningar?</div>
          <Divider />
          <Muted>Nej, du kan se listan och trip-detaljer utan konto. För att paxa måste du logga in.</Muted>
        </Card>

        <Card>
          <div style={{ fontWeight: 900 }}>Vem kan se vem som paxat?</div>
          <Divider />
          <Muted>
            Endast företaget som äger trippen kan se vilken driver som paxat (om trippen är RESERVED).
          </Muted>
        </Card>
      </div>
    </Container>
  );
}