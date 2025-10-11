# Groq Sequential Processor - Architecture

## 📁 File Structure

```text
lib/
├── prompts/
│   ├── grouping-prompts.ts     # Groq prompts for message grouping
│   ├── text-analysis-prompts.ts  # Groq prompts for text analysis
│   └── image-analysis-prompts.ts # Groq prompts for image analysis
├── services/
│   ├── groq-sequential-processor.ts    # Main Groq processor
│   ├── groq-grouping-service.ts       # Groups messages using Groq
│   ├── simple-product-service.ts      # Handles product creation
│   └── product-creation-service.ts    # Creates draft products
└── types/
    └── analysis-result.ts     # Analysis result interface
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

The Groq processor provides the main interface:

```typescript
const processor = new GroqSequentialProcessor(prisma);
await processor.processMessagesToProducts(messageIds);
```

## 📊 Services Overview

### 1. **GroqGroupingService**

- Groups WhatsApp messages by product using Groq
- Handles message preparation and analysis
- Returns structured message groups

### 2. **GroqSequentialProcessor**

- Main orchestrator for the entire process
- Handles text analysis, image analysis, and product creation
- Uses Groq for all AI operations

### 3. **SimpleProductService**

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
