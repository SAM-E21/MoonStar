import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Copy, Lock, PlusCircle, Search, Trash2, Trophy, X } from 'lucide-react';
import { BADGE_DEFINITIONS, LANDING_SITES } from '../data/missionData';
import {
  decodeChallengeCode,
  deleteChallengeScore,
  getChallengeScores,
  saveChallengeScore,
} from '../engine/challengeCodes';
import { t } from '../i18n/translations';
import type { BadgeId, ChallengeScoreEntry, Language } from '../types/game';

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
  const [filterCodeInput, setFilterCodeInput] = useState(currentCode ?? '');
  const [copied, setCopied] = useState(false);
  const [scoresVersion, setScoresVersion] = useState(0);

  // Quick manual friend score comparison inputs
  const [friendName, setFriendName] = useState('');
  const [friendCode, setFriendCode] = useState(currentCode ?? 'MRX-SHK-2I5-419');
  const [friendPoints, setFriendPoints] = useState('820');
  const [friendError, setFriendError] = useState(false);

  const scores: ChallengeScoreEntry[] = useMemo(() => {
    void scoresVersion;
    return getChallengeScores(filterCodeInput.trim() || undefined);
  }, [filterCodeInput, scoresVersion]);

  const topScore = scores.length > 0 ? Math.max(...scores.map((s) => s.score), 1) : 1;

  const describeCode = (code: string): string | null => {
    const parsed = decodeChallengeCode(code);
    if (!parsed || !parsed.landingSite || !parsed.difficulty) return null;
    const siteDef = LANDING_SITES.find((s) => s.id === parsed.landingSite);
    const siteName = siteDef ? t(lang, siteDef.nameKey) : parsed.landingSite;
    const diffLabel = t(lang, `prep.diff.${parsed.difficulty}`);
    return `${siteName} · ${parsed.crewSize} ${lang === 'es' ? 'trip.' : 'crew'} · ${diffLabel} · ${parsed.duration}d`;
  };

  const activeDecodedDesc = filterCodeInput.trim() ? describeCode(filterCodeInput) : null;

  const handleAddFriendScore = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = friendCode.trim().toUpperCase();
    const parsed = decodeChallengeCode(cleanCode);
    const pts = Math.max(0, Math.min(3000, Math.round(Number(friendPoints) || 0)));
    if (!parsed) {
      setFriendError(true);
      return;
    }
    setFriendError(false);
    const rating = pts >= 850 ? 'S' : pts >= 680 ? 'A' : pts >= 500 ? 'B' : 'C';
    saveChallengeScore({
      code: cleanCode,
      commanderName: friendName.trim() || (lang === 'es' ? 'Amigo MOONSTAR' : 'MOONSTAR Friend'),
      score: pts,
      rating,
      victory: pts >= 500,
    });
    setFriendName('');
    setFilterCodeInput(cleanCode);
    setScoresVersion((v) => v + 1);
  };

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
            <div className="flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-[#0d162c] border border-cyan-500/35 text-cyan-300">
              <span>
                {t(lang, 'pass.codeLabel')}: {currentCode}
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(currentCode);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1800);
                  } catch {
                    // Ignore
                  }
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] font-sans font-bold text-cyan-200 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                {copied ? t(lang, 'code.copied') : t(lang, 'code.copy')}
              </button>
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
              <div className="bg-[#0d162c] border border-slate-700 rounded-xl p-3 space-y-2.5 text-xs text-slate-300">
                <p>{t(lang, 'pass.challengeHint')}</p>

                {/* Filter / Compare by Challenge Code */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filterCodeInput}
                      onChange={(e) => setFilterCodeInput(e.target.value)}
                      placeholder={t(lang, 'pass.filterPlaceholder')}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#081020] border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  {currentCode && (
                    <button
                      type="button"
                      onClick={() => setFilterCodeInput(currentCode)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-200 font-bold cursor-pointer"
                    >
                      {t(lang, 'pass.onlyCurrent')}
                    </button>
                  )}
                  {filterCodeInput && (
                    <button
                      type="button"
                      onClick={() => setFilterCodeInput('')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold cursor-pointer"
                    >
                      {t(lang, 'pass.clearFilter')}
                    </button>
                  )}
                </div>

                {activeDecodedDesc && (
                  <div className="text-[11px] font-semibold text-cyan-300 bg-[#081020] border border-cyan-500/30 rounded-lg px-2.5 py-1.5">
                    {filterCodeInput.trim().toUpperCase()} · {activeDecodedDesc}
                  </div>
                )}
              </div>

              {/* Quick form to log a friend's shared score for direct side-by-side comparison */}
              <form
                onSubmit={handleAddFriendScore}
                className="bg-[#0c1528] border border-slate-800 rounded-xl p-3 space-y-2"
              >
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" />
                  {t(lang, 'pass.addEntryTitle')}
                </div>
                <div className="grid sm:grid-cols-[1.2fr_1.2fr_0.7fr_auto] gap-2">
                  <input
                    type="text"
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                    placeholder={t(lang, 'pass.friendName')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#081020] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    value={friendCode}
                    onChange={(e) => {
                      setFriendCode(e.target.value);
                      if (friendError) setFriendError(false);
                    }}
                    placeholder="MRX-SHK-2I5-419"
                    className="px-2.5 py-1.5 rounded-lg bg-[#081020] border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="number"
                    min={0}
                    max={3000}
                    value={friendPoints}
                    onChange={(e) => setFriendPoints(e.target.value)}
                    placeholder={t(lang, 'pass.scorePts')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#081020] border border-slate-700 text-xs text-white tabular-nums focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer"
                  >
                    {t(lang, 'pass.addCompare')}
                  </button>
                </div>
                {friendError && (
                  <div className="text-[11px] text-red-300 font-semibold">{t(lang, 'pass.invalidCodeHint')}</div>
                )}
              </form>

              {scores.length === 0 ? (
                <div className="bg-[#0c1528] border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
                  {t(lang, 'pass.noScores')}
                </div>
              ) : (
                <div className="space-y-2">
                  {scores.map((s, idx) => {
                    const ratioPct = Math.max(8, Math.round((s.score / topScore) * 100));
                    const meta = describeCode(s.code);
                    return (
                      <div
                        key={s.id}
                        className="bg-[#0c1528] border border-slate-800 rounded-xl p-3 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-full font-black flex items-center justify-center shrink-0 ${
                                idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-300'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">{s.commanderName}</div>
                              <div className="text-[11px] font-mono text-cyan-300 truncate">
                                {s.code} · {s.date}
                              </div>
                              {meta && <div className="text-[10px] text-slate-400 truncate">{meta}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="text-sm font-black text-emerald-300 tabular-nums">
                                {s.score} pts · {s.rating}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {s.victory ? t(lang, 'pass.won') : t(lang, 'pass.lost')}
                              </div>
                            </div>
                            <button
                              type="button"
                              aria-label={t(lang, 'pass.remove')}
                              onClick={() => {
                                deleteChallengeScore(s.id);
                                setScoresVersion((v) => v + 1);
                              }}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-slate-700 text-slate-400 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${idx === 0 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                            style={{ width: `${ratioPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
