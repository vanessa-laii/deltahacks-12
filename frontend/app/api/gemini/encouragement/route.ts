import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `You are a supportive caregiver assistant. A dementia patient has been working on a coloring activity. Please provide a brief, encouraging message (2-3 sentences) to gently nudge them to continue. Be warm, positive, and supportive. Keep it simple and easy to understand.`;

    // Try gemini-2.5-flash first, fallback to gemini-1.5-flash if rate limited
    let model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    let result;
    let response;
    let text;
    
    try {
      result = await model.generateContent(prompt);
      response = await result.response;
      text = response.text();
    } catch (error: unknown) {
      // If rate limited (429) or model not found (404), try gemini-1.5-flash as fallback
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('429') || errorMessage.includes('404')) {
        console.log('Rate limited or model unavailable, trying gemini-1.5-flash...');
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        result = await model.generateContent(prompt);
        response = await result.response;
        text = response.text();
      } else {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: text,
    });
  } catch (error) {
    console.error('Error calling Gemini API for encouragement:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate encouragement message',
      },
      { status: 500 }
    );
  }
}
