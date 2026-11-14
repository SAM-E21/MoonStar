import React from 'react';
import { AlertTriangle, ArrowRight, BookOpen, Lightbulb, ShieldAlert, Sparkles } from 'lucide-react';
import { CREW_CHARACTERS, STORY_CHAPTERS } from '../data/missionData';
import { t } from '../i18n/translations';
import type { Language, MissionState } from '../types/game';
import { CrewAvatar } from './CrewAvatar';

interface EventModalProps {
  lang: Language;
  state: MissionState;
  onStartOperations: () => void;
  onSelectChoice: (choiceId: 'A' | 'B' | 'C') => void;
  onAdvanceDay: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  lang,
  state,
  onStartOperations,
  onSelectChoice,
  onAdvanceDay,
}) => {
  // Phase 1: Morning Report
  if (state.phase === 'morning_report') {
    const netEnergy = state.energy.production - state.energy.consumption;
    const netOxygen = state.oxygen.production - state.oxygen.consumption;
    const netWater = state.water.production - state.water.consumption;
    const netFood = state.food.production - state.food.consumption;

    const formatNet = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

    const storyChapter = state.config.storyMode
      ? STORY_CHAPTERS.find((c) => c.day === state.day) ?? STORY_CHAPTERS[STORY_CHAPTERS.length - 1]
      : null;
    const speaker = storyChapter
      ? CREW_CHARACTERS.find((c) => c.id === storyChapter.speakerId) ?? CREW_CHARACTERS[0]
      : null;

    return (
      <div className="fixed inset-0 z-30 bg-[#040813]/75 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-lg bg-[#081022] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl my-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            {t(lang, 'hud.day')} {state.day} {t(lang, 'hud.of')} {state.config.duration}
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1">{t(lang, 'morning.title')}</h2>

          {storyChapter && speaker && (
            <div className="mt-4 bg-[#0c182f] border border-cyan-500/35 rounded-xl p-3.5 flex items-start gap-3">
              <CrewAvatar suitColor={speaker.suitColor} visorColor={speaker.visorColor} size="md" />
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  <BookOpen className="w-3 h-3" />
                  <span>{t(lang, 'story.badge')}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-amber-300">{t(lang, speaker.nameKey)}</span>
                </div>
                <div className="text-sm font-extrabold text-white mt-0.5">{t(lang, storyChapter.titleKey)}</div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">{t(lang, storyChapter.bodyKey)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 my-5">
            {[
              { label: t(lang, 'morning.netEnergy'), val: netEnergy, unit: '⚡' },
              { label: t(lang, 'morning.netOxygen'), val: netOxygen, unit: 'O₂' },
              { label: t(lang, 'morning.netWater'), val: netWater, unit: '💧' },
              { label: t(lang, 'morning.netFood'), val: netFood, unit: '🌱' },
            ].map((item) => (
              <div key={item.label} className="bg-[#0d162c] border border-slate-800 rounded-xl p-3">
                <div className="text-xs text-slate-400">{item.label}</div>
                <div
                  className={`text-xl font-extrabold tabular-nums mt-0.5 ${
                    item.val >= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {formatNet(item.val)} {item.unit}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onStartOperations}
            className="w-full py-3 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {t(lang, 'morning.continue')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Phase 3: Active Event Decision
  if (state.phase === 'event' && state.activeEvent) {
    const ev = state.activeEvent;
    const badgeColor =
      ev.severity === 'critical'
        ? 'bg-red-500/20 text-red-300 border-red-500/50'
        : ev.severity === 'opportunity'
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
          : 'bg-amber-500/20 text-amber-300 border-amber-500/50';

    return (
      <div className="fixed inset-0 z-30 bg-[#040813]/82 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl bg-[#081022] border border-amber-500/45 rounded-2xl p-6 shadow-2xl my-auto">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2.5 py-1 rounded text-xs font-extrabold border inline-flex items-center gap-1.5 ${badgeColor}`}>
              {ev.severity === 'critical' ? (
                <ShieldAlert className="w-3.5 h-3.5" />
              ) : ev.severity === 'opportunity' ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {t(lang, `ev.badge.${ev.severity}`)}
            </span>
            {ev.customSubtitle && (
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
                {ev.customSubtitle}
              </span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-white">{t(lang, ev.titleKey)}</h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">{t(lang, ev.descriptionKey)}</p>

          <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 mt-5 mb-2.5">
            {t(lang, 'ev.choose')}
          </div>

          <div className="flex flex-col gap-2.5">
            {ev.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectChoice(c.id)}
                className="text-left p-3.5 rounded-xl bg-[#0d162c] hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 transition-colors cursor-pointer"
              >
                <div className="text-sm font-bold text-white">
                  {c.id}. {t(lang, c.labelKey)}
                </div>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
                  <span className="text-amber-300 font-semibold">
                    {t(lang, 'ev.cost')}: {t(lang, c.costSummaryKey)}
                  </span>
                  <span className="text-cyan-300 font-semibold">
                    {t(lang, 'ev.benefit')}: {t(lang, c.benefitSummaryKey)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Phase 4: Event Consequence + Scientific Learning Card
  if (state.phase === 'summary' && state.resolvedEventResult) {
    const { event, choice } = state.resolvedEventResult;
    return (
      <div className="fixed inset-0 z-30 bg-[#040813]/80 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-[#081022] border border-cyan-500/45 rounded-2xl p-6 shadow-2xl">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            {t(lang, 'hud.phase.summary')} · {t(lang, 'hud.day')} {state.day}
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">{t(lang, event.titleKey)}</h2>

          <div className="bg-[#0d162c] border border-slate-700 rounded-xl p-4 my-4">
            <div className="text-xs font-bold text-cyan-300 mb-1">
              {choice.id}. {t(lang, choice.labelKey)}
            </div>
            <p className="text-sm text-slate-100 leading-relaxed">{t(lang, choice.outcomeKey)}</p>
          </div>

          <div className="bg-emerald-950/35 border border-emerald-500/35 rounded-xl p-4 mb-5 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 mb-1">
                {t(lang, 'ev.scienceTitle')}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {t(lang, event.scienceExplanationKey)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAdvanceDay}
            className="w-full py-3 px-5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {t(lang, 'ev.continue')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
