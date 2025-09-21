import { NextRequest } from 'next/server';

// Store active connections for AI events
const aiConnections = new Set<ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  console.log(`🔌 AI SSE connection request`);

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Store connection
      aiConnections.add(controller);

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
          aiConnections.delete(controller);
        }
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        aiConnections.delete(controller);
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

// Function to broadcast AI events to all connections
export function broadcastAIEvent(event: any) {
  console.log(`📡 Broadcasting AI event to all connections:`, event);

  if (aiConnections.size === 0) {
    console.log(`❌ No active AI connections found`);
    return;
  }

  const data = JSON.stringify(event);
  let successCount = 0;
  let errorCount = 0;

  aiConnections.forEach(controller => {
    try {
      controller.enqueue(`data: ${data}\n\n`);
      successCount++;
    } catch (error) {
      console.error('Error broadcasting AI event:', error);
      aiConnections.delete(controller);
      errorCount++;
    }
  });

  console.log(
    `✅ AI event sent to ${successCount} connections, ${errorCount} failed`
  );
}
