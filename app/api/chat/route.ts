import { NextRequest, NextResponse } from 'next/server';
import { initializeLearningSession, processUserMessage, endLearningSession } from '@/app/actions/learning';
import { generateStreamingBuddyResponse } from '@/utils/ai/streaming';
import { rateLimitManager } from '@/utils/ai/openai';

// =============================================
// Chat API Types
// =============================================

interface ChatRequest {
    action: 'start' | 'message' | 'end';
    sessionId?: string;
    message?: string;
    userContext?: {
        gradeLevel?: number;
        federalState?: string;
        sensitivitySettings?: any;
    };
}

interface ChatResponse {
    success: boolean;
    data?: any;
    error?: string;
    sessionId?: string;
}

// =============================================
// Rate Limiting
// =============================================

const RATE_LIMITS = {
    messages: {
        windowMs: 60 * 1000, // 1 minute
        max: 30, // 30 messages per minute
    },
    sessions: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 new sessions per hour
    }
};

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, limit: typeof RATE_LIMITS.messages): boolean {
    const now = Date.now();
    const key = `${identifier}_${limit.windowMs}`;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs });
        return true;
    }

    if (record.count >= limit.max) {
        return false;
    }

    record.count++;
    return true;
}

// =============================================
// Main Chat Handler
// =============================================

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
    try {
        // Get client IP for rate limiting
        const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

        // Parse request body
        const body: ChatRequest = await request.json();

        // Validate request
        if (!body.action || !['start', 'message', 'end'].includes(body.action)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid action'
            }, { status: 400 });
        }

        // Route to appropriate handler
        switch (body.action) {
            case 'start':
                return await handleStartSession(clientIP, body);
            case 'message':
                return await handleProcessMessage(clientIP, body);
            case 'end':
                return await handleEndSession(clientIP, body);
            default:
                return NextResponse.json({
                    success: false,
                    error: 'Unknown action'
                }, { status: 400 });
        }

    } catch (error) {
        console.error('Chat API error:', error);

        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

// =============================================
// Session Handlers
// =============================================

async function handleStartSession(clientIP: string, body: ChatRequest): Promise<NextResponse<ChatResponse>> {
    // Check rate limit for new sessions
    if (!checkRateLimit(clientIP, RATE_LIMITS.sessions)) {
        return NextResponse.json({
            success: false,
            error: 'Too many session requests. Please try again later.'
        }, { status: 429 });
    }

    try {
        const result = await initializeLearningSession();

        return NextResponse.json({
            success: true,
            data: {
                welcomeMessage: result.welcomeMessage,
                userContext: result.userContext
            },
            sessionId: result.sessionId
        });

    } catch (error) {
        console.error('Error starting session:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to start learning session'
        }, { status: 500 });
    }
}

async function handleProcessMessage(clientIP: string, body: ChatRequest): Promise<NextResponse<ChatResponse>> {
    // Check rate limit for messages
    if (!checkRateLimit(clientIP, RATE_LIMITS.messages)) {
        return NextResponse.json({
            success: false,
            error: 'Too many messages. Please slow down.'
        }, { status: 429 });
    }

    if (!body.sessionId || !body.message) {
        return NextResponse.json({
            success: false,
            error: 'Session ID and message are required'
        }, { status: 400 });
    }

    try {
        await rateLimitManager.waitForRateLimit();

        const result = await processUserMessage(body.sessionId, body.message);

        return NextResponse.json({
            success: true,
            data: {
                buddyResponse: result.buddyResponse,
                suggestedNextStep: result.suggestedNextStep,
                confidenceAssessment: result.confidenceAssessment,
                pedagogicalNotes: result.pedagogicalNotes,
                competencyUpdated: result.competencyUpdated
            }
        });

    } catch (error) {
        console.error('Error processing message:', error);

        // Return fallback response
        return NextResponse.json({
            success: true, // Still success to not break the user experience
            data: {
                buddyResponse: "Das ist eine interessante Frage! Lass uns das gemeinsam entdecken. 😊",
                suggestedNextStep: 'continue_learning',
                pedagogicalNotes: 'Fallback response due to error'
            }
        });
    }
}

async function handleEndSession(clientIP: string, body: ChatRequest): Promise<NextResponse<ChatResponse>> {
    if (!body.sessionId) {
        return NextResponse.json({
            success: false,
            error: 'Session ID is required'
        }, { status: 400 });
    }

    try {
        const result = await endLearningSession(body.sessionId);

        return NextResponse.json({
            success: true,
            data: {
                sessionMetrics: result.sessionMetrics,
                finalProgress: result.finalProgress
            }
        });

    } catch (error) {
        console.error('Error ending session:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to end session'
        }, { status: 500 });
    }
}

// =============================================
// Streaming Chat Endpoint
// =============================================

export async function PATCH(request: NextRequest): Promise<Response> {
    try {
        const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

        // Check rate limit
        if (!checkRateLimit(clientIP, RATE_LIMITS.messages)) {
            return new Response('Too many requests', { status: 429 });
        }

        const body = await request.json();

        if (!body.sessionId || !body.message || !body.userContext) {
            return new Response('Missing required fields', { status: 400 });
        }

        // Create streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    await rateLimitManager.waitForRateLimit();

                    let accumulatedContent = '';
                    let isFirstChunk = true;

                    await generateStreamingBuddyResponse(
                        body.message,
                        body.userContext,
                        [],
                        1,
                        {
                            onChunk: (chunk) => {
                                if (isFirstChunk) {
                                    // Send initial metadata
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                        type: 'start',
                                        sessionId: body.sessionId
                                    })}\n\n`));
                                    isFirstChunk = false;
                                }

                                // Send content chunk
                                const content = chunk.content.replace(accumulatedContent, '');
                                if (content) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                        type: 'chunk',
                                        content: content
                                    })}\n\n`));
                                    accumulatedContent = chunk.content;
                                }

                                if (chunk.isComplete) {
                                    // Send completion metadata
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                        type: 'end',
                                        suggestedNextStep: chunk.suggestedNextStep,
                                        confidenceAssessment: chunk.confidenceAssessment
                                    })}\n\n`));
                                    controller.close();
                                }
                            },
                            onError: (error) => {
                                console.error('Streaming error:', error);
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                    type: 'error',
                                    error: 'Something went wrong. Please try again.'
                                })}\n\n`));
                                controller.close();
                            }
                        }
                    );

                } catch (error) {
                    console.error('Stream error:', error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'error',
                        error: 'Stream failed'
                    })}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });

    } catch (error) {
        console.error('Streaming API error:', error);
        return new Response('Internal server error', { status: 500 });
    }
}

// =============================================
// Health Check Endpoint
// =============================================

export async function GET(): Promise<NextResponse> {
    try {
        // Simple health check
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            endpoints: {
                start: 'POST /api/chat - Start new learning session',
                message: 'POST /api/chat - Send message in existing session',
                streaming: 'PATCH /api/chat - Get streaming response',
                end: 'POST /api/chat - End learning session',
                health: 'GET /api/chat - Health check'
            }
        };

        return NextResponse.json(health);

    } catch (error) {
        console.error('Health check error:', error);

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// =============================================
// CORS and Headers
// =============================================

export async function OPTIONS(): Promise<NextResponse> {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
}

// =============================================
// Error Handling Middleware
// =============================================

export async function middleware(request: NextRequest) {
    // Add security headers
    const response = NextResponse.next();

    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}