import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeChallengeCode, encodeChallengeCode } from './challengeCodes';
import {
  advanceMissionDay,
  applyMiniGameReward,
  computeDailyRates,
  createInitialMission,
  generateMissionReport,
  getContextualCrewLine,
  performBuildingAction,
  pickDailyEvent,
  queueEarthMessage,
  resolveEventChoice,
  startOperationsPhase,
  tickEarthComms,
  toggleBuildingPower,
  triggerDailyEvent,
  triggerRealNasaSpaceWeatherEvent,
  upgradeBuilding,
} from './simulation';
import type { MissionConfig } from '../types/game';

const BASE_CONFIG: MissionConfig = {
  landingSite: 'shackleton',
  commanderRole: 'engineer',
  priority: 'survival',
  duration: 5,
  crewSize: 2,
  difficulty: 'engineer',
  equipment: [],
};

test('landing sites, commander roles, and equipment modify mission telemetry', () => {
  const base = createInitialMission(BASE_CONFIG);
  const cabeusEquipped = createInitialMission({
    landingSite: 'cabeus',
    commanderRole: 'geologist',
    priority: 'science',
    duration: 7,
    crewSize: 2,
    difficulty: 'explorer',
    equipment: ['extra_battery', 'shield_blanket', 'core_drill', 'dust_repeller'],
  });

  assert.equal(base.energy.max, 100);
  assert.equal(cabeusEquipped.energy.max, 130);
  assert.ok(cabeusEquipped.radiationRisk < base.radiationRisk);
  assert.ok(cabeusEquipped.researchPoints >= 35);
  assert.equal(cabeusEquipped.objectives.length, 8);
});

test('resource interconnections reflect powered modules, crew size, and veteran difficulty', () => {
  const crew2 = createInitialMission(BASE_CONFIG);
  const crew4 = createInitialMission({ ...BASE_CONFIG, crewSize: 4 });
  const veteran = createInitialMission({ ...BASE_CONFIG, difficulty: 'veteran' });

  const rates2 = computeDailyRates(crew2);
  const rates4 = computeDailyRates(crew4);
  const ratesVet = computeDailyRates(veteran);
  assert.ok(rates4.oxygenCons > rates2.oxygenCons);
  assert.ok(rates4.waterCons > rates2.waterCons);
  assert.ok(ratesVet.energyCons > rates2.energyCons);
  assert.ok(ratesVet.energyProd < rates2.energyProd);

  const poweredOff = toggleBuildingPower(crew2, 'greenhouse');
  const ratesOff = computeDailyRates(poweredOff);
  assert.ok(ratesOff.energyCons < rates2.energyCons);
  assert.equal(ratesOff.foodProd, 0);
});

test('dynamic event choices shuffle across A, B, and C rather than always being option A', () => {
  const state = createInitialMission(BASE_CONFIG);
  const recommendedLetters = new Set<'A' | 'B' | 'C'>();
  for (let day = 1; day <= 14; day++) {
    const ev = pickDailyEvent({ ...state, day }, day % 3);
    const rec = ev.choices.find((c) => c.isRecommended);
    if (rec) recommendedLetters.add(rec.id);
  }
  assert.ok(recommendedLetters.has('A'));
  assert.ok(recommendedLetters.has('B'));
  assert.ok(recommendedLetters.has('C'));
});

test('challenge codes encode and decode deterministically', () => {
  const code = encodeChallengeCode({
    ...BASE_CONFIG,
    landingSite: 'cabeus',
    crewSize: 4,
    difficulty: 'veteran',
    duration: 7,
    seed: 512,
  });
  assert.equal(code, 'MRX-CAB-4V7-512');
  const parsed = decodeChallengeCode(code);
  assert.ok(parsed !== null);
  assert.equal(parsed?.landingSite, 'cabeus');
  assert.equal(parsed?.crewSize, 4);
  assert.equal(parsed?.difficulty, 'veteran');
  assert.equal(parsed?.duration, 7);
  assert.equal(parsed?.seed, 512);
  // Idempotent re-encoding must keep the exact same code!
  const reencoded = encodeChallengeCode({
    ...BASE_CONFIG,
    ...parsed,
  });
  assert.equal(reencoded, code);
});

test('mini-games, badges, crew lines, and live NASA weather simulation integrate cleanly', () => {
  let state = createInitialMission({ ...BASE_CONFIG, crewSize: 4 });
  state = startOperationsPhase(state);

  state = applyMiniGameReward(state, 'solar_align', true);
  assert.equal(state.miniGamesWon, 1);
  assert.ok(state.unlockedBadges.includes('solar_guardian'));

  state = applyMiniGameReward(state, 'rover_ice', true);
  assert.equal(state.miniGamesWon, 2);
  assert.ok(state.unlockedBadges.includes('minigame_pro'));

  const crewSpeech = getContextualCrewLine(state);
  assert.ok(crewSpeech.character.id.length > 0);

  state = triggerRealNasaSpaceWeatherEvent(state, {
    id: '2026-test-cme',
    type: 'CME',
    date: '2026-11-14T10:00Z',
    speedKms: 680,
    sourceLocation: 'SOHO LASCO',
    summary: 'Real CME observed.',
    link: 'https://api.nasa.gov',
  });
  assert.equal(state.phase, 'event');
  assert.equal(state.nasaDataUsed, true);
  assert.ok(state.unlockedBadges.includes('nasa_explorer'));
  assert.ok(state.activeEvent?.customSubtitle?.includes('680 km/s'));
});

test('building actions, upgrades, and daily event progression work end-to-end', () => {
  let state = createInitialMission({
    ...BASE_CONFIG,
    difficulty: 'explorer',
    equipment: ['hydro_kit'],
  });

  state = startOperationsPhase(state);
  assert.equal(state.phase, 'operations');

  const energyBefore = state.energy.current;
  const scienceBefore = state.researchPoints;
  state = performBuildingAction(state, 'research');
  assert.ok(state.energy.current < energyBefore);
  assert.ok(state.researchPoints > scienceBefore);
  assert.equal(state.actionsTakenToday, 1);

  state = upgradeBuilding(state, 'solar');
  assert.equal(state.buildings.solar.upgraded, true);

  state = triggerDailyEvent(state);
  assert.equal(state.phase, 'event');
  assert.ok(state.activeEvent !== null);

  state = resolveEventChoice(state, 'A');
  assert.equal(state.phase, 'summary');
  assert.equal(state.decisionLog.length, 1);

  state = advanceMissionDay(state);
  assert.equal(state.day, 2);
  assert.equal(state.phase, 'morning_report');
  assert.equal(state.history.length, 2);
});

test('earth communications simulate light-speed delay before delivery', () => {
  let state = createInitialMission(BASE_CONFIG);

  state = queueEarthMessage(state, 'status');
  const pending = state.commsLog.filter((m) => !m.delivered);
  assert.equal(pending.length, 2);

  state = tickEarthComms(state, 1);
  assert.ok(state.commsLog.some((m) => !m.delivered));

  state = tickEarthComms(state, 20);
  assert.ok(state.commsLog.every((m) => m.delivered));
});

test('victory and defeat conditions produce accurate mission reports', () => {
  let state = createInitialMission({
    ...BASE_CONFIG,
    difficulty: 'explorer',
    equipment: ['extra_battery', 'water_filter', 'hydro_kit'],
  });

  for (let d = 1; d <= 5; d++) {
    state = startOperationsPhase(state);
    state = performBuildingAction(state, 'research');
    state = triggerDailyEvent(state, d);
    const recChoice = state.activeEvent!.choices.find((c) => c.isRecommended)?.id ?? 'B';
    state = resolveEventChoice(state, recChoice);
    state = advanceMissionDay(state);
  }

  assert.equal(state.status, 'victory');
  const report = generateMissionReport(state);
  assert.equal(report.victory, true);
  assert.ok(['S', 'A', 'B'].includes(report.rating));
  assert.equal(report.totalObjectives, 8);
  assert.ok(report.unlockedBadges.includes('lunar_survivor'));
  assert.ok(report.challengeCode.startsWith('MRX-'));

  let failing = createInitialMission({
    ...BASE_CONFIG,
    crewSize: 4,
    difficulty: 'veteran',
  });
  failing = {
    ...failing,
    oxygen: { ...failing.oxygen, current: 2 },
    buildings: {
      ...failing.buildings,
      oxygen: { ...failing.buildings.oxygen, powered: false },
    },
  };
  failing = advanceMissionDay(failing);
  assert.equal(failing.status, 'failed');
  assert.equal(failing.failureReasonKey, 'fail.oxygen');
});
