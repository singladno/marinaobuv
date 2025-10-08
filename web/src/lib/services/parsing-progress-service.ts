/**
 * Service for updating parsing progress in real-time
 * This service provides methods to update parsing progress during the parsing process
 */

interface ParsingProgressUpdate {
  parsingHistoryId: string;
  messagesRead?: number;
  productsCreated?: number;
  status?: 'running' | 'completed' | 'failed';
  errorMessage?: string;
}

export class ParsingProgressService {
  private parsingHistoryId: string | null = null;
  private baseUrl: string;

  constructor(parsingHistoryId?: string) {
    this.parsingHistoryId = parsingHistoryId || null;
    // Use HTTP for localhost development, HTTPS for production
    const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    this.baseUrl = nextAuthUrl.replace('https://localhost', 'http://localhost');
  }

  /**
   * Set the parsing history ID for this service instance
   */
  setParsingHistoryId(id: string) {
    this.parsingHistoryId = id;
  }

  /**
   * Update parsing progress
   */
  async updateProgress(
    update: Omit<ParsingProgressUpdate, 'parsingHistoryId'>
  ) {
    if (!this.parsingHistoryId) {
      console.warn('⚠️ No parsing history ID set, skipping progress update');
      return;
    }

    try {
      console.log(
        `📡 Updating parsing progress at: ${this.baseUrl}/api/admin/parsing-progress`
      );

      const response = await fetch(
        `${this.baseUrl}/api/admin/parsing-progress`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            parsingHistoryId: this.parsingHistoryId,
            ...update,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to update parsing progress:', errorData);
        return;
      }

      const result = await response.json();
      console.log('📊 Parsing progress updated:', result.data);
    } catch (error) {
      console.error('❌ Error updating parsing progress:', error);
    }
  }

  /**
   * Update messages read count
   */
  async updateMessagesRead(count: number) {
    await this.updateProgress({ messagesRead: count });
  }

  /**
   * Update products created count
   */
  async updateProductsCreated(count: number) {
    await this.updateProgress({ productsCreated: count });
  }

  /**
   * Update both messages and products counts
   */
  async updateCounts(messagesRead: number, productsCreated: number) {
    await this.updateProgress({ messagesRead, productsCreated });
  }

  /**
   * Mark parsing as completed
   */
  async markCompleted(messagesRead: number, productsCreated: number) {
    await this.updateProgress({
      status: 'completed',
      messagesRead,
      productsCreated,
    });
  }

  /**
   * Mark parsing as failed
   */
  async markFailed(errorMessage: string) {
    await this.updateProgress({
      status: 'failed',
      errorMessage,
    });
  }

  /**
   * Mark parsing as partially completed due to timeout
   */
  async markPartialCompletion(
    messagesRead: number,
    productsCreated: number,
    reason: string = 'Process timeout - partial completion'
  ) {
    await this.updateProgress({
      status: 'completed',
      messagesRead,
      productsCreated,
      errorMessage: reason,
    });
  }

  /**
   * Get current parsing progress
   */
  async getProgress() {
    if (!this.parsingHistoryId) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/parsing-progress?parsingHistoryId=${this.parsingHistoryId}`
      );

      if (!response.ok) {
        console.error('❌ Failed to fetch parsing progress');
        return null;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching parsing progress:', error);
      return null;
    }
  }
}

// Export a singleton instance for convenience
export const parsingProgress = new ParsingProgressService();
