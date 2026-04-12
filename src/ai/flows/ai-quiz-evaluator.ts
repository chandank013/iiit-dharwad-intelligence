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
  Question: {{{question}}}
  Correct Option Index: {{{correctAnswerIndex}}}
  Explanation: {{{explanation}}}
  Student Selected Index: {{#with (lookup ../studentAnswers @index)}}{{{this}}}{{/with}}
  ---
  {{/each}}
  
  Task:
  1. Calculate the final score based on the number of correct answers.
  2. Provide encouraging but professional feedback.
  3. Identify specific conceptual strengths and improvement areas.
  
  Ensure the response is strictly valid JSON.`,
});

const aiQuizEvaluatorFlow = ai.defineFlow(
  {
    name: 'aiQuizEvaluatorFlow',
    inputSchema: AIQuizEvaluatorInputSchema,
    outputSchema: AIQuizEvaluatorOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const { output } = await evaluationPrompt(input);
        if (output) return output;
        throw new Error('Empty AI response');
      } catch (error: any) {
        attempts++;
        const isQuotaError = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
        const isServiceError = error.message?.includes('503') || error.message?.includes('UNAVAILABLE') || error.message?.includes('overloaded');
        
        if (attempts >= maxAttempts || (!isQuotaError && !isServiceError)) {
          throw error;
        }
        
        const delay = isQuotaError ? 5000 * attempts : 2000 * attempts;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('AI Evaluation Service busy. Please try again in a moment.');
  }
);
