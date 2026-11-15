import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  ClipboardPaste,
  Compass,
  Copy,
  Dices,
  Droplet,
  Hash,
  MapPin,
  Radio,
  Rocket,
  Shield,
  Sun,
  Thermometer,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  COMMANDER_ROLES,
  EQUIPMENT_OPTIONS,
  LANDING_SITES,
  MISSION_PRIORITIES,
} from '../data/missionData';
import { decodeChallengeCode, encodeChallengeCode, generateRandomChallengeSeed } from '../engine/challengeCodes';
import { t } from '../i18n/translations';
import type {
  CommanderRole,
  CrewSize,
  Difficulty,
  EquipmentId,
  LandingSiteId,
  Language,
  MissionConfig,
  MissionDuration,
  MissionPriority,
} from '../types/game';

interface MissionPrepModalProps {
  lang: Language;
  onBack: () => void;
  onLaunch: (config: MissionConfig) => void;
}

export const MissionPrepModal: React.FC<MissionPrepModalProps> = ({ lang, onBack, onLaunch }) => {
  const [landingSite, setLandingSite] = useState<LandingSiteId>('shackleton');
  const [commanderRole, setCommanderRole] = useState<CommanderRole>('engineer');
  const [priority, setPriority] = useState<MissionPriority>('survival');
  const [duration, setDuration] = useState<MissionDuration>(5);
  const [crewSize, setCrewSize] = useState<CrewSize>(2);
  const [difficulty, setDifficulty] = useState<Difficulty>('engineer');
  const [equipment, setEquipment] = useState<EquipmentId[]>(['extra_battery', 'water_filter']);
  const [storyMode, setStoryMode] = useState<boolean>(true);
  const [seed, setSeed] = useState<number>(419);
  const [challengeInput, setChallengeInput] = useState<string>('');
  const [challengeStatus, setChallengeStatus] = useState<'idle' | 'applied' | 'invalid'>('idle');
  const [copiedCode, setCopiedCode] = useState(false);

  const activeSite = LANDING_SITES.find((s) => s.id === landingSite) ?? LANDING_SITES[0];

  const liveChallengeCode = useMemo(
    () =>
      encodeChallengeCode({
        landingSite,
        commanderRole,
        priority,
        duration,
        crewSize,
        difficulty,
        equipment,
        storyMode,
        seed,
      }),
    [landingSite, commanderRole, priority, duration, crewSize, difficulty, equipment, storyMode, seed],
  );

  const handleApplyChallenge = () => {
    const decoded = decodeChallengeCode(challengeInput);
    if (!decoded) {
      setChallengeStatus('invalid');
      return;
    }
    if (decoded.landingSite) setLandingSite(decoded.landingSite);
    if (decoded.crewSize) setCrewSize(decoded.crewSize);
    if (decoded.difficulty) setDifficulty(decoded.difficulty);
    if (decoded.duration) setDuration(decoded.duration);
    if (decoded.seed) setSeed(decoded.seed);
    setChallengeStatus('applied');
  };

  const toggleEquip = (id: EquipmentId) => {
    setEquipment((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className="fixed inset-0 z-30 bg-[#040813]/85 flex items-center justify-center p-3 md:p-5 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#081022] border border-cyan-500/35 rounded-2xl p-5 md:p-6 shadow-2xl my-auto max-h-[94vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3.5 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{t(lang, 'prep.title')}</h2>
            <p className="text-xs md:text-sm text-cyan-300 mt-0.5">{t(lang, 'prep.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            {t(lang, 'prep.back')}
          </button>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-5">
          {/* Left column: Landing Site + Telemetry + Commander Role + Priority + Duration/Crew/Difficulty */}
          <div className="flex flex-col gap-3.5">
            {/* Landing Site Selector */}
            <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400 mb-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {t(lang, 'prep.site')}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {LANDING_SITES.map((site) => {
                  const active = site.id === landingSite;
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => setLandingSite(site.id)}
                      className={`text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        active
                          ? 'bg-cyan-950/75 border-cyan-400 text-white'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{t(lang, site.nameKey)}</div>
                      <div className="text-[10px] text-cyan-300 font-semibold mt-0.5">{t(lang, site.regionKey)}</div>
                    </button>
                  );
                })}
              </div>

              {/* Site Telemetry Bar */}
              <div className="mt-2.5 bg-[#081020] border border-slate-800 rounded-lg p-2.5">
                <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">{t(lang, activeSite.descKey)}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <Sun className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {t(lang, 'prep.sunlight')}: {activeSite.sunlightPct}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
                    <Thermometer className="w-3.5 h-3.5 shrink-0" />
                    <span>{activeSite.tempRange}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                    <Droplet className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {t(lang, 'prep.ice')}: {t(lang, activeSite.icePotentialKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-violet-300 font-semibold">
                    <Radio className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {t(lang, 'prep.earthLink')}: {activeSite.earthLinkPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Commander Role & Priority */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400 mb-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {t(lang, 'prep.role')}
                </div>
                <div className="flex flex-col gap-1.5">
                  {COMMANDER_ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setCommanderRole(r.id)}
                      className={`text-left px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${
                        commanderRole === r.id
                          ? 'bg-emerald-950/70 border-emerald-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold">{t(lang, r.nameKey)}</div>
                      <div className="text-[10px] text-emerald-300">{t(lang, r.bonusKey)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400 mb-2">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    {t(lang, 'prep.priority')}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {MISSION_PRIORITIES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`text-left px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${
                          priority === p.id
                            ? 'bg-cyan-950/70 border-cyan-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs font-bold">{t(lang, p.nameKey)}</div>
                        <div className="text-[10px] text-slate-300">{t(lang, p.descKey)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration & Crew */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      {t(lang, 'prep.duration')}
                    </div>
                    <div className="flex gap-1.5">
                      {([5, 7] as MissionDuration[]).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDuration(d)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                            duration === d
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                              : 'bg-slate-900 text-slate-200 border-slate-700'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                      <Users className="w-3 h-3 text-cyan-400" />
                      {t(lang, 'prep.crew')}
                    </div>
                    <div className="flex gap-1.5">
                      {([2, 4] as CrewSize[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCrewSize(c)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                            crewSize === c
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                              : 'bg-slate-900 text-slate-200 border-slate-700'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Difficulties */}
            <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400 mb-2">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                {t(lang, 'prep.difficulty')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['explorer', 'engineer', 'commander', 'veteran'] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-2 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                      difficulty === diff
                        ? diff === 'veteran'
                          ? 'bg-red-500 text-white border-red-300'
                          : 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {t(lang, `prep.diff.${diff}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {t(lang, `prep.diff.${difficulty}.desc`)}
              </p>
            </div>
          </div>

          {/* Right column: Equipment & Briefing & Launch */}
          <div className="flex flex-col justify-between gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">{t(lang, 'prep.equip.title')}</h3>
                <span className="text-xs font-bold text-cyan-300 tabular-nums">
                  {equipment.length}/3 {t(lang, 'prep.equip.selected')}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {EQUIPMENT_OPTIONS.map((item) => {
                  const selected = equipment.includes(item.id);
                  const disabled = !selected && equipment.length >= 3;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleEquip(item.id)}
                      className={`text-left p-2.5 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                        selected
                          ? 'bg-cyan-950/70 border-cyan-400 text-white cursor-pointer'
                          : disabled
                            ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-[#0c162d] hover:bg-slate-800/80 border-slate-700 text-slate-200 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold">{t(lang, item.nameKey)}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-500/30">
                            {t(lang, item.effectBadgeKey)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">{t(lang, item.descKey)}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                          selected ? 'bg-cyan-400 border-cyan-300 text-slate-950' : 'border-slate-600'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {/* Story Mode & Shared Challenge Code */}
              <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-3 space-y-2.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={storyMode}
                  onClick={() => setStoryMode((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      {t(lang, 'prep.storyMode')}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">{t(lang, 'prep.storyMode.desc')}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 ${
                      storyMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {storyMode ? 'ON' : 'OFF'}
                  </span>
                </button>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-amber-300" />
                      {t(lang, 'prep.challenge.title')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-cyan-300" title={t(lang, 'prep.challenge.yourCode')}>
                        {liveChallengeCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSeed(generateRandomChallengeSeed())}
                        title={t(lang, 'prep.challenge.random')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] font-bold text-amber-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Dices className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(liveChallengeCode);
                            setCopiedCode(true);
                            window.setTimeout(() => setCopiedCode(false), 1800);
                          } catch {
                            setChallengeInput(liveChallengeCode);
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] font-bold text-cyan-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedCode ? t(lang, 'code.copied') : t(lang, 'code.copy')}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={challengeInput}
                      onChange={(e) => {
                        setChallengeInput(e.target.value);
                        if (challengeStatus !== 'idle') setChallengeStatus('idle');
                      }}
                      placeholder={t(lang, 'prep.challenge.placeholder')}
                      aria-label={t(lang, 'prep.challenge.title')}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#081020] border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setChallengeInput(text.trim());
                            setChallengeStatus('idle');
                          }
                        } catch {
                          // Fallback gracefully if clipboard read permission denied
                        }
                      }}
                      title={t(lang, 'code.paste')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      {t(lang, 'code.paste')}
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyChallenge}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer"
                    >
                      {t(lang, 'prep.challenge.apply')}
                    </button>
                  </div>
                  {challengeStatus === 'applied' && (
                    <div className="text-[11px] text-emerald-300 font-semibold">{t(lang, 'prep.challenge.applied')}</div>
                  )}
                  {challengeStatus === 'invalid' && (
                    <div className="text-[11px] text-red-300 font-semibold">{t(lang, 'prep.challenge.invalid')}</div>
                  )}
                </div>
              </div>

              <div className="bg-[#0b182f] border border-cyan-500/20 rounded-xl p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-1">
                  {t(lang, 'prep.briefing.title')}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{t(lang, 'prep.briefing.body')}</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onLaunch({
                    landingSite,
                    commanderRole,
                    priority,
                    duration,
                    crewSize,
                    difficulty,
                    equipment,
                    storyMode,
                    seed,
                    challengeCode: liveChallengeCode,
                  })
                }
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg transition-colors"
              >
                <Rocket className="w-5 h-5" />
                {t(lang, 'prep.launch')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
