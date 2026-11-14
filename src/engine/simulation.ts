import { BUILDING_DEFINITIONS, CREW_CHARACTERS, DYNAMIC_EVENTS, LANDING_SITES } from '../data/missionData';
import type {
  AlertSeverity,
  BadgeId,
  BuildingId,
  BuildingState,
  CommMessage,
  Difficulty,
  DonkiEventItem,
  EventChoice,
  GameEvent,
  MiniGameKind,
  MissionConfig,
  MissionObjective,
  MissionReport,
  MissionState,
  ResourceMetric,
} from '../types/game';
import { encodeChallengeCode } from './challengeCodes';

const STORAGE_KEY = 'lunaris_saved_mission_v2';
const BADGES_STORAGE_KEY = 'moonstar_passport_badges_v1';

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function loadPassportBadges(): BadgeId[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(BADGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BadgeId[]) : [];
  } catch {
    return [];
  }
}

export function savePassportBadges(badges: BadgeId[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(badges));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function unlockPassportBadge(badge: BadgeId): BadgeId[] {
  const existing = loadPassportBadges();
  if (existing.includes(badge)) return existing;
  const next = [...existing, badge];
  savePassportBadges(next);
  return next;
}

export function getDifficultyMultipliers(difficulty: Difficulty) {
  switch (difficulty) {
    case 'explorer':
      return { startRes: 1.15, drain: 0.85, solar: 1.12, eventSeverity: 0.85, radDrift: 2, dustExtra: 0 };
    case 'engineer':
      return { startRes: 0.96, drain: 1.06, solar: 0.98, eventSeverity: 1.05, radDrift: 3, dustExtra: 2 };
    case 'commander':
      return { startRes: 0.82, drain: 1.22, solar: 0.88, eventSeverity: 1.28, radDrift: 5, dustExtra: 4 };
    case 'veteran':
      return { startRes: 0.72, drain: 1.38, solar: 0.78, eventSeverity: 1.48, radDrift: 7, dustExtra: 6 };
  }
}

export function getLandingSiteProfile(siteId: MissionConfig['landingSite']) {
  return LANDING_SITES.find((s) => s.id === siteId) ?? LANDING_SITES[0];
}

export function createInitialBuildings(): Record<BuildingId, BuildingState> {
  return {
    habitat: { id: 'habitat', efficiency: 1.0, upgraded: false, dustLevel: 5, powered: true, activeBoost: false },
    solar: { id: 'solar', efficiency: 1.0, upgraded: false, dustLevel: 12, powered: true, activeBoost: false },
    greenhouse: { id: 'greenhouse', efficiency: 1.0, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
    water: { id: 'water', efficiency: 1.0, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
    oxygen: { id: 'oxygen', efficiency: 1.0, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
    comms: { id: 'comms', efficiency: 1.0, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
    shelter: { id: 'shelter', efficiency: 1.0, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
    rover: { id: 'rover', efficiency: 1.0, upgraded: false, dustLevel: 8, powered: true, activeBoost: false },
    research: { id: 'research', efficiency: 1.0, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
  };
}

export function createInitialObjectives(config: MissionConfig): MissionObjective[] {
  const baseSci = config.duration === 7 ? 60 : 45;
  const scienceTarget = config.priority === 'science' ? baseSci + 15 : baseSci;
  const dataTarget = config.priority === 'exploration' ? 4 : 3;

  return [
    {
      id: 'survive',
      titleKey: 'obj.survive.title',
      descriptionKey: 'obj.survive.desc',
      optional: false,
      completed: true,
      progress: 1,
      target: 1,
    },
    {
      id: 'science',
      titleKey: 'obj.science.title',
      descriptionKey: 'obj.science.desc',
      optional: false,
      completed: false,
      progress: 0,
      target: scienceTarget,
    },
    {
      id: 'food',
      titleKey: 'obj.food.title',
      descriptionKey: 'obj.food.desc',
      optional: false,
      completed: true,
      progress: 1,
      target: 1,
    },
    {
      id: 'comms',
      titleKey: 'obj.comms.title',
      descriptionKey: 'obj.comms.desc',
      optional: false,
      completed: true,
      progress: 1,
      target: 1,
    },
    {
      id: 'health',
      titleKey: 'obj.health.title',
      descriptionKey: 'obj.health.desc',
      optional: false,
      completed: true,
      progress: 1,
      target: 1,
    },
    {
      id: 'radiation',
      titleKey: 'obj.radiation.title',
      descriptionKey: 'obj.radiation.desc',
      optional: false,
      completed: true,
      progress: 1,
      target: 1,
    },
    {
      id: 'upgrades',
      titleKey: 'obj.upgrades.title',
      descriptionKey: 'obj.upgrades.desc',
      optional: false,
      completed: false,
      progress: 0,
      target: 2,
    },
    {
      id: 'data',
      titleKey: 'obj.data.title',
      descriptionKey: 'obj.data.desc',
      optional: config.priority !== 'exploration',
      completed: false,
      progress: 0,
      target: dataTarget,
    },
  ];
}

export function computeDailyRates(state: MissionState): {
  energyProd: number;
  energyCons: number;
  oxygenProd: number;
  oxygenCons: number;
  waterProd: number;
  waterCons: number;
  foodProd: number;
  foodCons: number;
} {
  const diff = getDifficultyMultipliers(state.config.difficulty);
  const site = getLandingSiteProfile(state.config.landingSite);
  const crew = state.config.crewSize;
  const b = state.buildings;

  const solarMult = b.solar.efficiency * (b.solar.upgraded ? 1.25 : 1) * (1 - b.solar.dustLevel * 0.0028);
  const polarShadowFactor =
    state.config.difficulty === 'veteran' && state.day % 2 === 0
      ? 0.86
      : state.config.difficulty === 'commander' && state.day % 3 === 0
        ? 0.9
        : 1.0;

  const energyProd = Math.round(58 * solarMult * diff.solar * site.solarMult * polarShadowFactor);

  let energyCons = 0;
  for (const key of Object.keys(b) as BuildingId[]) {
    if (key === 'solar') continue;
    const mod = b[key];
    if (mod.powered) {
      energyCons += BUILDING_DEFINITIONS[key].powerDraw;
    }
  }
  if (state.crewSheltered) {
    energyCons += 6;
  }
  energyCons = Math.round(energyCons * diff.drain);

  const hasPower = state.energy.current + energyProd - energyCons > 5;
  const hasWater = state.water.current > 8;

  const waterCons = Math.round(
    (crew * 4.2 + (b.greenhouse.powered ? 5 : 0) + (b.oxygen.powered ? 4 : 0)) * diff.drain,
  );
  const waterRecycled =
    b.water.powered && hasPower
      ? Math.round((crew * 3.8 + 4.5) * b.water.efficiency * (b.water.upgraded ? 1.2 : 1))
      : 0;

  const oxygenCons = Math.round(crew * 4.8 * diff.drain);
  const oxygenProd =
    (b.oxygen.powered && hasPower && hasWater
      ? (crew * 4.6 + 3.5) * b.oxygen.efficiency * (b.oxygen.upgraded ? 1.2 : 1)
      : 0) +
    (b.greenhouse.powered && hasPower ? 2.5 * b.greenhouse.efficiency : 0);

  const foodCons = Math.round(crew * 4.2 * diff.drain);
  const foodProd =
    b.greenhouse.powered && hasPower && hasWater
      ? Math.round((crew * 3.7 + 3.2) * b.greenhouse.efficiency * (b.greenhouse.upgraded ? 1.25 : 1))
      : 0;

  return {
    energyProd,
    energyCons,
    oxygenProd: Math.round(oxygenProd),
    oxygenCons,
    waterProd: waterRecycled,
    waterCons,
    foodProd,
    foodCons,
  };
}

export function evaluateBadges(state: MissionState): MissionState {
  const earned = new Set<BadgeId>([...loadPassportBadges(), ...(state.unlockedBadges ?? [])]);

  if (state.buildings.solar.efficiency >= 1.15) earned.add('solar_guardian');
  if (state.environmentalDataSamples >= 2) earned.add('ice_hunter');
  if (state.researchPoints >= 45) earned.add('moon_scientist');
  if (state.crewSheltered || state.radiationRisk <= 12) earned.add('safe_shield');
  if (state.nasaDataUsed) earned.add('nasa_explorer');
  if (state.miniGamesWon >= 2) earned.add('minigame_pro');
  if (state.status === 'victory') earned.add('lunar_survivor');

  const nextBadges = Array.from(earned);
  savePassportBadges(nextBadges);
  if (nextBadges.length === (state.unlockedBadges?.length ?? 0)) {
    return state;
  }
  return { ...state, unlockedBadges: nextBadges };
}

export function refreshRates(state: MissionState): MissionState {
  const rates = computeDailyRates(state);
  const next: MissionState = {
    ...state,
    energy: { ...state.energy, production: rates.energyProd, consumption: rates.energyCons },
    oxygen: { ...state.oxygen, production: rates.oxygenProd, consumption: rates.oxygenCons },
    water: { ...state.water, production: rates.waterProd, consumption: rates.waterCons },
    food: { ...state.food, production: rates.foodProd, consumption: rates.foodCons },
  };
  return evaluateBadges(evaluateObjectives(next));
}

export function createInitialMission(rawConfig: MissionConfig): MissionState {
  const seed = rawConfig.seed ?? 419;
  const challengeCode = rawConfig.challengeCode || encodeChallengeCode({ ...rawConfig, seed });
  const config: MissionConfig = {
    ...rawConfig,
    storyMode: rawConfig.storyMode ?? true,
    seed,
    challengeCode,
  };

  const diff = getDifficultyMultipliers(config.difficulty);
  const site = getLandingSiteProfile(config.landingSite);
  const buildings = createInitialBuildings();

  let energyMax = 100;
  let energyStart = Math.round(78 * diff.startRes);
  let waterStart = Math.round(76 * diff.startRes) + site.waterBonus;
  let foodStart = Math.round(75 * diff.startRes);
  let oxygenStart = Math.round(84 * diff.startRes);
  let radiationRisk = site.radStart;
  const commsQuality = site.commsStart;
  let researchPoints = site.scienceBonus;

  switch (config.commanderRole) {
    case 'engineer':
      buildings.solar.efficiency += 0.12;
      buildings.water.efficiency += 0.12;
      break;
    case 'botanist':
      buildings.greenhouse.efficiency += 0.18;
      foodStart += 8;
      break;
    case 'geologist':
      buildings.rover.efficiency += 0.15;
      buildings.research.efficiency += 0.15;
      researchPoints += 10;
      break;
    case 'medic':
      buildings.shelter.efficiency += 0.15;
      radiationRisk = Math.max(4, radiationRisk - 6);
      break;
  }

  switch (config.priority) {
    case 'survival':
      waterStart += 8;
      oxygenStart += 8;
      break;
    case 'science':
      researchPoints += 8;
      break;
    case 'exploration':
      buildings.rover.efficiency += 0.15;
      break;
  }

  if (config.equipment.includes('extra_battery')) {
    energyMax += 30;
    energyStart = Math.min(energyMax, energyStart + 20);
  }
  if (config.equipment.includes('hydro_kit')) {
    buildings.greenhouse.efficiency += 0.25;
    foodStart = Math.min(100, foodStart + 10);
  }
  if (config.equipment.includes('shield_blanket')) {
    buildings.shelter.efficiency += 0.2;
    radiationRisk = Math.max(4, radiationRisk - 12);
  }
  if (config.equipment.includes('water_filter')) {
    buildings.water.efficiency += 0.2;
    waterStart = Math.min(100, waterStart + 15);
  }
  if (config.equipment.includes('core_drill')) {
    buildings.research.efficiency += 0.25;
    researchPoints += 15;
  }
  if (config.equipment.includes('dust_repeller')) {
    buildings.solar.efficiency += 0.12;
    buildings.solar.dustLevel = Math.max(0, buildings.solar.dustLevel - 8);
  }

  const baseState: MissionState = {
    version: 3,
    config,
    day: 1,
    phase: 'morning_report',
    status: 'active',
    energy: {
      current: clamp(energyStart, 20, energyMax),
      max: energyMax,
      production: 0,
      consumption: 0,
      warningThreshold: 30,
      criticalThreshold: 15,
    },
    oxygen: {
      current: clamp(oxygenStart, 25, 100),
      max: 100,
      production: 0,
      consumption: 0,
      warningThreshold: 35,
      criticalThreshold: 18,
    },
    water: {
      current: clamp(waterStart, 25, 100),
      max: 100,
      production: 0,
      consumption: 0,
      warningThreshold: 35,
      criticalThreshold: 18,
    },
    food: {
      current: clamp(foodStart, 25, 100),
      max: 100,
      production: 0,
      consumption: 0,
      warningThreshold: 30,
      criticalThreshold: 15,
    },
    radiationRisk: clamp(radiationRisk, 2, 100),
    commsQuality: clamp(commsQuality, 20, 100),
    crewHealth: 96,
    crewSheltered: false,
    researchPoints,
    environmentalDataSamples: 0,
    actionsTakenToday: 0,
    maxActionsPerDay: config.crewSize === 4 ? 4 : 3,
    miniGamesWon: 0,
    nasaDataUsed: false,
    unlockedBadges: loadPassportBadges(),
    buildings,
    activeEvent: null,
    resolvedEventResult: null,
    usedEventIds: [],
    history: [
      {
        day: 1,
        energy: clamp(energyStart, 20, energyMax),
        oxygen: clamp(oxygenStart, 25, 100),
        water: clamp(waterStart, 25, 100),
        food: clamp(foodStart, 25, 100),
        radiationRisk: clamp(radiationRisk, 2, 100),
        crewHealth: 96,
      },
    ],
    objectives: createInitialObjectives(config),
    commsLog: [
      {
        id: 'init-1',
        sender: 'earth',
        daySent: 1,
        titleKey: 'comms.msg.statusReply.title',
        bodyKey: 'comms.msg.statusReply.body',
        delaySeconds: 0,
        delivered: true,
        remainingDelay: 0,
      },
    ],
    decisionLog: [],
    scienceTipsUnlocked: ['sci.lunar_environment'],
  };

  return refreshRates(baseState);
}

export function getResourceSeverity(metric: ResourceMetric): AlertSeverity {
  if (metric.current <= metric.criticalThreshold) return 'critical';
  if (metric.current <= metric.warningThreshold) return 'warning';
  return 'nominal';
}

export function evaluateObjectives(state: MissionState): MissionState {
  const hasSentComms = state.commsLog.some((m) => m.sender === 'commander');
  const upgradedCount = Object.values(state.buildings).filter((b) => b.upgraded).length;

  const objectives = state.objectives.map((obj) => {
    switch (obj.id) {
      case 'survive': {
        const ok = state.oxygen.current > 20 && state.water.current > 20;
        return { ...obj, completed: ok, progress: ok ? 1 : 0 };
      }
      case 'science': {
        const prog = Math.min(obj.target, state.researchPoints);
        return { ...obj, progress: prog, completed: state.researchPoints >= obj.target };
      }
      case 'food': {
        const ok = state.food.current >= 35;
        return { ...obj, completed: ok, progress: ok ? 1 : 0 };
      }
      case 'comms': {
        const ok = state.commsQuality >= 65 && (hasSentComms || state.day <= 2);
        return { ...obj, completed: ok, progress: ok ? 1 : 0 };
      }
      case 'health': {
        const ok = state.crewHealth >= 85;
        return { ...obj, completed: ok, progress: ok ? 1 : 0 };
      }
      case 'radiation': {
        const ok = state.radiationRisk <= 35;
        return { ...obj, completed: ok, progress: ok ? 1 : 0 };
      }
      case 'upgrades': {
        const prog = Math.min(obj.target, upgradedCount);
        return { ...obj, progress: prog, completed: upgradedCount >= obj.target };
      }
      case 'data': {
        const prog = Math.min(obj.target, state.environmentalDataSamples);
        return { ...obj, progress: prog, completed: state.environmentalDataSamples >= obj.target };
      }
      default:
        return obj;
    }
  });
  return { ...state, objectives };
}

export function startOperationsPhase(state: MissionState): MissionState {
  if (state.phase !== 'morning_report') return state;
  return { ...state, phase: 'operations' };
}

export function toggleBuildingPower(state: MissionState, buildingId: BuildingId): MissionState {
  if (buildingId === 'habitat' || buildingId === 'solar') return state;
  const current = state.buildings[buildingId];
  const next: MissionState = {
    ...state,
    buildings: {
      ...state.buildings,
      [buildingId]: { ...current, powered: !current.powered },
    },
  };
  return refreshRates(next);
}

export function performBuildingAction(state: MissionState, buildingId: BuildingId): MissionState {
  if (state.status !== 'active' || state.phase !== 'operations') return state;
  if (state.actionsTakenToday >= state.maxActionsPerDay) return state;

  const def = BUILDING_DEFINITIONS[buildingId];
  if (state.energy.current < def.actionCostEnergy) return state;

  const next: MissionState = {
    ...state,
    energy: { ...state.energy, current: state.energy.current - def.actionCostEnergy },
    actionsTakenToday: state.actionsTakenToday + 1,
    scienceTipsUnlocked: state.scienceTipsUnlocked.includes(def.scienceTipKey)
      ? state.scienceTipsUnlocked
      : [...state.scienceTipsUnlocked, def.scienceTipKey],
  };

  const b = { ...next.buildings[buildingId], activeBoost: true };

  switch (buildingId) {
    case 'habitat':
      next.crewHealth = clamp(next.crewHealth + 8, 0, 100);
      b.efficiency = clamp(b.efficiency + 0.08, 0.4, 1.45);
      break;
    case 'solar':
      b.dustLevel = Math.max(0, b.dustLevel - 20);
      b.efficiency = clamp(b.efficiency + 0.15, 0.4, 1.45);
      break;
    case 'greenhouse':
      if (next.water.current >= 4) {
        next.water = { ...next.water, current: next.water.current - 4 };
        next.food = { ...next.food, current: clamp(next.food.current + 12, 0, next.food.max) };
      }
      break;
    case 'water':
      next.water = { ...next.water, current: clamp(next.water.current + 14, 0, next.water.max) };
      b.efficiency = clamp(b.efficiency + 0.08, 0.4, 1.45);
      break;
    case 'oxygen':
      if (next.water.current >= 3) {
        next.water = { ...next.water, current: next.water.current - 3 };
        next.oxygen = { ...next.oxygen, current: clamp(next.oxygen.current + 14, 0, next.oxygen.max) };
      }
      break;
    case 'comms':
      next.commsQuality = clamp(next.commsQuality + 15, 0, 100);
      break;
    case 'shelter':
      next.crewSheltered = !next.crewSheltered;
      if (next.crewSheltered) {
        next.radiationRisk = clamp(next.radiationRisk - 12, 0, 100);
      }
      break;
    case 'rover':
      next.environmentalDataSamples += 1;
      next.researchPoints += Math.round(9 * b.efficiency);
      next.radiationRisk = clamp(next.radiationRisk + 4, 0, 100);
      break;
    case 'research':
      next.researchPoints += Math.round(14 * b.efficiency);
      break;
  }

  next.buildings = { ...next.buildings, [buildingId]: b };
  return refreshRates(next);
}

export function applyMiniGameReward(state: MissionState, kind: MiniGameKind, won: boolean): MissionState {
  if (!won || state.status !== 'active') return state;

  const buildings = { ...state.buildings };
  let next: MissionState = {
    ...state,
    miniGamesWon: state.miniGamesWon + 1,
  };

  if (kind === 'solar_dust') {
    buildings.solar = {
      ...buildings.solar,
      dustLevel: 0,
      efficiency: clamp(buildings.solar.efficiency + 0.18, 0.4, 1.45),
      activeBoost: true,
    };
    next = {
      ...next,
      energy: { ...next.energy, current: clamp(next.energy.current + 10, 0, next.energy.max) },
      buildings,
    };
  } else if (kind === 'comms_tune') {
    buildings.comms = {
      ...buildings.comms,
      efficiency: clamp(buildings.comms.efficiency + 0.12, 0.4, 1.45),
      activeBoost: true,
    };
    next = {
      ...next,
      commsQuality: clamp(next.commsQuality + 18, 0, 100),
      researchPoints: next.researchPoints + 8,
      buildings,
    };
  } else if (kind === 'rover_ice') {
    buildings.rover = {
      ...buildings.rover,
      efficiency: clamp(buildings.rover.efficiency + 0.12, 0.4, 1.45),
      activeBoost: true,
    };
    next = {
      ...next,
      water: { ...next.water, current: clamp(next.water.current + 10, 0, next.water.max) },
      environmentalDataSamples: next.environmentalDataSamples + 1,
      researchPoints: next.researchPoints + 12,
      buildings,
    };
  }

  return refreshRates(next);
}

export function upgradeBuilding(state: MissionState, buildingId: BuildingId): MissionState {
  if (state.status !== 'active' || state.phase !== 'operations') return state;
  const b = state.buildings[buildingId];
  if (b.upgraded) return state;
  const def = BUILDING_DEFINITIONS[buildingId];
  if (state.energy.current < def.upgradeCostEnergy) return state;

  const next: MissionState = {
    ...state,
    energy: { ...state.energy, current: state.energy.current - def.upgradeCostEnergy },
    buildings: {
      ...state.buildings,
      [buildingId]: {
        ...b,
        upgraded: true,
        efficiency: clamp(b.efficiency + 0.12, 0.4, 1.5),
      },
    },
  };
  return refreshRates(next);
}

const PERMUTATIONS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
  [0, 2, 1],
  [2, 1, 0],
  [1, 0, 2],
];

export function pickDailyEvent(state: MissionState, seedOffset = 0): GameEvent {
  const pool = DYNAMIC_EVENTS.filter((e) => !state.usedEventIds.includes(e.id));
  const candidates = pool.length > 0 ? pool : DYNAMIC_EVENTS;
  const missionSeed = state.config.seed ?? 419;
  const hash =
    missionSeed +
    state.day * 13 +
    state.researchPoints * 3 +
    Math.round(state.energy.current) +
    state.config.landingSite.length * 5 +
    seedOffset;
  const baseEvent = candidates[Math.abs(hash) % candidates.length];

  const baseCharCode = baseEvent.id.charCodeAt(baseEvent.id.length - 1) || 0;
  const perm = PERMUTATIONS[Math.abs(missionSeed + state.day * 5 + seedOffset + baseCharCode) % PERMUTATIONS.length];
  const letters: ['A', 'B', 'C'] = ['A', 'B', 'C'];
  const shuffledChoices: [EventChoice, EventChoice, EventChoice] = [
    { ...baseEvent.choices[perm[0]], id: letters[0] },
    { ...baseEvent.choices[perm[1]], id: letters[1] },
    { ...baseEvent.choices[perm[2]], id: letters[2] },
  ];

  return {
    ...baseEvent,
    choices: shuffledChoices,
  };
}

export function triggerDailyEvent(state: MissionState, seedOffset = 0): MissionState {
  if (state.status !== 'active' || state.phase !== 'operations') return state;
  const event = pickDailyEvent(state, seedOffset);
  return {
    ...state,
    phase: 'event',
    activeEvent: event,
    resolvedEventResult: null,
  };
}

export function triggerRealNasaSpaceWeatherEvent(state: MissionState, donkiEvent: DonkiEventItem): MissionState {
  if (state.status !== 'active') return state;

  const baseSolar = DYNAMIC_EVENTS[0]; // ev_solar_alert
  const detailBadge =
    donkiEvent.type === 'CME'
      ? `NASA DONKI CME · ${donkiEvent.speedKms ?? 450} km/s · ${donkiEvent.date.slice(0, 10)}`
      : donkiEvent.type === 'GST'
        ? `NASA DONKI GST · Kp ${donkiEvent.kpIndex ?? 6} · ${donkiEvent.date.slice(0, 10)}`
        : `NASA DONKI FLR · ${donkiEvent.classType ?? 'Solar'} · ${donkiEvent.date.slice(0, 10)}`;

  const perm = PERMUTATIONS[(state.day + donkiEvent.id.length) % PERMUTATIONS.length];
  const letters: ['A', 'B', 'C'] = ['A', 'B', 'C'];
  const shuffledChoices: [EventChoice, EventChoice, EventChoice] = [
    { ...baseSolar.choices[perm[0]], id: letters[0] },
    { ...baseSolar.choices[perm[1]], id: letters[1] },
    { ...baseSolar.choices[perm[2]], id: letters[2] },
  ];

  const nextEvent: GameEvent = {
    ...baseSolar,
    id: `nasa_real_${donkiEvent.id}`,
    customSubtitle: detailBadge,
    choices: shuffledChoices,
  };

  return refreshRates({
    ...state,
    nasaDataUsed: true,
    phase: 'event',
    activeEvent: nextEvent,
    resolvedEventResult: null,
  });
}

export function markNasaDataUsed(state: MissionState | null): MissionState | null {
  unlockPassportBadge('nasa_explorer');
  if (!state) return null;
  if (state.nasaDataUsed) return evaluateBadges(state);
  return evaluateBadges({ ...state, nasaDataUsed: true });
}

export function resolveEventChoice(state: MissionState, choiceId: 'A' | 'B' | 'C'): MissionState {
  if (!state.activeEvent || state.phase !== 'event') return state;
  const event = state.activeEvent;
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) return state;

  const eff = choice.effects;
  const diff = getDifficultyMultipliers(state.config.difficulty);
  const scaleNeg = (val: number | undefined) =>
    val === undefined ? 0 : val < 0 ? Math.round(val * diff.eventSeverity) : val;

  const buildings = { ...state.buildings };
  if (eff.solarEfficiencyDelta) {
    buildings.solar = {
      ...buildings.solar,
      efficiency: clamp(buildings.solar.efficiency + eff.solarEfficiencyDelta, 0.35, 1.45),
      dustLevel:
        eff.solarEfficiencyDelta > 0
          ? Math.max(0, buildings.solar.dustLevel - 15)
          : Math.min(85, buildings.solar.dustLevel + 18),
    };
  }
  if (eff.waterEfficiencyDelta) {
    buildings.water = {
      ...buildings.water,
      efficiency: clamp(buildings.water.efficiency + eff.waterEfficiencyDelta, 0.35, 1.45),
    };
  }
  if (eff.greenhouseEfficiencyDelta) {
    buildings.greenhouse = {
      ...buildings.greenhouse,
      efficiency: clamp(buildings.greenhouse.efficiency + eff.greenhouseEfficiencyDelta, 0.35, 1.45),
    };
  }
  if (eff.commsEfficiencyDelta) {
    buildings.comms = {
      ...buildings.comms,
      efficiency: clamp(buildings.comms.efficiency + eff.commsEfficiencyDelta, 0.35, 1.45),
    };
  }
  if (eff.roverEfficiencyDelta) {
    buildings.rover = {
      ...buildings.rover,
      efficiency: clamp(buildings.rover.efficiency + eff.roverEfficiencyDelta, 0.35, 1.45),
    };
  }
  if (eff.oxygenEfficiencyDelta) {
    buildings.oxygen = {
      ...buildings.oxygen,
      efficiency: clamp(buildings.oxygen.efficiency + eff.oxygenEfficiencyDelta, 0.35, 1.45),
    };
  }

  const next: MissionState = {
    ...state,
    phase: 'summary',
    activeEvent: null,
    resolvedEventResult: { event, choice },
    usedEventIds: [...state.usedEventIds, event.id],
    energy: {
      ...state.energy,
      current: clamp(state.energy.current + scaleNeg(eff.energy), 0, state.energy.max),
    },
    oxygen: {
      ...state.oxygen,
      current: clamp(state.oxygen.current + scaleNeg(eff.oxygen), 0, state.oxygen.max),
    },
    water: {
      ...state.water,
      current: clamp(state.water.current + scaleNeg(eff.water), 0, state.water.max),
    },
    food: {
      ...state.food,
      current: clamp(state.food.current + scaleNeg(eff.food), 0, state.food.max),
    },
    radiationRisk: clamp(state.radiationRisk + (eff.radiationRisk ?? 0), 0, 100),
    crewHealth: clamp(state.crewHealth + scaleNeg(eff.crewHealth), 0, 100),
    commsQuality: clamp(state.commsQuality + (eff.commsQuality ?? 0), 0, 100),
    researchPoints: state.researchPoints + (eff.researchPoints ?? 0),
    environmentalDataSamples: state.environmentalDataSamples + (eff.environmentalDataSamples ?? 0),
    crewSheltered: eff.shelterCrew ? true : state.crewSheltered,
    buildings,
    decisionLog: [
      ...state.decisionLog,
      {
        day: state.day,
        eventTitleKey: event.titleKey,
        choiceId: choice.id,
        choiceLabelKey: choice.labelKey,
        outcomeKey: choice.outcomeKey,
        recommended: Boolean(choice.isRecommended),
      },
    ],
    scienceTipsUnlocked: state.scienceTipsUnlocked.includes(event.scienceExplanationKey)
      ? state.scienceTipsUnlocked
      : [...state.scienceTipsUnlocked, event.scienceExplanationKey],
  };

  return refreshRates(next);
}

export function advanceMissionDay(state: MissionState): MissionState {
  if (state.status !== 'active') return state;

  const diff = getDifficultyMultipliers(state.config.difficulty);
  const site = getLandingSiteProfile(state.config.landingSite);
  const rates = computeDailyRates(state);
  const nextEnergy = clamp(state.energy.current + rates.energyProd - rates.energyCons, 0, state.energy.max);
  const nextWater = clamp(state.water.current + rates.waterProd - rates.waterCons, 0, state.water.max);
  const nextOxygen = clamp(state.oxygen.current + rates.oxygenProd - rates.oxygenCons, 0, state.oxygen.max);
  const nextFood = clamp(state.food.current + rates.foodProd - rates.foodCons, 0, state.food.max);

  let nextRad = state.radiationRisk;
  if (state.crewSheltered) {
    nextRad = clamp(nextRad - 10, 0, 100);
  } else {
    nextRad = clamp(nextRad + diff.radDrift, 0, 100);
  }

  let nextHealth = state.crewHealth;
  if (nextEnergy <= 0) nextHealth -= 12;
  if (nextRad >= 75) nextHealth -= 10;
  if (nextOxygen <= 15 || nextWater <= 15 || nextFood <= 10) nextHealth -= 14;
  if (nextOxygen > 35 && nextWater > 35 && nextFood > 30 && nextRad < 45 && nextEnergy > 15) {
    nextHealth += 3;
  }
  nextHealth = clamp(nextHealth, 0, 100);

  const dustMult = state.config.equipment.includes('dust_repeller') ? 0.5 : 1.0;
  const dailyDust = Math.round((site.dustRate + diff.dustExtra) * dustMult);
  const solar = {
    ...state.buildings.solar,
    dustLevel: clamp(state.buildings.solar.dustLevel + dailyDust, 0, 85),
  };

  const resetBuildings = { ...state.buildings, solar };
  for (const k of Object.keys(resetBuildings) as BuildingId[]) {
    resetBuildings[k] = { ...resetBuildings[k], activeBoost: false };
  }

  let failureReasonKey: string | undefined;
  let status: 'active' | 'victory' | 'failed' = 'active';

  if (nextOxygen <= 0) {
    status = 'failed';
    failureReasonKey = 'fail.oxygen';
  } else if (nextWater <= 0) {
    status = 'failed';
    failureReasonKey = 'fail.water';
  } else if (nextFood <= 0) {
    status = 'failed';
    failureReasonKey = 'fail.food';
  } else if (nextHealth <= 0) {
    status = 'failed';
    failureReasonKey = 'fail.health';
  } else if (state.day >= state.config.duration) {
    status = 'victory';
  }

  const nextDay = status === 'active' ? state.day + 1 : state.day;

  const updated: MissionState = {
    ...state,
    day: nextDay,
    phase: 'morning_report',
    status,
    failureReasonKey,
    energy: { ...state.energy, current: nextEnergy },
    oxygen: { ...state.oxygen, current: nextOxygen },
    water: { ...state.water, current: nextWater },
    food: { ...state.food, current: nextFood },
    radiationRisk: nextRad,
    crewHealth: nextHealth,
    crewSheltered: false,
    actionsTakenToday: 0,
    resolvedEventResult: null,
    buildings: resetBuildings,
    history: [
      ...state.history,
      {
        day: state.day + 1,
        energy: nextEnergy,
        oxygen: nextOxygen,
        water: nextWater,
        food: nextFood,
        radiationRisk: nextRad,
        crewHealth: nextHealth,
      },
    ],
  };

  return refreshRates(updated);
}

export function getContextualCrewLine(state: MissionState): {
  character: (typeof CREW_CHARACTERS)[number];
  lineKey: string;
  mood: 'happy' | 'alert' | 'critical';
} {
  const activeCrew = CREW_CHARACTERS.slice(0, state.config.crewSize);
  const pick = (id: 'sofia' | 'mateo' | 'leo' | 'luna') =>
    activeCrew.find((c) => c.id === id) ?? activeCrew[0];

  if (state.radiationRisk >= 65) {
    return { character: pick('luna'), lineKey: 'crew.line.radHigh', mood: 'critical' };
  }
  if (state.energy.current <= 28) {
    return { character: pick('mateo'), lineKey: 'crew.line.energyLow', mood: 'critical' };
  }
  if (state.water.current <= 32 || state.oxygen.current <= 35) {
    return { character: pick('sofia'), lineKey: 'crew.line.lifeLow', mood: 'alert' };
  }
  if (state.buildings.solar.dustLevel >= 22) {
    return { character: pick('mateo'), lineKey: 'crew.line.dust', mood: 'alert' };
  }
  if (state.crewSheltered) {
    return { character: pick('luna'), lineKey: 'crew.line.sheltered', mood: 'happy' };
  }
  if (state.food.current >= 70) {
    return { character: pick('leo'), lineKey: 'crew.line.greenGood', mood: 'happy' };
  }
  return { character: pick('sofia'), lineKey: 'crew.line.nominal', mood: 'happy' };
}

export function queueEarthMessage(
  state: MissionState,
  kind: 'status' | 'advice',
): MissionState {
  const qualityPenalty = Math.round((100 - state.commsQuality) * 0.05);
  const delaySeconds = 3 + qualityPenalty;

  const outMsg: CommMessage = {
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: 'commander',
    daySent: state.day,
    titleKey: kind === 'status' ? 'comms.msg.status.title' : 'comms.msg.advice.title',
    bodyKey: kind === 'status' ? 'comms.msg.status.body' : 'comms.msg.advice.body',
    delaySeconds,
    delivered: false,
    remainingDelay: delaySeconds,
  };

  const replyMsg: CommMessage = {
    id: `earth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: 'earth',
    daySent: state.day,
    titleKey: kind === 'status' ? 'comms.msg.statusReply.title' : 'comms.msg.adviceReply.title',
    bodyKey: kind === 'status' ? 'comms.msg.statusReply.body' : 'comms.msg.adviceReply.body',
    delaySeconds: delaySeconds + 2,
    delivered: false,
    remainingDelay: delaySeconds + 2,
  };

  const next: MissionState = {
    ...state,
    commsQuality: clamp(state.commsQuality + 4, 0, 100),
    commsLog: [...state.commsLog, outMsg, replyMsg],
    scienceTipsUnlocked: state.scienceTipsUnlocked.includes('sci.comms_delay')
      ? state.scienceTipsUnlocked
      : [...state.scienceTipsUnlocked, 'sci.comms_delay'],
  };

  return evaluateBadges(evaluateObjectives(next));
}

export function tickEarthComms(state: MissionState, elapsedSec: number): MissionState {
  let changed = false;
  const commsLog = state.commsLog.map((msg) => {
    if (msg.delivered) return msg;
    changed = true;
    const rem = Math.max(0, msg.remainingDelay - elapsedSec);
    return {
      ...msg,
      remainingDelay: rem,
      delivered: rem <= 0,
    };
  });
  return changed ? { ...state, commsLog } : state;
}

export function generateMissionReport(state: MissionState): MissionReport {
  const victory = state.status === 'victory';
  const energyEfficiency = Math.round(
    clamp(state.buildings.solar.efficiency * 60 + state.energy.current * 0.4, 0, 100),
  );
  const waterEfficiency = Math.round(
    clamp(state.buildings.water.efficiency * 60 + state.water.current * 0.4, 0, 100),
  );
  const foodEfficiency = Math.round(
    clamp(state.buildings.greenhouse.efficiency * 55 + state.food.current * 0.45, 0, 100),
  );
  const radiationProtectionScore = Math.round(clamp(100 - state.radiationRisk, 0, 100));

  const completedObjectives = state.objectives.filter((o) => o.completed).length;
  const totalObjectives = state.objectives.length;

  const score = Math.round(
    (victory ? 300 : state.day * 30) +
      state.crewHealth * 2 +
      completedObjectives * 45 +
      state.researchPoints * 2 +
      state.miniGamesWon * 25 +
      (energyEfficiency + waterEfficiency + foodEfficiency + radiationProtectionScore) * 0.6,
  );

  let rating: 'S' | 'A' | 'B' | 'C' = 'C';
  if (victory && score >= 950) rating = 'S';
  else if (victory && score >= 780) rating = 'A';
  else if (victory) rating = 'B';

  const bestDecisions = state.decisionLog.filter((d) => d.recommended);
  const lessonsToImprove: string[] = [];

  if (state.decisionLog.some((d) => !d.recommended)) {
    lessonsToImprove.push('sci.radiation_shielding');
  }
  if (waterEfficiency < 70) {
    lessonsToImprove.push('sci.water_recycling');
  }
  if (energyEfficiency < 70) {
    lessonsToImprove.push('sci.solar_power');
  }
  if (foodEfficiency < 70) {
    lessonsToImprove.push('sci.greenhouse_energy');
  }
  if (lessonsToImprove.length === 0) {
    lessonsToImprove.push('sci.lunar_science');
  }

  return {
    victory,
    rating,
    score,
    daysSurvived: state.day,
    totalDays: state.config.duration,
    crewHealth: Math.round(state.crewHealth),
    energyEfficiency,
    waterEfficiency,
    foodEfficiency,
    radiationProtectionScore,
    researchPoints: state.researchPoints,
    completedObjectives,
    totalObjectives,
    unlockedBadges: state.unlockedBadges,
    challengeCode: state.config.challengeCode ?? encodeChallengeCode(state.config),
    bestDecisions,
    lessonsToImprove,
    failureReasonKey: state.failureReasonKey,
  };
}

export function saveMissionToStorage(state: MissionState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function loadMissionFromStorage(): MissionState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MissionState;
    if (
      !parsed ||
      parsed.version !== 3 ||
      !parsed.config ||
      !parsed.config.landingSite ||
      !parsed.config.commanderRole ||
      !parsed.config.priority
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearMissionFromStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
}
