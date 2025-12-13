import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

import { requireAuth } from '@/lib/server/auth-helpers';
import { getGroqConfig } from '@/lib/groq-proxy-config';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, 'ADMIN');
    if (auth.error) {
      return auth.error;
    }

    const groqConfig =
      process.env.NODE_ENV === 'production'
        ? await getGroqConfig()
        : { apiKey: process.env.GROQ_API_KEY };

    const groq = new Groq(groqConfig as any);

    // Use a better model for quality Russian text generation
    // llama-3.3-70b-versatile is available and provides better grammar and translation quality
    // Fallback to llama-3.1-8b-instant if the larger model is not available
    const meditationModel =
      process.env.GROQ_MEDITATION_MODEL || 'llama-3.3-70b-versatile';
    console.log('[meditation] Calling Groq API with model:', meditationModel);

    let response;
    try {
      response = await groq.chat.completions.create({
        model: meditationModel,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that provides wise quotes from famous philosophers, authors, and thinkers. Return ONLY real, authentic quotes from well-known historical figures. Never make up quotes. Always return the quote in Russian translation with PERFECT grammar and include the original author name. The Russian translation must be grammatically correct, natural, and well-written. Before returning the quote, you MUST double-check and fix any grammar errors, ensuring proper declensions, cases, and agreements in Russian. The final text must be grammatically perfect in Russian.',
          },
          {
            role: 'user',
            content:
              'Верни случайную мудрую цитату от известного философа, писателя или мыслителя. Цитата должна быть на русском языке, короткой (1-2 предложения), успокаивающей и вдохновляющей. КРИТИЧЕСКИ ВАЖНО: используй ТОЛЬКО реальные цитаты от реальных авторов. НЕ придумывай цитаты. Цитата должна быть переведена на русский язык с ИДЕАЛЬНОЙ грамматикой. ОБЯЗАТЕЛЬНО: перед возвратом ответа проверь и исправь ВСЕ грамматические ошибки - проверь правильность склонений, падежей, согласований, окончаний, ударений. Убедись, что все слова согласованы правильно, падежи использованы верно, нет орфографических и пунктуационных ошибок. Используй правильный, литературный русский язык без ошибок. Верни ответ в формате JSON: {"quote": "текст цитаты", "author": "Имя автора"}. Примеры авторов: Марк Аврелий, Сенека, Конфуций, Лао-Цзы, Будда, Эпиктет, Марк Твен, Оскар Уайльд, Альберт Эйнштейн, Ральф Уолдо Эмерсон, Генри Дэвид Торо, и другие известные философы и писатели.',
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 200,
        temperature: 0.5, // Slightly lower temperature for better grammar while maintaining variety
      });
    } catch (modelError: any) {
      // If the model is not available, fallback to llama-3.1-8b-instant
      if (
        modelError?.error?.code === 'model_decommissioned' ||
        modelError?.message?.includes('decommissioned') ||
        modelError?.message?.includes('not found')
      ) {
        console.warn(
          '[meditation] Model',
          meditationModel,
          'not available, falling back to llama-3.1-8b-instant'
        );
        response = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant that provides wise quotes from famous philosophers, authors, and thinkers. Return ONLY real, authentic quotes from well-known historical figures. Never make up quotes. Always return the quote in Russian translation with PERFECT grammar and include the original author name. The Russian translation must be grammatically correct, natural, and well-written. Before returning the quote, you MUST double-check and fix any grammar errors, ensuring proper declensions, cases, and agreements in Russian. The final text must be grammatically perfect in Russian.',
            },
            {
              role: 'user',
              content:
                'Верни случайную мудрую цитату от известного философа, писателя или мыслителя. Цитата должна быть на русском языке, короткой (1-2 предложения), успокаивающей и вдохновляющей. КРИТИЧЕСКИ ВАЖНО: используй ТОЛЬКО реальные цитаты от реальных авторов. НЕ придумывай цитаты. Цитата должна быть переведена на русский язык с ИДЕАЛЬНОЙ грамматикой. ОБЯЗАТЕЛЬНО: перед возвратом ответа проверь и исправь ВСЕ грамматические ошибки - проверь правильность склонений, падежей, согласований, окончаний, ударений. Убедись, что все слова согласованы правильно, падежи использованы верно, нет орфографических и пунктуационных ошибок. Используй правильный, литературный русский язык без ошибок. Верни ответ в формате JSON: {"quote": "текст цитаты", "author": "Имя автора"}. Примеры авторов: Марк Аврелий, Сенека, Конфуций, Лао-Цзы, Будда, Эпиктет, Марк Твен, Оскар Уайльд, Альберт Эйнштейн, Ральф Уолдо Эмерсон, Генри Дэвид Торо, и другие известные философы и писатели.',
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 200,
          temperature: 0.5, // Lower temperature for better grammar with smaller model
        });
      } else {
        throw modelError;
      }
    }

    console.log(
      '[meditation] Groq response:',
      JSON.stringify(response, null, 2)
    );
    console.log('[meditation] Response choices:', response.choices);
    console.log('[meditation] First choice:', response.choices?.[0]);
    console.log(
      '[meditation] First choice message:',
      response.choices?.[0]?.message
    );
    console.log(
      '[meditation] First choice content:',
      response.choices?.[0]?.message?.content
    );

    const rawContent = response.choices[0]?.message?.content?.trim() || '{}';
    console.log('[meditation] Raw content:', rawContent);

    let quoteData: { quote?: string; author?: string };
    try {
      quoteData = JSON.parse(rawContent);
    } catch (error) {
      console.error('[meditation] Failed to parse JSON:', error);
      return NextResponse.json(
        {
          error: 'Не удалось обработать ответ от сервера',
        },
        { status: 500 }
      );
    }

    const quote = quoteData.quote?.trim() || '';
    const author = quoteData.author?.trim() || '';

    if (!quote) {
      console.error(
        '[meditation] Empty quote received. Full response:',
        JSON.stringify(response, null, 2)
      );
      return NextResponse.json(
        {
          error: 'Не удалось получить цитату',
        },
        { status: 500 }
      );
    }

    console.log('[meditation] Generated quote:', quote);
    console.log('[meditation] Author:', author);

    return NextResponse.json(
      {
        quote,
        author: author || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating meditation message:', error);
    return NextResponse.json(
      {
        error:
          'Не удалось подготовить текст для медитации. Попробуйте еще раз или просто подождите несколько секунд.',
      },
      { status: 500 }
    );
  }
}
