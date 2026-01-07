import z from 'zod';
import { getDBInstance } from '../infra/dbMemory';
import { stepQuestion } from '../api/form';
import { modelResponseSchema } from './agentService';

export enum SessionState {
  INITIAL = 'initial',
  ACTIVE = 'active',
  PENDING = 'pending',
  COMPLETE = 'complete',
}

export const sessionSchema = z.object({
  sessionId: z.string(),
  formData: z.array(stepQuestion),
  summary: z
    .object({
      note: z.string(),
    })
    .nullable(),
  state: z.enum(SessionState),
  history: z.array(modelResponseSchema),
  submitedAnswers: z.array(stepQuestion),
});

export type Session = z.infer<typeof sessionSchema>;

type CreateNewSessionResponse = { sessionId: string };

const _dbInstance = getDBInstance();

export const getAllSessions = (): Session[] => {
  return _dbInstance.sessions;
};

export const getSessionById = (sessionId: string): Session | null => {
  const searchedSession = _dbInstance.sessions.find((session) => session.sessionId === sessionId);

  if (searchedSession !== undefined) return searchedSession;
  return null;
};

export const addNewSessionToDB = (newSession: Session): CreateNewSessionResponse => {
  _dbInstance.sessions.push(newSession);

  return { sessionId: newSession.sessionId };
};

export const updateSessionData = (sessionId: string, updatedSession: Session) => {
  const sessionIndex = _dbInstance.sessions.findIndex(
    (session) => session.sessionId === sessionId
  );
  if (sessionIndex !== -1) {
    _dbInstance.sessions[sessionIndex] = updatedSession;
  }
};
