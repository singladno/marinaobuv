import { prisma } from '@/lib/db-node';
import { env } from '@/lib/env';
import {
  SECOND_ANALYSIS_PROMPT,
  type SecondAnalysisData,
  type NewCategoryRequest,
} from '@/lib/second-prompt';

// Helper function to map Russian gender values to enum values
export function mapGenderToEnum(
  gender: string | null
): 'FEMALE' | 'MALE' | 'UNISEX' | null {
  if (!gender) return null;

  const genderMap: Record<string, 'FEMALE' | 'MALE' | 'UNISEX'> = {
    женская: 'FEMALE',
    мужская: 'MALE',
    унисекс: 'UNISEX',
  };

  return genderMap[gender.toLowerCase()] || null;
}

export interface AnalysisResult {
  id: string;
  success: boolean;
  analysis?: SecondAnalysisData;
  error?: string;
}

export async function markDraftsAsProcessing(
  draftIds: string[]
): Promise<void> {
  await prisma.waDraftProduct.updateMany({
    where: { id: { in: draftIds } },
    data: {
      aiStatus: 'ai_processing',
      aiProcessedAt: null,
    },
  });
}

export async function markDraftAsFailed(draftId: string): Promise<void> {
  await prisma.waDraftProduct.update({
    where: { id: draftId },
    data: {
      aiStatus: 'ai_failed',
      aiProcessedAt: new Date(),
    },
  });
}

export async function updateDraftWithAnalysis(
  draftId: string,
  analysisData: SecondAnalysisData,
  rawResponse: unknown,
  prompt: string
): Promise<void> {
  let finalCategoryId = analysisData.categoryId;

  // Handle new category creation if requested
  if (analysisData.newCategory && !analysisData.categoryId) {
    try {
      finalCategoryId = await createNewCategory(analysisData.newCategory);
      console.log(
        `Created new category ${analysisData.newCategory.name} with ID: ${finalCategoryId}`
      );
    } catch (error) {
      console.error(
        `Failed to create new category: ${analysisData.newCategory.name}`,
        error
      );
      // Continue with null categoryId if creation fails
      finalCategoryId = null;
    }
  }

  await prisma.waDraftProduct.update({
    where: { id: draftId },
    data: {
      name: analysisData.name,
      material: analysisData.material,
      gender: mapGenderToEnum(analysisData.gender),
      season: analysisData.season,
      categoryId: finalCategoryId,
      rawGptResponse2: rawResponse,
      gptRequest2: prompt,
      aiStatus: 'ai_completed',
      aiProcessedAt: new Date(),
    },
  });
}

export async function updateImageColors(
  draftId: string,
  imageColors: string[]
): Promise<void> {
  const draft = await prisma.waDraftProduct.findUnique({
    where: { id: draftId },
    include: {
      images: {
        where: { isActive: true },
        orderBy: { sort: 'asc' },
      },
    },
  });

  if (!draft) return;

  for (let i = 0; i < Math.min(imageColors.length, draft.images.length); i++) {
    await prisma.waDraftProductImage.update({
      where: { id: draft.images[i].id },
      data: { color: imageColors[i] },
    });
  }
}

export async function createNewCategory(
  newCategoryRequest: NewCategoryRequest
): Promise<string> {
  // First, verify the parent category exists
  const parentCategory = await prisma.category.findUnique({
    where: { id: newCategoryRequest.parentCategoryId },
    select: { id: true, path: true },
  });

  if (!parentCategory) {
    throw new Error(
      `Parent category with ID ${newCategoryRequest.parentCategoryId} not found`
    );
  }

  // Create the new category path
  const newPath = `${parentCategory.path}/${newCategoryRequest.slug}`;

  // Check if category with this path already exists
  const existingCategory = await prisma.category.findUnique({
    where: { path: newPath },
  });

  if (existingCategory) {
    console.log(
      `Category with path ${newPath} already exists, using existing ID: ${existingCategory.id}`
    );
    return existingCategory.id;
  }

  // Create the new category
  const newCategory = await prisma.category.create({
    data: {
      name: newCategoryRequest.name,
      slug: newCategoryRequest.slug,
      path: newPath,
      parentId: newCategoryRequest.parentCategoryId,
      isActive: true,
      sort: 500, // Default sort value
    },
  });

  console.log(
    `Created new category: ${newCategory.name} (${newCategory.id}) under parent ${parentCategory.path}`
  );

  return newCategory.id;
}

export async function callOpenAIAPI(
  prompt: string,
  imageUrls: string[]
): Promise<SecondAnalysisData> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
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
            response_format: { type: 'json_object' },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `OpenAI API error (attempt ${attempt + 1}):`,
          response.status,
          errorText
        );

        // If it's a rate limit error, wait before retrying
        if (response.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempt++;
          continue;
        }

        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Try to parse as JSON directly first (since we're using response_format: json_object)
      try {
        return JSON.parse(content) as SecondAnalysisData;
      } catch (parseError) {
        // Fallback to regex parsing if direct JSON parsing fails
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        return JSON.parse(jsonMatch[0]) as SecondAnalysisData;
      }
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }

      // Wait before retrying
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(
        `Retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`
      );
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('Max retries exceeded');
}

export async function analyzeDraft(
  draft: {
    id: string;
    images: Array<{ url: string; id: string; sort: number }>;
  },
  categoryTreeJson: string
): Promise<AnalysisResult> {
  try {
    const imageUrls = draft.images.map(img => img.url);

    if (imageUrls.length === 0) {
      console.log(`No images found for draft ${draft.id}`);
      await markDraftAsFailed(draft.id);
      return {
        id: draft.id,
        success: false,
        error: 'No images found',
      };
    }

    const prompt = `${SECOND_ANALYSIS_PROMPT}

ДОСТУПНЫЕ КАТЕГОРИИ:
${categoryTreeJson}

ИЗОБРАЖЕНИЯ ДЛЯ АНАЛИЗА:
${imageUrls.map((url: string, index: number) => `Изображение ${index + 1}: ${url}`).join('\n')}

Проанализируй эти изображения и верни результат в формате JSON.`;

    const analysisData = await callOpenAIAPI(prompt, imageUrls);

    await updateDraftWithAnalysis(draft.id, analysisData, null, prompt);

    if (analysisData.imageColors && analysisData.imageColors.length > 0) {
      await updateImageColors(draft.id, analysisData.imageColors);
    }

    console.log(`Successfully analyzed draft ${draft.id}`);
    return {
      id: draft.id,
      success: true,
      analysis: analysisData,
    };
  } catch (error) {
    console.error(`Failed to analyze draft ${draft.id}:`, error);
    await markDraftAsFailed(draft.id);
    return {
      id: draft.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
