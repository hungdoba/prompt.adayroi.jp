import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is required.');
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    const prompt = `
      You are a senior prompt engineer specializing in optimizing AI prompts. 
      Your task is to review the user's prompt and return improved versions with explanations.

      Guidelines:
      - Analyze the user's prompt for clarity, conciseness, and effectiveness.
      - Provide one or more revised versions that enhance its quality.
      - Explain the improvements made in each revision.
      - Maintain the original intent while improving wording and structure.

      Response format (JSON array):
      [
        {
          "role": "assistant",
          "option": <number>,  // Unique option number for each revision
          "content": "<Revised prompt>",  
          "explain": "<Explanation of the improvements>"
        }
      ]

      Example:
      [
        {
          "role": "assistant",
          "option": 1,
          "content": "You are a senior AI prompt engineer. Your job is to refine user prompts for clarity and effectiveness.",
          "explain": "Reworded for conciseness and specificity."
        },
        {
          "role": "assistant",
          "option": 2,
          "content": "Your role is to help users craft precise and high-quality AI prompts by reviewing and refining their input.",
          "explain": "Expanded details to clarify responsibilities."
        }
      ]

      ---
      
      The user's prompt to improve:
      
      "${content}"
    `;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    return NextResponse.json({
      response: result.response.text(),
    });
  } catch (error: unknown) {
    console.error(
      'Error generating content:',
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      },
      { status: 500 }
    );
  }
}
