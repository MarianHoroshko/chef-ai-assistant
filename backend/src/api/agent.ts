import { NextFunction, Request, Response, Router } from 'express';
import z from 'zod';
import { validate } from '../middlewares/validation';
import { getSessionById, SessionState, updateSessionData } from '../services/sessionService';
import {
  generateInitialNote,
  generateRefinedNote,
  SendMessageToModelArguments,
} from '../services/agentService';
import { INTERVIEW_QUESTIONS } from '../agents/chefAgent';
import puppeteer, { Browser } from 'puppeteer';
import { AppError } from '../utils/errors';

const router = Router();

const bodySchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, { error: 'sessionId is required.' }),
  }),
});

type Body = z.infer<typeof bodySchema>;

/**
 * @openapi
 * components:
 *  schemas:
 *    Initial:
 *      type: object
 *      required:
 *        - sessionId
 *      properties:
 *        sessionId:
 *          type: string
 *
 * /agent/initial:
 *   post:
 *     summary: Generate initial note
 *     description: Generating the first draft of the note along with questions to help fill in the details.
 *     tags: [Agent]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Initial'
 *     responses:
 *       200:
 *         description: generated init note
 *       400:
 *         description: validation error
 */
router.post(
  '/initial',
  validate(bodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const initial: Body = req;
      const reqBody = initial.body;

      const session = getSessionById(reqBody.sessionId);
      if (!session) throw new AppError(404, 'Session not found.');

      // Store submitted answers
      session.submitedAnswers = [...session.submitedAnswers, ...session.formData];

      // prepare conversation to be used by model
      const conversation: SendMessageToModelArguments[] =
        session?.formData.flatMap((item) => {
          const question = INTERVIEW_QUESTIONS[item.questionId];

          return {
            systemMessage: `System question: ${question.text}. Question category: ${question.category} `,
            userMessage: item.userAnswer,
          };
        }) ?? [];

      // generate note and questions
      const modelResponse = await generateInitialNote(conversation);
      if (!modelResponse) throw new AppError(500, 'Something went wrong on the server.');

      // update session
      session.summary = { note: modelResponse?.note ?? '' };
      session.history = [...session.history, modelResponse];
      session.formData = []; // Clear form data after processing

      session.state =
        modelResponse.questions && modelResponse.questions.length > 0
          ? SessionState.PENDING
          : SessionState.COMPLETE;

      updateSessionData(reqBody.sessionId, session);

      res.json({
        summary: modelResponse?.note,
        questions: modelResponse?.questions,
        suggested_dishes: modelResponse?.suggested_dishes,
        state: session.state,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * components:
 *  schemas:
 *    Initial:
 *      type: object
 *      required:
 *        - sessionId
 *      properties:
 *        sessionId:
 *          type: string
 *
 * /agent/refine:
 *   post:
 *     summary: Update note
 *     description: Update the note based on the client’s responses.
 *     tags: [Agent]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Initial'
 *     responses:
 *       200:
 *         description: generated init note
 *       400:
 *         description: validation error
 */
router.post(
  '/refine',
  validate(bodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const initial: Body = req;
      const reqBody = initial.body;

      const session = getSessionById(reqBody.sessionId);
      if (!session) throw new AppError(404, 'Session not found.');

      // Store submitted answers
      session.submitedAnswers = [...session.submitedAnswers, ...session.formData];

      // prepare conversation to be used by model
      const lastModelResponse = session.history[session.history.length - 1];

      // Build a map of all questions from the entire history
      const allQuestionsMap = new Map();

      // Add initial interview questions
      Object.values(INTERVIEW_QUESTIONS).forEach(q => {
        allQuestionsMap.set(q.id, q);
      });

      // Add generated questions from history
      session.history.forEach(response => {
        response.questions?.forEach(q => {
          allQuestionsMap.set(q.id, q);
        });
      });

      const conversation: SendMessageToModelArguments[] =
        session.submitedAnswers.flatMap((item) => {
          const question = allQuestionsMap.get(item.questionId);

          return {
            systemMessage: `System question: ${question?.text ?? ''}. Question category: ${question?.category ?? ''} `,
            userMessage: item.userAnswer,
          };
        }) ?? [];

      // generate refined note and questions if needed
      const modelResponse = await generateRefinedNote(conversation, lastModelResponse.note);
      if (!modelResponse) throw new AppError(500, 'Something went wrong on the server.');

      // update session
      session.summary = { note: modelResponse?.note ?? '' };
      session.history = [...session.history, modelResponse];
      session.formData = []; // Clear form data after processing

      session.state =
        modelResponse.questions && modelResponse.questions.length > 0
          ? SessionState.PENDING
          : SessionState.COMPLETE;

      updateSessionData(reqBody.sessionId, session);

      res.json({
        summary: modelResponse.note,
        questions: modelResponse.questions,
        suggested_dishes: modelResponse?.suggested_dishes,
        state: session.state,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * components:
 *  schemas:
 *    Initial:
 *      type: object
 *      required:
 *        - sessionId
 *      properties:
 *        sessionId:
 *          type: string
 *
 * /agent/generate-pdf:
 *   post:
 *     summary: Generate PDF from last note
 *     description: Generate PDF from last note.
 *     tags: [Agent]
 *     requestBody:
 *        required: true
 *        content:
 *          application/pdf:
 *            schema:
 *              $ref: '#/components/schemas/Initial'
 *     responses:
 *       200:
 *         description: downloadable pdf
 *       400:
 *         description: validation error
 */
router.post('/generate-pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;

    const session = getSessionById(sessionId);
    if (!session) throw new AppError(404, 'Session not found.');

    const lastModelResponse = session.history[session.history.length - 1];
    const noteInHTML = lastModelResponse?.html;

    if (!noteInHTML) throw new AppError(400, 'No content to generate PDF.');

    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();

      await page.setContent(noteInHTML, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="generated_note.pdf"',
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error: unknown) {
      console.error('PDF Generation Error:', error);

      const message = error instanceof Error ? error.message : 'Failed to generate PDF';
      throw new AppError(500, (message ?? 'Error occurred') || 'Failed to generate PDF');
    } finally {
      if (browser) await browser.close();
    }
  } catch (error) {
    next(error);
  }
});

export default router;
