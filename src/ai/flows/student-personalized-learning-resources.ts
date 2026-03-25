'use server';
/**
 * @fileOverview A Genkit flow for generating personalized learning resources for students.
 *
 * - studentPersonalizedLearningResources - A function that generates personalized learning resources.
 * - StudentPersonalizedLearningResourcesInput - The input type for the studentPersonalizedLearningResources function.
 * - StudentPersonalizedLearningResourcesOutput - The return type for the studentPersonalizedLearningResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudentPersonalizedLearningResourcesInputSchema = z.object({
  weakAreas: z
    .array(z.string())
    .describe('An array of weak areas identified in the student\'s assignment.'),
  feedback: z
    .string()
    .describe('Detailed feedback provided on the student\'s assignment.'),
});
export type StudentPersonalizedLearningResourcesInput = z.infer<
  typeof StudentPersonalizedLearningResourcesInputSchema
>;

const StudentPersonalizedLearningResourcesOutputSchema = z.object({
  learningResources: z
    .array(
      z.object({
        title: z.string().describe('Title of the learning resource.'),
        url: z.string().url().describe('URL to the learning resource.'),
      })
    )
    .describe('A list of personalized learning resources.'),
});
export type StudentPersonalizedLearningResourcesOutput = z.infer<
  typeof StudentPersonalizedLearningResourcesOutputSchema
>;

export async function studentPersonalizedLearningResources(
  input: StudentPersonalizedLearningResourcesInput
): Promise<StudentPersonalizedLearningResourcesOutput> {
  return studentPersonalizedLearningResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedLearningResourcesPrompt',
  input: {schema: StudentPersonalizedLearningResourcesInputSchema},
  output: {schema: StudentPersonalizedLearningResourcesOutputSchema},
  prompt: `You are an AI assistant specialized in education, tasked with recommending personalized learning resources to students.

Given the student's identified weak areas and the feedback on their assignment, provide a list of diverse and helpful online learning resources (e.g., articles, videos, tutorials, documentation, interactive exercises) that can help them improve.

Focus on resources that directly address the weak areas and feedback provided. Ensure the URLs are valid and functional.

Weak Areas: 
{{#each weakAreas}}- {{{this}}}
{{/each}}

Feedback: {{{feedback}}}`,
});

const studentPersonalizedLearningResourcesFlow = ai.defineFlow(
  {
    name: 'studentPersonalizedLearningResourcesFlow',
    inputSchema: StudentPersonalizedLearningResourcesInputSchema,
    outputSchema: StudentPersonalizedLearningResourcesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
