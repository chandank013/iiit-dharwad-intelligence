'use server';
/**
 * @fileOverview This file provides an AI tool to evaluate a student's assignment submission draft and provide quality warnings or feedback before final submission.
 *
 * - studentSubmissionQualityWarning - A function that provides quality warnings and feedback for a student's submission.
 * - StudentSubmissionQualityWarningInput - The input type for the studentSubmissionQualityWarning function.
 * - StudentSubmissionQualityWarningOutput - The return type for the studentSubmissionQualityWarning function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudentSubmissionQualityWarningInputSchema = z.object({
  assignmentDescription: z.string().describe('The detailed description of the assignment given by the professor.'),
  submissionContent: z.string().describe("The student's draft submission content (e.g., essay text, code snippets, or a detailed textual summary of a project or file content suitable for AI analysis)."),
});
export type StudentSubmissionQualityWarningInput = z.infer<typeof StudentSubmissionQualityWarningInputSchema>;

const StudentSubmissionQualityWarningOutputSchema = z.object({
  hasWarnings: z.boolean().describe('True if potential issues are identified in the submission, false otherwise.'),
  summaryFeedback: z.string().describe('A brief summary of the overall quality and main points of feedback for the submission.'),
  detailedSuggestions: z.array(z.string()).describe('A list of specific, actionable suggestions for immediate correction.'),
  potentialIssues: z.array(z.string()).describe('A list of potential problems or weaknesses identified in the submission.'),
  improvementIdeas: z.array(z.string()).describe('Broader ideas, creative directions, or conceptual upgrades to elevate the submission quality.'),
});
export type StudentSubmissionQualityWarningOutput = z.infer<typeof StudentSubmissionQualityWarningOutputSchema>;

/**
 * Main wrapper function for the quality check flow.
 */
export async function studentSubmissionQualityWarning(input: StudentSubmissionQualityWarningInput): Promise<StudentSubmissionQualityWarningOutput> {
  return studentSubmissionQualityWarningFlow(input);
}

const submissionQualityPrompt = ai.definePrompt({
  name: 'submissionQualityPrompt',
  input: { schema: StudentSubmissionQualityWarningInputSchema },
  output: { schema: StudentSubmissionQualityWarningOutputSchema },
  config: {
    temperature: 0.4,
  },
  prompt: `You are an expert academic coach and mentor. Your goal is to evaluate a student's draft and provide constructive feedback that helps them not just fix errors, but truly excel.

Assignment requirements:
{{{assignmentDescription}}}

Student's current draft:
{{{submissionContent}}}

Task:
1. Check for compliance with the instructions.
2. Identify missing elements or logical gaps (Potential Issues).
3. Provide immediate actionable steps to improve the current content (Detailed Suggestions).
4. SUGGEST BROADER IDEAS: Think about how the student could make this submission "A-grade" material. (Improvement Ideas).

IMPORTANT: Return a JSON object matching the requested schema. If the submission is very short or non-textual (like a filename), explain that you need more content to perform a detailed analysis in the summaryFeedback.`,
});

const studentSubmissionQualityWarningFlow = ai.defineFlow(
  {
    name: 'studentSubmissionQualityWarningFlow',
    inputSchema: StudentSubmissionQualityWarningInputSchema,
    outputSchema: StudentSubmissionQualityWarningOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 4;
    
    while (attempts < maxAttempts) {
      try {
        const { output } = await submissionQualityPrompt(input);
        
        if (output) {
          return output;
        }
        
        throw new Error('AI returned an empty or invalid structure.');
      } catch (error: any) {
        attempts++;
        
        // Log error for server-side debugging
        console.error(`AI Quality Scan Attempt ${attempts} failed:`, error.message);

        // Determine if error is retryable (Quota, Service Unavailable, or generic transient)
        const isQuota = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
        const isTransient = error.message?.includes('503') || error.message?.includes('overloaded') || error.message?.includes('UNAVAILABLE') || error.message?.includes('deadline');
        
        if (attempts >= maxAttempts) {
          throw new Error('The AI Strategic Assistant is currently busy. Please try your scan again in a few moments.');
        }

        // Wait with exponential backoff
        const delay = isQuota ? 4000 * attempts : 1500 * attempts;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Analysis could not be completed after several attempts.');
  }
);
