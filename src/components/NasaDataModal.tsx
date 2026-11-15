import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Dna,
  ExternalLink,
  Lightbulb,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  Sun,
  X,
} from 'lucide-react';
import { t } from '../i18n/translations';
import type { DonkiEventItem, DonkiResponse, Language, OsdrResponse, RadLabResponse } from '../types/game';

interface NasaDataModalProps {
  lang: Language;
  canSimulateInMission?: boolean;
  onSimulateWeather?: (ev: DonkiEventItem) => void;
  onClose: () => void;
}

export const NasaDataModal: React.FC<NasaDataModalProps> = ({
  lang,
  canSimulateInMission = false,
  onSimulateWeather,
  onClose,
}) => {
  const [tab, setTab] = useState<'donki' | 'osdr' | 'radlab'>('donki');
  const [donki, setDonki] = useState<DonkiResponse | null>(null);
  const [osdr, setOsdr] = useState<OsdrResponse | null>(null);
  const [radlab, setRadlab] = useState<RadLabResponse | null>(null);
  const [osdrQuery, setOsdrQuery] = useState('spaceflight OR arabidopsis OR bone OR radiation');
  const [loading, setLoading] = useState(false);

  const loadAll = async (forceRefresh = false, customOsdrQuery?: string) => {
    setLoading(true);
    const refreshParam = forceRefresh ? '&refresh=1' : '';
    const q = customOsdrQuery ?? osdrQuery;
    try {
      const [dRes, oRes, rRes] = await Promise.all([
        fetch(`/api/nasa/donki?${forceRefresh ? 'refresh=1' : ''}`),
        fetch(`/api/nasa/osdr?q=${encodeURIComponent(q)}${refreshParam}`),
        fetch(`/api/nasa/radlab?${forceRefresh ? 'refresh=1' : ''}`),
      ]);
      if (dRes.ok) {
        setDonki((await dRes.json()) as DonkiResponse);
      }
      if (oRes.ok) {
        setOsdr((await oRes.json()) as OsdrResponse);
      }
      if (rRes.ok) {
        setRadlab((await rRes.json()) as RadLabResponse);
      }
    } catch {
      // Handled gracefully by empty/retry UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll(false);
  }, []);

  const searchOsdrTerm = async (term: string) => {
    setOsdrQuery(term);
    setLoading(true);
    try {
      const res = await fetch(`/api/nasa/osdr?q=${encodeURIComponent(term)}&refresh=1`);
      if (res.ok) {
        setOsdr((await res.json()) as OsdrResponse);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleOsdrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osdrQuery.trim()) return;
    await searchOsdrTerm(osdrQuery.trim());
  };

  const osdrTopics = [
    { key: 'plants', query: 'arabidopsis OR plant OR hydroponic', labelKey: 'nasa.osdr.topic.plants' },
    { key: 'bones', query: 'bone OR muscle OR rodent', labelKey: 'nasa.osdr.topic.bones' },
    { key: 'radiation', query: 'radiation OR cosmic OR dna', labelKey: 'nasa.osdr.topic.radiation' },
    { key: 'microbes', query: 'bacteria OR microbe OR surface', labelKey: 'nasa.osdr.topic.microbes' },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-[#040813]/85 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#081022] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">{t(lang, 'nasa.title')}</h2>
            <p className="text-xs md:text-sm text-cyan-300 mt-0.5">{t(lang, 'nasa.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAll(true)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {t(lang, 'nasa.refresh')}
            </button>
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 my-4">
          <button
            type="button"
            onClick={() => setTab('donki')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
              tab === 'donki'
                ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                : 'bg-[#0d162c] text-slate-200 border-slate-700 hover:border-slate-500'
            }`}
          >
            <Sun className="w-4 h-4" />
            {t(lang, 'nasa.tab.donki')}
          </button>
          <button
            type="button"
            onClick={() => setTab('osdr')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
              tab === 'osdr'
                ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                : 'bg-[#0d162c] text-slate-200 border-slate-700 hover:border-slate-500'
            }`}
          >
            <Dna className="w-4 h-4" />
            {t(lang, 'nasa.tab.osdr')}
          </button>
          <button
            type="button"
            onClick={() => setTab('radlab')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
              tab === 'radlab'
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-[#0d162c] text-slate-200 border-slate-700 hover:border-slate-500'
            }`}
          >
            <Activity className="w-4 h-4" />
            {t(lang, 'nasa.tab.radlab')}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-3">
          {tab === 'donki' && (
            <>
              {loading && !donki && <div className="text-sm text-slate-300 py-8 text-center">{t(lang, 'nasa.loading')}</div>}
              {donki && (
                <>
                  <div className="bg-[#0d162c] border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                          donki.sourceType === 'live'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {donki.sourceType === 'live' ? t(lang, 'nasa.source.live') : t(lang, 'nasa.source.archived')}
                      </span>
                      <p className="text-xs text-slate-300 mt-1">{donki.note}</p>
                      {donki.endpoint && (
                        <p className="text-[10px] text-slate-400 mt-0.5 break-all">
                          {t(lang, 'nasa.endpoint')}: {donki.endpoint}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{donki.sourceName}</span>
                  </div>

                  <div className="bg-cyan-950/35 border border-cyan-500/35 rounded-xl p-3.5 flex items-start gap-2.5">
                    <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-extrabold text-cyan-200">{t(lang, 'nasa.kid.title')}</div>
                      <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{t(lang, 'nasa.kid.donki')}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {donki.events.map((ev) => {
                      const intensityPct =
                        ev.type === 'CME'
                          ? Math.min(100, Math.round(((ev.speedKms ?? 450) / 1400) * 100))
                          : ev.type === 'GST'
                            ? Math.min(100, Math.round(((ev.kpIndex ?? 5) / 9) * 100))
                            : ev.classType?.startsWith('X')
                              ? 95
                              : ev.classType?.startsWith('M')
                                ? 65
                                : 35;

                      const kidTitle =
                        ev.type === 'FLR'
                          ? t(lang, 'nasa.donki.flrTitle')
                          : ev.type === 'CME'
                            ? t(lang, 'nasa.donki.cmeTitle')
                            : t(lang, 'nasa.donki.gstTitle');

                      const levelBadge =
                        intensityPct >= 75
                          ? t(lang, 'nasa.donki.high')
                          : intensityPct >= 50
                            ? t(lang, 'nasa.donki.moderate')
                            : t(lang, 'nasa.donki.calm');

                      const impactKey =
                        intensityPct >= 75
                          ? 'nasa.donki.moonImpact.high'
                          : intensityPct >= 50
                            ? 'nasa.donki.moonImpact.moderate'
                            : 'nasa.donki.moonImpact.calm';

                      return (
                        <div key={ev.id} className="bg-[#0c1528] border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span
                                className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                                  intensityPct >= 75
                                    ? 'bg-red-500/20 text-red-200'
                                    : intensityPct >= 50
                                      ? 'bg-amber-500/20 text-amber-200'
                                      : 'bg-emerald-500/20 text-emerald-200'
                                }`}
                              >
                                {levelBadge}
                              </span>
                              <span className="text-[11px] text-slate-400 tabular-nums">{ev.date.slice(0, 16).replace('T', ' ')} UTC</span>
                            </div>

                            <h3 className="text-sm font-extrabold text-white mt-1.5">{kidTitle}</h3>
                            <p className="text-xs text-cyan-200 mt-1 leading-relaxed font-medium">
                              {t(lang, impactKey)}
                            </p>

                            {/* Visual Activity Level Meter for kids */}
                            <div className="mt-2.5 mb-2">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                                <span>{t(lang, 'nasa.viz.stormLevel')}</span>
                                <span className={intensityPct >= 75 ? 'text-amber-300' : 'text-cyan-300'}>
                                  {intensityPct}%
                                </span>
                              </div>
                              <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                                <div
                                  className={`h-full ${intensityPct >= 75 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                                  style={{ width: `${intensityPct}%` }}
                                />
                              </div>
                            </div>

                            <div className="bg-[#081022] border border-slate-800/80 rounded-lg p-2 text-[11px] text-slate-400 leading-relaxed">
                              <span className="font-bold text-slate-300">{t(lang, 'nasa.donki.techDetails')} </span>
                              {ev.type}
                              {ev.classType ? ` · ${ev.classType}` : ''}
                              {ev.speedKms ? ` · ${ev.speedKms} km/s` : ''}
                              {ev.kpIndex ? ` · Kp ${ev.kpIndex}` : ''} — {ev.summary}
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{ev.sourceLocation}</span>
                              <a
                                href={ev.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                              >
                                NASA DONKI <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            {canSimulateInMission && onSimulateWeather && (
                              <button
                                type="button"
                                onClick={() => onSimulateWeather(ev)}
                                className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                {t(lang, 'nasa.simulateWeather')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'osdr' && (
            <div className="space-y-3">
              <div className="bg-emerald-950/35 border border-emerald-500/35 rounded-xl p-3.5 flex items-start gap-2.5">
                <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-extrabold text-emerald-200">{t(lang, 'nasa.kid.title')}</div>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{t(lang, 'nasa.kid.osdr')}</p>
                </div>
              </div>

              {/* Quick kid-friendly topic buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 mr-1">{t(lang, 'nasa.osdr.quickTopics')}</span>
                {osdrTopics.map((tp) => (
                  <button
                    key={tp.key}
                    type="button"
                    disabled={loading}
                    onClick={() => void searchOsdrTerm(tp.query)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                      osdrQuery === tp.query
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                        : 'bg-[#0d162c] hover:bg-slate-800 text-emerald-200 border-slate-700'
                    }`}
                  >
                    {t(lang, tp.labelKey)}
                  </button>
                ))}
              </div>

              <form onSubmit={handleOsdrSearch} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={osdrQuery}
                  onChange={(e) => setOsdrQuery(e.target.value)}
                  placeholder={t(lang, 'nasa.osdr.searchPlaceholder')}
                  className="flex-1 min-w-[220px] px-3 py-2 rounded-xl bg-[#0d162c] border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  {t(lang, 'nasa.osdr.searchBtn')}
                </button>
              </form>

              {loading && !osdr && <div className="text-sm text-slate-300 py-8 text-center">{t(lang, 'nasa.loading')}</div>}

              {osdr && (
                <>
                  <div className="bg-[#0d162c] border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                          osdr.sourceType === 'live'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {osdr.sourceType === 'live' ? t(lang, 'nasa.source.live') : t(lang, 'nasa.source.archived')}
                      </span>
                      <span className="ml-2 text-xs text-emerald-200 font-semibold tabular-nums">
                        {osdr.totalMatches} {t(lang, 'nasa.osdr.matches')}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 break-all">
                        {t(lang, 'nasa.endpoint')}: {osdr.endpoint}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">{osdr.sourceName}</span>
                  </div>

                  {osdr.studies.map((study) => {
                    const textBlob = `${study.organism} ${study.title} ${study.description}`;
                    const isPlant = /arabidopsis|plant|seed|leaf|crop|botan/i.test(textBlob);
                    const isBone = /bone|muscle|musculoskeletal|skeletal|rodent|mus musculus/i.test(textBlob);
                    const isRad = /radiation|cosmic|ray|dna|gamma/i.test(textBlob);
                    const isMicrobe = /bacter|microb|genome|fung|surface/i.test(textBlob);
                    const kidSummaryKey = isPlant
                      ? 'nasa.osdr.kidPlant'
                      : isBone
                        ? 'nasa.osdr.kidBone'
                        : isRad
                          ? 'nasa.osdr.kidRad'
                          : isMicrobe
                            ? 'nasa.osdr.kidMicrobe'
                            : 'nasa.osdr.kidGeneral';

                    return (
                      <div key={study.accession} className="bg-[#0c1528] border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 inline-flex items-center gap-1">
                                {isPlant ? <Sprout className="w-3 h-3" /> : <Dna className="w-3 h-3" />}
                                {study.accession}
                              </span>
                              <span className="text-[11px] text-cyan-300 font-semibold">{study.organism}</span>
                              <span className="text-[11px] text-slate-400">{study.center}</span>
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1.5">{study.title}</h3>
                          </div>
                          <a
                            href={study.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 shrink-0"
                          >
                            OSDR <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="bg-emerald-950/35 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs text-emerald-200 font-medium">
                          {t(lang, kidSummaryKey)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <span className="text-emerald-300 font-semibold">{study.mission}</span> · {study.description}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {tab === 'radlab' && (
            <div className="space-y-3">
              {/* Visual ISS Magnetosphere Shield vs Unshielded Moon Graphic */}
              <div className="bg-[#0c162d] border border-cyan-500/35 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-extrabold text-cyan-200">{t(lang, 'nasa.viz.issVsMoon')}</div>
                <svg viewBox="0 0 360 92" className="w-full h-24 bg-[#070f22] rounded-lg border border-slate-800">
                  <circle cx="56" cy="46" r="18" fill="#0284c7" />
                  <path d="M 48 39 Q 58 43 54 55 Q 64 56 66 44 Z" fill="#4ade80" opacity="0.85" />
                  <path d="M 32 14 C 95 6, 95 86, 32 78" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                  <rect x="82" y="42" width="12" height="6" rx="1" fill="#f8fafc" />
                  <text x="16" y="84" fill="#7dd3fc" fontSize="8.5" fontWeight="bold">ISS · 400 km</text>

                  <line x1="180" y1="8" x2="180" y2="84" stroke="#334155" />

                  <circle cx="290" cy="46" r="16" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="210" y1="26" x2="270" y2="38" stroke="#facc15" strokeWidth="2" />
                  <line x1="210" y1="46" x2="270" y2="46" stroke="#facc15" strokeWidth="2" />
                  <line x1="210" y1="66" x2="270" y2="54" stroke="#facc15" strokeWidth="2" />
                  <text x="242" y="84" fill="#fde047" fontSize="8.5" fontWeight="bold">MOONSTAR · 384,400 km</text>
                </svg>
                <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-semibold">
                  <div className="text-cyan-200">{t(lang, 'nasa.viz.issProtected')}</div>
                  <div className="text-amber-300">{t(lang, 'nasa.viz.moonExposed')}</div>
                </div>
              </div>

              <div className="bg-cyan-950/35 border border-cyan-500/35 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-extrabold text-cyan-200">{t(lang, 'nasa.kid.title')}</div>
                    <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{t(lang, 'nasa.kid.radlab')}</p>
                    <p className="text-xs text-emerald-200 mt-1.5 leading-relaxed font-medium">
                      {t(lang, 'nasa.radlab.unitExplain')}
                    </p>
                  </div>
                </div>
                <div className="bg-[#081022] border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-amber-200 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{t(lang, 'nasa.radlab.moonLesson')}</span>
                </div>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/45 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-100 leading-relaxed font-medium">
                  {t(lang, 'nasa.radlab.warning')}
                </p>
              </div>

              {loading && !radlab && <div className="text-sm text-slate-300 py-8 text-center">{t(lang, 'nasa.loading')}</div>}

              {radlab && (
                <div className="space-y-2.5">
                  <div className="bg-[#0d162c] border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                          radlab.sourceType === 'live'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {radlab.sourceType === 'live' ? t(lang, 'nasa.source.live') : t(lang, 'nasa.source.archived')}
                      </span>
                      {radlab.endpoint && (
                        <p className="text-[10px] text-slate-400 mt-1 break-all">
                          {t(lang, 'nasa.endpoint')}: {radlab.endpoint}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{radlab.sourceName}</span>
                  </div>

                  {radlab.measurements.map((m) => {
                    const isMod = m.doseRate >= 8;
                    const pct = Math.min(100, Math.max(12, Math.round((m.doseRate / 20) * 100)));
                    return (
                      <div key={m.id} className="bg-[#0c1528] border border-slate-800 rounded-xl p-3.5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-white">{m.instrument}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {m.date} · Orbit {m.orbitAltitudeKm} km
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-extrabold text-amber-300 tabular-nums">
                              {m.doseRate} {m.unit}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400">ISS Orbit Only</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className={isMod ? 'text-amber-300' : 'text-emerald-300'}>
                              {t(lang, isMod ? 'nasa.radlab.levelMod' : 'nasa.radlab.levelLow')}
                            </span>
                            <span className="text-slate-400">{m.notes}</span>
                          </div>
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full ${isMod ? 'bg-amber-400' : 'bg-emerald-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
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
