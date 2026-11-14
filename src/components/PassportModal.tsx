import React, { useState } from 'react';
import { Award, CheckCircle2, Lock, Trophy, X } from 'lucide-react';
import { BADGE_DEFINITIONS } from '../data/missionData';
import { getChallengeScores } from '../engine/challengeCodes';
import { t } from '../i18n/translations';
import type { BadgeId, Language } from '../types/game';

interface PassportModalProps {
  lang: Language;
  unlockedBadges: BadgeId[];
  currentCode?: string;
  onClose: () => void;
}

export const PassportModal: React.FC<PassportModalProps> = ({
  lang,
  unlockedBadges,
  currentCode,
  onClose,
}) => {
  const [tab, setTab] = useState<'badges' | 'challenges'>('badges');
  const [filterByCurrent, setFilterByCurrent] = useState(false);

  const scores = getChallengeScores(filterByCurrent && currentCode ? currentCode : undefined);

  return (
    <div className="fixed inset-0 z-40 bg-[#040813]/85 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#081022] border border-amber-500/40 rounded-2xl p-6 shadow-2xl my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">{t(lang, 'pass.title')}</h2>
            <p className="text-xs md:text-sm text-amber-300 mt-0.5">{t(lang, 'pass.subtitle')}</p>
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

        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('badges')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
                tab === 'badges'
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-[#0d162c] text-slate-200 border-slate-700'
              }`}
            >
              <Award className="w-4 h-4" />
              {t(lang, 'pass.tab.badges')} ({unlockedBadges.length}/{BADGE_DEFINITIONS.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('challenges')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
                tab === 'challenges'
                  ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                  : 'bg-[#0d162c] text-slate-200 border-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4" />
              {t(lang, 'pass.tab.challenges')}
            </button>
          </div>

          {currentCode && (
            <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-[#0d162c] border border-cyan-500/35 text-cyan-300">
              {t(lang, 'pass.codeLabel')}: {currentCode}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 pr-1">
          {tab === 'badges' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {BADGE_DEFINITIONS.map((b) => {
                const earned = unlockedBadges.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                      earned
                        ? 'bg-[#0d192f] border-amber-400/55 text-white'
                        : 'bg-[#0a1120] border-slate-800 text-slate-400 opacity-75'
                    }`}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: earned ? `${b.accentHex}22` : '#0f172a',
                        borderColor: earned ? b.accentHex : '#334155',
                      }}
                    >
                      {earned ? (
                        <Award className="w-6 h-6" style={{ color: b.accentHex }} />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold">{t(lang, b.titleKey)}</span>
                        {earned && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{t(lang, b.descKey)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'challenges' && (
            <div className="space-y-3">
              <div className="bg-[#0d162c] border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <span>{t(lang, 'pass.challengeHint')}</span>
                {currentCode && (
                  <button
                    type="button"
                    onClick={() => setFilterByCurrent((v) => !v)}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                      filterByCurrent
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                        : 'bg-slate-800 text-slate-200 border-slate-600'
                    }`}
                  >
                    {filterByCurrent ? t(lang, 'pass.showAll') : t(lang, 'pass.onlyCurrent')}
                  </button>
                )}
              </div>

              {scores.length === 0 ? (
                <div className="bg-[#0c1528] border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
                  {t(lang, 'pass.noScores')}
                </div>
              ) : (
                <div className="space-y-2">
                  {scores.map((s, idx) => (
                    <div
                      key={s.id}
                      className="bg-[#0c1528] border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-300 font-black flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white">{s.commanderName}</div>
                          <div className="text-[11px] font-mono text-cyan-300">{s.code} · {s.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-300 tabular-nums">
                          {s.score} pts · {s.rating}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {s.victory ? t(lang, 'pass.won') : t(lang, 'pass.lost')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
