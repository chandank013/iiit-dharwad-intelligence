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
  submissionContent: z.string().describe('The student\u0027s draft submission content (e.g., essay text, code snippets, or a detailed textual summary of a project or file content suitable for AI analysis).'),
});
export type StudentSubmissionQualityWarningInput = z.infer<typeof StudentSubmissionQualityWarningInputSchema>;

const StudentSubmissionQualityWarningOutputSchema = z.object({
  hasWarnings: z.boolean().describe('True if potential issues are identified in the submission, false otherwise.'),
  summaryFeedback: z.string().describe('A brief summary of the overall quality and main points of feedback for the submission.'),
  detailedSuggestions: z.array(z.string()).describe('A list of specific suggestions for improvement.'),
  potentialIssues: z.array(z.string()).describe('A list of potential problems or weaknesses identified in the submission.'),
});
export type StudentSubmissionQualityWarningOutput = z.infer<typeof StudentSubmissionQualityWarningOutputSchema>;

export async function studentSubmissionQualityWarning(input: StudentSubmissionQualityWarningInput): Promise<StudentSubmissionQualityWarningOutput> {
  return studentSubmissionQualityWarningFlow(input);
}

const submissionQualityPrompt = ai.definePrompt({
  name: 'submissionQualityPrompt',
  input: { schema: StudentSubmissionQualityWarningInputSchema },
  output: { schema: StudentSubmissionQualityWarningOutputSchema },
  prompt: `You are an AI assistant tasked with evaluating a student's assignment submission draft. Your goal is to provide constructive feedback and identify potential issues before the student makes a final submission.\n\nConsider the following assignment description:\n---\nAssignment Description:\n{{{assignmentDescription}}}\n---\n\nAnd the student's submission draft:\n---\nStudent Submission Draft:\n{{{submissionContent}}}\n---\n\nBased on the assignment description and the student's draft, identify any potential issues, areas for improvement, or elements that might be missing or incorrect. Provide clear, actionable suggestions to help the student improve their submission.\n\nStructure your response as a JSON object with the following fields:\n- 'hasWarnings': boolean (true if any issues or significant improvements are needed, false otherwise)\n- 'summaryFeedback': string (A brief overall assessment)\n- 'detailedSuggestions': string[] (A list of specific, actionable suggestions)\n- 'potentialIssues': string[] (A list of identified problems or weaknesses)\n\nExample of expected output structure:\n{\n  "hasWarnings": true,\n  "summaryFeedback": "The submission addresses most requirements but lacks specific examples.",\n  "detailedSuggestions": [\n    "Add concrete examples to illustrate the concepts discussed.",\n    "Ensure all sections mentioned in the assignment description are covered."\n  ],\n  "potentialIssues": [\n    "Lack of detail in certain explanations.",\n    "One part of the assignment description seems to be partially missed."\n  ]\n}\n`
});

const studentSubmissionQualityWarningFlow = ai.defineFlow(
  {
    name: 'studentSubmissionQualityWarningFlow',
    inputSchema: StudentSubmissionQualityWarningInputSchema,
    outputSchema: StudentSubmissionQualityWarningOutputSchema,
  },
  async (input) => {
    const { output } = await submissionQualityPrompt(input);
    return output!;
  }
);
