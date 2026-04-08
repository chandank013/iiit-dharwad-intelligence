'use server';
/**
 * @fileOverview A Genkit flow for an academic assistant chatbot.
 *
 * - academicAssistantChat - A function that handles chat interactions.
 * - AcademicAssistantInput - The input type for the academicAssistantChat function.
 * - AcademicAssistantOutput - The return type for the academicAssistantChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AcademicAssistantInputSchema = z.object({
  history: z.array(MessageSchema).optional(),
  query: z.string(),
  pageContext: z.string().optional().describe('Details about the current page the user is viewing.'),
});
export type AcademicAssistantInput = z.infer<typeof AcademicAssistantInputSchema>;

const AcademicAssistantOutputSchema = z.object({
  response: z.string(),
});
export type AcademicAssistantOutput = z.infer<typeof AcademicAssistantOutputSchema>;

export async function academicAssistantChat(input: AcademicAssistantInput): Promise<AcademicAssistantOutput> {
  return academicAssistantChatFlow(input);
}

const academicAssistantChatFlow = ai.defineFlow(
  {
    name: 'academicAssistantChatFlow',
    inputSchema: AcademicAssistantInputSchema,
    outputSchema: AcademicAssistantOutputSchema,
  },
  async (input) => {
    const {text} = await ai.generate({
      system: `You are the IIIT Dharwad Academic Assistant. 
      You help students and professors with queries related to courses, assignments, and academic progress.
      
      CURRENT CONTEXT: The user is currently on the following page: {{{pageContext}}}
      
      Instructions:
      1. Be professional, helpful, and concise. 
      2. Use the provided page context to give more relevant answers.
      3. If the user is on an assignment page, offer help with submission guidelines or rubric clarification.
      4. If the user is on a course page, offer help with announcements or content discovery.
      5. Do not hallucinate data. If you don't know something specific about their grades or private records, advise them to check the dashboard.
      6. Maintain the institute's professional tone.`,
      prompt: input.query,
      history: input.history?.map(m => ({
        role: m.role,
        content: [{text: m.content}]
      })),
    });

    return { response: text || "I'm sorry, I couldn't process that request right now." };
  }
);
