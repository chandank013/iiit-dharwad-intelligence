
'use server';
/**
 * @fileOverview A Genkit flow for professors to auto-generate a comprehensive rubric based on an assignment description.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfessorAIRubricGeneratorInputSchema = z.object({
  description: z.string().describe('The detailed description of the assignment.'),
});
export type ProfessorAIRubricGeneratorInput = z.infer<typeof ProfessorAIRubricGeneratorInputSchema>;

const ProfessorAIRubricGeneratorOutputSchema = z.object({
  rubric: z.array(z.object({
    criterion: z.string().describe('The grading criterion, e.g., "Code Quality".'),
    description: z.string().describe('Detailed description of expectations.'),
    maxPoints: z.number().describe('Max points for this criterion.'),
  })),
});
export type ProfessorAIRubricGeneratorOutput = z.infer<typeof ProfessorAIRubricGeneratorOutputSchema>;

export async function professorAIRubricGenerator(input: ProfessorAIRubricGeneratorInput): Promise<ProfessorAIRubricGeneratorOutput> {
  return professorAIRubricGeneratorFlow(input);
}

const professorAIRubricGeneratorPrompt = ai.definePrompt({
  name: 'professorAIRubricGeneratorPrompt',
  input: {schema: ProfessorAIRubricGeneratorInputSchema},
  output: {schema: ProfessorAIRubricGeneratorOutputSchema},
  prompt: `You are an expert academic assistant. Generate a fair grading rubric (4-6 criteria) based on this assignment:
  
  {{{description}}}
  
  Ensure the output is strictly valid JSON matching the schema.`,
});

const professorAIRubricGeneratorFlow = ai.defineFlow(
  {
    name: 'professorAIRubricGeneratorFlow',
    inputSchema: ProfessorAIRubricGeneratorInputSchema,
    outputSchema: ProfessorAIRubricGeneratorOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const { output } = await professorAIRubricGeneratorPrompt(input);
        if (output) return output;
        throw new Error('Empty AI response');
      } catch (error: any) {
        attempts++;
        if (attempts >= 3) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      }
    }
    throw new Error('AI Service unavailable.');
  }
);
