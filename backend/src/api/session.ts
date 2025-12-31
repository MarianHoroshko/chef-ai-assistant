import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { addNewSessionToDB, Session, SessionState } from '../services/sessionService';

const router = Router();

/**
 * @openapi
 * /session/start:
 *   post:
 *     summary: Start new chat session
 *     tags: [Session]
 *     description: Starts new chat session and returns it's id
 *     responses:
 *       200:
 *         description: New session id
 */
router.post('/start', (req: Request, res: Response) => {
  const newSession: Session = {
    sessionId: uuid(),
    formData: [],
    summary: null,
    state: SessionState.INITIAL,
    history: [],
  };

  const addedSession = addNewSessionToDB(newSession);

  res.json({ sessionId: addedSession.sessionId });
});

export default router;
