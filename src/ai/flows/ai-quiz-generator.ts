'use server';
/**
 * @fileOverview AI-driven quiz generator for professors.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIQuizGeneratorInputSchema = z.object({
  content: z.string().describe('The source material or topic for the quiz.'),
  numQuestions: z.number().min(1).max(20).default(5),
  difficulty: z.enum(['basic', 'intermediate', 'advanced', 'mixed']).default('intermediate'),
});
export type AIQuizGeneratorInput = z.infer<typeof AIQuizGeneratorInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswerIndex: z.number().min(0).max(3),
  explanation: z.string(),
});

const AIQuizGeneratorOutputSchema = z.object({
  title: z.string(),
  questions: z.array(QuizQuestionSchema),
});
export type AIQuizGeneratorOutput = z.infer<typeof AIQuizGeneratorOutputSchema>;

export async function aiQuizGenerator(input: AIQuizGeneratorInput): Promise<AIQuizGeneratorOutput> {
  return aiQuizGeneratorFlow(input);
}

const quizGeneratorPrompt = ai.definePrompt({
  name: 'quizGeneratorPrompt',
  input: { schema: AIQuizGeneratorInputSchema },
  output: { schema: AIQuizGeneratorOutputSchema },
  prompt: `You are an expert educator. Create a multiple-choice quiz based on this content:
  
  Content: {{{content}}}
  Requested Difficulty: {{{difficulty}}}
  
  Requirements:
  1. Exactly {{numQuestions}} questions.
  2. Each question must have 4 distinct options.
  3. Provide a clear explanation for the correct answer.
  4. Output a catchy title for the quiz.
  5. The complexity and depth of the questions must strictly match the "{{{difficulty}}}" level.`,
});

const aiQuizGeneratorFlow = ai.defineFlow(
  {
    name: 'aiQuizGeneratorFlow',
    inputSchema: AIQuizGeneratorInputSchema,
    outputSchema: AIQuizGeneratorOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
      try {
        const { output } = await quizGeneratorPrompt(input);
        if (output) return output;
        throw new Error('Empty AI response');
      } catch (error: any) {
        attempts++;
        const isQuotaError = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
        const isServiceError = error.message?.includes('503') || error.message?.includes('UNAVAILABLE') || error.message?.includes('overloaded');
        
        if (attempts >= maxAttempts || (!isQuotaError && !isServiceError)) {
          throw error;
        }
        
        const delay = isQuotaError ? 6000 * attempts : 2500 * attempts;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Failed to generate quiz due to service demand. Please try again.');
  }
);
