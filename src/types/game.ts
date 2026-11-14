export type Language = 'es' | 'en';

export type ScreenMode = 'title' | 'prep' | 'playing' | 'gameover';

export type Difficulty = 'explorer' | 'engineer' | 'commander' | 'veteran';

export type LandingSiteId = 'shackleton' | 'cabeus' | 'tranquility' | 'aristarchus';

export type CommanderRole = 'engineer' | 'botanist' | 'geologist' | 'medic';

export type MissionPriority = 'survival' | 'science' | 'exploration';

export type MissionDuration = 5 | 7;

export type CrewSize = 2 | 4;

export type EquipmentId =
  | 'extra_battery'
  | 'hydro_kit'
  | 'shield_blanket'
  | 'water_filter'
  | 'core_drill'
  | 'dust_repeller';

export type BuildingId =
  | 'habitat'
  | 'solar'
  | 'greenhouse'
  | 'water'
  | 'oxygen'
  | 'comms'
  | 'shelter'
  | 'rover'
  | 'research';

export type DailyPhase =
  | 'morning_report'
  | 'operations'
  | 'event'
  | 'summary';

export type AlertSeverity = 'nominal' | 'warning' | 'critical';

export type BadgeId =
  | 'solar_guardian'
  | 'ice_hunter'
  | 'moon_scientist'
  | 'safe_shield'
  | 'nasa_explorer'
  | 'minigame_pro'
  | 'academy_star'
  | 'lunar_survivor';

export type MiniGameKind = 'solar_dust' | 'comms_tune' | 'rover_ice';

export interface ResourceMetric {
  current: number;
  max: number;
  production: number;
  consumption: number;
  warningThreshold: number;
  criticalThreshold: number;
}

export interface ResourceSnapshot {
  day: number;
  energy: number;
  oxygen: number;
  water: number;
  food: number;
  radiationRisk: number;
  crewHealth: number;
}

export interface BuildingState {
  id: BuildingId;
  efficiency: number;
  upgraded: boolean;
  dustLevel: number;
  powered: boolean;
  activeBoost: boolean;
}

export interface EventChoice {
  id: 'A' | 'B' | 'C';
  labelKey: string;
  costSummaryKey: string;
  benefitSummaryKey: string;
  effects: {
    energy?: number;
    oxygen?: number;
    water?: number;
    food?: number;
    radiationRisk?: number;
    crewHealth?: number;
    commsQuality?: number;
    researchPoints?: number;
    environmentalDataSamples?: number;
    solarEfficiencyDelta?: number;
    waterEfficiencyDelta?: number;
    greenhouseEfficiencyDelta?: number;
    commsEfficiencyDelta?: number;
    roverEfficiencyDelta?: number;
    oxygenEfficiencyDelta?: number;
    shelterCrew?: boolean;
  };
  outcomeKey: string;
  isRecommended?: boolean;
}

export interface GameEvent {
  id: string;
  category:
    | 'solar'
    | 'dust'
    | 'water'
    | 'greenhouse'
    | 'comms'
    | 'rover'
    | 'science'
    | 'battery'
    | 'oxygen'
    | 'micrometeoroid'
    | 'thermal'
    | 'medical';
  severity: 'warning' | 'critical' | 'opportunity';
  titleKey: string;
  descriptionKey: string;
  customSubtitle?: string;
  scienceExplanationKey: string;
  choices: [EventChoice, EventChoice, EventChoice];
}

export interface MissionObjective {
  id: string;
  titleKey: string;
  descriptionKey: string;
  optional: boolean;
  completed: boolean;
  progress: number;
  target: number;
}

export interface CommMessage {
  id: string;
  sender: 'commander' | 'earth';
  daySent: number;
  titleKey: string;
  bodyKey: string;
  delaySeconds: number;
  delivered: boolean;
  remainingDelay: number;
}

export interface DecisionLogEntry {
  day: number;
  eventTitleKey: string;
  choiceId: 'A' | 'B' | 'C';
  choiceLabelKey: string;
  outcomeKey: string;
  recommended: boolean;
}

export interface MissionConfig {
  landingSite: LandingSiteId;
  commanderRole: CommanderRole;
  priority: MissionPriority;
  duration: MissionDuration;
  crewSize: CrewSize;
  difficulty: Difficulty;
  equipment: EquipmentId[];
  storyMode?: boolean;
  challengeCode?: string;
  seed?: number;
}

export interface MissionState {
  version: number;
  config: MissionConfig;
  day: number;
  phase: DailyPhase;
  status: 'active' | 'victory' | 'failed';
  failureReasonKey?: string;
  energy: ResourceMetric;
  oxygen: ResourceMetric;
  water: ResourceMetric;
  food: ResourceMetric;
  radiationRisk: number;
  commsQuality: number;
  crewHealth: number;
  crewSheltered: boolean;
  researchPoints: number;
  environmentalDataSamples: number;
  actionsTakenToday: number;
  maxActionsPerDay: number;
  miniGamesWon: number;
  nasaDataUsed: boolean;
  unlockedBadges: BadgeId[];
  buildings: Record<BuildingId, BuildingState>;
  activeEvent: GameEvent | null;
  resolvedEventResult: {
    event: GameEvent;
    choice: EventChoice;
  } | null;
  usedEventIds: string[];
  history: ResourceSnapshot[];
  objectives: MissionObjective[];
  commsLog: CommMessage[];
  decisionLog: DecisionLogEntry[];
  scienceTipsUnlocked: string[];
}

export interface MissionReport {
  victory: boolean;
  rating: 'S' | 'A' | 'B' | 'C';
  score: number;
  daysSurvived: number;
  totalDays: number;
  crewHealth: number;
  energyEfficiency: number;
  waterEfficiency: number;
  foodEfficiency: number;
  radiationProtectionScore: number;
  researchPoints: number;
  completedObjectives: number;
  totalObjectives: number;
  unlockedBadges: BadgeId[];
  challengeCode: string;
  bestDecisions: DecisionLogEntry[];
  lessonsToImprove: string[];
  failureReasonKey?: string;
}

export interface ChallengeScoreEntry {
  id: string;
  code: string;
  commanderName: string;
  score: number;
  rating: 'S' | 'A' | 'B' | 'C';
  victory: boolean;
  date: string;
}

export interface DonkiEventItem {
  id: string;
  type: 'FLR' | 'CME' | 'GST';
  date: string;
  classType?: string;
  speedKms?: number;
  kpIndex?: number;
  sourceLocation: string;
  summary: string;
  link: string;
}

export interface DonkiResponse {
  sourceType: 'live' | 'archived';
  sourceName: string;
  endpoint?: string;
  fetchedAt: string;
  note: string;
  events: DonkiEventItem[];
}

export interface OsdrStudyItem {
  accession: string;
  title: string;
  organism: string;
  center: string;
  mission: string;
  description: string;
  url: string;
}

export interface OsdrResponse {
  sourceType: 'live' | 'archived';
  sourceName: string;
  endpoint: string;
  totalMatches: number;
  fetchedAt: string;
  studies: OsdrStudyItem[];
}

export interface RadLabResponse {
  sourceType: 'live' | 'archived';
  sourceName: string;
  endpoint?: string;
  fetchedAt?: string;
  totalRowsReturned?: number;
  disclaimer: string;
  measurements: Array<{
    id: string;
    instrument: string;
    date: string;
    doseRate: number;
    unit: string;
    orbitAltitudeKm: number;
    notes: string;
  }>;
}
