import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getSessionUser } from '@/lib/auth';

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

    const { model, promptType, prompt, contextText } = await req.json();

    if (!prompt && promptType === 'Custom') {
      return NextResponse.json({ error: 'กรุณาระบุคำสั่งสั่งการ (Prompt is required)' }, { status: 400 });
    }

    // สร้างเนื้อหาคำสั่งขึ้นอยู่กับ Prompt Type
    let systemInstruction = 'You are bl1nk ink AI assistant. Generate clean, highly professional markdown text based on instructions.';
    let fullPrompt = '';

    const contextPart = contextText ? `\n\n--- บริบทเนื้อหาเดิมในเอกสาร ---\n${contextText}\n--- สิ้นสุดบริบท ---\n` : '';

    switch (promptType) {
      case 'Summarize':
        fullPrompt = `โปรดสรุปเนื้อหาต่อไปนี้ให้สั้นกระชับ เป็นข้อๆ อย่างพรีเมียมและสวยงาม:${contextPart}\nคำสั่งเพิ่มเติม: ${prompt || 'สรุปเนื้อหาหลักอย่างครบถ้วน'}`;
        break;
      case 'Draft Email':
        fullPrompt = `โปรดเขียนร่างอีเมลที่เป็นทางการและเป็นมืออาชีพ จากข้อมูลนี้:${contextPart}\nคำสั่งเพิ่มเติม: ${prompt || 'ร่างอีเมลติดต่อทางธุรกิจที่สุภาพ'}`;
        break;
      case 'Brainstorm Ideas':
        fullPrompt = `โปรดระดมสมองและจุดประกายไอเดีย (Brainstorm Ideas) ในรูปแบบรายการที่อ่านง่าย น่าสนใจ จากข้อมูลนี้:${contextPart}\nคำสั่งเพิ่มเติม: ${prompt || 'นำเสนอไอเดียสร้างสรรค์ที่แปลกใหม่ 5 ข้อ'}`;
        break;
      case 'Improve Writing':
        fullPrompt = `โปรดช่วยขัดเกลาและปรับปรุงภาษาในส่วนนี้ให้หรูหรา เป็นมืออาชีพ และอ่านง่ายขึ้น:${contextPart}\nคำสั่งเพิ่มเติม: ${prompt || 'เน้นการปรับไวยากรณ์และความลื่นไหลของประโยค'}`;
        break;
      default:
        // Custom Prompt
        fullPrompt = `คำสั่งของผู้ใช้: ${prompt}\n${contextPart}`;
        break;
    }

    // ตรวจสอบโมเดลที่เลือกใช้งาน
    const selectedModel = model || 'Gemini';

    if (selectedModel === 'OpenAI') {
      const openAiKey = process.env.OPENAI_API_KEY;
      if (openAiKey) {
        // มีคีย์ของ OpenAI จริง -> ยิงไปที่ OpenAI API
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openAiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: fullPrompt }
              ],
              temperature: 0.7
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content || '';
            return NextResponse.json({ text, isFallback: false, modelUsed: 'GPT-4o (OpenAI)' });
          } else {
            const err = await res.text();
            throw new Error(`OpenAI API returned error: ${err}`);
          }
        } catch (openaiErr: any) {
          // หากยิง OpenAI เสียแต่ตั้งคีย์ไว้ ให้ลองตกมาใช้ Gemini fallback พร้อมแจ้งเตือน
          const ai = getGeminiClient();
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: fullPrompt,
            config: { systemInstruction }
          });
          return NextResponse.json({
            text: response.text || '',
            isFallback: true,
            fallbackMessage: `ระบบสลับมาใช้ Gemini อัตโนมัติเนื่องจากพบปัญหาในการติดต่อ OpenAI: ${openaiErr.message || openaiErr}`
          });
        }
      } else {
        // ไม่มีคีย์ OpenAI -> สลับใช้ Gemini fallback อัตโนมัติและแจ้งผู้ใช้
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: fullPrompt,
          config: { systemInstruction }
        });
        return NextResponse.json({
          text: response.text || '',
          isFallback: true,
          fallbackMessage: 'ระบบสลับมาใช้ Gemini Fallback เนื่องจากยังไม่ได้กำหนด OPENAI_API_KEY ใน Settings > Secrets ของแอป'
        });
      }
    } 
    
    if (selectedModel === 'Anthropic') {
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (anthropicKey) {
        // มีคีย์ของ Anthropic จริง -> ยิงไปที่ Anthropic API
        try {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1024,
              system: systemInstruction,
              messages: [
                { role: 'user', content: fullPrompt }
              ],
              temperature: 0.7
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.content?.[0]?.text || '';
            return NextResponse.json({ text, isFallback: false, modelUsed: 'Claude 3.5 Sonnet (Anthropic)' });
          } else {
            const err = await res.text();
            throw new Error(`Anthropic API returned error: ${err}`);
          }
        } catch (anthropicErr: any) {
          const ai = getGeminiClient();
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: fullPrompt,
            config: { systemInstruction }
          });
          return NextResponse.json({
            text: response.text || '',
            isFallback: true,
            fallbackMessage: `ระบบสลับมาใช้ Gemini อัตโนมัติเนื่องจากพบปัญหาในการติดต่อ Anthropic: ${anthropicErr.message || anthropicErr}`
          });
        }
      } else {
        // ไม่มีคีย์ Anthropic -> สลับใช้ Gemini fallback
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: fullPrompt,
          config: { systemInstruction }
        });
        return NextResponse.json({
          text: response.text || '',
          isFallback: true,
          fallbackMessage: 'ระบบสลับมาใช้ Gemini Fallback เนื่องจากยังไม่ได้กำหนด ANTHROPIC_API_KEY ใน Settings > Secrets ของแอป'
        });
      }
    }

    // Default: Gemini
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: fullPrompt,
      config: { systemInstruction }
    });

    return NextResponse.json({
      text: response.text || '',
      isFallback: false,
      modelUsed: 'Gemini 3.5 Flash'
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
