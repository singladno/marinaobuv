import Groq from 'groq-sdk';
import { prisma } from '../db-node';
import { GroqGroupingService } from './groq-grouping-service';
import { BatchProductService } from './batch-product-service';
import { AnalysisValidationService } from './analysis-validation-service';

export class GroqSequentialProcessor {
  private groq: Groq;
  private groupingService: GroqGroupingService;
  private batchProductService: BatchProductService;
  private validationService: AnalysisValidationService;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });
    this.groupingService = new GroqGroupingService();
    this.batchProductService = new BatchProductService();
    this.validationService = new AnalysisValidationService();
  }

  /**
   * Process messages sequentially: Group → Analysis → Colors
   */
  async processMessagesToProducts(messageIds: string[]): Promise<{
    anyProcessed: boolean;
    finalizedMessageIds: string[];
  }> {
    console.log(`🚀 Starting Groq sequential processing for ${messageIds.length} messages`);

    try {
      // Step 1: Group messages using Groq
      console.log('📊 Step 1: Grouping messages...');
      const groups = await this.groupMessagesWithGroq(messageIds);
      
      if (groups.length === 0) {
        console.log('❌ No valid message groups found');
        return { anyProcessed: false, finalizedMessageIds: [] };
      }

      console.log(`✅ Found ${groups.length} message groups`);

      // Step 2: Process each group sequentially
      const processedProducts: string[] = [];
      
      for (const group of groups) {
        try {
          console.log(`🔄 Processing group ${group.groupId} with ${group.messageIds.length} messages`);
          
          // Create inactive product
          const productResult = await this.batchProductService.createInactiveProduct({
            messageIds: group.messageIds,
            productContext: group.productContext,
            confidence: group.confidence,
          });

          // Step 3: Analyze product with Groq
          console.log(`🔍 Step 2: Analyzing product ${productResult.productId}...`);
          await this.analyzeProductWithGroq(productResult.productId, group.messageIds);

          // Step 4: Detect colors with Groq
          console.log(`🎨 Step 3: Detecting colors for product ${productResult.productId}...`);
          await this.detectColorsWithGroq(productResult.productId, group.messageIds);

          // Step 5: Activate product if both steps completed
          console.log(`✅ Activating product ${productResult.productId}...`);
          await this.batchProductService.activateProduct(productResult.productId);

          processedProducts.push(productResult.productId);
          console.log(`✅ Successfully processed product ${productResult.productId}`);

        } catch (error) {
          console.error(`❌ Error processing group ${group.groupId}:`, error);
        }
      }

      console.log(`🎉 Sequential processing completed: ${processedProducts.length} products processed`);
      return { anyProcessed: true, finalizedMessageIds: messageIds };

    } catch (error) {
      console.error('❌ Error in sequential processing:', error);
      return { anyProcessed: false, finalizedMessageIds: [] };
    }
  }

  /**
   * Group messages using Groq
   */
  private async groupMessagesWithGroq(messageIds: string[]): Promise<any[]> {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) return [];

    // Prepare messages for grouping
    const messagesForGrouping = messages.map(msg => ({
      id: msg.id,
      text: msg.text,
      type: msg.type,
      createdAt: msg.createdAt,
      senderId: msg.senderId,
    }));

    // Use existing grouping service but with Groq
    return await this.groupingService.groupMessages(messagesForGrouping);
  }

  /**
   * Analyze product using Groq
   */
  private async analyzeProductWithGroq(productId: string, messageIds: string[]): Promise<void> {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    // Prepare text content
    const textContents = messages
      .map(m => m.text)
      .filter(Boolean)
      .join('\n\n');

    // Prepare image URLs
    const imageUrls = messages
      .filter(m => m.type === 'imageMessage' && m.mediaUrl)
      .map(m => m.mediaUrl!);

    if (!textContents || imageUrls.length === 0) {
      throw new Error('No valid content for analysis');
    }

    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a product analysis expert. Analyze the provided product information and return a JSON response with the following structure:
{
  "name": "Product name",
  "description": "Product description",
  "material": "Material type",
  "price": 0,
  "gender": "male/female/unisex",
  "season": "summer/winter/all-season",
  "sizes": ["size1", "size2", "size3"]
}

Rules:
- Extract the exact product name from the text
- Create a detailed description based on the text and images
- Identify material (leather, fabric, etc.)
- Extract price as a number (0 if not found)
- Determine gender (male/female/unisex)
- Determine season (summer/winter/all-season)
- Extract all available sizes as an array
- Be precise and accurate`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Product information: ${textContents}`,
              },
              ...imageUrls.map(url => ({
                type: 'image_url',
                image_url: { url }
              }))
            ]
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const analysisResult = JSON.parse(response.choices[0].message.content);
      
      // Validate analysis result
      if (!this.validationService.validateAnalysisResult(analysisResult)) {
        throw new Error('Analysis validation failed');
      }

      // Update product with analysis
      await this.batchProductService.updateProductWithAnalysis(
        `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        analysisResult
      );

      console.log(`✅ Product ${productId} analyzed successfully`);

    } catch (error) {
      console.error(`❌ Error analyzing product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Detect colors using Groq
   */
  private async detectColorsWithGroq(productId: string, messageIds: string[]): Promise<void> {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    const imageUrls = messages
      .filter(m => m.type === 'imageMessage' && m.mediaUrl)
      .map(m => m.mediaUrl!);

    if (imageUrls.length === 0) {
      console.log(`⚠️ No images found for product ${productId}`);
      return;
    }

    try {
      const colorResults = [];

      // Process each image individually
      for (let i = 0; i < imageUrls.length; i++) {
        const response = await this.groq.chat.completions.create({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Return strictly {"images":[{"color":"color_name"}]} for the single provided image. Use Russian color names.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Detect shoe color for this image and return JSON response.'
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrls[i] }
                }
              ]
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });

        const colorResult = JSON.parse(response.choices[0].message.content);
        colorResults.push(colorResult);
      }

      // Update product with color results
      await this.batchProductService.updateProductWithColors(
        `color_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        colorResults
      );

      console.log(`✅ Colors detected for product ${productId}: ${colorResults.length} images processed`);

    } catch (error) {
      console.error(`❌ Error detecting colors for product ${productId}:`, error);
      throw error;
    }
  }
}
