import React, { useState } from 'react';
import { Award, CheckCircle2, Home, Lightbulb, RotateCcw, Target, Trophy } from 'lucide-react';
import { BADGE_DEFINITIONS } from '../data/missionData';
import { saveChallengeScore } from '../engine/challengeCodes';
import { t } from '../i18n/translations';
import type { Language, MissionReport } from '../types/game';

interface MissionReportModalProps {
  lang: Language;
  report: MissionReport;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const MissionReportModal: React.FC<MissionReportModalProps> = ({
  lang,
  report,
  onPlayAgain,
  onMainMenu,
}) => {
  const [commanderName, setCommanderName] = useState('');
  const [savedScore, setSavedScore] = useState(false);

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commanderName.trim() || (lang === 'es' ? 'Comandante MOONSTAR' : 'Cmdr. MOONSTAR');
    saveChallengeScore({
      code: report.challengeCode,
      commanderName: trimmed,
      score: report.score,
      rating: report.rating,
      victory: report.victory,
    });
    setSavedScore(true);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#040813]/88 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#081022] border border-cyan-500/45 rounded-2xl p-6 md:p-7 shadow-2xl my-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span
              className={`inline-block text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded mb-2 ${
                report.victory ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {report.victory ? t(lang, 'report.victory') : t(lang, 'report.failure')}
            </span>
            <p className="text-sm text-slate-300">
              {report.victory ? t(lang, 'report.subtitle.win') : t(lang, 'report.subtitle.loss')}
            </p>
            {!report.victory && report.failureReasonKey && (
              <p className="text-xs text-amber-300 mt-1.5 font-semibold">{t(lang, report.failureReasonKey)}</p>
            )}
          </div>

          <div className="bg-[#0d162c] border border-cyan-500/40 rounded-2xl px-5 py-3 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">{t(lang, 'report.rating')}</div>
            <div className="text-4xl font-black text-cyan-300 leading-none mt-1 flex items-center justify-center gap-1.5">
              <Award className="w-7 h-7 text-amber-400" />
              {report.rating}
            </div>
            <div className="text-xs text-slate-300 tabular-nums mt-1">{report.score} pts</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
          {[
            { label: t(lang, 'report.daysSurvived'), val: `${report.daysSurvived}/${report.totalDays}` },
            { label: t(lang, 'report.crewHealth'), val: `${report.crewHealth}%` },
            { label: t(lang, 'report.sciencePts'), val: `${report.researchPoints}` },
            { label: t(lang, 'report.objectives'), val: `${report.completedObjectives}/${report.totalObjectives}` },
            { label: t(lang, 'report.energyEff'), val: `${report.energyEfficiency}%` },
            { label: t(lang, 'report.waterEff'), val: `${report.waterEfficiency}%` },
            { label: t(lang, 'report.foodEff'), val: `${report.foodEfficiency}%` },
            { label: t(lang, 'report.radProt'), val: `${report.radiationProtectionScore}%` },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0d162c] border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">{stat.label}</div>
              <div className="text-lg font-extrabold text-white tabular-nums mt-0.5">{stat.val}</div>
            </div>
          ))}
        </div>

        {/* Decisions & Educational Lessons */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0c1528] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300 mb-2">
              <Target className="w-4 h-4" />
              {t(lang, 'report.bestDecisions')}
            </div>
            {report.bestDecisions.length > 0 ? (
              <ul className="space-y-1.5">
                {report.bestDecisions.slice(0, 4).map((d, idx) => (
                  <li key={idx} className="text-xs text-slate-200 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      D{d.day}: {t(lang, d.eventTitleKey)} — {t(lang, d.choiceLabelKey)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">—</p>
            )}
          </div>

          <div className="bg-[#0c1528] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-2">
              <Lightbulb className="w-4 h-4" />
              {t(lang, 'report.lessons')}
            </div>
            <ul className="space-y-2">
              {report.lessonsToImprove.map((tipKey) => (
                <li key={tipKey} className="text-xs text-slate-200 leading-relaxed">
                  • {t(lang, tipKey)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Passport Badges & Challenge Leaderboard Submit */}
        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <div className="bg-[#0c1528] border border-amber-500/35 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-2">
              <Award className="w-4 h-4" />
              {t(lang, 'report.badgesEarned')} ({report.unlockedBadges.length}/{BADGE_DEFINITIONS.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BADGE_DEFINITIONS.filter((b) => report.unlockedBadges.includes(b.id)).map((b) => (
                <span
                  key={b.id}
                  className="px-2 py-1 rounded-lg bg-[#081020] border text-[11px] font-bold text-white"
                  style={{ borderColor: b.accentHex }}
                >
                  {t(lang, b.titleKey)}
                </span>
              ))}
              {report.unlockedBadges.length === 0 && <span className="text-xs text-slate-400">—</span>}
            </div>
          </div>

          <div className="bg-[#0c1528] border border-cyan-500/35 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                {t(lang, 'report.challengeCode')}
              </span>
              <span className="font-mono text-white">{report.challengeCode}</span>
            </div>

            {savedScore ? (
              <div className="text-xs font-bold text-emerald-300 py-1.5">{t(lang, 'report.scoreSaved')}</div>
            ) : (
              <form onSubmit={handleSaveScore} className="flex gap-2">
                <input
                  type="text"
                  value={commanderName}
                  onChange={(e) => setCommanderName(e.target.value)}
                  placeholder={t(lang, 'report.commanderPlaceholder')}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#081020] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer"
                >
                  {t(lang, 'report.saveScore')}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="flex-1 py-3 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t(lang, 'report.playAgain')}
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" />
            {t(lang, 'report.toMenu')}
          </button>
        </div>
      </div>
    </div>
  );
};
