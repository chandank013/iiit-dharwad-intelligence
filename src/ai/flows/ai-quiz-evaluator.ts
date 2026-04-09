'use server';
/**
 * @fileOverview AI-driven quiz evaluator for instant feedback.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIQuizEvaluatorInputSchema = z.object({
  quizTitle: z.string(),
  questions: z.array(z.object({
    question: z.string(),
    correctAnswerIndex: z.number(),
    explanation: z.string(),
  })),
  studentAnswers: z.array(z.number()),
});
export type AIQuizEvaluatorInput = z.infer<typeof AIQuizEvaluatorInputSchema>;

const AIQuizEvaluatorOutputSchema = z.object({
  score: z.number().describe('Total percentage score'),
  feedback: z.string().describe('General feedback on performance'),
  strengths: z.array(z.string()),
  improvementAreas: z.array(z.string()),
});
export type AIQuizEvaluatorOutput = z.infer<typeof AIQuizEvaluatorOutputSchema>;

export async function aiQuizEvaluator(input: AIQuizEvaluatorInput): Promise<AIQuizEvaluatorOutput> {
  return aiQuizEvaluatorFlow(input);
}

const evaluationPrompt = ai.definePrompt({
  name: 'quizEvaluationPrompt',
  input: { schema: AIQuizEvaluatorInputSchema },
  output: { schema: AIQuizEvaluatorOutputSchema },
  prompt: `Evaluate this student's performance on the quiz "{{{quizTitle}}}".
  
  Quiz Data:
  {{#each questions}}
  Q: {{{question}}} | Correct: {{{correctAnswerIndex}}} | Student: {{#with (lookup ../studentAnswers @index)}}{{{this}}}{{/with}}
  {{/each}}
  
  Provide a detailed assessment including a score, overall feedback, strengths, and areas for improvement.`,
});

const aiQuizEvaluatorFlow = ai.defineFlow(
  {
    name: 'aiQuizEvaluatorFlow',
    inputSchema: AIQuizEvaluatorInputSchema,
    outputSchema: AIQuizEvaluatorOutputSchema,
  },
  async (input) => {
    const { output } = await evaluationPrompt(input);
    return output!;
  }
);
