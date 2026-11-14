import type {
  BadgeId,
  BuildingId,
  CommanderRole,
  EquipmentId,
  GameEvent,
  LandingSiteId,
  MissionPriority,
} from '../types/game';

export interface LandingSiteProfile {
  id: LandingSiteId;
  nameKey: string;
  regionKey: string;
  descKey: string;
  sunlightPct: number;
  tempRange: string;
  icePotentialKey: string;
  earthLinkPct: number;
  solarMult: number;
  waterBonus: number;
  commsStart: number;
  radStart: number;
  dustRate: number;
  scienceBonus: number;
  terrainTintHex: number;
}

export const LANDING_SITES: LandingSiteProfile[] = [
  {
    id: 'shackleton',
    nameKey: 'site.shackleton.name',
    regionKey: 'site.shackleton.region',
    descKey: 'site.shackleton.desc',
    sunlightPct: 86,
    tempRange: '-130°C a -20°C',
    icePotentialKey: 'site.ice.high',
    earthLinkPct: 84,
    solarMult: 1.0,
    waterBonus: 6,
    commsStart: 84,
    radStart: 18,
    dustRate: 5,
    scienceBonus: 0,
    terrainTintHex: 0xffffff,
  },
  {
    id: 'cabeus',
    nameKey: 'site.cabeus.name',
    regionKey: 'site.cabeus.region',
    descKey: 'site.cabeus.desc',
    sunlightPct: 68,
    tempRange: '-175°C a -55°C',
    icePotentialKey: 'site.ice.veryHigh',
    earthLinkPct: 74,
    solarMult: 0.84,
    waterBonus: 18,
    commsStart: 74,
    radStart: 15,
    dustRate: 4,
    scienceBonus: 8,
    terrainTintHex: 0xdbeafe,
  },
  {
    id: 'tranquility',
    nameKey: 'site.tranquility.name',
    regionKey: 'site.tranquility.region',
    descKey: 'site.tranquility.desc',
    sunlightPct: 96,
    tempRange: '-130°C a +120°C',
    icePotentialKey: 'site.ice.low',
    earthLinkPct: 96,
    solarMult: 1.18,
    waterBonus: -10,
    commsStart: 96,
    radStart: 24,
    dustRate: 6,
    scienceBonus: 4,
    terrainTintHex: 0xe7e5e4,
  },
  {
    id: 'aristarchus',
    nameKey: 'site.aristarchus.name',
    regionKey: 'site.aristarchus.region',
    descKey: 'site.aristarchus.desc',
    sunlightPct: 88,
    tempRange: '-140°C a +95°C',
    icePotentialKey: 'site.ice.medium',
    earthLinkPct: 90,
    solarMult: 1.05,
    waterBonus: 0,
    commsStart: 90,
    radStart: 22,
    dustRate: 9,
    scienceBonus: 12,
    terrainTintHex: 0xfef3c7,
  },
];

export interface CommanderRoleOption {
  id: CommanderRole;
  nameKey: string;
  bonusKey: string;
}

export const COMMANDER_ROLES: CommanderRoleOption[] = [
  { id: 'engineer', nameKey: 'role.engineer.name', bonusKey: 'role.engineer.bonus' },
  { id: 'botanist', nameKey: 'role.botanist.name', bonusKey: 'role.botanist.bonus' },
  { id: 'geologist', nameKey: 'role.geologist.name', bonusKey: 'role.geologist.bonus' },
  { id: 'medic', nameKey: 'role.medic.name', bonusKey: 'role.medic.bonus' },
];

export interface MissionPriorityOption {
  id: MissionPriority;
  nameKey: string;
  descKey: string;
}

export const MISSION_PRIORITIES: MissionPriorityOption[] = [
  { id: 'survival', nameKey: 'prio.survival.name', descKey: 'prio.survival.desc' },
  { id: 'science', nameKey: 'prio.science.name', descKey: 'prio.science.desc' },
  { id: 'exploration', nameKey: 'prio.exploration.name', descKey: 'prio.exploration.desc' },
];

export interface EquipmentOption {
  id: EquipmentId;
  nameKey: string;
  descKey: string;
  effectBadgeKey: string;
}

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  {
    id: 'extra_battery',
    nameKey: 'equip.extra_battery.name',
    descKey: 'equip.extra_battery.desc',
    effectBadgeKey: 'equip.extra_battery.badge',
  },
  {
    id: 'hydro_kit',
    nameKey: 'equip.hydro_kit.name',
    descKey: 'equip.hydro_kit.desc',
    effectBadgeKey: 'equip.hydro_kit.badge',
  },
  {
    id: 'shield_blanket',
    nameKey: 'equip.shield_blanket.name',
    descKey: 'equip.shield_blanket.desc',
    effectBadgeKey: 'equip.shield_blanket.badge',
  },
  {
    id: 'water_filter',
    nameKey: 'equip.water_filter.name',
    descKey: 'equip.water_filter.desc',
    effectBadgeKey: 'equip.water_filter.badge',
  },
  {
    id: 'core_drill',
    nameKey: 'equip.core_drill.name',
    descKey: 'equip.core_drill.desc',
    effectBadgeKey: 'equip.core_drill.badge',
  },
  {
    id: 'dust_repeller',
    nameKey: 'equip.dust_repeller.name',
    descKey: 'equip.dust_repeller.desc',
    effectBadgeKey: 'equip.dust_repeller.badge',
  },
];

export interface BuildingDefinition {
  id: BuildingId;
  nameKey: string;
  roleKey: string;
  scienceTipKey: string;
  powerDraw: number;
  actionLabelKey: string;
  actionCostEnergy: number;
  upgradeCostEnergy: number;
  colorHex: string;
}

export const BUILDING_DEFINITIONS: Record<BuildingId, BuildingDefinition> = {
  habitat: {
    id: 'habitat',
    nameKey: 'bld.habitat.name',
    roleKey: 'bld.habitat.role',
    scienceTipKey: 'sci.lunar_environment',
    powerDraw: 14,
    actionLabelKey: 'bld.habitat.action',
    actionCostEnergy: 6,
    upgradeCostEnergy: 18,
    colorHex: '#38bdf8',
  },
  solar: {
    id: 'solar',
    nameKey: 'bld.solar.name',
    roleKey: 'bld.solar.role',
    scienceTipKey: 'sci.solar_power',
    powerDraw: 0,
    actionLabelKey: 'bld.solar.action',
    actionCostEnergy: 4,
    upgradeCostEnergy: 16,
    colorHex: '#facc15',
  },
  greenhouse: {
    id: 'greenhouse',
    nameKey: 'bld.greenhouse.name',
    roleKey: 'bld.greenhouse.role',
    scienceTipKey: 'sci.greenhouse_energy',
    powerDraw: 12,
    actionLabelKey: 'bld.greenhouse.action',
    actionCostEnergy: 8,
    upgradeCostEnergy: 18,
    colorHex: '#4ade80',
  },
  water: {
    id: 'water',
    nameKey: 'bld.water.name',
    roleKey: 'bld.water.role',
    scienceTipKey: 'sci.water_recycling',
    powerDraw: 10,
    actionLabelKey: 'bld.water.action',
    actionCostEnergy: 6,
    upgradeCostEnergy: 16,
    colorHex: '#22d3ee',
  },
  oxygen: {
    id: 'oxygen',
    nameKey: 'bld.oxygen.name',
    roleKey: 'bld.oxygen.role',
    scienceTipKey: 'sci.oxygen_production',
    powerDraw: 11,
    actionLabelKey: 'bld.oxygen.action',
    actionCostEnergy: 7,
    upgradeCostEnergy: 16,
    colorHex: '#60a5fa',
  },
  comms: {
    id: 'comms',
    nameKey: 'bld.comms.name',
    roleKey: 'bld.comms.role',
    scienceTipKey: 'sci.comms_delay',
    powerDraw: 6,
    actionLabelKey: 'bld.comms.action',
    actionCostEnergy: 5,
    upgradeCostEnergy: 14,
    colorHex: '#a78bfa',
  },
  shelter: {
    id: 'shelter',
    nameKey: 'bld.shelter.name',
    roleKey: 'bld.shelter.role',
    scienceTipKey: 'sci.radiation_shielding',
    powerDraw: 5,
    actionLabelKey: 'bld.shelter.action',
    actionCostEnergy: 4,
    upgradeCostEnergy: 15,
    colorHex: '#f59e0b',
  },
  rover: {
    id: 'rover',
    nameKey: 'bld.rover.name',
    roleKey: 'bld.rover.role',
    scienceTipKey: 'sci.rover_exploration',
    powerDraw: 4,
    actionLabelKey: 'bld.rover.action',
    actionCostEnergy: 8,
    upgradeCostEnergy: 16,
    colorHex: '#fb923c',
  },
  research: {
    id: 'research',
    nameKey: 'bld.research.name',
    roleKey: 'bld.research.role',
    scienceTipKey: 'sci.lunar_science',
    powerDraw: 8,
    actionLabelKey: 'bld.research.action',
    actionCostEnergy: 9,
    upgradeCostEnergy: 18,
    colorHex: '#c084fc',
  },
};

export const BUILDING_ORDER: BuildingId[] = [
  'habitat',
  'solar',
  'greenhouse',
  'water',
  'oxygen',
  'comms',
  'shelter',
  'rover',
  'research',
];

// Notice: recommended answers vary intentionally across A, B, and C,
// AND pickDailyEvent shuffles choices deterministically per mission day.
export const DYNAMIC_EVENTS: GameEvent[] = [
  {
    id: 'ev_solar_alert',
    category: 'solar',
    severity: 'critical',
    titleKey: 'ev.solar.title',
    descriptionKey: 'ev.solar.desc',
    scienceExplanationKey: 'sci.radiation_shielding',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.solar.cC.label',
        costSummaryKey: 'ev.solar.cC.cost',
        benefitSummaryKey: 'ev.solar.cC.benefit',
        effects: { radiationRisk: 22, crewHealth: -14, researchPoints: 10 },
        outcomeKey: 'ev.solar.cC.outcome',
      },
      {
        id: 'B',
        labelKey: 'ev.solar.cA.label',
        costSummaryKey: 'ev.solar.cA.cost',
        benefitSummaryKey: 'ev.solar.cA.benefit',
        effects: { energy: -8, radiationRisk: -22, crewHealth: 4, shelterCrew: true },
        outcomeKey: 'ev.solar.cA.outcome',
        isRecommended: true,
      },
      {
        id: 'C',
        labelKey: 'ev.solar.cB.label',
        costSummaryKey: 'ev.solar.cB.cost',
        benefitSummaryKey: 'ev.solar.cB.benefit',
        effects: { energy: -4, radiationRisk: -10, researchPoints: 6 },
        outcomeKey: 'ev.solar.cB.outcome',
      },
    ],
  },
  {
    id: 'ev_lunar_dust',
    category: 'dust',
    severity: 'warning',
    titleKey: 'ev.dust.title',
    descriptionKey: 'ev.dust.desc',
    scienceExplanationKey: 'sci.solar_power',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.dust.cB.label',
        costSummaryKey: 'ev.dust.cB.cost',
        benefitSummaryKey: 'ev.dust.cB.benefit',
        effects: { energy: -10, solarEfficiencyDelta: 0.14 },
        outcomeKey: 'ev.dust.cB.outcome',
      },
      {
        id: 'B',
        labelKey: 'ev.dust.cC.label',
        costSummaryKey: 'ev.dust.cC.cost',
        benefitSummaryKey: 'ev.dust.cC.benefit',
        effects: { solarEfficiencyDelta: -0.22 },
        outcomeKey: 'ev.dust.cC.outcome',
      },
      {
        id: 'C',
        labelKey: 'ev.dust.cA.label',
        costSummaryKey: 'ev.dust.cA.cost',
        benefitSummaryKey: 'ev.dust.cA.benefit',
        effects: { energy: -6, oxygen: -4, solarEfficiencyDelta: 0.25, radiationRisk: 4 },
        outcomeKey: 'ev.dust.cA.outcome',
        isRecommended: true,
      },
    ],
  },
  {
    id: 'ev_water_valve',
    category: 'water',
    severity: 'critical',
    titleKey: 'ev.water.title',
    descriptionKey: 'ev.water.desc',
    scienceExplanationKey: 'sci.water_recycling',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.water.cA.label',
        costSummaryKey: 'ev.water.cA.cost',
        benefitSummaryKey: 'ev.water.cA.benefit',
        effects: { energy: -10, water: 6, waterEfficiencyDelta: 0.2 },
        outcomeKey: 'ev.water.cA.outcome',
        isRecommended: true,
      },
      {
        id: 'B',
        labelKey: 'ev.water.cB.label',
        costSummaryKey: 'ev.water.cB.cost',
        benefitSummaryKey: 'ev.water.cB.benefit',
        effects: { water: -8, energy: -3, waterEfficiencyDelta: 0.05 },
        outcomeKey: 'ev.water.cB.outcome',
      },
      {
        id: 'C',
        labelKey: 'ev.water.cC.label',
        costSummaryKey: 'ev.water.cC.cost',
        benefitSummaryKey: 'ev.water.cC.benefit',
        effects: { water: -16, waterEfficiencyDelta: -0.22 },
        outcomeKey: 'ev.water.cC.outcome',
      },
    ],
  },
  {
    id: 'ev_greenhouse_temp',
    category: 'greenhouse',
    severity: 'warning',
    titleKey: 'ev.greenhouse.title',
    descriptionKey: 'ev.greenhouse.desc',
    scienceExplanationKey: 'sci.greenhouse_energy',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.greenhouse.cC.label',
        costSummaryKey: 'ev.greenhouse.cC.cost',
        benefitSummaryKey: 'ev.greenhouse.cC.benefit',
        effects: { food: -11, greenhouseEfficiencyDelta: -0.2 },
        outcomeKey: 'ev.greenhouse.cC.outcome',
      },
      {
        id: 'B',
        labelKey: 'ev.greenhouse.cA.label',
        costSummaryKey: 'ev.greenhouse.cA.cost',
        benefitSummaryKey: 'ev.greenhouse.cA.benefit',
        effects: { energy: -9, water: -4, food: 8, greenhouseEfficiencyDelta: 0.2 },
        outcomeKey: 'ev.greenhouse.cA.outcome',
        isRecommended: true,
      },
      {
        id: 'C',
        labelKey: 'ev.greenhouse.cB.label',
        costSummaryKey: 'ev.greenhouse.cB.cost',
        benefitSummaryKey: 'ev.greenhouse.cB.benefit',
        effects: { energy: -4, food: 2 },
        outcomeKey: 'ev.greenhouse.cB.outcome',
      },
    ],
  },
  {
    id: 'ev_comms_blackout',
    category: 'comms',
    severity: 'warning',
    titleKey: 'ev.comms.title',
    descriptionKey: 'ev.comms.desc',
    scienceExplanationKey: 'sci.comms_delay',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.comms.cB.label',
        costSummaryKey: 'ev.comms.cB.cost',
        benefitSummaryKey: 'ev.comms.cB.benefit',
        effects: { energy: -3, commsQuality: 8, researchPoints: 5 },
        outcomeKey: 'ev.comms.cB.outcome',
      },
      {
        id: 'B',
        labelKey: 'ev.comms.cC.label',
        costSummaryKey: 'ev.comms.cC.cost',
        benefitSummaryKey: 'ev.comms.cC.benefit',
        effects: { commsQuality: -22, commsEfficiencyDelta: -0.16 },
        outcomeKey: 'ev.comms.cC.outcome',
      },
      {
        id: 'C',
        labelKey: 'ev.comms.cA.label',
        costSummaryKey: 'ev.comms.cA.cost',
        benefitSummaryKey: 'ev.comms.cA.benefit',
        effects: { energy: -8, commsQuality: 22, commsEfficiencyDelta: 0.15 },
        outcomeKey: 'ev.comms.cA.outcome',
        isRecommended: true,
      },
    ],
  },
  {
    id: 'ev_rover_wheel',
    category: 'rover',
    severity: 'warning',
    titleKey: 'ev.rover.title',
    descriptionKey: 'ev.rover.desc',
    scienceExplanationKey: 'sci.rover_exploration',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.rover.cA.label',
        costSummaryKey: 'ev.rover.cA.cost',
        benefitSummaryKey: 'ev.rover.cA.benefit',
        effects: { energy: -7, oxygen: -3, roverEfficiencyDelta: 0.2, researchPoints: 14, environmentalDataSamples: 1 },
        outcomeKey: 'ev.rover.cA.outcome',
        isRecommended: true,
      },
      {
        id: 'B',
        labelKey: 'ev.rover.cB.label',
        costSummaryKey: 'ev.rover.cB.cost',
        benefitSummaryKey: 'ev.rover.cB.benefit',
        effects: { energy: -2, researchPoints: 6 },
        outcomeKey: 'ev.rover.cB.outcome',
      },
      {
        id: 'C',
        labelKey: 'ev.rover.cC.label',
        costSummaryKey: 'ev.rover.cC.cost',
        benefitSummaryKey: 'ev.rover.cC.benefit',
        effects: { roverEfficiencyDelta: -0.25 },
        outcomeKey: 'ev.rover.cC.outcome',
      },
    ],
  },
  {
    id: 'ev_ice_discovery',
    category: 'science',
    severity: 'opportunity',
    titleKey: 'ev.discovery.title',
    descriptionKey: 'ev.discovery.desc',
    scienceExplanationKey: 'sci.lunar_science',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.discovery.cC.label',
        costSummaryKey: 'ev.discovery.cC.cost',
        benefitSummaryKey: 'ev.discovery.cC.benefit',
        effects: { energy: 5 },
        outcomeKey: 'ev.discovery.cC.outcome',
      },
      {
        id: 'B',
        labelKey: 'ev.discovery.cA.label',
        costSummaryKey: 'ev.discovery.cA.cost',
        benefitSummaryKey: 'ev.discovery.cA.benefit',
        effects: { energy: -9, water: 16, researchPoints: 22, environmentalDataSamples: 1 },
        outcomeKey: 'ev.discovery.cA.outcome',
        isRecommended: true,
      },
      {
        id: 'C',
        labelKey: 'ev.discovery.cB.label',
        costSummaryKey: 'ev.discovery.cB.cost',
        benefitSummaryKey: 'ev.discovery.cB.benefit',
        effects: { energy: -4, researchPoints: 12 },
        outcomeKey: 'ev.discovery.cB.outcome',
      },
    ],
  },
  {
    id: 'ev_battery_cell',
    category: 'battery',
    severity: 'warning',
    titleKey: 'ev.battery.title',
    descriptionKey: 'ev.battery.desc',
    scienceExplanationKey: 'sci.lunar_environment',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.battery.cB.label',
        costSummaryKey: 'ev.battery.cB.cost',
        benefitSummaryKey: 'ev.battery.cB.benefit',
        effects: { energy: -5, crewHealth: 3 },
        outcomeKey: 'ev.battery.cB.outcome',
      },
      {
        id: 'B',
        labelKey: 'ev.battery.cC.label',
        costSummaryKey: 'ev.battery.cC.cost',
        benefitSummaryKey: 'ev.battery.cC.benefit',
        effects: { energy: -16, crewHealth: -6 },
        outcomeKey: 'ev.battery.cC.outcome',
      },
      {
        id: 'C',
        labelKey: 'ev.battery.cA.label',
        costSummaryKey: 'ev.battery.cA.cost',
        benefitSummaryKey: 'ev.battery.cA.benefit',
        effects: { energy: 14, researchPoints: 6, solarEfficiencyDelta: 0.1 },
        outcomeKey: 'ev.battery.cA.outcome',
        isRecommended: true,
      },
    ],
  },
  {
    id: 'ev_oxygen_scrubber',
    category: 'oxygen',
    severity: 'critical',
    titleKey: 'ev.o2.title',
    descriptionKey: 'ev.o2.desc',
    scienceExplanationKey: 'sci.oxygen_production',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.o2.cB.label',
        costSummaryKey: 'ev.o2.cB.cost',
        benefitSummaryKey: 'ev.o2.cB.benefit',
        effects: { energy: -4, oxygen: -6 },
        outcomeKey: 'ev.o2.cB.outcome',
      },
      {
        id: 'B',
        labelKey: 'ev.o2.cA.label',
        costSummaryKey: 'ev.o2.cA.cost',
        benefitSummaryKey: 'ev.o2.cA.benefit',
        effects: { energy: -9, water: -4, oxygen: 12, oxygenEfficiencyDelta: 0.15 },
        outcomeKey: 'ev.o2.cA.outcome',
        isRecommended: true,
      },
      {
        id: 'C',
        labelKey: 'ev.o2.cC.label',
        costSummaryKey: 'ev.o2.cC.cost',
        benefitSummaryKey: 'ev.o2.cC.benefit',
        effects: { oxygen: -15, oxygenEfficiencyDelta: -0.2, crewHealth: -8 },
        outcomeKey: 'ev.o2.cC.outcome',
      },
    ],
  },
  {
    id: 'ev_micrometeoroid',
    category: 'micrometeoroid',
    severity: 'critical',
    titleKey: 'ev.micro.title',
    descriptionKey: 'ev.micro.desc',
    scienceExplanationKey: 'sci.lunar_environment',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.micro.cC.label',
        costSummaryKey: 'ev.micro.cC.cost',
        benefitSummaryKey: 'ev.micro.cC.benefit',
        effects: { oxygen: -12, crewHealth: -10, energy: -6 },
        outcomeKey: 'ev.micro.cC.outcome',
      },
      {
        id: 'B',
        labelKey: 'ev.micro.cB.label',
        costSummaryKey: 'ev.micro.cB.cost',
        benefitSummaryKey: 'ev.micro.cB.benefit',
        effects: { energy: -5, oxygen: -4, researchPoints: 5 },
        outcomeKey: 'ev.micro.cB.outcome',
      },
      {
        id: 'C',
        labelKey: 'ev.micro.cA.label',
        costSummaryKey: 'ev.micro.cA.cost',
        benefitSummaryKey: 'ev.micro.cA.benefit',
        effects: { energy: -11, oxygen: 4, crewHealth: 3, researchPoints: 10 },
        outcomeKey: 'ev.micro.cA.outcome',
        isRecommended: true,
      },
    ],
  },
  {
    id: 'ev_polar_shadow',
    category: 'thermal',
    severity: 'warning',
    titleKey: 'ev.shadow.title',
    descriptionKey: 'ev.shadow.desc',
    scienceExplanationKey: 'sci.solar_power',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.shadow.cA.label',
        costSummaryKey: 'ev.shadow.cA.cost',
        benefitSummaryKey: 'ev.shadow.cA.benefit',
        effects: { energy: -7, crewHealth: 4, greenhouseEfficiencyDelta: 0.1 },
        outcomeKey: 'ev.shadow.cA.outcome',
        isRecommended: true,
      },
      {
        id: 'B',
        labelKey: 'ev.shadow.cB.label',
        costSummaryKey: 'ev.shadow.cB.cost',
        benefitSummaryKey: 'ev.shadow.cB.benefit',
        effects: { energy: 8, crewHealth: -6, food: -5 },
        outcomeKey: 'ev.shadow.cB.outcome',
      },
      {
        id: 'C',
        labelKey: 'ev.shadow.cC.label',
        costSummaryKey: 'ev.shadow.cC.cost',
        benefitSummaryKey: 'ev.shadow.cC.benefit',
        effects: { energy: -14, water: -4 },
        outcomeKey: 'ev.shadow.cC.outcome',
      },
    ],
  },
  {
    id: 'ev_crew_fitness',
    category: 'medical',
    severity: 'warning',
    titleKey: 'ev.med.title',
    descriptionKey: 'ev.med.desc',
    scienceExplanationKey: 'sci.osdr_biology',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.med.cB.label',
        costSummaryKey: 'ev.med.cB.cost',
        benefitSummaryKey: 'ev.med.cB.benefit',
        effects: { food: -4, crewHealth: 4 },
        outcomeKey: 'ev.med.cB.outcome',
      },
      {
        id: 'B',
        labelKey: 'ev.med.cA.label',
        costSummaryKey: 'ev.med.cA.cost',
        benefitSummaryKey: 'ev.med.cA.benefit',
        effects: { energy: -5, water: -3, crewHealth: 10, researchPoints: 9 },
        outcomeKey: 'ev.med.cA.outcome',
        isRecommended: true,
      },
      {
        id: 'C',
        labelKey: 'ev.med.cC.label',
        costSummaryKey: 'ev.med.cC.cost',
        benefitSummaryKey: 'ev.med.cC.benefit',
        effects: { crewHealth: -11, researchPoints: 8 },
        outcomeKey: 'ev.med.cC.outcome',
      },
    ],
  },
  {
    id: 'ev_lava_tube',
    category: 'science',
    severity: 'opportunity',
    titleKey: 'ev.lava.title',
    descriptionKey: 'ev.lava.desc',
    scienceExplanationKey: 'sci.radiation_shielding',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.lava.cC.label',
        costSummaryKey: 'ev.lava.cC.cost',
        benefitSummaryKey: 'ev.lava.cC.benefit',
        effects: { energy: 4 },
        outcomeKey: 'ev.lava.cC.outcome',
      },
      {
        id: 'B',
        labelKey: 'ev.lava.cB.label',
        costSummaryKey: 'ev.lava.cB.cost',
        benefitSummaryKey: 'ev.lava.cB.benefit',
        effects: { energy: -4, researchPoints: 10 },
        outcomeKey: 'ev.lava.cB.outcome',
      },
      {
        id: 'C',
        labelKey: 'ev.lava.cA.label',
        costSummaryKey: 'ev.lava.cA.cost',
        benefitSummaryKey: 'ev.lava.cA.benefit',
        effects: { energy: -8, radiationRisk: -14, researchPoints: 20, environmentalDataSamples: 1 },
        outcomeKey: 'ev.lava.cA.outcome',
        isRecommended: true,
      },
    ],
  },
  {
    id: 'ev_hydro_algae',
    category: 'greenhouse',
    severity: 'opportunity',
    titleKey: 'ev.algae.title',
    descriptionKey: 'ev.algae.desc',
    scienceExplanationKey: 'sci.greenhouse_energy',
    choices: [
      {
        id: 'A',
        labelKey: 'ev.algae.cA.label',
        costSummaryKey: 'ev.algae.cA.cost',
        benefitSummaryKey: 'ev.algae.cA.benefit',
        effects: { energy: -6, water: -5, food: 12, oxygen: 8, researchPoints: 10 },
        outcomeKey: 'ev.algae.cA.outcome',
        isRecommended: true,
      },
      {
        id: 'B',
        labelKey: 'ev.algae.cB.label',
        costSummaryKey: 'ev.algae.cB.cost',
        benefitSummaryKey: 'ev.algae.cB.benefit',
        effects: { energy: -3, food: 5 },
        outcomeKey: 'ev.algae.cB.outcome',
      },
      {
        id: 'C',
        labelKey: 'ev.algae.cC.label',
        costSummaryKey: 'ev.algae.cC.cost',
        benefitSummaryKey: 'ev.algae.cC.benefit',
        effects: { water: 4 },
        outcomeKey: 'ev.algae.cC.outcome',
      },
    ],
  },
];

export interface AcademyQuestion {
  id: string;
  questionKey: string;
  optionsKeys: [string, string, string];
  correctIndex: number;
}

export interface AcademyLesson {
  id: string;
  titleKey: string;
  summaryKey: string;
  detailKey: string;
  iconName: 'shield' | 'droplet' | 'sprout' | 'sun' | 'radio' | 'moon' | 'battery' | 'compass';
  questions: AcademyQuestion[];
}

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: 'radiation',
    titleKey: 'acad.rad.title',
    summaryKey: 'acad.rad.summary',
    detailKey: 'acad.rad.detail',
    iconName: 'shield',
    questions: [
      {
        id: 'rad_q1',
        questionKey: 'acad.rad.q',
        optionsKeys: ['acad.rad.o1', 'acad.rad.o2', 'acad.rad.o3'],
        correctIndex: 1,
      },
      {
        id: 'rad_q2',
        questionKey: 'acad.rad.q2',
        optionsKeys: ['acad.rad.q2.o1', 'acad.rad.q2.o2', 'acad.rad.q2.o3'],
        correctIndex: 0,
      },
      {
        id: 'rad_q3',
        questionKey: 'acad.rad.q3',
        optionsKeys: ['acad.rad.q3.o1', 'acad.rad.q3.o2', 'acad.rad.q3.o3'],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'water',
    titleKey: 'acad.water.title',
    summaryKey: 'acad.water.summary',
    detailKey: 'acad.water.detail',
    iconName: 'droplet',
    questions: [
      {
        id: 'water_q1',
        questionKey: 'acad.water.q',
        optionsKeys: ['acad.water.o1', 'acad.water.o2', 'acad.water.o3'],
        correctIndex: 0,
      },
      {
        id: 'water_q2',
        questionKey: 'acad.water.q2',
        optionsKeys: ['acad.water.q2.o1', 'acad.water.q2.o2', 'acad.water.q2.o3'],
        correctIndex: 2,
      },
      {
        id: 'water_q3',
        questionKey: 'acad.water.q3',
        optionsKeys: ['acad.water.q3.o1', 'acad.water.q3.o2', 'acad.water.q3.o3'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'greenhouse',
    titleKey: 'acad.green.title',
    summaryKey: 'acad.green.summary',
    detailKey: 'acad.green.detail',
    iconName: 'sprout',
    questions: [
      {
        id: 'green_q1',
        questionKey: 'acad.green.q',
        optionsKeys: ['acad.green.o1', 'acad.green.o2', 'acad.green.o3'],
        correctIndex: 2,
      },
      {
        id: 'green_q2',
        questionKey: 'acad.green.q2',
        optionsKeys: ['acad.green.q2.o1', 'acad.green.q2.o2', 'acad.green.q2.o3'],
        correctIndex: 0,
      },
      {
        id: 'green_q3',
        questionKey: 'acad.green.q3',
        optionsKeys: ['acad.green.q3.o1', 'acad.green.q3.o2', 'acad.green.q3.o3'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'solar',
    titleKey: 'acad.solar.title',
    summaryKey: 'acad.solar.summary',
    detailKey: 'acad.solar.detail',
    iconName: 'sun',
    questions: [
      {
        id: 'solar_q1',
        questionKey: 'acad.solar.q',
        optionsKeys: ['acad.solar.o1', 'acad.solar.o2', 'acad.solar.o3'],
        correctIndex: 1,
      },
      {
        id: 'solar_q2',
        questionKey: 'acad.solar.q2',
        optionsKeys: ['acad.solar.q2.o1', 'acad.solar.q2.o2', 'acad.solar.q2.o3'],
        correctIndex: 2,
      },
      {
        id: 'solar_q3',
        questionKey: 'acad.solar.q3',
        optionsKeys: ['acad.solar.q3.o1', 'acad.solar.q3.o2', 'acad.solar.q3.o3'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'comms',
    titleKey: 'acad.comms.title',
    summaryKey: 'acad.comms.summary',
    detailKey: 'acad.comms.detail',
    iconName: 'radio',
    questions: [
      {
        id: 'comms_q1',
        questionKey: 'acad.comms.q',
        optionsKeys: ['acad.comms.o1', 'acad.comms.o2', 'acad.comms.o3'],
        correctIndex: 0,
      },
      {
        id: 'comms_q2',
        questionKey: 'acad.comms.q2',
        optionsKeys: ['acad.comms.q2.o1', 'acad.comms.q2.o2', 'acad.comms.q2.o3'],
        correctIndex: 1,
      },
      {
        id: 'comms_q3',
        questionKey: 'acad.comms.q3',
        optionsKeys: ['acad.comms.q3.o1', 'acad.comms.q3.o2', 'acad.comms.q3.o3'],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'lunar',
    titleKey: 'acad.lunar.title',
    summaryKey: 'acad.lunar.summary',
    detailKey: 'acad.lunar.detail',
    iconName: 'moon',
    questions: [
      {
        id: 'lunar_q1',
        questionKey: 'acad.lunar.q',
        optionsKeys: ['acad.lunar.o1', 'acad.lunar.o2', 'acad.lunar.o3'],
        correctIndex: 2,
      },
      {
        id: 'lunar_q2',
        questionKey: 'acad.lunar.q2',
        optionsKeys: ['acad.lunar.q2.o1', 'acad.lunar.q2.o2', 'acad.lunar.q2.o3'],
        correctIndex: 1,
      },
      {
        id: 'lunar_q3',
        questionKey: 'acad.lunar.q3',
        optionsKeys: ['acad.lunar.q3.o1', 'acad.lunar.q3.o2', 'acad.lunar.q3.o3'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'batteries',
    titleKey: 'acad.bat.title',
    summaryKey: 'acad.bat.summary',
    detailKey: 'acad.bat.detail',
    iconName: 'battery',
    questions: [
      {
        id: 'bat_q1',
        questionKey: 'acad.bat.q1',
        optionsKeys: ['acad.bat.q1.o1', 'acad.bat.q1.o2', 'acad.bat.q1.o3'],
        correctIndex: 1,
      },
      {
        id: 'bat_q2',
        questionKey: 'acad.bat.q2',
        optionsKeys: ['acad.bat.q2.o1', 'acad.bat.q2.o2', 'acad.bat.q2.o3'],
        correctIndex: 0,
      },
      {
        id: 'bat_q3',
        questionKey: 'acad.bat.q3',
        optionsKeys: ['acad.bat.q3.o1', 'acad.bat.q3.o2', 'acad.bat.q3.o3'],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'geology',
    titleKey: 'acad.geo.title',
    summaryKey: 'acad.geo.summary',
    detailKey: 'acad.geo.detail',
    iconName: 'compass',
    questions: [
      {
        id: 'geo_q1',
        questionKey: 'acad.geo.q1',
        optionsKeys: ['acad.geo.q1.o1', 'acad.geo.q1.o2', 'acad.geo.q1.o3'],
        correctIndex: 2,
      },
      {
        id: 'geo_q2',
        questionKey: 'acad.geo.q2',
        optionsKeys: ['acad.geo.q2.o1', 'acad.geo.q2.o2', 'acad.geo.q2.o3'],
        correctIndex: 1,
      },
      {
        id: 'geo_q3',
        questionKey: 'acad.geo.q3',
        optionsKeys: ['acad.geo.q3.o1', 'acad.geo.q3.o2', 'acad.geo.q3.o3'],
        correctIndex: 0,
      },
    ],
  },
];

export interface BadgeDefinition {
  id: BadgeId;
  titleKey: string;
  descKey: string;
  accentHex: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'solar_guardian', titleKey: 'badge.solar_guardian.title', descKey: 'badge.solar_guardian.desc', accentHex: '#facc15' },
  { id: 'ice_hunter', titleKey: 'badge.ice_hunter.title', descKey: 'badge.ice_hunter.desc', accentHex: '#22d3ee' },
  { id: 'moon_scientist', titleKey: 'badge.moon_scientist.title', descKey: 'badge.moon_scientist.desc', accentHex: '#c084fc' },
  { id: 'safe_shield', titleKey: 'badge.safe_shield.title', descKey: 'badge.safe_shield.desc', accentHex: '#f59e0b' },
  { id: 'nasa_explorer', titleKey: 'badge.nasa_explorer.title', descKey: 'badge.nasa_explorer.desc', accentHex: '#38bdf8' },
  { id: 'minigame_pro', titleKey: 'badge.minigame_pro.title', descKey: 'badge.minigame_pro.desc', accentHex: '#4ade80' },
  { id: 'academy_star', titleKey: 'badge.academy_star.title', descKey: 'badge.academy_star.desc', accentHex: '#34d399' },
  { id: 'lunar_survivor', titleKey: 'badge.lunar_survivor.title', descKey: 'badge.lunar_survivor.desc', accentHex: '#fb7185' },
];

export interface CrewCharacter {
  id: 'sofia' | 'mateo' | 'leo' | 'luna';
  nameKey: string;
  roleKey: string;
  suitColor: string;
  visorColor: string;
}

export const CREW_CHARACTERS: CrewCharacter[] = [
  { id: 'sofia', nameKey: 'crew.sofia.name', roleKey: 'crew.sofia.role', suitColor: '#38bdf8', visorColor: '#fbbf24' },
  { id: 'mateo', nameKey: 'crew.mateo.name', roleKey: 'crew.mateo.role', suitColor: '#facc15', visorColor: '#38bdf8' },
  { id: 'leo', nameKey: 'crew.leo.name', roleKey: 'crew.leo.role', suitColor: '#4ade80', visorColor: '#bae6fd' },
  { id: 'luna', nameKey: 'crew.luna.name', roleKey: 'crew.luna.role', suitColor: '#c084fc', visorColor: '#fde68a' },
];

export interface StoryChapter {
  day: number;
  speakerId: 'sofia' | 'mateo' | 'leo' | 'luna';
  titleKey: string;
  bodyKey: string;
}

export const STORY_CHAPTERS: StoryChapter[] = [
  { day: 1, speakerId: 'sofia', titleKey: 'story.d1.title', bodyKey: 'story.d1.body' },
  { day: 2, speakerId: 'leo', titleKey: 'story.d2.title', bodyKey: 'story.d2.body' },
  { day: 3, speakerId: 'mateo', titleKey: 'story.d3.title', bodyKey: 'story.d3.body' },
  { day: 4, speakerId: 'luna', titleKey: 'story.d4.title', bodyKey: 'story.d4.body' },
  { day: 5, speakerId: 'sofia', titleKey: 'story.d5.title', bodyKey: 'story.d5.body' },
  { day: 6, speakerId: 'mateo', titleKey: 'story.d6.title', bodyKey: 'story.d6.body' },
  { day: 7, speakerId: 'luna', titleKey: 'story.d7.title', bodyKey: 'story.d7.body' },
];

