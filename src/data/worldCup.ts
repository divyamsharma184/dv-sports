export type MatchStatus = "live" | "upcoming" | "final";

export type Team = {
  id: string;
  name: string;
  code: string;
  flag?: string;
  group?: string;
};

export type Stadium = {
  id: string;
  name: string;
  city: string;
  country: string;
};

export type Match = {
  id: string;
  stage: string;
  group: string;
  matchday: string;
  dateLabel: string;
  timeLabel: string;
  timestamp: number;
  status: MatchStatus;
  statusLabel: string;
  venue: string;
  home: MatchTeam;
  away: MatchTeam;
};

export type MatchTeam = {
  id: string;
  name: string;
  code: string;
  flag?: string;
  score: string;
};

export type Standing = {
  teamId: string;
  name: string;
  code: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
};

export type GroupTable = {
  name: string;
  standings: Standing[];
};

export type BettingPick = {
  fixtureId: string;
  market: string;
  selection: string;
  odds: string;
  confidence: "Lean" | "Play" | "Strong";
  note: string;
};

export const fallbackTeams: Team[] = [
  { id: "1", name: "Mexico", code: "MEX", group: "A" },
  { id: "2", name: "South Africa", code: "RSA", group: "A" },
  { id: "3", name: "South Korea", code: "KOR", group: "A" },
  { id: "4", name: "Czech Republic", code: "CZE", group: "A" },
  { id: "5", name: "Canada", code: "CAN", group: "B" },
  { id: "6", name: "Bosnia and Herzegovina", code: "BIH", group: "B" },
  { id: "7", name: "Qatar", code: "QAT", group: "B" },
  { id: "8", name: "Switzerland", code: "SUI", group: "B" },
  { id: "9", name: "Brazil", code: "BRA", group: "C" },
  { id: "10", name: "Morocco", code: "MAR", group: "C" },
  { id: "11", name: "Haiti", code: "HAI", group: "C" },
  { id: "12", name: "Scotland", code: "SCO", group: "C" },
  { id: "13", name: "United States", code: "USA", group: "D" },
  { id: "14", name: "Paraguay", code: "PAR", group: "D" },
  { id: "15", name: "Australia", code: "AUS", group: "D" },
  { id: "16", name: "Turkey", code: "TUR", group: "D" }
];

export const fallbackStadiums: Stadium[] = [
  { id: "1", name: "Estadio Azteca", city: "Mexico City", country: "Mexico" },
  { id: "2", name: "Estadio Akron", city: "Guadalajara", country: "Mexico" },
  { id: "9", name: "MetLife Stadium", city: "New York/New Jersey", country: "United States" },
  { id: "11", name: "AT&T Stadium", city: "Dallas", country: "United States" },
  { id: "12", name: "BMO Field", city: "Toronto", country: "Canada" },
  { id: "13", name: "BC Place", city: "Vancouver", country: "Canada" },
  { id: "15", name: "Levi's Stadium", city: "San Francisco Bay Area", country: "United States" },
  { id: "16", name: "SoFi Stadium", city: "Los Angeles", country: "United States" }
];

export const fallbackMatches: Match[] = [
  {
    id: "1",
    stage: "Group A",
    group: "A",
    matchday: "1",
    dateLabel: "Jun 12",
    timeLabel: "12:30 AM IST",
    timestamp: new Date("2026-06-11T13:00:00-06:00").getTime(),
    status: "final",
    statusLabel: "FT",
    venue: "Estadio Azteca, Mexico City",
    home: { id: "1", name: "Mexico", code: "MEX", score: "2" },
    away: { id: "2", name: "South Africa", code: "RSA", score: "0" }
  },
  {
    id: "2",
    stage: "Group A",
    group: "A",
    matchday: "1",
    dateLabel: "Jun 12",
    timeLabel: "7:30 AM IST",
    timestamp: new Date("2026-06-11T20:00:00-06:00").getTime(),
    status: "final",
    statusLabel: "FT",
    venue: "Estadio Akron, Guadalajara",
    home: { id: "3", name: "South Korea", code: "KOR", score: "2" },
    away: { id: "4", name: "Czech Republic", code: "CZE", score: "1" }
  },
  {
    id: "3",
    stage: "Group B",
    group: "B",
    matchday: "1",
    dateLabel: "Jun 13",
    timeLabel: "12:30 AM IST",
    timestamp: new Date("2026-06-12T15:00:00-04:00").getTime(),
    status: "final",
    statusLabel: "FT",
    venue: "BMO Field, Toronto",
    home: { id: "5", name: "Canada", code: "CAN", score: "1" },
    away: { id: "6", name: "Bosnia and Herzegovina", code: "BIH", score: "1" }
  },
  {
    id: "4",
    stage: "Group D",
    group: "D",
    matchday: "1",
    dateLabel: "Jun 13",
    timeLabel: "6:30 AM IST",
    timestamp: new Date("2026-06-12T18:00:00-07:00").getTime(),
    status: "final",
    statusLabel: "FT",
    venue: "SoFi Stadium, Los Angeles",
    home: { id: "13", name: "United States", code: "USA", score: "4" },
    away: { id: "14", name: "Paraguay", code: "PAR", score: "1" }
  },
  {
    id: "8",
    stage: "Group B",
    group: "B",
    matchday: "1",
    dateLabel: "Jun 14",
    timeLabel: "12:30 AM IST",
    timestamp: new Date("2026-06-13T12:00:00-07:00").getTime(),
    status: "upcoming",
    statusLabel: "12:30 AM IST",
    venue: "Levi's Stadium, San Francisco Bay Area",
    home: { id: "7", name: "Qatar", code: "QAT", score: "0" },
    away: { id: "8", name: "Switzerland", code: "SUI", score: "0" }
  },
  {
    id: "7",
    stage: "Group C",
    group: "C",
    matchday: "1",
    dateLabel: "Jun 14",
    timeLabel: "4:30 AM IST",
    timestamp: new Date("2026-06-13T18:00:00-05:00").getTime(),
    status: "upcoming",
    statusLabel: "4:30 AM IST",
    venue: "AT&T Stadium, Dallas",
    home: { id: "9", name: "Brazil", code: "BRA", score: "0" },
    away: { id: "10", name: "Morocco", code: "MAR", score: "0" }
  },
  {
    id: "5",
    stage: "Group C",
    group: "C",
    matchday: "1",
    dateLabel: "Jun 14",
    timeLabel: "6:30 AM IST",
    timestamp: new Date("2026-06-13T21:00:00-04:00").getTime(),
    status: "upcoming",
    statusLabel: "6:30 AM IST",
    venue: "MetLife Stadium, New York/New Jersey",
    home: { id: "11", name: "Haiti", code: "HAI", score: "0" },
    away: { id: "12", name: "Scotland", code: "SCO", score: "0" }
  },
  {
    id: "6",
    stage: "Group D",
    group: "D",
    matchday: "1",
    dateLabel: "Jun 14",
    timeLabel: "9:30 AM IST",
    timestamp: new Date("2026-06-13T21:00:00-07:00").getTime(),
    status: "upcoming",
    statusLabel: "9:30 AM IST",
    venue: "BC Place, Vancouver",
    home: { id: "15", name: "Australia", code: "AUS", score: "0" },
    away: { id: "16", name: "Turkey", code: "TUR", score: "0" }
  }
];

export const fallbackGroups: GroupTable[] = [
  {
    name: "A",
    standings: [
      { teamId: "1", name: "Mexico", code: "MEX", played: 1, wins: 1, draws: 0, losses: 0, goalDifference: 2, points: 3 },
      { teamId: "3", name: "South Korea", code: "KOR", played: 1, wins: 1, draws: 0, losses: 0, goalDifference: 1, points: 3 },
      { teamId: "4", name: "Czech Republic", code: "CZE", played: 1, wins: 0, draws: 0, losses: 1, goalDifference: -1, points: 0 },
      { teamId: "2", name: "South Africa", code: "RSA", played: 1, wins: 0, draws: 0, losses: 1, goalDifference: -2, points: 0 }
    ]
  },
  {
    name: "B",
    standings: [
      { teamId: "5", name: "Canada", code: "CAN", played: 1, wins: 0, draws: 1, losses: 0, goalDifference: 0, points: 1 },
      { teamId: "6", name: "Bosnia and Herzegovina", code: "BIH", played: 1, wins: 0, draws: 1, losses: 0, goalDifference: 0, points: 1 },
      { teamId: "7", name: "Qatar", code: "QAT", played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
      { teamId: "8", name: "Switzerland", code: "SUI", played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 }
    ]
  }
];
