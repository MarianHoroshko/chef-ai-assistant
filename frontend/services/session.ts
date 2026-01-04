import { apiUrls } from './config';
import { apiClient } from './apiClient';
import z from 'zod';

const sessionStartSchema = z.object({
  sessionId: z.string(),
});

export type SessionStart = z.infer<typeof sessionStartSchema>;

export const startNewSession = async (): Promise<SessionStart> => {
  const data = await apiClient.post(apiUrls.session.start);

  return sessionStartSchema.parse(data);
};
