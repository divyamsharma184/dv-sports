import type { BettingPick } from "./worldCup";

export const dvPicks: Record<string, BettingPick> = {
  "10": {
    fixtureId: "10",
    market: "Total Goals",
    selection: "Over 4.5",
    odds: "2.05",
    confidence: "Lean",
    note: "Germany are top 10 with 4 world class attackers Vs a team making its wc debut should be easier than it looks"
  },
  "8": {
    fixtureId: "8",
    market: "Match Result",
    selection: "Switzerland draw no bet",
    odds: "TBD",
    confidence: "Lean",
    note: "Waiting for final lineups before locking the card."
  },
  "7": {
    fixtureId: "7",
    market: "Total Goals",
    selection: "Over 2.5",
    odds: "TBD",
    confidence: "Play",
    note: "Brazil tempo plus Morocco transition threat makes this the first look."
  }
};
