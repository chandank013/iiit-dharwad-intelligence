
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
  config: {
    temperature: 0.7,
  },
  prompt: `You are an expert academic assistant specializing in creating detailed, fair, and comprehensive grading rubrics. 
You must output a list of criteria that help evaluate student work fairly.

Assignment Description:
---
{{{description}}}
---

Instructions:
1. Break down the grading into 4-6 distinct criteria.
2. For each criterion, provide a clear title and a detailed description of what a student must demonstrate to earn full points.
3. Assign 'maxPoints' to each criterion such that they are proportional to the importance of that task.
4. Ensure the output is strictly valid JSON matching the requested schema.

Generate the professional rubric now:`,
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
        if (!output || !output.rubric) {
          throw new Error('AI returned an empty or invalid rubric structure.');
        }
        return output;
      } catch (error: any) {
        attempts++;
        const errorMessage = error.message || '';
        const isRetryable = 
          errorMessage.includes('503') || 
          errorMessage.includes('high demand') || 
          errorMessage.includes('UNAVAILABLE') || 
          errorMessage.includes('overloaded') ||
          errorMessage.includes('deadline') ||
          errorMessage.includes('fetch');

        console.warn(`AI Rubric Generation attempt ${attempts} failed:`, errorMessage);

        if (attempts >= maxAttempts || !isRetryable) {
          throw new Error(
            isRetryable 
              ? 'The AI service is currently experiencing extremely high demand. Please try again in 30 seconds.' 
              : `Generation failed: ${errorMessage}`
          );
        }

        // Exponential backoff: 2s, 4s, 8s, 16s...
        const delay = Math.pow(2, attempts) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('AI Service is currently unavailable. Please try again later.');
  }
);
