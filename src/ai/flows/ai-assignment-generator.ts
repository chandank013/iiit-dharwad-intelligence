'use server';
/**
 * @fileOverview AI-driven assignment generator for professors.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIAssignmentGeneratorInputSchema = z.object({
  context: z.string().describe('The source material, topic, or learning objectives for the assignment.'),
  fileDataUri: z.string().optional().describe("A context file (like a PDF) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  difficulty: z.enum(['introductory', 'intermediate', 'advanced']).default('intermediate'),
});
export type AIAssignmentGeneratorInput = z.infer<typeof AIAssignmentGeneratorInputSchema>;

const AIAssignmentGeneratorOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  rubric: z.array(z.object({
    criterion: z.string(),
    description: z.string(),
    maxPoints: z.number(),
  })),
});
export type AIAssignmentGeneratorOutput = z.infer<typeof AIAssignmentGeneratorOutputSchema>;

export async function aiAssignmentGenerator(input: AIAssignmentGeneratorInput): Promise<AIAssignmentGeneratorOutput> {
  return aiAssignmentGeneratorFlow(input);
}

const assignmentPrompt = ai.definePrompt({
  name: 'assignmentGeneratorPrompt',
  input: { schema: AIAssignmentGeneratorInputSchema },
  output: { schema: AIAssignmentGeneratorOutputSchema },
  prompt: `You are an expert academic designer at an engineering institute.
  
  Based on this source context:
  {{{context}}}
  
  {{#if fileDataUri}}
  Additional reference material provided: {{media url=fileDataUri}}
  {{/if}}
  
  Target Difficulty: {{{difficulty}}}
  
  Task: Create a professional, comprehensive assignment.
  1. Title: Catchy but academic.
  2. Description: Detailed tasks, learning objectives, and constraints.
  3. Rubric: 4-5 fair grading criteria totaling 100 points.
  
  Ensure the tone is professional and suitable for IIIT Dharwad students.`,
});

const aiAssignmentGeneratorFlow = ai.defineFlow(
  {
    name: 'aiAssignmentGeneratorFlow',
    inputSchema: AIAssignmentGeneratorInputSchema,
    outputSchema: AIAssignmentGeneratorOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const { output } = await assignmentPrompt(input);
        if (output) return output;
        throw new Error('Empty AI response');
      } catch (error) {
        attempts++;
        if (attempts >= 3) throw error;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    throw new Error('Failed to generate assignment context');
  }
);
