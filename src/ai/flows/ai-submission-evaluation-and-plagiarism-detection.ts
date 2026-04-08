'use server';
/**
 * @fileOverview AI-driven submission evaluation and plagiarism detection.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AISubmissionEvaluationInputSchema = z.object({
  assignmentDescription: z.string(),
  assignmentRubric: z.string(),
  submissionText: z.string().optional(),
  submissionFileDataUri: z.string().optional(),
  submissionLink: z.string().optional(),
  allOtherSubmissionsText: z.array(z.string()).default([]),
});
export type AISubmissionEvaluationInput = z.infer<typeof AISubmissionEvaluationInputSchema>;

const AISubmissionEvaluationOutputSchema = z.object({
  rubricScores: z.array(z.object({
    item: z.string(),
    score: z.number(),
    feedback: z.string(),
  })),
  totalScore: z.number(),
  writtenFeedback: z.string(),
  weakAreas: z.array(z.string()),
  plagiarismDetected: z.boolean(),
  plagiarismDetails: z.string(),
});
export type AISubmissionEvaluationOutput = z.infer<typeof AISubmissionEvaluationOutputSchema>;

export async function aiSubmissionEvaluationAndPlagiarismDetection(input: AISubmissionEvaluationInput): Promise<AISubmissionEvaluationOutput> {
  return aiSubmissionEvaluationAndPlagiarismDetectionFlow(input);
}

const evaluationPrompt = ai.definePrompt({
  name: 'submissionEvaluationPrompt',
  input: { schema: AISubmissionEvaluationInputSchema },
  output: { schema: AISubmissionEvaluationOutputSchema },
  prompt: `Evaluate this submission based on the rubric:
  Rubric: {{{assignmentRubric}}}
  Submission: {{{submissionText}}}
  Compare against others for plagiarism: {{#each allOtherSubmissionsText}}{{{this}}}{{/each}}`,
});

const aiSubmissionEvaluationAndPlagiarismDetectionFlow = ai.defineFlow(
  {
    name: 'aiSubmissionEvaluationAndPlagiarismDetectionFlow',
    inputSchema: AISubmissionEvaluationInputSchema,
    outputSchema: AISubmissionEvaluationOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      try {
        const { output } = await evaluationPrompt(input);
        if (output) return output;
        throw new Error('Empty evaluation');
      } catch (error: any) {
        attempts++;
        const isQuotaError = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
        const isServiceError = error.message?.includes('503') || error.message?.includes('UNAVAILABLE') || error.message?.includes('overloaded');
        
        if (attempts >= maxAttempts || (!isQuotaError && !isServiceError)) {
          throw error;
        }
        
        const delay = isQuotaError ? 6000 * attempts : 3000 * attempts;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('AI Evaluation Service busy. Please try grading again in a few moments.');
  }
);
