import React, { useEffect, useMemo, useState } from 'react';
import {
  BatteryCharging,
  CheckCircle2,
  Compass,
  Droplet,
  Moon,
  Radio,
  Shield,
  Sprout,
  Sun,
  X,
  XCircle,
} from 'lucide-react';
import { ACADEMY_LESSONS } from '../data/missionData';
import { unlockPassportBadge } from '../engine/simulation';
import { t } from '../i18n/translations';
import type { Language } from '../types/game';

interface AcademyModalProps {
  lang: Language;
  onClose: () => void;
}

export const AcademyModal: React.FC<AcademyModalProps> = ({ lang, onClose }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const lesson = ACADEMY_LESSONS[selectedIdx];

  const { totalQuestions, totalCorrect } = useMemo(() => {
    let total = 0;
    let correct = 0;
    for (const l of ACADEMY_LESSONS) {
      for (const q of l.questions) {
        total += 1;
        if (answers[q.id] === q.correctIndex) correct += 1;
      }
    }
    return { totalQuestions: total, totalCorrect: correct };
  }, [answers]);

  useEffect(() => {
    if (totalCorrect >= 6) {
      unlockPassportBadge('academy_star');
    }
  }, [totalCorrect]);

  const renderIcon = (name: string) => {
    switch (name) {
      case 'shield':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'droplet':
        return <Droplet className="w-4 h-4 text-cyan-400" />;
      case 'sprout':
        return <Sprout className="w-4 h-4 text-emerald-400" />;
      case 'sun':
        return <Sun className="w-4 h-4 text-yellow-400" />;
      case 'radio':
        return <Radio className="w-4 h-4 text-violet-400" />;
      case 'battery':
        return <BatteryCharging className="w-4 h-4 text-lime-400" />;
      case 'compass':
        return <Compass className="w-4 h-4 text-orange-400" />;
      default:
        return <Moon className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#040813]/85 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#081022] border border-emerald-500/35 rounded-2xl p-5 md:p-6 shadow-2xl my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">{t(lang, 'acad.title')}</h2>
            <p className="text-xs md:text-sm text-emerald-300 mt-0.5">{t(lang, 'acad.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs font-extrabold text-emerald-300 tabular-nums">
              {t(lang, 'acad.score')}: {totalCorrect}/{totalQuestions}
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
        </div>

        <div className="grid md:grid-cols-[245px_1fr] gap-4 overflow-hidden flex-1">
          <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
            {ACADEMY_LESSONS.map((l, idx) => {
              const solvedCount = l.questions.filter((q) => answers[q.id] === q.correctIndex).length;
              const allSolved = solvedCount === l.questions.length;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    idx === selectedIdx
                      ? 'bg-emerald-950/70 border-emerald-400 text-white'
                      : 'bg-[#0c1528] border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {renderIcon(l.iconName)}
                    <span>{t(lang, l.titleKey)}</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded tabular-nums shrink-0 ${
                      allSolved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {solvedCount}/{l.questions.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-[#0c1528] border border-slate-800 rounded-xl p-5 overflow-y-auto space-y-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                {renderIcon(lesson.iconName)}
                <span>{t(lang, lesson.summaryKey)}</span>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-1">{t(lang, lesson.titleKey)}</h3>
              <p className="text-sm text-slate-200 mt-2 leading-relaxed">{t(lang, lesson.detailKey)}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                {t(lang, 'acad.check')}
              </div>

              {lesson.questions.map((q, qIdx) => {
                const chosen = answers[q.id];
                const isCorrect = chosen === q.correctIndex;
                return (
                  <div key={q.id} className="bg-[#081022] border border-slate-800/90 rounded-xl p-3.5">
                    <div className="text-[11px] font-bold text-slate-400 mb-1">
                      {t(lang, 'acad.questionLabel')} {qIdx + 1}/{lesson.questions.length}
                    </div>
                    <p className="text-sm font-semibold text-white mb-2.5">{t(lang, q.questionKey)}</p>

                    <div className="flex flex-col gap-1.5">
                      {q.optionsKeys.map((optKey, oIdx) => {
                        const selected = chosen === oIdx;
                        return (
                          <button
                            key={optKey}
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                            className={`text-left px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                              selected
                                ? oIdx === q.correctIndex
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                                  : 'bg-red-500/20 border-red-400 text-red-200'
                                : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-cyan-400'
                            }`}
                          >
                            {t(lang, optKey)}
                          </button>
                        );
                      })}
                    </div>

                    {chosen !== undefined && (
                      <div
                        className={`mt-2.5 px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                          isCorrect
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                            : 'bg-red-950/50 border-red-500/50 text-red-200'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{isCorrect ? t(lang, 'acad.correct') : t(lang, 'acad.wrong')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
