import { getDonkiData, jsonApiResponse } from '../../../server/nasaHandlers';

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
    const forceRefresh = url.searchParams.get('refresh') === '1';
    const data = await getDonkiData({
      apiKey: context.env?.NASA_API_KEY,
      forceRefresh,
    });
    return jsonApiResponse(data, 200, forceRefresh);
  } catch {
    return jsonApiResponse({ error: 'Unable to process NASA DONKI request' }, 500, true);
  }
};
