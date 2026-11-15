import { jsonApiResponse } from '../../server/nasaHandlers';

export const onRequestGet = async (): Promise<Response> => {
  return jsonApiResponse(
    {
      ok: true,
      service: 'moonstar-mission-server',
      runtime: 'cloudflare-pages',
      timestamp: new Date().toISOString(),
    },
    200,
    true,
  );
};
