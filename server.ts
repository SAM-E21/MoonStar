import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

interface CachedResponse<T> {
  timestamp: number;
  data: T;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
let donkiCache: CachedResponse<unknown> | null = null;
let osdrCache: CachedResponse<unknown> | null = null;
let radlabCache: CachedResponse<unknown> | null = null;

// Real historical NASA DONKI events used strictly as a clearly labeled archived fallback
// when api.nasa.gov is unreachable, rate-limited, or returns no recent records.
const ARCHIVED_DONKI_EVENTS = [
  {
    id: '2024-05-10T06:54:00-FLR-001',
    type: 'FLR',
    date: '2024-05-10T06:54Z',
    classType: 'X3.9',
    sourceLocation: 'S20W12 (AR13664)',
    summary: 'Major X3.9 solar flare observed by GOES-16 from Active Region 13664.',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/30854/-1',
  },
  {
    id: '2024-05-10T17:00:00-GST-001',
    type: 'GST',
    date: '2024-05-10T17:00Z',
    kpIndex: 9,
    sourceLocation: 'Earth Magnetosphere',
    summary: 'Extreme G5 geomagnetic storm (Kp = 9) triggered by multiple Earth-directed CMEs.',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/GST/30879/-1',
  },
  {
    id: '2024-05-08T05:36:00-CME-001',
    type: 'CME',
    date: '2024-05-08T05:36Z',
    speedKms: 1418,
    sourceLocation: 'SOHO LASCO C2/C3',
    summary: 'Fast halo Coronal Mass Ejection associated with AR13664 activity (~1,418 km/s).',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/30801/-1',
  },
  {
    id: '2024-10-03T12:18:00-FLR-001',
    type: 'FLR',
    date: '2024-10-03T12:18Z',
    classType: 'X9.0',
    sourceLocation: 'S16W05 (AR13842)',
    summary: 'Intense X9.0 solar flare detected by GOES X-ray sensors.',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/33751/-1',
  },
];

const ARCHIVED_OSDR_STUDIES = [
  {
    accession: 'OSD-102',
    title: 'Rodent Research-3 (RR-3): Musculoskeletal adaptation to microgravity',
    organism: 'Mus musculus',
    center: 'Ames Research Center (ARC)',
    mission: 'SpaceX-8 / ISS',
    description: 'Evaluates skeletal muscle atrophy and bone microstructure changes during spaceflight.',
    url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-102',
  },
  {
    accession: 'OSD-370',
    title: 'APEX-07: Arabidopsis thaliana gene expression in spaceflight',
    organism: 'Arabidopsis thaliana',
    center: 'Kennedy Space Center (KSC)',
    mission: 'SpaceX-22 / ISS',
    description: 'Investigates plant root and shoot transcriptome responses under controlled LED habitats.',
    url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-370',
  },
  {
    accession: 'OSD-361',
    title: 'ISS Surfaces Bacterial Genomes from MT-2 (ISS-MOP)',
    organism: 'Micrococcus luteus, Staphylococcus epidermidis',
    center: 'Ames Research Center (ARC)',
    mission: 'SpaceX-11 / ISS',
    description: 'Characterizes microbial genomes sampled from surfaces inside International Space Station modules.',
    url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-361',
  },
];

const ARCHIVED_RADLAB_ISS = {
  sourceType: 'archived' as const,
  sourceName: 'NASA OSDR RadLab — ISS Reference Archive',
  endpoint: 'https://visualization.osdr.nasa.gov/radlab/api/',
  disclaimer:
    'ISS measurements come from Low Earth Orbit inside Earth’s protective magnetosphere and CANNOT be used directly as lunar surface radiation doses.',
  measurements: [
    {
      id: 'iss-dostel2-2022-04',
      instrument: 'DosTel2 (Columbus Module)',
      date: '2022-04-01T23:00:00Z',
      doseRate: 10.22,
      unit: 'µGy/h',
      orbitAltitudeKm: 429,
      notes: 'Archived DosTel2 absorbed dose rate measurement inside Columbus module.',
    },
    {
      id: 'iss-dostel1-2022-04',
      instrument: 'DosTel1 (Columbus Module)',
      date: '2022-04-02T01:03:00Z',
      doseRate: 4.75,
      unit: 'µGy/h',
      orbitAltitudeKm: 420,
      notes: 'Archived DosTel1 reading along ISS orbit.',
    },
  ],
};

function formatDateYMD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function fetchWithTimeout(url: string, timeoutMs = 5500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'lunaris-mission-server' });
  });

  app.get('/api/nasa/donki', async (req, res) => {
    const forceRefresh = req.query.refresh === '1';
    if (!forceRefresh && donkiCache && Date.now() - donkiCache.timestamp < CACHE_TTL_MS) {
      return res.json(donkiCache.data);
    }

    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = formatDateYMD(start);
    const endDate = formatDateYMD(now);

    try {
      const [flrRes, cmeRes, gstRes] = await Promise.all([
        fetchWithTimeout(
          `https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${encodeURIComponent(NASA_API_KEY)}`,
        ),
        fetchWithTimeout(
          `https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${encodeURIComponent(NASA_API_KEY)}`,
        ),
        fetchWithTimeout(
          `https://api.nasa.gov/DONKI/GST?startDate=${startDate}&endDate=${endDate}&api_key=${encodeURIComponent(NASA_API_KEY)}`,
        ),
      ]);

      if (!flrRes.ok && !cmeRes.ok && !gstRes.ok) {
        throw new Error(`DONKI HTTP ${flrRes.status}/${cmeRes.status}/${gstRes.status}`);
      }

      const flrJson = flrRes.ok ? ((await flrRes.json()) as Array<Record<string, unknown>>) : [];
      const cmeJson = cmeRes.ok ? ((await cmeRes.json()) as Array<Record<string, unknown>>) : [];
      const gstJson = gstRes.ok ? ((await gstRes.json()) as Array<Record<string, unknown>>) : [];

      const events: Array<Record<string, unknown>> = [];

      if (Array.isArray(flrJson)) {
        for (const item of flrJson.slice(0, 4)) {
          events.push({
            id: String(item.flrID || `FLR-${item.beginTime}`),
            type: 'FLR',
            date: String(item.beginTime || ''),
            classType: String(item.classType || 'Observed'),
            sourceLocation: String(item.sourceLocation || 'Solar Disk'),
            summary: `Solar flare class ${String(item.classType || 'N/A')} observed from ${String(item.sourceLocation || 'Solar Disk')}.`,
            link: String(item.link || 'https://ccmc.gsfc.nasa.gov/tools/DONKI/'),
          });
        }
      }

      if (Array.isArray(cmeJson)) {
        for (const item of cmeJson.slice(0, 4)) {
          const analyses = Array.isArray(item.cmeAnalyses) ? item.cmeAnalyses : [];
          const firstAnalysis = analyses[0] as Record<string, unknown> | undefined;
          const speed = firstAnalysis?.speed ? Number(firstAnalysis.speed) : undefined;
          const rawNote = String(item.note || 'Coronal Mass Ejection cataloged by NASA CCMC DONKI.');
          const cleanSummary = rawNote.length > 165 ? `${rawNote.slice(0, 162).trimEnd()}...` : rawNote;
          events.push({
            id: String(item.activityID || `CME-${item.startTime}`),
            type: 'CME',
            date: String(item.startTime || ''),
            speedKms: speed,
            sourceLocation: String(item.sourceLocation || 'SOHO / STEREO'),
            summary: cleanSummary,
            link: String(item.link || 'https://ccmc.gsfc.nasa.gov/tools/DONKI/'),
          });
        }
      }

      if (Array.isArray(gstJson)) {
        for (const item of gstJson.slice(0, 3)) {
          const kpList = Array.isArray(item.allKpIndex) ? item.allKpIndex : [];
          const maxKp = kpList.reduce((acc: number, k: Record<string, unknown>) => {
            const val = Number(k.kpIndex || 0);
            return val > acc ? val : acc;
          }, 0);
          events.push({
            id: String(item.gstID || `GST-${item.startTime}`),
            type: 'GST',
            date: String(item.startTime || ''),
            kpIndex: maxKp || undefined,
            sourceLocation: 'Earth Magnetosphere',
            summary: `Geomagnetic storm recorded${maxKp ? ` with peak Kp index ${maxKp}` : ''}.`,
            link: String(item.link || 'https://ccmc.gsfc.nasa.gov/tools/DONKI/'),
          });
        }
      }

      if (events.length === 0) {
        const fallbackPayload = {
          sourceType: 'archived',
          sourceName: 'NASA DONKI Space Weather Database (Archived Historical Reference)',
          endpoint: 'https://api.nasa.gov/DONKI/',
          fetchedAt: new Date().toISOString(),
          note: 'No recent live events returned for the queried window; showing verified archived NASA DONKI events.',
          events: ARCHIVED_DONKI_EVENTS,
        };
        donkiCache = { timestamp: Date.now(), data: fallbackPayload };
        return res.json(fallbackPayload);
      }

      events.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const livePayload = {
        sourceType: 'live',
        sourceName: 'NASA CCMC DONKI Live API (api.nasa.gov)',
        endpoint: `https://api.nasa.gov/DONKI/ (window ${startDate} to ${endDate})`,
        fetchedAt: new Date().toISOString(),
        note: 'Live space weather telemetry retrieved directly from NASA DONKI.',
        events: events.slice(0, 8),
      };
      donkiCache = { timestamp: Date.now(), data: livePayload };
      return res.json(livePayload);
    } catch {
      return res.json({
        sourceType: 'archived',
        sourceName: 'NASA DONKI Space Weather Database (Archived Historical Reference)',
        endpoint: 'https://api.nasa.gov/DONKI/',
        fetchedAt: new Date().toISOString(),
        note: 'Live NASA DONKI API is currently unreachable or rate-limited; displaying verified archived NASA DONKI events.',
        events: ARCHIVED_DONKI_EVENTS,
      });
    }
  });

  app.get('/api/nasa/osdr', async (req, res) => {
    const query = String(req.query.q || 'spaceflight OR arabidopsis OR bone OR radiation').trim();
    const forceRefresh = req.query.refresh === '1';

    if (!forceRefresh && query === 'spaceflight OR arabidopsis OR bone OR radiation' && osdrCache && Date.now() - osdrCache.timestamp < CACHE_TTL_MS) {
      return res.json(osdrCache.data);
    }

    try {
      const apiUrl = `https://osdr.nasa.gov/osdr/data/search?term=${encodeURIComponent(query)}&type=cgene&size=8`;
      const response = await fetchWithTimeout(apiUrl, 6000);
      if (!response.ok) {
        throw new Error(`OSDR HTTP ${response.status}`);
      }
      const json = (await response.json()) as {
        hits?: {
          total?: number;
          hits?: Array<{ _source?: Record<string, unknown> }>;
        };
      };

      const hits = json?.hits?.hits ?? [];
      const studies = hits
        .map((h) => h._source)
        .filter((s): s is Record<string, unknown> => Boolean(s && s.Accession))
        .map((s) => {
          const accession = String(s.Accession || '');
          const missionRaw = s.Mission as Record<string, unknown> | undefined;
          const missionName = missionRaw && typeof missionRaw === 'object' ? String(missionRaw.Name || '') : '';
          const orgRaw = s.organism;
          const organism = Array.isArray(orgRaw)
            ? orgRaw.join(', ')
            : String(orgRaw || 'Multiple organisms').replace(/\s+/g, ' ').trim();
          const rawDesc = String(s['Study Description'] || s['Study Protocol Description'] || '');
          const cleanDesc = rawDesc.length > 220 ? `${rawDesc.slice(0, 217).trimEnd()}...` : rawDesc;

          return {
            accession,
            title: String(s['Study Title'] || accession),
            organism: organism.length > 90 ? `${organism.slice(0, 87).trimEnd()}...` : organism || 'Space Biology Specimen',
            center: String(s['Managing NASA Center'] || 'NASA GeneLab / OSDR'),
            mission: missionName || String(s['Space Program'] || 'NASA Space Biology'),
            description: cleanDesc || 'Public spaceflight biology dataset hosted on NASA Open Science Data Repository.',
            url: String(s['Authoritative Source URL'] || `https://osdr.nasa.gov/bio/repo/data/studies/${accession}`),
          };
        });

      if (studies.length === 0) {
        throw new Error('No OSDR hits returned');
      }

      const payload = {
        sourceType: 'live' as const,
        sourceName: 'NASA Open Science Data Repository Live Search API',
        endpoint: apiUrl,
        totalMatches: json?.hits?.total ?? studies.length,
        fetchedAt: new Date().toISOString(),
        studies,
      };

      if (query === 'spaceflight OR arabidopsis OR bone OR radiation') {
        osdrCache = { timestamp: Date.now(), data: payload };
      }
      return res.json(payload);
    } catch {
      return res.json({
        sourceType: 'archived' as const,
        sourceName: 'NASA OSDR Reference Archive',
        endpoint: 'https://osdr.nasa.gov/osdr/data/search',
        totalMatches: ARCHIVED_OSDR_STUDIES.length,
        fetchedAt: new Date().toISOString(),
        studies: ARCHIVED_OSDR_STUDIES,
      });
    }
  });

  app.get('/api/nasa/radlab', async (req, res) => {
    const forceRefresh = req.query.refresh === '1';
    if (!forceRefresh && radlabCache && Date.now() - radlabCache.timestamp < CACHE_TTL_MS) {
      return res.json(radlabCache.data);
    }

    const radlabUrl =
      'https://visualization.osdr.nasa.gov/radlab/api/?spacecraft=ISS&instrument=DosTel&timestamp>=2022-04-01T23:00&timestamp<2022-04-02T01:05&absorbed_dose_rate&altitude&module&format=json';

    try {
      const response = await fetchWithTimeout(radlabUrl, 6500);
      if (!response.ok) {
        throw new Error(`RadLab HTTP ${response.status}`);
      }
      const json = (await response.json()) as {
        columns?: string[];
        data?: Array<Array<string | number>>;
      };

      const cols = json.columns ?? [];
      const rows = json.data ?? [];
      const idxTs = cols.indexOf('timestamp');
      const idxInst = cols.indexOf('instrument');
      const idxDose = cols.indexOf('absorbed_dose_rate');
      const idxAlt = cols.indexOf('altitude');
      const idxMod = cols.indexOf('module');

      if (rows.length === 0 || idxTs === -1 || idxDose === -1) {
        throw new Error('Unexpected RadLab schema');
      }

      // Sample 6 evenly spaced live measurements from the API response
      const step = Math.max(1, Math.floor(rows.length / 6));
      const sampled: Array<{
        id: string;
        instrument: string;
        date: string;
        doseRate: number;
        unit: string;
        orbitAltitudeKm: number;
        notes: string;
      }> = [];

      for (let i = 0; i < rows.length && sampled.length < 6; i += step) {
        const row = rows[i];
        const ts = String(row[idxTs] ?? '');
        const inst = String(row[idxInst] ?? 'DosTel');
        const mod = String(row[idxMod] ?? 'Columbus');
        const dose = Number(Number(row[idxDose] ?? 0).toFixed(2));
        const alt = Math.round(Number(row[idxAlt] ?? 420));
        sampled.push({
          id: `rad-${i}-${ts}`,
          instrument: `${inst} (${mod} Module)`,
          date: ts,
          doseRate: dose,
          unit: 'µGy/h',
          orbitAltitudeKm: alt,
          notes: `Live ISS telemetry sample from NASA RadLab API (${rows.length} readings returned in query).`,
        });
      }

      const livePayload = {
        sourceType: 'live' as const,
        sourceName: 'NASA OSDR RadLab Live Data API (visualization.osdr.nasa.gov)',
        endpoint: radlabUrl,
        fetchedAt: new Date().toISOString(),
        totalRowsReturned: rows.length,
        disclaimer:
          'ISS measurements come from Low Earth Orbit inside Earth’s protective magnetosphere and CANNOT be used directly as lunar surface radiation doses.',
        measurements: sampled,
      };
      radlabCache = { timestamp: Date.now(), data: livePayload };
      return res.json(livePayload);
    } catch {
      return res.json({
        ...ARCHIVED_RADLAB_ISS,
        fetchedAt: new Date().toISOString(),
        totalRowsReturned: ARCHIVED_RADLAB_ISS.measurements.length,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LUNARIS Mission Server running at http://localhost:${PORT}`);
  });
}

startServer();
