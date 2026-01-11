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

    const body = await request.json();
    const { neglectRatio, tremorScore, nudgeCount, context } = body;

    if (typeof neglectRatio !== 'number' || 
        typeof tremorScore !== 'number' || typeof nudgeCount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metrics provided' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `Act as a clinical neuropsychologist. A dementia patient colored a photo${context ? ` of ${context}` : ''}. 

Metrics:
- Neglect Ratio: ${neglectRatio.toFixed(3)} (0.5 is balanced, closer to 0 or 1 indicates spatial neglect - values closer to 0 suggest left-sided neglect, values closer to 1 suggest right-sided neglect)
- Tremor Score: ${tremorScore.toFixed(3)} (higher indicates more micro-movements/jitter)
- Nudges used: ${nudgeCount}

Focus specifically on Unilateral Left-Sided Neglect as a symptom. Compare this to a healthy baseline. Provide a 3-sentence summary for a family caregiver:
1. First sentence: Comment on spatial awareness and attention distribution, specifically regarding left-sided neglect (if neglectRatio < 0.3, this indicates significant left-sided neglect)
2. Second sentence: Comment on motor control and hand stability (tremor score)
3. Third sentence: Comment on engagement level based on nudges used and overall participation

Keep the language clear, compassionate, and informative. Focus on what the data suggests about the patient's current state, with particular attention to left-sided spatial neglect.`;

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
      analysis: text,
    });
  } catch (error) {
    console.error('Error calling Gemini API for analysis:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate analysis',
      },
      { status: 500 }
    );
  }
}
