/**
 * Parsing Coordinator Service
 * Manages manual vs automated parsing to prevent conflicts
 */
import { prisma } from '../db-node';

export interface ParsingRequest {
  type: 'manual' | 'cron';
  reason?: string;
}

export interface ParsingGuardResult {
  canProceed: boolean;
  reason?: string;
  runningProcesses?: Array<{
    id: string;
    type: string;
    startedAt: Date;
    duration: number;
  }>;
}

export class ParsingCoordinator {
  /**
   * Check if parsing can proceed and handle conflicts
   */
  static async canStartParsing(
    request: ParsingRequest
  ): Promise<ParsingGuardResult> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get all running processes
    const runningProcesses = await prisma.parsingHistory.findMany({
      where: { status: 'running' },
      orderBy: { startedAt: 'desc' },
    });

    // If no processes running, allow immediately
    if (runningProcesses.length === 0) {
      return { canProceed: true };
    }

    // Check for stuck processes (running > 1 hour)
    const stuckProcesses = runningProcesses.filter(
      p => p.startedAt < oneHourAgo
    );

    if (stuckProcesses.length > 0) {
      console.log(
        `🧹 Found ${stuckProcesses.length} stuck processes, cleaning up...`
      );
      await this.cleanupStuckProcesses(stuckProcesses);

      // After cleanup, check again
      const remainingProcesses = await prisma.parsingHistory.count({
        where: { status: 'running' },
      });

      if (remainingProcesses === 0) {
        return { canProceed: true };
      }
    }

    // Handle different request types
    if (request.type === 'manual') {
      return this.handleManualRequest(request, runningProcesses);
    } else {
      return this.handleCronRequest(runningProcesses, request.reason);
    }
  }

  /**
   * Handle manual parsing requests - NO FORCE OVERRIDE
   */
  private static async handleManualRequest(
    request: ParsingRequest,
    runningProcesses: any[]
  ): Promise<ParsingGuardResult> {
    const processInfo = runningProcesses.map(p => ({
      id: p.id,
      type: p.triggeredBy || 'unknown',
      startedAt: p.startedAt,
      duration: Math.floor((Date.now() - p.startedAt.getTime()) / 1000),
    }));

    // Check if there's already a manual process running
    const manualProcess = runningProcesses.find(
      p => p.triggeredBy === 'manual'
    );
    if (manualProcess) {
      return {
        canProceed: false,
        reason: 'Manual parsing already in progress. Wait for completion.',
        runningProcesses: processInfo,
      };
    }

    // Check if cron process is running - BLOCK manual parsing
    const cronProcess = runningProcesses.find(p => p.triggeredBy === 'cron');
    if (cronProcess) {
      const duration = Math.floor(
        (Date.now() - cronProcess.startedAt.getTime()) / 1000
      );
      return {
        canProceed: false,
        reason: `Cron parsing is running (${duration}s). Manual parsing is not allowed while cron is active.`,
        runningProcesses: processInfo,
      };
    }

    // Allow manual parsing only if no other processes are running
    return { canProceed: true };
  }

  /**
   * Handle cron parsing requests
   */
  private static async handleCronRequest(
    runningProcesses: any[],
    currentReason?: string
  ): Promise<ParsingGuardResult> {
    const processInfo = runningProcesses.map(p => ({
      id: p.id,
      type: p.triggeredBy || 'unknown',
      startedAt: p.startedAt,
      duration: Math.floor((Date.now() - p.startedAt.getTime()) / 1000),
    }));

    // Cron should not override manual processes
    const manualProcess = runningProcesses.find(
      p => p.triggeredBy === 'manual'
    );
    if (manualProcess) {
      return {
        canProceed: false,
        reason: 'Manual parsing in progress. Cron will skip this run.',
        runningProcesses: processInfo,
      };
    }

    // Cron should not override other cron processes of the SAME type
    // BUT: Allow different parser types to run simultaneously (Telegram vs Groq)
    const isCurrentTelegram = currentReason?.includes('Telegram');

    // Find cron processes of the same type
    const sameTypeCronProcess = runningProcesses.find(p => {
      if (p.triggeredBy !== 'cron') return false;

      const isRunningTelegram = p.reason?.includes('Telegram');
      const isRunningGroq =
        p.reason?.includes('Groq') || p.reason?.includes('WhatsApp');

      // If current is Telegram, block only if another Telegram is running
      if (isCurrentTelegram && isRunningTelegram) return true;

      // If current is Groq, block only if another Groq is running
      if (!isCurrentTelegram && isRunningGroq) return true;

      // Different parser types can run simultaneously
      return false;
    });

    if (sameTypeCronProcess) {
      return {
        canProceed: false,
        reason: `${isCurrentTelegram ? 'Telegram' : 'Groq'} parser already in progress. Skipping this run.`,
        runningProcesses: processInfo,
      };
    }

    return { canProceed: true };
  }

  /**
   * Create a parsing history record with proper metadata
   */
  static async createParsingHistory(
    type: 'manual' | 'cron',
    reason?: string
  ): Promise<string> {
    const parsingHistory = await prisma.parsingHistory.create({
      data: {
        startedAt: new Date(),
        status: 'running',
        messagesRead: 0,
        productsCreated: 0,
        triggeredBy: type,
        reason: reason || null,
      },
    });

    return parsingHistory.id;
  }

  /**
   * Clean up stuck processes
   */
  private static async cleanupStuckProcesses(
    stuckProcesses: any[]
  ): Promise<void> {
    const now = new Date();

    for (const process of stuckProcesses) {
      const duration = Math.floor(
        (now.getTime() - process.startedAt.getTime()) / 1000
      );

      await prisma.parsingHistory.update({
        where: { id: process.id },
        data: {
          status: 'failed',
          completedAt: now,
          errorMessage: `Process timeout (${duration}s) - automatically cleaned up`,
        },
      });
    }
  }

  /**
   * Get current parsing status
   */
  static async getParsingStatus(): Promise<{
    running: number;
    processes: Array<{
      id: string;
      type: string;
      startedAt: Date;
      duration: number;
      reason?: string;
    }>;
  }> {
    const processes = await prisma.parsingHistory.findMany({
      where: { status: 'running' },
      orderBy: { startedAt: 'desc' },
    });

    return {
      running: processes.length,
      processes: processes.map(p => ({
        id: p.id,
        type: p.triggeredBy || 'unknown',
        startedAt: p.startedAt,
        duration: Math.floor((Date.now() - p.startedAt.getTime()) / 1000),
        reason: p.reason || undefined,
      })),
    };
  }
}
