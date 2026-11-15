import { getOsdrData, jsonApiResponse } from '../../../server/nasaHandlers';

interface Env {
  NASA_API_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  try {
    const url = new URL(context.request.url);
    const query = url.searchParams.get('q') ?? undefined;
    const forceRefresh = url.searchParams.get('refresh') === '1';
    const data = await getOsdrData({ query, forceRefresh });
    return jsonApiResponse(data, 200, forceRefresh);
  } catch {
    return jsonApiResponse({ error: 'Unable to process NASA OSDR request' }, 500, true);
  }
};
