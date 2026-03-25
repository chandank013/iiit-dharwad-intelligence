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
      You help students and professors with queries related to courses, assignments, and academic progress at the Indian Institute of Information Technology, Dharwad.
      Be professional, helpful, and concise. 
      If you don't know something specifically about the user's data (like their specific grades), advise them to check their dashboard.
      Do not hallucinate facts about the institute.`,
      prompt: input.query,
      history: input.history?.map(m => ({
        role: m.role,
        content: [{text: m.content}]
      })),
    });

    return { response: text || "I'm sorry, I couldn't process that request right now." };
  }
);
