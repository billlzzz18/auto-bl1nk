import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getSessionUser } from '@/lib/auth';

/**
 * JSDoc: ขุมพลัง AI ประยุกต์วิเคราะห์ข้อมูลบน Server-Side ยึด @google/genai SDK
 * ใช้รูปแบบ Lazy-Loading เพื่อป้องกัน App Crash บน Startup หากยังไม่ได้กรอก API Keys
 */
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing. Please configure it under Settings > Secrets.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, systemInstruction } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'กรุณาระบุมาร์กดาวน์หรือคำสั่งแกนนำ (Prompt is required)' }, { status: 400 });
    }

    try {
      const ai = getGeminiClient();

      // โมเดลสากลสำหรับวิเคราะห์สรุปงานทั่วไปยึดตาม 'gemini-3.5-flash'
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || 'You are bl1nk ink AI personal workspace helper. Write helpful responses in Thai or English.'
        }
      });

      return NextResponse.json({
        text: response.text || 'ไม่สามารถวิเคราะห์เนื้อหาได้'
      });

    } catch (sdkError: any) {
      return NextResponse.json({
        error: `Gemini API Error: ${sdkError.message || sdkError}`
      }, { status: 503 });
    }

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
