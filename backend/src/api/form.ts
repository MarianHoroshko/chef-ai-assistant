import { Router, Request, Response } from 'express';
import z from 'zod';
import { getSessionById, SessionState, updateSessionData } from '../services/sessionService';
import { validate } from '../middlewares/validation';
import { INTERVIEW_QUESTIONS } from '../agents/chefAgent';

const router = Router();

export const stepQuestion = z.object({
  questionId: z.string().min(1, { error: 'question id is required.' }),
  userAnswer: z.string().min(1, { error: 'user answer is required.' }),
});

const stepSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, { error: 'session id is required.' }),
    data: stepQuestion,
  }),
});

type Step = z.infer<typeof stepSchema>;

/**
 * @openapi
 * components:
 *   schemas:
 *     Step:
 *       type: object
 *       required:
 *         - sessionId
 *         - data
 *       properties:
 *         sessionId:
 *           type: string
 *         data:
 *           type: object
 *           required:
 *             - questionId
 *             - userAnswer
 *           properties:
 *             questionId:
 *               type: string
 *             userAnswer:
 *               type: string
 *
 * /form/step:
 *   post:
 *     summary: Saves step data
 *     description: Saves single form step
 *     tags: [Form]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Step'
 *     responses:
 *       200:
 *         description: step status
 *       400:
 *         description: validation error
 */
router.post('/step', validate(stepSchema), (req: Request, res: Response) => {
  const step: Step = req;
  const reqBody = step.body;

  const session = getSessionById(reqBody.sessionId);
  if (!session) return res.status(404).json({ err: 404, message: 'Session not found.' });

  session.formData = [...session.formData, reqBody.data];
  session.state = SessionState.ACTIVE;

  updateSessionData(reqBody.sessionId, session);

  return res.json({ status: 'ok' });
});

/**
 * @openapi
 *
 * /form/get-questions:
 *   get:
 *     summary: Returns list of interview questions
 *     description: Returns list of interview questions
 *     tags: [Form]
 *     responses:
 *       200:
 *         description: return questions
 */
router.get('/get-questions', (req: Request, res: Response) => {
  const arrayOfQuestions = Object.keys(INTERVIEW_QUESTIONS).map((key) => ({
    ...INTERVIEW_QUESTIONS[key as keyof typeof INTERVIEW_QUESTIONS],
  }));

  return res.json({
    questions: arrayOfQuestions,
  });
});

export default router;
