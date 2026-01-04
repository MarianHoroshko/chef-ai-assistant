import z from 'zod';
import { apiUrls } from './config';
import { apiClient } from './apiClient';

const noteSchema = z.object({
  summary: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      category: z.string(),
    })
  ),
  suggested_dishes: z.array(
    z.object({
      course: z.string(),
      dish_name: z.string(),
      rationale: z.string(),
    })
  ),
  state: z.string(),
});

export type Note = z.infer<typeof noteSchema>;

export const generateInitialNote = async ({ sessionId }: { sessionId: string }): Promise<Note> => {
  const data = await apiClient.post(apiUrls.agent.initialNote, { sessionId });
  return noteSchema.parse(data);
};

export const generateRefineNote = async ({ sessionId }: { sessionId: string }): Promise<Note> => {
  const data = await apiClient.post(apiUrls.agent.refineNote, { sessionId });
  return noteSchema.parse(data);
};

export const generateNotePdf = async ({ sessionId }: { sessionId: string }) => {
  const response = await apiClient.post<Blob>(
    apiUrls.agent.generateNotePdf,
    { sessionId },
    {
      headers: {
        Accept: 'application/pdf',
      },
    }
  );
  return response;
};
