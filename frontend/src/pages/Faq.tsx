import { Card, Container, Divider, H1, Muted } from "../ui";

export default function Faq() {
  return (
    <Container maxWidth={880}>
      <H1>FAQ</H1>
      <Muted>Vanliga frågor om Transport Match.</Muted>

      <Divider />

      <Card>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
          Så fungerar Transport Match
        </div>
        <Muted>
          Företag lägger upp en körning. Förare kan bläddra bland körningar med status <b>Öppen</b> och paxa en som
          passar. När den paxas blir den <b>Reserverad</b>.
        </Muted>

        <Divider />

        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
          Måste jag ha konto för att se körningar?
        </div>
        <Muted>
          Nej. Du kan se listan och detaljer om varje resa utan konto. För att paxa en körning behöver du logga in.
        </Muted>

        <Divider />

        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
          Vem kan se vem som paxat?
        </div>
        <Muted>
          Endast företaget som skapat körningen kan se vilken förare som paxat – och bara när körningen är{" "}
          <b>Reserverad</b>.
        </Muted>
      </Card>
    </Container>
  );
}
