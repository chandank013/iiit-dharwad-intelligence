'use server';
/**
 * @fileOverview AI-driven quiz generator for professors.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIQuizGeneratorInputSchema = z.object({
  content: z.string().describe('The source material or topic for the quiz.'),
  numQuestions: z.number().default(5),
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
  prompt: `You are an expert educator. Create a challenging multiple-choice quiz based on this content:
  
  Content: {{{content}}}
  
  Requirements:
  1. Exactly {{numQuestions}} questions.
  2. Each question must have 4 distinct options.
  3. Provide a clear explanation for the correct answer.
  4. Output a catchy title for the quiz.`,
});

const aiQuizGeneratorFlow = ai.defineFlow(
  {
    name: 'aiQuizGeneratorFlow',
    inputSchema: AIQuizGeneratorInputSchema,
    outputSchema: AIQuizGeneratorOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const { output } = await quizGeneratorPrompt(input);
        if (output) return output;
        throw new Error('Empty AI response');
      } catch (error) {
        attempts++;
        if (attempts >= 3) throw error;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    throw new Error('Failed to generate quiz');
  }
);
