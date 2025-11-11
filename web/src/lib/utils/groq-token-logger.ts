/**
 * Token Usage Logger for Groq API calls
 * Logs token usage to a JSON file for analysis
 */

import fs from 'node:fs';
import path from 'node:path';

export interface TokenUsageLog {
  timestamp: string;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputToOutputRatio: number;
  metadata?: {
    productId?: string;
    messageCount?: number;
    imageCount?: number;
    groupCount?: number;
    [key: string]: any;
  };
}

class GroqTokenLogger {
  private logFile: string;
  private logStream: fs.WriteStream | null = null;
  private logs: TokenUsageLog[] = [];

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create a timestamped log file for each run
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logsDir, `groq-token-usage-${timestamp}.json`);
    
    // Also create a latest.json for easy access
    const latestFile = path.join(logsDir, 'groq-token-usage-latest.json');
    
    // Initialize log file with empty array
    fs.writeFileSync(this.logFile, '[]');
    fs.writeFileSync(latestFile, '[]');
    
    // Open write stream for appending
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    
    console.log(`📊 Token usage logging to: ${this.logFile}`);
    console.log(`📊 Latest token usage also saved to: ${latestFile}`);
  }

  /**
   * Log token usage for a Groq API call
   */
  log(
    operation: string,
    model: string,
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
    metadata?: Record<string, any>
  ): void {
    const inputTokens = usage.prompt_tokens;
    const outputTokens = usage.completion_tokens;
    const totalTokens = usage.total_tokens;
    const ratio = outputTokens > 0 ? inputTokens / outputTokens : 0;

    const logEntry: TokenUsageLog = {
      timestamp: new Date().toISOString(),
      operation,
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      inputToOutputRatio: Math.round(ratio * 100) / 100, // Round to 2 decimal places
      metadata: metadata || {},
    };

    // Add to in-memory array
    this.logs.push(logEntry);

    // Write to file (append as JSON line for easy parsing)
    if (this.logStream) {
      const jsonLine = JSON.stringify(logEntry) + '\n';
      this.logStream.write(jsonLine);
    }

    // Also update the full JSON array file
    this.updateFullLogFile();

    // Console output for immediate visibility
    console.log(
      `📊 Token Usage [${operation}]: Input=${inputTokens}, Output=${outputTokens}, Total=${totalTokens}, Ratio=${logEntry.inputToOutputRatio}:1`
    );
  }

  /**
   * Update the full JSON array file with all logs
   */
  private updateFullLogFile(): void {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      const latestFile = path.join(logsDir, 'groq-token-usage-latest.json');
      
      // Write complete array to latest file
      fs.writeFileSync(latestFile, JSON.stringify(this.logs, null, 2));
    } catch (error) {
      console.error('Error updating full log file:', error);
    }
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    averageInputTokens: number;
    averageOutputTokens: number;
    averageRatio: number;
    byOperation: Record<string, {
      count: number;
      avgInput: number;
      avgOutput: number;
      avgRatio: number;
    }>;
  } {
    if (this.logs.length === 0) {
      return {
        totalCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        averageInputTokens: 0,
        averageOutputTokens: 0,
        averageRatio: 0,
        byOperation: {},
      };
    }

    const totalInput = this.logs.reduce((sum, log) => sum + log.inputTokens, 0);
    const totalOutput = this.logs.reduce((sum, log) => sum + log.outputTokens, 0);
    const total = this.logs.reduce((sum, log) => sum + log.totalTokens, 0);

    // Group by operation
    const byOperation: Record<string, { input: number[]; output: number[]; ratio: number[] }> = {};
    this.logs.forEach((log) => {
      if (!byOperation[log.operation]) {
        byOperation[log.operation] = { input: [], output: [], ratio: [] };
      }
      byOperation[log.operation].input.push(log.inputTokens);
      byOperation[log.operation].output.push(log.outputTokens);
      byOperation[log.operation].ratio.push(log.inputToOutputRatio);
    });

    const operationStats: Record<string, any> = {};
    Object.keys(byOperation).forEach((op) => {
      const data = byOperation[op];
      const count = data.input.length;
      const avgInput = data.input.reduce((a, b) => a + b, 0) / count;
      const avgOutput = data.output.reduce((a, b) => a + b, 0) / count;
      const avgRatio = data.ratio.reduce((a, b) => a + b, 0) / count;

      operationStats[op] = {
        count,
        avgInput: Math.round(avgInput),
        avgOutput: Math.round(avgOutput),
        avgRatio: Math.round(avgRatio * 100) / 100,
      };
    });

    return {
      totalCalls: this.logs.length,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalTokens: total,
      averageInputTokens: Math.round(totalInput / this.logs.length),
      averageOutputTokens: Math.round(totalOutput / this.logs.length),
      averageRatio: Math.round((totalInput / totalOutput) * 100) / 100,
      byOperation: operationStats,
    };
  }

  /**
   * Print summary to console
   */
  printSummary(): void {
    const summary = this.getSummary();
    
    console.log('\n📊 ===== GROQ TOKEN USAGE SUMMARY =====');
    console.log(`Total API Calls: ${summary.totalCalls}`);
    console.log(`Total Input Tokens: ${summary.totalInputTokens.toLocaleString()}`);
    console.log(`Total Output Tokens: ${summary.totalOutputTokens.toLocaleString()}`);
    console.log(`Total Tokens: ${summary.totalTokens.toLocaleString()}`);
    console.log(`\nAverage Input Tokens: ${summary.averageInputTokens.toLocaleString()}`);
    console.log(`Average Output Tokens: ${summary.averageOutputTokens.toLocaleString()}`);
    console.log(`Average Input:Output Ratio: ${summary.averageRatio}:1`);
    
    console.log('\n📊 By Operation:');
    Object.keys(summary.byOperation).forEach((op) => {
      const stats = summary.byOperation[op];
      console.log(`  ${op}:`);
      console.log(`    Calls: ${stats.count}`);
      console.log(`    Avg Input: ${stats.avgInput.toLocaleString()} tokens`);
      console.log(`    Avg Output: ${stats.avgOutput.toLocaleString()} tokens`);
      console.log(`    Avg Ratio: ${stats.avgRatio}:1`);
    });
    
    console.log('\n📊 Groq Requirements Check:');
    console.log(`  ✅ Average Input < 8K: ${summary.averageInputTokens < 8000 ? '✅ PASS' : '❌ FAIL'} (${summary.averageInputTokens} tokens)`);
    console.log(`  ✅ Input:Output Ratio ~4:1: ${summary.averageRatio >= 3.5 && summary.averageRatio <= 4.5 ? '✅ PASS' : '⚠️  CHECK'} (${summary.averageRatio}:1)`);
    console.log('=====================================\n');
  }

  /**
   * Close the log stream
   */
  close(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
    this.updateFullLogFile();
  }
}

// Singleton instance
let loggerInstance: GroqTokenLogger | null = null;

/**
 * Get or create the token logger instance
 */
export function getTokenLogger(): GroqTokenLogger {
  if (!loggerInstance) {
    loggerInstance = new GroqTokenLogger();
  }
  return loggerInstance;
}

/**
 * Initialize token logger (call at start of parsing)
 */
export function initializeTokenLogger(): GroqTokenLogger {
  loggerInstance = new GroqTokenLogger();
  return loggerInstance;
}

/**
 * Close token logger (call at end of parsing)
 */
export function closeTokenLogger(): void {
  if (loggerInstance) {
    loggerInstance.printSummary();
    loggerInstance.close();
    loggerInstance = null;
  }
}


