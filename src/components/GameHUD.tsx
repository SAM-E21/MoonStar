import React, { useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Database,
  Droplet,
  FlaskConical,
  Heart,
  Home,
  Radio,
  Send,
  Shield,
  Sprout,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from 'lucide-react';
import { BUILDING_DEFINITIONS, BUILDING_ORDER } from '../data/missionData';
import { getContextualCrewLine, getResourceSeverity } from '../engine/simulation';
import { t } from '../i18n/translations';
import type { BuildingId, Language, MiniGameKind, MissionState } from '../types/game';
import { BuildingPanel } from './BuildingPanel';
import { CrewAvatar } from './CrewAvatar';
import { ResourceCharts } from './ResourceCharts';

interface GameHUDProps {
  lang: Language;
  state: MissionState;
  selectedBuilding: BuildingId | null;
  hoveredBuilding: BuildingId | null;
  onSelectBuilding: (id: BuildingId | null) => void;
  onBuildingAction: (id: BuildingId) => void;
  onBuildingUpgrade: (id: BuildingId) => void;
  onBuildingTogglePower: (id: BuildingId) => void;
  onOpenMiniGame: (kind: MiniGameKind) => void;
  onEndDay: () => void;
  onSendComms: (kind: 'status' | 'advice') => void;
  onOpenNasa: () => void;
  onOpenAcademy: () => void;
  onOpenCalculator: () => void;
  onOpenPassport: () => void;
  onOpenMenu: () => void;
  onResetCamera: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  lang,
  state,
  selectedBuilding,
  hoveredBuilding,
  onSelectBuilding,
  onBuildingAction,
  onBuildingUpgrade,
  onBuildingTogglePower,
  onOpenMiniGame,
  onEndDay,
  onSendComms,
  onOpenNasa,
  onOpenAcademy,
  onOpenCalculator,
  onOpenPassport,
  onOpenMenu,
  onResetCamera,
  muted,
  onToggleMute,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'objectives' | 'comms'>('overview');
  const crewMsg = getContextualCrewLine(state);

  const resourceItems = [
    {
      key: 'energy',
      label: t(lang, 'hud.energy'),
      metric: state.energy,
      icon: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
      barColor: '#facc15',
    },
    {
      key: 'oxygen',
      label: t(lang, 'hud.oxygen'),
      metric: state.oxygen,
      icon: <Wind className="w-3.5 h-3.5 text-sky-400" />,
      barColor: '#38bdf8',
    },
    {
      key: 'water',
      label: t(lang, 'hud.water'),
      metric: state.water,
      icon: <Droplet className="w-3.5 h-3.5 text-cyan-400" />,
      barColor: '#22d3ee',
    },
    {
      key: 'food',
      label: t(lang, 'hud.food'),
      metric: state.food,
      icon: <Sprout className="w-3.5 h-3.5 text-emerald-400" />,
      barColor: '#4ade80',
    },
  ];

  const radColor =
    state.radiationRisk >= 70
      ? 'text-red-300 border-red-500/60'
      : state.radiationRisk >= 45
        ? 'text-amber-300 border-amber-500/60'
        : 'text-emerald-300 border-slate-700';

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 md:p-4">
      {/* Top Perimeter Status Strip */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        {/* Left: Day & Resource Telemetry */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-[#060c1a]/92 border border-cyan-500/35 rounded-xl px-3 py-2 shadow-xl">
          <div className="pr-2.5 border-r border-slate-700">
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              {t(lang, `hud.phase.${state.phase}`)}
            </div>
            <div className="text-sm font-black text-white tabular-nums leading-tight">
              {t(lang, 'hud.day')} {state.day}/{state.config.duration}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {resourceItems.map((r) => {
              const sev = getResourceSeverity(r.metric);
              const border =
                sev === 'critical'
                  ? 'border-red-500/70 bg-red-950/40'
                  : sev === 'warning'
                    ? 'border-amber-500/60 bg-amber-950/30'
                    : 'border-slate-800 bg-[#0b1429]';
              const net = r.metric.production - r.metric.consumption;
              return (
                <div
                  key={r.key}
                  title={`${r.label}: ${Math.round(r.metric.current)}/${r.metric.max} (${net >= 0 ? '+' : ''}${net}/d)`}
                  className={`px-2.5 py-1 rounded-lg border ${border} min-w-[82px]`}
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-300 font-semibold">
                    <span className="flex items-center gap-1">
                      {r.icon}
                      {r.label}
                    </span>
                    <span className={`tabular-nums ${net >= 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {net >= 0 ? '+' : ''}
                      {net}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-extrabold text-white tabular-nums">
                      {Math.round(r.metric.current)}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((r.metric.current / r.metric.max) * 100))}%`,
                          backgroundColor: sev === 'critical' ? '#ef4444' : sev === 'warning' ? '#f59e0b' : r.barColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secondary Status: Crew, Rad, Comms, Science */}
          <div className="flex flex-wrap items-center gap-1.5 pl-1 border-l border-slate-700 text-xs">
            <div className="px-2 py-1 rounded-lg bg-[#0b1429] border border-slate-800 flex items-center gap-1 tabular-nums">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold text-white">{Math.round(state.crewHealth)}%</span>
            </div>
            <div className={`px-2 py-1 rounded-lg bg-[#0b1429] border flex items-center gap-1 tabular-nums ${radColor}`}>
              <Shield className="w-3.5 h-3.5" />
              <span className="font-bold">{Math.round(state.radiationRisk)}</span>
              {state.crewSheltered && (
                <span className="text-[10px] bg-amber-400 text-slate-950 px-1 rounded font-extrabold">
                  {t(lang, 'hud.sheltered')}
                </span>
              )}
            </div>
            <div className="px-2 py-1 rounded-lg bg-[#0b1429] border border-slate-800 flex items-center gap-1 tabular-nums">
              <Radio className="w-3.5 h-3.5 text-violet-400" />
              <span className="font-bold text-white">{Math.round(state.commsQuality)}%</span>
            </div>
            <div className="px-2 py-1 rounded-lg bg-[#0b1429] border border-slate-800 flex items-center gap-1 tabular-nums">
              <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold text-white">{state.researchPoints}</span>
            </div>
          </div>
        </div>

        {/* Right Utility Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#060c1a]/92 border border-slate-700/80 rounded-xl p-1.5 shadow-xl">
          <button
            type="button"
            onClick={onResetCamera}
            title={t(lang, 'hud.resetCam')}
            aria-label={t(lang, 'hud.resetCam')}
            className="px-2.5 py-1.5 rounded-lg bg-[#0b1429] hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">{t(lang, 'hud.resetCam')}</span>
          </button>
          <button
            type="button"
            onClick={onOpenNasa}
            className="px-2.5 py-1.5 rounded-lg bg-[#0b1429] hover:bg-slate-800 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t(lang, 'hud.viewNasa')}</span>
          </button>
          <button
            type="button"
            onClick={onOpenAcademy}
            className="px-2.5 py-1.5 rounded-lg bg-[#0b1429] hover:bg-slate-800 text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t(lang, 'hud.academy')}</span>
          </button>
          <button
            type="button"
            onClick={onOpenCalculator}
            className="px-2.5 py-1.5 rounded-lg bg-[#0b1429] hover:bg-slate-800 text-violet-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t(lang, 'hud.calculator')}</span>
          </button>
          <button
            type="button"
            onClick={onOpenPassport}
            className="px-2.5 py-1.5 rounded-lg bg-[#0b1429] hover:bg-slate-800 text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t(lang, 'hud.passport')}</span>
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? t(lang, 'hud.unmute') : t(lang, 'hud.mute')}
            className="p-1.5 rounded-lg bg-[#0b1429] hover:bg-slate-800 text-slate-200 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label={t(lang, 'hud.menu')}
            className="p-1.5 rounded-lg bg-[#0b1429] hover:bg-slate-800 text-slate-200 cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Crew Character Companion Speech Chip + Hover Tooltip */}
      <div className="flex flex-wrap items-start justify-between gap-2 my-auto pointer-events-none">
        <div
          className={`pointer-events-auto max-w-xs bg-[#060c1a]/92 border rounded-xl p-2.5 shadow-xl flex items-center gap-2.5 ${
            crewMsg.mood === 'critical'
              ? 'border-red-500/60'
              : crewMsg.mood === 'alert'
                ? 'border-amber-500/60'
                : 'border-cyan-500/35'
          }`}
        >
          <CrewAvatar
            suitColor={crewMsg.character.suitColor}
            visorColor={crewMsg.character.visorColor}
            size="sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
              <span>{t(lang, crewMsg.character.nameKey)}</span>
              {state.config.challengeCode && (
                <span className="text-[9px] font-mono text-slate-400">· {state.config.challengeCode}</span>
              )}
            </div>
            <p className="text-[11px] text-slate-100 leading-snug mt-0.5">{t(lang, crewMsg.lineKey)}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {hoveredBuilding && !selectedBuilding && (
            <div className="bg-[#060c1a]/92 border border-cyan-400/50 rounded-lg px-3 py-1.5 text-xs font-bold text-cyan-200 shadow-lg">
              {t(lang, BUILDING_DEFINITIONS[hoveredBuilding].nameKey)}
            </div>
          )}

          {selectedBuilding && (
            <BuildingPanel
              lang={lang}
              state={state}
              buildingId={selectedBuilding}
              onClose={() => onSelectBuilding(null)}
              onAction={onBuildingAction}
              onUpgrade={onBuildingUpgrade}
              onTogglePower={onBuildingTogglePower}
              onOpenMiniGame={onOpenMiniGame}
            />
          )}
        </div>
      </div>

      {/* Bottom Collapsible Command Dock */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="pointer-events-auto px-3 py-1 rounded-t-lg bg-[#060c1a]/95 border border-b-0 border-cyan-500/35 text-[11px] font-bold text-cyan-300 flex items-center gap-1 cursor-pointer"
        >
          {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {dockCollapsed ? t(lang, 'hud.showDock') : t(lang, 'hud.hideDock')}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto w-full max-w-4xl bg-[#060c1a]/94 border border-cyan-500/35 rounded-2xl p-3 shadow-2xl">
            {/* Dock Header Tabs + Actions Left + End Day CTA */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'overview' as const, label: t(lang, 'hud.tab.overview'), icon: <Activity className="w-3.5 h-3.5" /> },
                  { id: 'charts' as const, label: t(lang, 'hud.tab.charts'), icon: <BarChart3 className="w-3.5 h-3.5" /> },
                  { id: 'objectives' as const, label: t(lang, 'hud.tab.objectives'), icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                  { id: 'comms' as const, label: t(lang, 'hud.tab.comms'), icon: <Radio className="w-3.5 h-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      activeTab === tab.id
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-[#0c1528] text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-300 font-semibold tabular-nums">
                  {t(lang, 'hud.actionsLeft')}:{' '}
                  <span className="text-cyan-300 font-extrabold">
                    {state.maxActionsPerDay - state.actionsTakenToday}/{state.maxActionsPerDay}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onEndDay}
                  className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer transition-colors shadow"
                >
                  {t(lang, 'hud.endDay')}
                </button>
              </div>
            </div>

            {/* Dock Tab Body */}
            <div className="pt-2.5">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                  {BUILDING_ORDER.map((id) => {
                    const def = BUILDING_DEFINITIONS[id];
                    const b = state.buildings[id];
                    const active = selectedBuilding === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onSelectBuilding(active ? null : id)}
                        className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-cyan-950/80 border-cyan-400 text-white'
                            : 'bg-[#0b1429] hover:bg-slate-800 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: def.colorHex }} />
                          <span className="text-[10px] font-bold tabular-nums text-slate-400">
                            {Math.round(b.efficiency * 100)}%
                          </span>
                        </div>
                        <div className="text-[11px] font-bold leading-tight mt-1 text-center">
                          {t(lang, `bld.${id}.short`)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'charts' && <ResourceCharts history={state.history} lang={lang} />}

              {activeTab === 'objectives' && (
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {state.objectives.map((obj) => (
                    <div
                      key={obj.id}
                      className={`p-2 rounded-xl border text-xs ${
                        obj.completed
                          ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-100'
                          : 'bg-[#0b1429] border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-bold">
                        <span className="leading-tight">{t(lang, obj.titleKey)}</span>
                        {obj.target > 1 ? (
                          <span className="tabular-nums text-cyan-300 shrink-0">
                            {obj.progress}/{obj.target}
                          </span>
                        ) : (
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 ${
                              obj.completed ? 'text-emerald-400' : 'text-slate-600'
                            }`}
                          />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t(lang, obj.descriptionKey)}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'comms' && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0b1429] border border-slate-800 rounded-xl p-2.5">
                    <span className="text-[11px] text-cyan-200">{t(lang, 'comms.delayInfo')}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onSendComms('status')}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {t(lang, 'comms.sendStatus')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSendComms('advice')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5 text-violet-400" />
                        {t(lang, 'comms.requestAdvice')}
                      </button>
                    </div>
                  </div>

                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {[...state.commsLog].reverse().map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                          msg.sender === 'commander'
                            ? 'bg-cyan-950/35 border-cyan-500/30'
                            : 'bg-[#0b1429] border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white">
                            [D{msg.daySent}] {t(lang, msg.titleKey)}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {msg.delivered ? t(lang, msg.bodyKey) : t(lang, 'comms.pending')}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold tabular-nums text-cyan-300 shrink-0">
                          {msg.delivered
                            ? t(lang, 'comms.delivered')
                            : `${Math.ceil(msg.remainingDelay)}s`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
