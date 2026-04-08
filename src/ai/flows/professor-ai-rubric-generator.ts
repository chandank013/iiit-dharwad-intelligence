
'use server';
/**
 * @fileOverview A Genkit flow for professors to auto-generate a comprehensive rubric based on an assignment description.
 *
 * - professorAIRubricGenerator - A function that handles the AI rubric generation process.
 * - ProfessorAIRubricGeneratorInput - The input type for the professorAIRubricGenerator function.
 * - ProfessorAIRubricGeneratorOutput - The return type for the professorAIRubricGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfessorAIRubricGeneratorInputSchema = z.object({
  description: z
    .string()
    .describe('The detailed description of the assignment for which the rubric is needed.'),
});
export type ProfessorAIRubricGeneratorInput = z.infer<
  typeof ProfessorAIRubricGeneratorInputSchema
>;

const ProfessorAIRubricGeneratorOutputSchema = z.object({
  rubric: z
    .array(
      z.object({
        criterion: z
          .string()
          .describe(
            'The grading criterion, e.g., "Code Quality", "Clarity", "Content Accuracy".'
          ),
        description: z
          .string()
          .describe('Detailed description of what is expected for this criterion.'),
        maxPoints: z
          .number()
          .describe('The maximum points achievable for this criterion.'),
      })
    )
    .describe(
      'A comprehensive rubric for the assignment, consisting of multiple grading criteria.'
    ),
});
export type ProfessorAIRubricGeneratorOutput = z.infer<
  typeof ProfessorAIRubricGeneratorOutputSchema
>;

export async function professorAIRubricGenerator(
  input: ProfessorAIRubricGeneratorInput
): Promise<ProfessorAIRubricGeneratorOutput> {
  return professorAIRubricGeneratorFlow(input);
}

const professorAIRubricGeneratorPrompt = ai.definePrompt({
  name: 'professorAIRubricGeneratorPrompt',
  input: {schema: ProfessorAIRubricGeneratorInputSchema},
  output: {schema: ProfessorAIRubricGeneratorOutputSchema},
  prompt: `You are an expert in creating detailed and fair grading rubrics for academic assignments.
Based on the following assignment description, generate a comprehensive rubric in JSON format.
Each rubric item should include a 'criterion', a 'description' of what is expected for this criterion, and 'maxPoints'.
Ensure the rubric covers all essential aspects of the assignment and is suitable for evaluating student submissions.

Assignment Description:
{{{description}}}

Generate the rubric here:`,
});

const professorAIRubricGeneratorFlow = ai.defineFlow(
  {
    name: 'professorAIRubricGeneratorFlow',
    inputSchema: ProfessorAIRubricGeneratorInputSchema,
    outputSchema: ProfessorAIRubricGeneratorOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      try {
        const { output } = await professorAIRubricGeneratorPrompt(input);
        return output!;
      } catch (error: any) {
        attempts++;
        const isUnavailable = error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('UNAVAILABLE') || error.message?.includes('overloaded');
        if (attempts >= maxAttempts || !isUnavailable) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, attempts * 3000));
      }
    }
    throw new Error('AI Service is currently experiencing high demand. Please try again.');
  }
);
