import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-node';
import { getCategoryTree } from '@/lib/catalog';
import {
  SECOND_ANALYSIS_PROMPT,
  type SecondAnalysisData,
} from '@/lib/second-prompt';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const { draftIds } = await request.json();

    if (!draftIds || !Array.isArray(draftIds) || draftIds.length === 0) {
      return NextResponse.json(
        { error: 'Draft IDs are required' },
        { status: 400 }
      );
    }

    // Get approved drafts with their images
    const drafts = await prisma.waDraftProduct.findMany({
      where: {
        id: { in: draftIds },
        status: 'approved',
      },
      include: {
        images: {
          where: { isActive: true },
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (drafts.length === 0) {
      return NextResponse.json(
        { error: 'No approved drafts found' },
        { status: 404 }
      );
    }

    // Get category tree for the prompt
    const categoryTree = await getCategoryTree();
    const categoryTreeJson = JSON.stringify(categoryTree);

    const results = [];

    // Mark all drafts as processing
    await prisma.waDraftProduct.updateMany({
      where: { id: { in: drafts.map(d => d.id) } },
      data: {
        aiStatus: 'ai_processing',
        aiProcessedAt: null,
      },
    });

    for (const draft of drafts) {
      try {
        // Prepare images for analysis
        const imageUrls = draft.images.map(img => img.url);

        if (imageUrls.length === 0) {
          console.log(`No images found for draft ${draft.id}`);
          // Mark as failed if no images
          await prisma.waDraftProduct.update({
            where: { id: draft.id },
            data: {
              aiStatus: 'ai_failed',
              aiProcessedAt: new Date(),
            },
          });
          continue;
        }

        // Create the prompt with images
        const prompt = `${SECOND_ANALYSIS_PROMPT}

ДОСТУПНЫЕ КАТЕГОРИИ:
${categoryTreeJson}

ИЗОБРАЖЕНИЯ ДЛЯ АНАЛИЗА:
${imageUrls.map((url, index) => `Изображение ${index + 1}: ${url}`).join('\n')}

Проанализируй эти изображения и верни результат в формате JSON.`;

        // Call OpenAI API
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: prompt,
                    },
                    ...imageUrls.map(url => ({
                      type: 'image_url',
                      image_url: {
                        url: url,
                        detail: 'high',
                      },
                    })),
                  ],
                },
              ],
              max_tokens: 1000,
              temperature: 0.1,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('No content in OpenAI response');
        }

        // Parse the JSON response
        let analysisData: SecondAnalysisData;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON found in response');
          }
          analysisData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', parseError);
          console.error('Response content:', content);
          continue;
        }

        // Update the draft with the analysis results
        await prisma.waDraftProduct.update({
          where: { id: draft.id },
          data: {
            name: analysisData.name,
            material: analysisData.material,
            gender: analysisData.gender,
            season: analysisData.season,
            categoryId: analysisData.categoryId,
            rawGptResponse2: data,
            gptRequest2: prompt,
            aiStatus: 'ai_completed',
            aiProcessedAt: new Date(),
          },
        });

        // Update image colors
        if (analysisData.imageColors && analysisData.imageColors.length > 0) {
          for (
            let i = 0;
            i < Math.min(analysisData.imageColors.length, draft.images.length);
            i++
          ) {
            await prisma.waDraftProductImage.update({
              where: { id: draft.images[i].id },
              data: { color: analysisData.imageColors[i] },
            });
          }
        }

        results.push({
          id: draft.id,
          success: true,
          analysis: analysisData,
        });

        console.log(`Successfully analyzed draft ${draft.id}`);
      } catch (error) {
        console.error(`Failed to analyze draft ${draft.id}:`, error);

        // Mark as failed
        await prisma.waDraftProduct.update({
          where: { id: draft.id },
          data: {
            aiStatus: 'ai_failed',
            aiProcessedAt: new Date(),
          },
        });

        results.push({
          id: draft.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Analyzed ${results.filter(r => r.success).length} out of ${drafts.length} drafts`,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to run AI analysis' },
      { status: 500 }
    );
  }
}
