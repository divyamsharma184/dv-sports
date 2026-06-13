import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  fallbackGroups,
  fallbackMatches,
  fallbackTeams,
  type BettingPick,
  type GroupTable,
  type Match
} from "./src/data/worldCup";
import { dvPicks } from "./src/data/dvPicks";
import { getWorldCupSnapshot, type WorldCupSnapshot } from "./src/services/worldCupProvider";
import { colors, darkColors, radii, spacing, type ThemeColors } from "./src/theme";

type TabKey = "today" | "upcoming" | "results";

const tabs: Array<{ label: string; value: TabKey }> = [
  { label: "Today", value: "today" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Results", value: "results" }
];
const AUTO_REFRESH_MS = 5000;

const initialSnapshot: WorldCupSnapshot = {
  matches: fallbackMatches,
  groups: fallbackGroups,
  teams: fallbackTeams,
  lastUpdated: "Loading",
  source: "fallback"
};

type AppStyles = ReturnType<typeof createStyles>;

const AppThemeContext = createContext<{ styles: AppStyles; theme: ThemeColors }>({
  styles: createStyles(colors),
  theme: colors
});

function useAppTheme() {
  return useContext(AppThemeContext);
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [snapshot, setSnapshot] = useState<WorldCupSnapshot>(initialSnapshot);
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [selectedId, setSelectedId] = useState(fallbackMatches[0]?.id);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const theme = isDarkMode ? darkColors : colors;
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "DV SPORTS";
    }
  }, []);

  const refresh = useCallback(async (isSilent = false) => {
    const nextSnapshot = await getWorldCupSnapshot();
    setSnapshot(nextSnapshot);
    setSelectedId((current) => {
      if (isSilent && nextSnapshot.matches.some((match) => match.id === current)) {
        return current;
      }

      return filterMatches(nextSnapshot.matches, activeTab)[0]?.id ?? pickFeaturedMatch(nextSnapshot.matches).id;
    });
    setLastSyncedAt(new Date());
  }, [activeTab]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh(true);
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [refresh]);

  const matchesForTab = useMemo(() => {
    return filterMatches(snapshot.matches, activeTab);
  }, [activeTab, snapshot.matches]);

  const selectedMatch =
    snapshot.matches.find((match) => match.id === selectedId) ??
    matchesForTab[0] ??
    pickFeaturedMatch(snapshot.matches);
  const selectedPick = dvPicks[selectedMatch.id];

  const featuredGroups = useMemo(() => {
    const selectedGroup = snapshot.groups.find((group) => group.name === selectedMatch.group);
    const groupsWithActivity = snapshot.groups.filter((group) =>
      group.standings.some((standing) => standing.played > 0)
    );

    return [selectedGroup, ...groupsWithActivity]
      .filter((group): group is GroupTable => Boolean(group))
      .filter((group, index, list) => list.findIndex((item) => item.name === group.name) === index)
      .slice(0, 4);
  }, [selectedMatch.group, snapshot.groups]);

  return (
    <AppThemeContext.Provider value={{ styles, theme }}>
    <SafeAreaView style={styles.shell}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>DV SPORTS</Text>
          <Text style={styles.title}>World Cup</Text>
        </View>
        <Pressable
          onPress={() => setIsDarkMode((value) => !value)}
          style={styles.iconButton}
          accessibilityLabel="Toggle dark mode"
          accessibilityRole="button"
          testID="theme-toggle"
        >
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={19} color={theme.ink} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{snapshot.matches.length} matches</Text>
        <Text style={styles.syncText}>{syncLabel(lastSyncedAt)}</Text>
        <View style={styles.sourcePill}>
          <View style={[styles.sourceDot, snapshot.source === "live" && styles.sourceDotLive]} />
          <Text style={styles.sourceText}>{snapshot.source === "live" ? "Live feed" : "Fallback"}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <MatchHero match={selectedMatch} />

        <DvsPick pick={selectedPick} />

        <View style={styles.tabs}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => {
                  setActiveTab(tab.value);
                  const nextMatch = filterMatches(snapshot.matches, tab.value)[0];
                  if (nextMatch) {
                    setSelectedId(nextMatch.id);
                  }
                }}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader title="Schedule" meta={scheduleMeta(activeTab, matchesForTab.length)} />
        <View style={styles.matchList}>
          {matchesForTab.map((match) => (
            <MatchRow
              isSelected={match.id === selectedMatch.id}
              key={match.id}
              match={match}
              onPress={() => setSelectedId(match.id)}
            />
          ))}
        </View>

        <SectionHeader title="Groups" meta={`Updated ${snapshot.lastUpdated}`} />
        <View style={styles.groupList}>
          {featuredGroups.map((group) => (
            <GroupCard group={group} key={group.name} />
          ))}
        </View>

        <Text style={styles.disclaimer}>
          Schedule and scores are pulled from a public World Cup feed with bundled fallback data. Verify critical travel, ticketing, and broadcast details with FIFA.
        </Text>
      </ScrollView>
    </SafeAreaView>
    </AppThemeContext.Provider>
  );
}

function MatchHero({ match }: { match: Match }) {
  const { styles } = useAppTheme();

  return (
    <View style={styles.hero}>
      <View style={styles.heroTopline}>
        <View>
          <Text style={styles.stage}>{match.stage}</Text>
          <Text style={styles.venue} numberOfLines={1}>{match.venue}</Text>
        </View>
        <StatusBadge status={match.status} label={match.statusLabel} />
      </View>

      <View style={styles.scoreboard}>
        <TeamBlock team={match.home} />
        <Text style={styles.scoreDivider}>-</Text>
        <TeamBlock team={match.away} align="right" />
      </View>

      <View style={styles.heroFooter}>
        <View>
          <Text style={styles.footerLabel}>Kickoff</Text>
          <Text style={styles.footerValue}>{match.dateLabel} at {match.timeLabel}</Text>
        </View>
        <LiveMatchClock match={match} />
        <View style={styles.matchNumber}>
          <Text style={styles.matchNumberText}>M{match.id}</Text>
        </View>
      </View>
    </View>
  );
}

function DvsPick({ pick }: { pick?: BettingPick }) {
  const { styles } = useAppTheme();

  return (
    <View style={styles.pickPanel}>
      <View style={styles.pickHeader}>
        <View>
          <Text style={styles.pickKicker}>DVs Pick</Text>
          <Text style={styles.pickTitle}>{pick ? pick.selection : "No play sent yet"}</Text>
        </View>
        <View style={styles.pickBadge}>
          <Text style={styles.pickBadgeText}>{pick?.confidence ?? "Watch"}</Text>
        </View>
      </View>

      <View style={styles.pickDetails}>
        <View style={styles.pickDetail}>
          <Text style={styles.pickLabel}>Market</Text>
          <Text style={styles.pickValue}>{pick?.market ?? "Pending"}</Text>
        </View>
        <View style={styles.pickDetail}>
          <Text style={styles.pickLabel}>Odds</Text>
          <Text style={styles.pickValue}>{pick?.odds ?? "TBD"}</Text>
        </View>
      </View>

      <Text style={styles.pickNote}>
        {pick?.note ?? "Send a play for this match and it will appear here."}
      </Text>
    </View>
  );
}

function LiveMatchClock({ match }: { match: Match }) {
  const { styles } = useAppTheme();
  const now = useNow();
  const deltaSeconds = Math.round((match.timestamp - now.getTime()) / 1000);

  if (match.status === "final") {
    return (
      <View style={styles.clockBlock}>
        <Text style={styles.footerLabel}>Clock</Text>
        <Text style={styles.footerValue}>Final</Text>
      </View>
    );
  }

  if (match.status === "live") {
    const elapsedSeconds = Math.max(0, Math.round((now.getTime() - match.timestamp) / 1000));

    return (
      <View style={styles.clockBlock}>
        <Text style={styles.footerLabel}>Clock</Text>
        <Text style={styles.footerValue}>{formatElapsed(elapsedSeconds)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.clockBlock}>
      <Text style={styles.footerLabel}>Starts In</Text>
      <Text style={styles.footerValue}>{formatCountdown(deltaSeconds)}</Text>
    </View>
  );
}

function TeamBlock({
  align = "left",
  team
}: {
  align?: "left" | "right";
  team: Match["home"];
}) {
  const { styles } = useAppTheme();

  return (
    <View style={[styles.teamBlock, align === "right" && styles.teamBlockRight]}>
      <FlagBadge flag={team.flag} code={team.code} />
      <Text style={styles.score}>{team.score}</Text>
      <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
    </View>
  );
}

function MatchRow({
  isSelected,
  match,
  onPress
}: {
  isSelected: boolean;
  match: Match;
  onPress: () => void;
}) {
  const { styles, theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.matchRow,
        isSelected && styles.matchRowSelected,
        pressed && styles.matchRowPressed
      ]}
    >
      <View style={styles.matchTime}>
        <Text style={styles.matchDate}>{match.dateLabel}</Text>
        <Text style={styles.matchClock}>{match.status === "final" ? "FT" : match.timeLabel}</Text>
      </View>

      <View style={styles.rowTeams}>
        <RowTeam code={match.home.code} flag={match.home.flag} name={match.home.name} score={match.home.score} />
        <RowTeam code={match.away.code} flag={match.away.flag} name={match.away.name} score={match.away.score} />
      </View>

      <View style={styles.rowStatus}>
        <Text style={styles.rowStage}>{match.stage}</Text>
        <Ionicons name="chevron-forward" size={17} color={theme.muted} />
      </View>
    </Pressable>
  );
}

function RowTeam({
  code,
  flag,
  name,
  score
}: {
  code: string;
  flag?: string;
  name: string;
  score: string;
}) {
  const { styles } = useAppTheme();

  return (
    <View style={styles.rowTeam}>
      <FlagBadge code={code} flag={flag} size="small" />
      <Text style={styles.rowTeamName} numberOfLines={1}>{name}</Text>
      <Text style={styles.rowScore}>{score}</Text>
    </View>
  );
}

function GroupCard({ group }: { group: GroupTable }) {
  const { styles } = useAppTheme();

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>Group {group.name}</Text>
        <Text style={styles.groupMeta}>Pts</Text>
      </View>
      {group.standings.map((standing, index) => (
        <View style={styles.standingRow} key={standing.teamId}>
          <Text style={styles.rank}>{index + 1}</Text>
          <Text style={styles.standingTeam} numberOfLines={1}>{standing.name}</Text>
          <Text style={styles.record}>{standing.played}P</Text>
          <Text style={styles.gd}>{standing.goalDifference >= 0 ? "+" : ""}{standing.goalDifference}</Text>
          <Text style={styles.points}>{standing.points}</Text>
        </View>
      ))}
    </View>
  );
}

function FlagBadge({
  code,
  flag,
  size = "large"
}: {
  code: string;
  flag?: string;
  size?: "small" | "large";
}) {
  const { styles } = useAppTheme();
  const isSmall = size === "small";

  return (
    <View style={[styles.flagBadge, isSmall && styles.flagBadgeSmall]}>
      {flag ? (
        <Image source={{ uri: flag }} style={[styles.flagImage, isSmall && styles.flagImageSmall]} />
      ) : (
        <Text style={[styles.flagText, isSmall && styles.flagTextSmall]}>{code}</Text>
      )}
    </View>
  );
}

function StatusBadge({ label, status }: { label: string; status: Match["status"] }) {
  const { styles } = useAppTheme();

  return (
    <View style={[styles.statusBadge, status === "live" && styles.statusBadgeLive]}>
      {status === "live" && <View style={styles.liveDot} />}
      <Text style={[styles.statusText, status === "live" && styles.statusTextLive]}>{label}</Text>
    </View>
  );
}

function SectionHeader({ meta, title }: { meta: string; title: string }) {
  const { styles } = useAppTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionMeta}>{meta}</Text>
    </View>
  );
}

function filterMatches(matches: Match[], tab: TabKey) {
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Kolkata",
    year: "numeric"
  }).format(new Date());

  if (tab === "today") {
    const todayMatches = matches.filter((match) => {
      const key = new Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "Asia/Kolkata",
        year: "numeric"
      }).format(match.timestamp);

      return key === todayKey;
    });

    return todayMatches.length > 0 ? todayMatches : matches.filter((match) => match.status !== "final").slice(0, 8);
  }

  if (tab === "results") {
    return matches.filter((match) => match.status === "final").slice(-12).reverse();
  }

  return matches.filter((match) => match.status !== "final").slice(0, 16);
}

function pickFeaturedMatch(matches: Match[]) {
  return matches.find((match) => match.status === "live") ??
    matches.find((match) => match.status === "upcoming") ??
    matches[0];
}

function scheduleMeta(tab: TabKey, count: number) {
  if (tab === "today") {
    return `${count} today`;
  }

  if (tab === "results") {
    return `${count} final`;
  }

  return `${count} next`;
}

function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);

    return () => clearInterval(interval);
  }, []);

  return now;
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatCountdown(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return "Any sec";
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

function syncLabel(date: Date | null) {
  if (!date) {
    return "Syncing";
  }

  return `Sync ${new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(date)} IST`;
}

function createStyles(theme: ThemeColors) {
  return StyleSheet.create({
  shell: {
    backgroundColor: theme.canvas,
    flex: 1
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.page,
    paddingTop: 8
  },
  kicker: {
    color: theme.red,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: theme.ink,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 40
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: theme.surface,
    borderColor: theme.line,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.page,
    marginTop: 12
  },
  metaText: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  syncText: {
    color: theme.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    marginHorizontal: 10,
    textAlign: "right"
  },
  sourcePill: {
    alignItems: "center",
    backgroundColor: theme.surface,
    borderColor: theme.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  sourceDot: {
    backgroundColor: theme.muted,
    borderRadius: 4,
    height: 7,
    width: 7
  },
  sourceDotLive: {
    backgroundColor: theme.green
  },
  sourceText: {
    color: theme.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  content: {
    padding: spacing.page,
    paddingBottom: 34
  },
  hero: {
    backgroundColor: theme.surface,
    borderColor: theme.line,
    borderRadius: radii.panel,
    borderWidth: 1,
    padding: 18
  },
  heroTopline: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  stage: {
    color: theme.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  venue: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
    maxWidth: 230
  },
  statusBadge: {
    alignItems: "center",
    backgroundColor: theme.canvas,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  statusBadgeLive: {
    backgroundColor: "#EEF7F0"
  },
  liveDot: {
    backgroundColor: theme.green,
    borderRadius: 4,
    height: 7,
    width: 7
  },
  statusText: {
    color: theme.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  statusTextLive: {
    color: theme.green
  },
  scoreboard: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26
  },
  teamBlock: {
    flex: 1,
    gap: 8
  },
  teamBlockRight: {
    alignItems: "flex-end"
  },
  flagBadge: {
    alignItems: "center",
    backgroundColor: theme.canvas,
    borderColor: theme.line,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    overflow: "hidden",
    width: 52
  },
  flagBadgeSmall: {
    borderRadius: 12,
    height: 24,
    width: 32
  },
  flagImage: {
    height: 36,
    width: 52
  },
  flagImageSmall: {
    height: 24,
    width: 32
  },
  flagText: {
    color: theme.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  flagTextSmall: {
    fontSize: 9
  },
  score: {
    color: theme.ink,
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 56
  },
  scoreDivider: {
    color: theme.muted,
    fontSize: 28,
    fontWeight: "800",
    paddingHorizontal: 10
  },
  teamName: {
    color: theme.ink,
    fontSize: 15,
    fontWeight: "800",
    maxWidth: 142
  },
  heroFooter: {
    alignItems: "center",
    borderTopColor: theme.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginTop: 22,
    paddingTop: 14
  },
  clockBlock: {
    alignItems: "center",
    flex: 1
  },
  pickPanel: {
    backgroundColor: theme.surface,
    borderColor: theme.line,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: 12,
    padding: 14
  },
  pickHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  pickKicker: {
    color: theme.red,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  pickTitle: {
    color: theme.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 4,
    maxWidth: 230
  },
  pickBadge: {
    alignItems: "center",
    backgroundColor: theme.ink,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 30,
    paddingHorizontal: 10
  },
  pickBadgeText: {
    color: theme.surface,
    fontSize: 12,
    fontWeight: "900"
  },
  pickDetails: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  pickDetail: {
    backgroundColor: theme.canvas,
    borderRadius: radii.card,
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  pickLabel: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  pickValue: {
    color: theme.ink,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 5
  },
  pickNote: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 10
  },
  footerLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  footerValue: {
    color: theme.ink,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3
  },
  matchNumber: {
    alignItems: "center",
    backgroundColor: theme.ink,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    minWidth: 48,
    paddingHorizontal: 10
  },
  matchNumberText: {
    color: theme.surface,
    fontSize: 12,
    fontWeight: "900"
  },
  tabs: {
    backgroundColor: "#E9ECE7",
    borderRadius: 14,
    flexDirection: "row",
    gap: 4,
    marginTop: 18,
    padding: 4
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 11,
    flex: 1,
    justifyContent: "center",
    minHeight: 38
  },
  tabButtonActive: {
    backgroundColor: theme.surface
  },
  tabText: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  tabTextActive: {
    color: theme.ink
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24
  },
  sectionTitle: {
    color: theme.ink,
    fontSize: 21,
    fontWeight: "900"
  },
  sectionMeta: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  matchList: {
    gap: 10,
    marginTop: 12
  },
  matchRow: {
    alignItems: "center",
    backgroundColor: theme.surface,
    borderColor: theme.line,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 86,
    paddingHorizontal: 12
  },
  matchRowSelected: {
    borderColor: theme.ink,
    borderWidth: 1.5
  },
  matchRowPressed: {
    opacity: 0.78
  },
  matchTime: {
    alignItems: "center",
    borderRightColor: theme.line,
    borderRightWidth: 1,
    minWidth: 58,
    paddingRight: 10
  },
  matchDate: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  matchClock: {
    color: theme.ink,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4
  },
  rowTeams: {
    flex: 1,
    gap: 8,
    paddingHorizontal: 12
  },
  rowTeam: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  rowTeamName: {
    color: theme.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "800"
  },
  rowScore: {
    color: theme.ink,
    fontSize: 16,
    fontWeight: "900",
    minWidth: 20,
    textAlign: "right"
  },
  rowStatus: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    maxWidth: 90
  },
  rowStage: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  groupList: {
    gap: 10,
    marginTop: 12
  },
  groupCard: {
    backgroundColor: theme.surface,
    borderColor: theme.line,
    borderRadius: radii.card,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  groupTitle: {
    color: theme.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  groupMeta: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  standingRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 30
  },
  rank: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "800",
    width: 22
  },
  standingTeam: {
    color: theme.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  record: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    width: 34
  },
  gd: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    width: 34
  },
  points: {
    color: theme.ink,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
    width: 28
  },
  disclaimer: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 14
  }
  });
}
