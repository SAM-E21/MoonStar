import React, { useMemo, useState } from 'react';
import { CheckCircle2, Flame, ShieldAlert, Wind, Wrench, Zap } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { generateHabitatFaults, type HabitatToolId } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import type { MiniGameComponentProps } from './types';

const TOOLS: Array<{ id: HabitatToolId; labelKey: string; colorClass: string }> = [
  { id: 'sealant', labelKey: 'mg.hab.tool.sealant', colorClass: 'border-cyan-400 bg-cyan-950/60 text-cyan-200' },
  { id: 'heater', labelKey: 'mg.hab.tool.heater', colorClass: 'border-amber-400 bg-amber-950/60 text-amber-200' },
  { id: 'scrubber', labelKey: 'mg.hab.tool.scrubber', colorClass: 'border-emerald-400 bg-emerald-950/60 text-emerald-200' },
  { id: 'breaker', labelKey: 'mg.hab.tool.breaker', colorClass: 'border-violet-400 bg-violet-950/60 text-violet-200' },
];

export const HabitatMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const initialFaults = useMemo(() => generateHabitatFaults(difficulty, seed), [difficulty, seed]);
  const [faults, setFaults] = useState(initialFaults);
  const [selectedTool, setSelectedTool] = useState<HabitatToolId>('sealant');
  const [wrongId, setWrongId] = useState<string | null>(null);

  const renderToolIcon = (tool: HabitatToolId) => {
    switch (tool) {
      case 'sealant':
        return <ShieldAlert className="w-4 h-4" />;
      case 'heater':
        return <Flame className="w-4 h-4" />;
      case 'scrubber':
        return <Wind className="w-4 h-4" />;
      case 'breaker':
        return <Zap className="w-4 h-4" />;
    }
  };

  const handleRepairFault = (faultId: string) => {
    if (paused) return;
    const target = faults.find((f) => f.id === faultId);
    if (!target || target.fixed) return;

    if (target.requiredTool === selectedTool) {
      soundEngine.playActionSuccess();
      const next = faults.map((f) => (f.id === faultId ? { ...f, fixed: true } : f));
      setFaults(next);
      setWrongId(null);
      if (next.every((f) => f.fixed)) {
        const pct = Math.min(100, Math.round(65 + timeLeft * 1.4));
        onWin(pct);
      }
    } else {
      soundEngine.playAlert();
      setWrongId(faultId);
      onPenaltySeconds(2);
    }
  };

  const fixedCount = faults.filter((f) => f.fixed).length;

  return (
    <div className="space-y-4">
      <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-2">
          {t(lang, 'mg.hab.pickTool')}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TOOLS.map((tool) => {
            const active = selectedTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedTool(tool.id);
                }}
                className={`px-2.5 py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  active
                    ? `${tool.colorClass} ring-2 ring-white/50 scale-[1.02]`
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {renderToolIcon(tool.id)}
                <span>{t(lang, tool.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-300">
          <span>{t(lang, 'mg.hab.clickFault')}</span>
          <span className="tabular-nums text-cyan-300">
            {fixedCount}/{faults.length} {t(lang, 'mg.hab.repaired')}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          {faults.map((f) => (
            <button
              key={f.id}
              type="button"
              disabled={f.fixed}
              onClick={() => handleRepairFault(f.id)}
              className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 text-xs font-bold transition-colors ${
                f.fixed
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 cursor-default'
                  : wrongId === f.id
                    ? 'bg-red-950/60 border-red-400 text-red-100 cursor-pointer'
                    : 'bg-[#081022] border-amber-500/45 hover:border-cyan-400 text-white cursor-pointer'
              }`}
            >
              <span className="flex items-center gap-2">
                {f.fixed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Wrench className="w-4 h-4 text-amber-300 shrink-0" />
                )}
                <span>{t(lang, f.labelKey)}</span>
              </span>
              {!f.fixed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                  {t(lang, `mg.hab.tool.${f.requiredTool}`).split(' ')[0]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
