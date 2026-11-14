import React from 'react';
import { ArrowUpCircle, Gamepad2, Lightbulb, Power, Sparkles, X, Zap } from 'lucide-react';
import { BUILDING_DEFINITIONS } from '../data/missionData';
import { t } from '../i18n/translations';
import type { BuildingId, Language, MiniGameKind, MissionState } from '../types/game';

interface BuildingPanelProps {
  lang: Language;
  state: MissionState;
  buildingId: BuildingId;
  onClose: () => void;
  onAction: (id: BuildingId) => void;
  onUpgrade: (id: BuildingId) => void;
  onTogglePower: (id: BuildingId) => void;
  onOpenMiniGame?: (kind: MiniGameKind) => void;
}

export const BuildingPanel: React.FC<BuildingPanelProps> = ({
  lang,
  state,
  buildingId,
  onClose,
  onAction,
  onUpgrade,
  onTogglePower,
  onOpenMiniGame,
}) => {
  const def = BUILDING_DEFINITIONS[buildingId];
  const b = state.buildings[buildingId];
  const canAct =
    state.phase === 'operations' &&
    state.actionsTakenToday < state.maxActionsPerDay &&
    state.energy.current >= def.actionCostEnergy;
  const canUpgrade =
    state.phase === 'operations' && !b.upgraded && state.energy.current >= def.upgradeCostEnergy;
  const canTogglePower = buildingId !== 'habitat' && buildingId !== 'solar';
  const miniGameKind: MiniGameKind | null =
    buildingId === 'solar'
      ? 'solar_dust'
      : buildingId === 'comms'
        ? 'comms_tune'
        : buildingId === 'rover'
          ? 'rover_ice'
          : null;

  return (
    <div className="pointer-events-auto w-80 md:w-96 bg-[#070e1e]/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl text-slate-100">
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: def.colorHex }} />
            <h3 className="text-base font-extrabold text-white">{t(lang, def.nameKey)}</h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">{t(lang, def.roleKey)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t(lang, 'bld.close')}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2.5 my-3">
        <div className="bg-[#0d162c] border border-slate-800 rounded-xl p-2.5">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">{t(lang, 'bld.efficiency')}</div>
          <div className="text-lg font-extrabold text-cyan-300 tabular-nums">
            {Math.round(b.efficiency * 100)}%
          </div>
        </div>
        <div className="bg-[#0d162c] border border-slate-800 rounded-xl p-2.5">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">
            {buildingId === 'solar' ? t(lang, 'bld.powerGen') : t(lang, 'bld.powerDraw')}
          </div>
          <div className="text-lg font-extrabold text-amber-300 tabular-nums flex items-center gap-1">
            <Zap className="w-4 h-4" />
            {buildingId === 'solar'
              ? `+${state.energy.production}`
              : b.powered
                ? `-${def.powerDraw}`
                : '0'}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!canAct}
          onClick={() => onAction(buildingId)}
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-colors ${
            canAct
              ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 cursor-pointer'
              : 'bg-slate-800/80 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center gap-1.5 text-left">
            <Sparkles className="w-4 h-4 shrink-0" />
            {t(lang, def.actionLabelKey)}
          </span>
          <span className="tabular-nums font-extrabold shrink-0">-{def.actionCostEnergy}⚡</span>
        </button>

        {miniGameKind && onOpenMiniGame && state.phase === 'operations' && (
          <button
            type="button"
            onClick={() => onOpenMiniGame(miniGameKind)}
            className="w-full py-2 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Gamepad2 className="w-4 h-4" />
            {t(lang, 'bld.playMiniGame')}
          </button>
        )}

        {state.phase === 'operations' && state.actionsTakenToday >= state.maxActionsPerDay && (
          <div className="text-[11px] text-amber-300 font-semibold text-center bg-amber-950/30 border border-amber-500/30 rounded-lg py-1 px-2">
            {t(lang, 'bld.noActions')}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!canUpgrade}
            onClick={() => onUpgrade(buildingId)}
            className={`py-2 px-2.5 rounded-xl font-semibold text-xs border flex items-center justify-center gap-1.5 transition-colors ${
              b.upgraded
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 cursor-default'
                : canUpgrade
                  ? 'bg-slate-800 hover:bg-slate-700 border-amber-400/40 text-amber-200 cursor-pointer'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            {b.upgraded ? t(lang, 'bld.upgraded') : `${t(lang, 'bld.upgrade')} (-${def.upgradeCostEnergy}⚡)`}
          </button>

          <button
            type="button"
            disabled={!canTogglePower}
            onClick={() => onTogglePower(buildingId)}
            className={`py-2 px-2.5 rounded-xl font-semibold text-xs border flex items-center justify-center gap-1.5 transition-colors ${
              !canTogglePower
                ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
                : b.powered
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 cursor-pointer'
                  : 'bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-900/50 cursor-pointer'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {b.powered ? t(lang, 'bld.powerToggle') : t(lang, 'bld.powerOff')}
          </button>
        </div>
      </div>

      {/* Educational Science Snippet */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-300 leading-relaxed">{t(lang, def.scienceTipKey)}</p>
      </div>
    </div>
  );
};
