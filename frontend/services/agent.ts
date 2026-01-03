import z from 'zod';
import { apiUrls } from './config';

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
  const response = await fetch(apiUrls.agent.initialNote, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
    }),
  });

  if (!response.ok) throw new Error('Failed to generate initial note');

  const data = await response.json();
  return noteSchema.parse(data);
};

export const generateRefineNote = async ({ sessionId }: { sessionId: string }): Promise<Note> => {
  const response = await fetch(apiUrls.agent.refineNote, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
    }),
  });

  if (!response.ok) throw new Error('Failed to generate initial note');

  const data = await response.json();
  return noteSchema.parse(data);
};

export const generateNotePdf = async ({ sessionId }: { sessionId: string }) => {
  const response = await fetch(apiUrls.agent.generateNotePdf, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
    }),
  });

  if (!response.ok) throw new Error('Failed to generate note pdf');

  const blob = await response.blob();
  return blob;
};
