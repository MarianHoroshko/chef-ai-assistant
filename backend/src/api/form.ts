import { NextFunction, Request, Response, Router } from 'express';
import z from 'zod';
import { getSessionById, SessionState, updateSessionData } from '../services/sessionService';
import { validate } from '../middlewares/validation';
import { INTERVIEW_QUESTIONS } from '../agents/chefAgent';
import { AppError } from '../utils/errors';

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
router.post(
  '/step',
  validate(stepSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const step: Step = req;
      const reqBody = step.body;

      const session = getSessionById(reqBody.sessionId);
      if (!session) throw new AppError(404, 'Session not found.');

      session.formData = [...session.formData, reqBody.data];
      session.state = SessionState.ACTIVE;

      updateSessionData(reqBody.sessionId, session);

      res.json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  },
);

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
router.get('/get-questions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const arrayOfQuestions = Object.keys(INTERVIEW_QUESTIONS).map((key) => ({
      ...INTERVIEW_QUESTIONS[key as keyof typeof INTERVIEW_QUESTIONS],
    }));

    res.json({
      questions: arrayOfQuestions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
