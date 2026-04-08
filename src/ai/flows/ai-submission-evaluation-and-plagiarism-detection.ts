'use server';
/**
 * @fileOverview This file implements a Genkit flow for AI-driven submission evaluation and plagiarism detection.
 *
 * - aiSubmissionEvaluationAndPlagiarismDetection - A function that handles the AI evaluation of student submissions.
 * - AISubmissionEvaluationInput - The input type for the aiSubmissionEvaluationAndPlagiarismDetection function.
 * - AISubmissionEvaluationOutput - The return type for the aiSubmissionEvaluationAndPlagiarismDetection function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const AISubmissionEvaluationInputSchema = z.object({
  assignmentDescription: z.string().describe('The full description of the assignment given to students.'),
  assignmentRubric: z.string().describe('The rubric provided for grading the assignment. This should be a detailed string or markdown.'),

  // Submission content can be one of these types
  submissionText: z.string().optional().describe('The student\'s submission content as raw text.'),
  submissionFileDataUri: z.string().optional().describe(
    'The student\'s submission content as a data URI for a file (e.g., code, document, image). Must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
  ),
  submissionLink: z.string().optional().describe('A link to the student\'s submission (e.g., GitHub repository, Google Drive URL).'),

  // Other submissions for plagiarism check
  allOtherSubmissionsText: z.array(z.string()).describe(
    'An array of raw text contents from other student submissions for plagiarism detection.'
  ).default([]),
  allOtherSubmissionsMedia: z.array(z.string()).describe(
    'An array of data URIs from other student submissions (files) for plagiarism detection.'
  ).default([]),
  allOtherSubmissionsLinks: z.array(z.string()).describe(
    'An array of links (e.g., GitHub, Drive) from other student submissions for plagiarism detection.'
  ).default([]),
}).refine(
  (data) => data.submissionText || data.submissionFileDataUri || data.submissionLink,
  'One of submissionText, submissionFileDataUri, or submissionLink must be provided.'
);
export type AISubmissionEvaluationInput = z.infer<typeof AISubmissionEvaluationInputSchema>;

// Output Schema
const AISubmissionEvaluationOutputSchema = z.object({
  rubricScores: z.array(z.object({
    item: z.string().describe('The name or category of the rubric item.'),
    score: z.number().int().min(0).max(100).describe('The score received for this rubric item. Should be an integer between 0 and 100.'),
    feedback: z.string().describe('Specific feedback for this rubric item, explaining the score and suggesting improvements.'),
  })).describe('An array of scores and feedback for each item in the rubric.'),
  totalScore: z.number().int().min(0).max(100).describe('The overall total score for the submission, based on the rubric. Should be an integer between 0 and 100.'),
  writtenFeedback: z.string().describe('Comprehensive written feedback for the entire submission, summarizing strengths, weaknesses, and actionable improvements.'),
  weakAreas: z.array(z.string()).describe('An array of identified weak areas or topics in the submission where the student struggled or needs to improve.'),
  plagiarismDetected: z.boolean().describe('True if significant plagiarism is detected, false otherwise.'),
  plagiarismDetails: z.string().describe('Detailed explanation of any detected plagiarism, including similarities with other submissions and their sources. Empty if no plagiarism is detected.'),
});
export type AISubmissionEvaluationOutput = z.infer<typeof AISubmissionEvaluationOutputSchema>;

// Wrapper function to call the flow
export async function aiSubmissionEvaluationAndPlagiarismDetection(
  input: AISubmissionEvaluationInput
): Promise<AISubmissionEvaluationOutput> {
  return aiSubmissionEvaluationAndPlagiarismDetectionFlow(input);
}

// Define the prompt
const evaluationPrompt = ai.definePrompt({
  name: 'submissionEvaluationAndPlagiarismDetectionPrompt',
  input: { schema: AISubmissionEvaluationInputSchema },
  output: { schema: AISubmissionEvaluationOutputSchema },
  prompt: `You are an expert academic evaluator and plagiarism detector.
Your task is to thoroughly evaluate a student's submission for an assignment based on the provided assignment description and rubric. You must identify specific weak areas and detect any plagiarism by comparing the student's work against other submissions provided.

---
Assignment Description:
{{{assignmentDescription}}}

---
Assignment Rubric:
{{{assignmentRubric}}}

---
Student's Submission:
{{#if submissionText}}
  Submission Content (Text):
  {{{submissionText}}}
{{/if}}
{{#if submissionFileDataUri}}
  Submission Content (File/Media):
  {{media url=submissionFileDataUri}}
{{/if}}
{{#if submissionLink}}
  Submission Link (e.g., GitHub, Google Drive):
  {{{submissionLink}}}
  Note: Assume content at this link is relevant to the assignment.
{{/if}}

---
Other Submissions for Plagiarism Check:
{{#if allOtherSubmissionsText}}
  Text-based submissions for comparison:
  {{#each allOtherSubmissionsText}}
    --- Other Submission:
    {{{this}}}
  {{/each}}
{{/if}}
{{#if allOtherSubmissionsMedia}}
  File/Media-based submissions for comparison:
  {{#each allOtherSubmissionsMedia}}
    --- Other Submission File/Media:
    {{media url=this}}
  {{/each}}
{{/if}}
{{#if allOtherSubmissionsLinks}}
  Link-based submissions for comparison:
  {{#each allOtherSubmissionsLinks}}
    --- Other Submission Link:
    {{{this}}}
    Note: Assume content at this link is relevant to the assignment.
  {{/each}}
{{/if}}
{{#unless allOtherSubmissionsText}}
  {{#unless allOtherSubmissionsMedia}}
    {{#unless allOtherSubmissionsLinks}}
      No other submissions provided for plagiarism check.
    {{/unless}}
  {{/unless}}
{{/unless}}

---

Instructions for Evaluation and Plagiarism Detection:
1.  **Rubric Evaluation**: Go through each item in the 'Assignment Rubric'. Assign a 'score' (an integer between 0 and 100) and provide detailed 'feedback'. The feedback should explain the score and offer constructive advice for improvement.
2.  **Total Score Calculation**: Based on your assessment of each rubric item, calculate an 'totalScore' for the entire submission. This must be an integer between 0 and 100.
3.  **Comprehensive Written Feedback**: Write overall 'writtenFeedback' for the student, highlighting the main strengths, addressing significant weaknesses, and suggesting concrete steps for improvement.
4.  **Identification of Weak Areas**: List specific conceptual or technical 'weakAreas' (as an array of strings) where the student's submission indicates a lack of understanding or skill, based on the assignment requirements and rubric.
5.  **Plagiarism Check**:
    *   Carefully compare the 'Student's Submission' (text, file/media, and links) against ALL 'Other Submissions for Plagiarism Check'.
    *   Set 'plagiarismDetected' to 'true' if you find substantial similarities, direct copying, or unacknowledged rephrasing that constitutes plagiarism.
    *   If plagiarism is detected, fill 'plagiarismDetails' with a clear explanation of what was plagiarized, the extent of the plagiarism, and specifically identify which other submission(s) or parts thereof were involved. If no plagiarism is found, ensure 'plagiarismDetails' is an empty string.

Ensure your output strictly adheres to the JSON schema provided, including correct data types and ranges for scores.
`
});

// Define the flow with retry logic for high demand (503 errors)
const aiSubmissionEvaluationAndPlagiarismDetectionFlow = ai.defineFlow(
  {
    name: 'aiSubmissionEvaluationAndPlagiarismDetectionFlow',
    inputSchema: AISubmissionEvaluationInputSchema,
    outputSchema: AISubmissionEvaluationOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const { output } = await evaluationPrompt(input);
        return output!;
      } catch (error: any) {
        attempts++;
        const isUnavailable = error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('UNAVAILABLE');
        if (attempts >= maxAttempts || !isUnavailable) {
          throw error;
        }
        // Wait exponentially before retry
        await new Promise(resolve => setTimeout(resolve, attempts * 2000));
      }
    }
    throw new Error('AI Service is currently experiencing high demand. Please try again in a few moments.');
  }
);
