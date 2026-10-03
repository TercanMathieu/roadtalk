import {
  type AiRouteDto,
  aiRouteSchema,
  type GenerateAiRouteRequestDto,
} from '@roadtalk/contracts';

import { request } from '../../lib/http';

export async function generateAiRoute(
  accessToken: string,
  body: GenerateAiRouteRequestDto,
): Promise<AiRouteDto> {
  const json = await request('POST', '/ai-routes/generate', { accessToken, body });
  return aiRouteSchema.parse(json);
}
