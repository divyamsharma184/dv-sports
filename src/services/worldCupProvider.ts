import {
  fallbackGroups,
  fallbackMatches,
  fallbackStadiums,
  fallbackTeams,
  type GroupTable,
  type Match,
  type MatchStatus,
  type Stadium,
  type Team
} from "../data/worldCup";

const API_BASE = "https://worldcup26.ir/get";
const IST_TIME_ZONE = "Asia/Kolkata";
const STADIUM_TIME_ZONES: Record<string, string> = {
  "1": "America/Mexico_City",
  "2": "America/Mexico_City",
  "3": "America/Monterrey",
  "4": "America/Chicago",
  "5": "America/Chicago",
  "6": "America/Chicago",
  "7": "America/New_York",
  "8": "America/New_York",
  "9": "America/New_York",
  "10": "America/New_York",
  "11": "America/New_York",
  "12": "America/Toronto",
  "13": "America/Vancouver",
  "14": "America/Los_Angeles",
  "15": "America/Los_Angeles",
  "16": "America/Los_Angeles"
};

type ApiGame = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
};

type ApiTeam = {
  id: string;
  name_en: string;
  flag?: string;
  fifa_code?: string;
  groups?: string;
};

type ApiStadium = {
  id: string;
  name_en: string;
  fifa_name?: string;
  city_en: string;
  country_en: string;
};

type ApiGroup = {
  name: string;
  teams: Array<{
    team_id: string;
    mp: string;
    w: string;
    d: string;
    l: string;
    pts: string;
    gd: string;
  }>;
};

export type WorldCupSnapshot = {
  matches: Match[];
  groups: GroupTable[];
  teams: Team[];
  lastUpdated: string;
  source: "live" | "fallback";
};

export async function getWorldCupSnapshot(): Promise<WorldCupSnapshot> {
  try {
    const [gamesResponse, teamsResponse, stadiumsResponse, groupsResponse] = await Promise.all([
      fetchJson<{ games: ApiGame[] }>(`${API_BASE}/games`),
      fetchJson<{ teams: ApiTeam[] }>(`${API_BASE}/teams`),
      fetchJson<{ stadiums: ApiStadium[] }>(`${API_BASE}/stadiums`),
      fetchJson<{ groups: ApiGroup[] }>(`${API_BASE}/groups`)
    ]);

    const teams = teamsResponse.teams.map(normalizeTeam);
    const stadiums = stadiumsResponse.stadiums.map(normalizeStadium);
    const matches = gamesResponse.games
      .map((game) => normalizeMatch(game, teams, stadiums))
      .sort((a, b) => a.timestamp - b.timestamp);
    const groups = groupsResponse.groups
      .map((group) => normalizeGroup(group, teams))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      matches,
      groups,
      teams,
      lastUpdated: formatUpdatedAt(new Date()),
      source: "live"
    };
  } catch (error) {
    return {
      matches: fallbackMatches,
      groups: fallbackGroups,
      teams: fallbackTeams,
      lastUpdated: "Offline fallback",
      source: "fallback"
    };
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`World Cup API failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeTeam(team: ApiTeam): Team {
  return {
    id: team.id,
    name: team.name_en,
    code: team.fifa_code ?? abbreviate(team.name_en),
    flag: team.flag,
    group: team.groups
  };
}

function normalizeStadium(stadium: ApiStadium): Stadium {
  return {
    id: stadium.id,
    name: stadium.fifa_name ?? stadium.name_en,
    city: stadium.city_en,
    country: stadium.country_en
  };
}

function normalizeMatch(game: ApiGame, teams: Team[], stadiums: Stadium[]): Match {
  const home = findTeam(teams, game.home_team_id, game.home_team_name_en ?? game.home_team_label);
  const away = findTeam(teams, game.away_team_id, game.away_team_name_en ?? game.away_team_label);
  const stadium = stadiums.find((item) => item.id === game.stadium_id);
  const timestamp = parseVenueLocalDate(game.local_date, game.stadium_id);
  const status = getStatus(game);

  return {
    id: game.id,
    stage: stageLabel(game),
    group: game.group,
    matchday: game.matchday,
    dateLabel: formatMatchDate(timestamp),
    timeLabel: formatMatchTime(timestamp),
    timestamp,
    status,
    statusLabel: getStatusLabel(status, game, timestamp),
    venue: stadium ? `${stadium.name}, ${stadium.city}` : "Venue TBA",
    home: {
      id: home.id,
      name: home.name,
      code: home.code,
      flag: home.flag,
      score: game.home_score
    },
    away: {
      id: away.id,
      name: away.name,
      code: away.code,
      flag: away.flag,
      score: game.away_score
    }
  };
}

function normalizeGroup(group: ApiGroup, teams: Team[]): GroupTable {
  return {
    name: group.name,
    standings: group.teams
      .map((row) => {
        const team = findTeam(teams, row.team_id);

        return {
          teamId: row.team_id,
          name: team.name,
          code: team.code,
          played: numberFrom(row.mp),
          wins: numberFrom(row.w),
          draws: numberFrom(row.d),
          losses: numberFrom(row.l),
          goalDifference: numberFrom(row.gd),
          points: numberFrom(row.pts)
        };
      })
      .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || a.name.localeCompare(b.name))
  };
}

function findTeam(teams: Team[], id: string, label = "TBD"): Team {
  return teams.find((team) => team.id === id) ?? {
    id,
    name: label,
    code: abbreviate(label)
  };
}

function parseVenueLocalDate(value: string, stadiumId: string): number {
  const [date = "", time = "00:00"] = value.split(" ");
  const [month, day, year] = date.split("/").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const timeZone = STADIUM_TIME_ZONES[stadiumId] ?? "UTC";

  return zonedTimeToUtc({ year, month, day, hour, minute }, timeZone);
}

function zonedTimeToUtc(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string
) {
  const base = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const offset = getTimeZoneOffset(base, timeZone);

  return base - offset;
}

function getTimeZoneOffset(timestamp: number, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric"
  });
  const dateParts = formatter.formatToParts(new Date(timestamp));
  const values = Object.fromEntries(dateParts.map((part) => [part.type, part.value]));
  const hour = values.hour === "24" ? 0 : Number(values.hour);
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    hour,
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - timestamp;
}

function getStatus(game: ApiGame): MatchStatus {
  if (game.finished === "TRUE" || game.time_elapsed === "finished") {
    return "final";
  }

  if (game.time_elapsed !== "notstarted") {
    return "live";
  }

  return "upcoming";
}

function getStatusLabel(status: MatchStatus, game: ApiGame, timestamp: number) {
  if (status === "final") {
    return "FT";
  }

  if (status === "live") {
    return `${game.time_elapsed}'`;
  }

  return formatMatchTime(timestamp);
}

function stageLabel(game: ApiGame) {
  if (game.type === "group") {
    return `Group ${game.group}`;
  }

  const labels: Record<string, string> = {
    r32: "Round of 32",
    r16: "Round of 16",
    qf: "Quarterfinal",
    sf: "Semifinal",
    third: "Third Place",
    final: "Final"
  };

  return labels[game.type] ?? game.group;
}

function formatMatchDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: IST_TIME_ZONE
  }).format(timestamp);
}

function formatMatchTime(timestamp: number) {
  return `${new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: IST_TIME_ZONE
  }).format(timestamp)} IST`;
}

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    timeZone: IST_TIME_ZONE
  }).format(date);
}

function abbreviate(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function numberFrom(value: string) {
  return Number.parseInt(value, 10) || 0;
}
