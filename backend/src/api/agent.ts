import { Router, Request, Response } from 'express';
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
router.post('/initial', validate(bodySchema), async (req: Request, res: Response) => {
  const initial: Body = req;
  const reqBody = initial.body;

  const session = getSessionById(reqBody.sessionId);
  if (!session) return res.status(404).json({ err: 404, message: 'Session not found.' });

  // prepare conversation to be used by model
  const conversation: SendMessageToModelArguments[] =
    session?.formData.flatMap((item) => {
      const question = INTERVIEW_QUESTIONS[item.questionId];

      return {
        systemMessage: `System question: ${question.text}. Question category: ${question.category}`,
        userMessage: item.userAnswer,
      };
    }) ?? [];

  // generate note and questions
  const modelResponse = await generateInitialNote(conversation);
  if (!modelResponse)
    return res.status(500).json({ err: 500, message: 'Something went wrong on the server.' });

  // update session
  session.summary = { note: modelResponse?.note ?? '' };
  session.state = SessionState.PENDING;
  session.history = [...session.history, modelResponse];

  updateSessionData(reqBody.sessionId, session);

  return res.json({
    summary: modelResponse?.note,
    questions: modelResponse?.questions,
    suggested_dishes: modelResponse?.suggested_dishes,
    state: session.state,
  });
});

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
router.post('/refine', validate(bodySchema), async (req: Request, res: Response) => {
  const initial: Body = req;
  const reqBody = initial.body;

  const session = getSessionById(reqBody.sessionId);
  if (!session) return res.status(404).json({ err: 404, message: 'Session not found.' });

  // prepare conversation to be used by model
  const lastModelResponse = session.history[session.history.length - 1];
  const conversation: SendMessageToModelArguments[] =
    session?.formData.flatMap((item) => {
      const question = lastModelResponse.questions.find(
        (question) => question.id === item.questionId,
      );

      return {
        systemMessage: `System question: ${question?.text ?? ''}. Question category: ${question?.category ?? ''}`,
        userMessage: item.userAnswer,
      };
    }) ?? [];

  // generate refined note and questions if needed
  const modelResponse = await generateRefinedNote(conversation, lastModelResponse.note);
  if (!modelResponse)
    return res.status(500).json({ err: 500, message: 'Something went wrong on the server.' });

  // update session
  session.summary = { note: modelResponse?.note ?? '' };
  session.history = [...session.history, modelResponse];

  session.state =
    modelResponse.questions && modelResponse.questions.length > 0
      ? SessionState.PENDING
      : SessionState.COMPLETE;

  updateSessionData(reqBody.sessionId, session);

  if (modelResponse.questions && modelResponse.questions.length > 0)
    return res.json({
      summary: modelResponse.note,
      questions: modelResponse.questions,
      suggested_dishes: modelResponse?.suggested_dishes,
      state: session.state,
    });

  return res.json({
    summary: modelResponse.note,
    suggested_dishes: modelResponse?.suggested_dishes,
    state: session.state,
  });
});

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
router.post('/generate-pdf', async (req: Request, res: Response) => {
  const { sessionId } = req.body; // Cleaner destructuring

  const session = getSessionById(sessionId);
  if (!session) {
    return res.status(404).json({ err: 404, message: 'Session not found.' });
  }

  const lastModelResponse = session.history[session.history.length - 1];
  const noteInHTML = lastModelResponse?.html;

  if (!noteInHTML) {
    return res.status(400).json({ err: 400, message: 'No content to generate PDF.' });
  }

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'], // Added shm usage for Docker
    });

    const page = await browser.newPage();

    // 1. Set content with a timeout to prevent hanging
    await page.setContent(noteInHTML, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // 2. Generate Buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });

    // 3. Clear any existing headers and set explicitly
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="generated_note.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    // 4. Use end() to send the buffer directly
    return res.end(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    // Ensure we only send one response
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate PDF' });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

export default router;
