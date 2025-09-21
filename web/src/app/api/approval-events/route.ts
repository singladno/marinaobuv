import { NextRequest } from 'next/server';

// Store active connections
const connections = new Set<ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  console.log(`🔌 SSE connection request for all drafts`);

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Store connection
      connections.add(controller);

      // Send initial connection message
      const data = JSON.stringify({
        type: 'connected',
        timestamp: Date.now(),
      });
      controller.enqueue(`data: ${data}\n\n`);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
        } catch (error) {
          clearInterval(keepAlive);
          connections.delete(controller);
        }
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        connections.delete(controller);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Function to broadcast events to all connections
export function broadcastApprovalEvent(draftId: string, event: any) {
  console.log(`📡 Broadcasting event to all connections:`, event);

  if (connections.size === 0) {
    console.log(`❌ No active connections found`);
    return;
  }

  const data = JSON.stringify(event);
  let successCount = 0;
  let errorCount = 0;

  connections.forEach(controller => {
    try {
      controller.enqueue(`data: ${data}\n\n`);
      successCount++;
    } catch (error) {
      console.error('Error broadcasting event:', error);
      connections.delete(controller);
      errorCount++;
    }
  });

  console.log(
    `✅ Event sent to ${successCount} connections, ${errorCount} failed`
  );
}
