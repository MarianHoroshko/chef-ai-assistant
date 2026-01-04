import { z } from 'zod';
import { apiUrls } from './config';
import { apiClient } from './apiClient';

const questionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      category: z.string(),
    })
  ),
});

export type Questions = z.infer<typeof questionsSchema>;

export const getQuestions = async (): Promise<Questions> => {
  const data = await apiClient.get(apiUrls.form.getQuestions);
  return questionsSchema.parse(data);
};

export const sendQuestionAnswer = async ({
  sessionId,
  questionId,
  userAnswer,
}: {
  sessionId: string;
  questionId: string;
  userAnswer: string;
}) => {
  await apiClient.post(apiUrls.form.step, {
    sessionId,
    data: {
      questionId,
      userAnswer,
    },
  });
};
