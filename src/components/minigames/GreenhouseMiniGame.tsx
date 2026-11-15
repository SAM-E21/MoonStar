import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Cherry,
  Droplet,
  FlaskConical,
  Leaf,
  Scissors,
  Sprout,
  Sun,
  Wheat,
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createPrng } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import { MiniGameFrame } from './MiniGameFrame';
import type { MiniGameComponentProps } from './types';

type GreenToolId = 'water' | 'light' | 'nutrients' | 'harvest';

interface CropPod {
  id: string;
  nameKey: string;
  need: GreenToolId;
  stage: number; // 0..3 (3 => harvest ready)
  patienceMs: number;
  maxPatienceMs: number;
}

const POD_TEMPLATES: Array<{ id: string; nameKey: string }> = [
  { id: 'lettuce', nameKey: 'mg.green.pod.lettuce' },
  { id: 'strawberry', nameKey: 'mg.green.pod.strawberry' },
  { id: 'potato', nameKey: 'mg.green.pod.potato' },
  { id: 'algae', nameKey: 'mg.green.pod.algae' },
];

const CARE_NEEDS: Array<'water' | 'light' | 'nutrients'> = ['water', 'light', 'nutrients'];

const renderPlantIcon = (id: string) => {
  switch (id) {
    case 'strawberry':
      return <Cherry className="w-5 h-5 text-rose-300" />;
    case 'potato':
      return <Wheat className="w-5 h-5 text-amber-300" />;
    case 'algae':
      return <Leaf className="w-5 h-5 text-cyan-300" />;
    default:
      return <Sprout className="w-5 h-5 text-emerald-300" />;
  }
};

const renderToolIcon = (tool: GreenToolId, cls = 'w-4 h-4') => {
  switch (tool) {
    case 'water':
      return <Droplet className={cls} />;
    case 'light':
      return <Sun className={cls} />;
    case 'nutrients':
      return <FlaskConical className={cls} />;
    case 'harvest':
      return <Scissors className={cls} />;
  }
};

export const GreenhouseMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const goalHarvests = difficulty === 'easy' ? 4 : difficulty === 'normal' ? 6 : 8;
  const maxPatience = difficulty === 'easy' ? 11500 : difficulty === 'normal' ? 9200 : 7500;
  const rngRef = useRef(createPrng(seed + 41));
  const wonRef = useRef(false);

  const [pods, setPods] = useState<CropPod[]>(() => {
    const rng = createPrng(seed + 13);
    return POD_TEMPLATES.map((tpl, idx) => ({
      ...tpl,
      need: idx === 0 ? 'harvest' : CARE_NEEDS[Math.floor(rng() * CARE_NEEDS.length)],
      stage: idx === 0 ? 3 : Math.floor(rng() * 2),
      patienceMs: maxPatience - idx * 800,
      maxPatienceMs: maxPatience,
    }));
  });

  const [activeTool, setActiveTool] = useState<GreenToolId>('harvest');
  const [harvested, setHarvested] = useState(0);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning' | 'info'; text: string } | null>(null);

  // Number keys 1-4 for fast tool switching
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || wonRef.current) return;
      if (e.key === '1') setActiveTool('water');
      else if (e.key === '2') setActiveTool('light');
      else if (e.key === '3') setActiveTool('nutrients');
      else if (e.key === '4') setActiveTool('harvest');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused]);

  // Patience countdown per crop pod
  useEffect(() => {
    if (paused || wonRef.current) return;
    const tickMs = 200;

    const id = window.setInterval(() => {
      let wilted = false;
      setPods((prev) =>
        prev.map((pod) => {
          const nextPat = pod.patienceMs - tickMs;
          if (nextPat <= 0) {
            wilted = true;
            const nextNeed = CARE_NEEDS[Math.floor(rngRef.current() * CARE_NEEDS.length)];
            return {
              ...pod,
              stage: 0,
              need: nextNeed,
              patienceMs: maxPatience,
              maxPatienceMs: maxPatience,
            };
          }
          return { ...pod, patienceMs: nextPat };
        }),
      );

      if (wilted) {
        soundEngine.playAlert();
        setFeedback({ tone: 'warning', text: t(lang, 'mg.green.wilted') });
        onPenaltySeconds(2);
      }
    }, tickMs);

    return () => window.clearInterval(id);
  }, [paused, maxPatience, lang, onPenaltySeconds]);

  const handlePodClick = (podId: string) => {
    if (paused || wonRef.current) return;
    const target = pods.find((p) => p.id === podId);
    if (!target) return;

    if (target.need !== activeTool) {
      soundEngine.playAlert();
      setFeedback({ tone: 'warning', text: t(lang, 'mg.green.wrongTool') });
      onPenaltySeconds(2);
      return;
    }

    if (target.need === 'harvest') {
      soundEngine.playActionSuccess();
      const nextCount = harvested + 1;
      setHarvested(nextCount);
      setFeedback({ tone: 'success', text: t(lang, 'mg.green.harvestOk') });

      setPods((prev) =>
        prev.map((p) =>
          p.id === podId
            ? {
                ...p,
                stage: 0,
                need: CARE_NEEDS[Math.floor(rngRef.current() * CARE_NEEDS.length)],
                patienceMs: maxPatience,
              }
            : p,
        ),
      );

      if (nextCount >= goalHarvests) {
        wonRef.current = true;
        onWin(Math.min(100, Math.round(70 + timeLeft * 0.85)));
      }
    } else {
      soundEngine.playClick();
      setPods((prev) =>
        prev.map((p) => {
          if (p.id !== podId) return p;
          const nextStage = p.stage + 1;
          const nextNeed: GreenToolId =
            nextStage >= 2 ? 'harvest' : CARE_NEEDS[Math.floor(rngRef.current() * CARE_NEEDS.length)];
          return {
            ...p,
            stage: nextStage,
            need: nextNeed,
            patienceMs: maxPatience,
          };
        }),
      );
      setFeedback({ tone: 'info', text: `${t(lang, target.nameKey)} ↑` });
    }
  };

  const tools: Array<{ id: GreenToolId; labelKey: string; activeCls: string; keyHint: string }> = [
    { id: 'water', labelKey: 'mg.green.tool.water', activeCls: 'bg-cyan-400 text-slate-950 border-cyan-300', keyHint: '1' },
    { id: 'light', labelKey: 'mg.green.tool.light', activeCls: 'bg-amber-400 text-slate-950 border-amber-300', keyHint: '2' },
    {
      id: 'nutrients',
      labelKey: 'mg.green.tool.nutrients',
      activeCls: 'bg-violet-400 text-slate-950 border-violet-300',
      keyHint: '3',
    },
    {
      id: 'harvest',
      labelKey: 'mg.green.tool.harvest',
      activeCls: 'bg-emerald-400 text-slate-950 border-emerald-300',
      keyHint: '4',
    },
  ];

  return (
    <MiniGameFrame
      icon={<Sprout className="w-4 h-4 text-emerald-300" />}
      instruction={t(lang, 'mg.greenhouse_balance.desc')}
      progressPct={(harvested / goalHarvests) * 100}
      progressTone="emerald"
      stats={[
        { label: t(lang, 'mg.green.harvests'), value: `${harvested}/${goalHarvests}`, tone: 'emerald' },
      ]}
      feedback={feedback}
      footer={
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tools.map((tool) => {
            const active = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTool(tool.id);
                }}
                className={`px-3 py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? tool.activeCls
                    : 'bg-[#0b152a] hover:bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {renderToolIcon(tool.id)}
                <span>{t(lang, tool.labelKey)}</span>
                <span className="text-[10px] opacity-70 font-mono">[{tool.keyHint}]</span>
              </button>
            );
          })}
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2.5">
        {pods.map((pod) => {
          const patPct = Math.max(0, Math.round((pod.patienceMs / pod.maxPatienceMs) * 100));
          const isReady = pod.need === 'harvest';
          const matchesTool = pod.need === activeTool;

          return (
            <button
              key={pod.id}
              type="button"
              onClick={() => handlePodClick(pod.id)}
              className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-colors cursor-pointer ${
                isReady
                  ? 'bg-emerald-950/55 border-emerald-400'
                  : matchesTool
                    ? 'bg-[#101e3c] border-cyan-400/70'
                    : 'bg-[#0b152a] hover:bg-[#101c37] border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[#060d1e] border border-slate-700 flex items-center justify-center">
                    {renderPlantIcon(pod.id)}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">{t(lang, pod.nameKey)}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[0, 1, 2].map((step) => (
                        <span
                          key={step}
                          className={`w-3.5 h-1.5 rounded-full ${
                            pod.stage > step || isReady ? 'bg-emerald-400' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Callout Request Bubble */}
                <div
                  className={`px-2 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 shrink-0 ${
                    pod.need === 'water'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : pod.need === 'light'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : pod.need === 'nutrients'
                          ? 'bg-violet-500/20 border-violet-400 text-violet-200'
                          : 'bg-emerald-400 text-slate-950 border-emerald-300'
                  }`}
                >
                  {isReady ? <CheckCircle2 className="w-3.5 h-3.5" /> : renderToolIcon(pod.need, 'w-3.5 h-3.5')}
                  <span>{t(lang, `mg.green.need.${pod.need}`)}</span>
                </div>
              </div>

              {/* Patience Gauge */}
              <div className="h-1.5 bg-[#060d1e] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    patPct < 30 ? 'bg-rose-400' : patPct < 60 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${patPct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </MiniGameFrame>
  );
};
