# DV SPORTS

A lean iOS and Android FIFA World Cup app prototype inspired by the speed and clarity of Apple Sports.

## Product direction

- FIFA World Cup only for now. IPL can return next season as a separate sport module.
- Schedule-first interface with live/feed status, match detail, results, upcoming fixtures, and group tables.
- Match times are shown in IST.
- `DVs Pick` shows your betting play for the selected match.
- Minimal UI: no news clutter, no social feed, no unnecessary cards.
- Public live feed integration with bundled fallback data for offline development.

## Add DVs Pick

Edit [src/data/dvPicks.ts](src/data/dvPicks.ts) and add one entry per match id:

```ts
"8": {
  fixtureId: "8",
  market: "Match Result",
  selection: "Switzerland draw no bet",
  odds: "1.82",
  confidence: "Lean",
  note: "Waiting for final lineups before locking the card."
}
```

The key and `fixtureId` should match the World Cup match id. The selected match card shows the matching pick automatically.

## Data provider path

The prototype pulls from:

- `https://worldcup26.ir/get/games`
- `https://worldcup26.ir/get/teams`
- `https://worldcup26.ir/get/stadiums`
- `https://worldcup26.ir/get/groups`

For production, keep provider calls server-side. Mobile apps should talk to your backend, not directly to sports APIs, so feed changes, caching, rate limits, source validation, and odds keys can be handled safely.

## Real-time behavior

The prototype refreshes match data every 5 seconds and shows a one-second ticking clock/countdown in the selected match card.

For launch-grade live accuracy, use a server-side real-time feed with WebSockets or Server-Sent Events. The current public feed is good for prototyping schedules and scores, but official live seconds, stoppage time, VAR delays, cards, substitutions, and odds movement should come from a paid low-latency provider.

Good production upgrade options:

- Fixtures, scores, events, and standings: Sportmonks, API-Football, BALLDONTLIE FIFA, TheStatsAPI.
- Odds: The Odds API, SportsDataIO, SportsGameOdds, Sportradar.

## Run

```bash
npm install
npm start
```

Then open with Expo Go on iOS or Android.
