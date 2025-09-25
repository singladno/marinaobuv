# Unified OpenAI Processor - Refactored Architecture

## 📁 File Structure

```
lib/
├── prompts/
│   ├── grouping-prompt.ts      # OpenAI prompt for message grouping
│   └── analysis-prompt.ts      # OpenAI prompt for unified analysis
├── services/
│   ├── message-grouping-service.ts    # Groups messages using OpenAI
│   ├── unified-analysis-service.ts    # Analyzes text + images together
│   ├── image-processing-service.ts    # Handles image upload to S3
│   └── product-creation-service.ts    # Creates draft products
├── unified-openai-processor-v2.ts     # Main orchestrator (clean & readable)
└── unified-openai-processor.ts        # Original (kept for reference)
```

## 🔧 Architecture Benefits

### ✅ **Separation of Concerns**

- Each service has a single responsibility
- Easy to test individual components
- Clear interfaces between services

### ✅ **Readable Code**

- Main processor is now clean and easy to follow
- Each service is focused and well-documented
- Prompts are separated for easy modification

### ✅ **Maintainable**

- Easy to modify individual services
- Clear dependencies between components
- Easy to add new features

### ✅ **Testable**

- Each service can be unit tested independently
- Mock services for testing the main processor
- Clear interfaces for dependency injection

## 🚀 Usage

The refactored processor maintains the same interface:

```typescript
const processor = new UnifiedOpenAIProcessor();
await processor.processMessagesToProducts(messageIds);
```

## 📊 Services Overview

### 1. **MessageGroupingService**

- Groups WhatsApp messages by product using OpenAI
- Handles message preparation and GPT analysis
- Returns structured message groups

### 2. **UnifiedAnalysisService**

- Analyzes text and images together
- Extracts product information (name, price, sizes, colors, etc.)
- Returns structured analysis results

### 3. **ImageProcessingService**

- Downloads images from WhatsApp URLs
- Uploads images to S3 storage
- Handles image processing errors gracefully

### 4. **ProductCreationService**

- Creates draft products in database
- Handles product images
- Manages provider relationships

## 🔄 Processing Flow

1. **Grouping**: `MessageGroupingService` groups messages by product
2. **Image Processing**: `ImageProcessingService` downloads and uploads images
3. **Analysis**: `UnifiedAnalysisService` analyzes text + images together
4. **Creation**: `ProductCreationService` creates final draft products

## 📝 Detailed Logging

Each service provides detailed real-time logging:

- 🚀 Processing status
- 📊 Progress indicators
- ✅ Success messages
- ❌ Error handling
- 📸 Image processing details
- 🤖 OpenAI analysis results
