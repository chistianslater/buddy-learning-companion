import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { generateBuddyResponse, rateLimitManager } from './openai';
import type { UserContext, LearningMessage } from './openai';

// =============================================
// Streaming Response Types
// =============================================

export interface StreamingChunk {
    content: string;
    isComplete: boolean;
    suggestedNextStep?: 'continue_learning' | 'take_break' | 'change_topic' | 'end_session';
    confidenceAssessment?: number;
    error?: string;
}

export interface StreamingCallbacks {
    onChunk?: (chunk: StreamingChunk) => void;
    onComplete?: (fullResponse: StreamingChunk) => void;
    onError?: (error: Error) => void;
}

// =============================================
// Real-time Streaming Implementation
// =============================================

/**
 * Generate streaming Buddy response for real-time chat experience
 */
export async function generateStreamingBuddyResponse(
    userMessage: string,
    userContext: UserContext,
    conversationHistory: LearningMessage[] = [],
    pedagogicalStep: number = 1,
    callbacks: StreamingCallbacks = {}
): Promise<void> {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
        const error = new Error("OpenAI API key is not configured");
        callbacks.onError?.(error);
        throw error;
    }

    await rateLimitManager.waitForRateLimit();

    const openai = new OpenAI({ apiKey: openaiKey });

    try {
        // Create system prompt with Buddy personality
        const systemPrompt = createStreamingSystemPrompt(userContext, pedagogicalStep);

        // Prepare messages
        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-5).map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            })),
            { role: 'user', content: userMessage }
        ];

        // Create streaming completion
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 300,
            temperature: 0.8,
            presence_penalty: 0.3,
            frequency_penalty: 0.2,
            stream: true
        });

        let accumulatedContent = '';
        let isFirstChunk = true;

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';

            if (content) {
                accumulatedContent += content;

                // Send chunk to callback
                callbacks.onChunk?.({
                    content: accumulatedContent,
                    isComplete: false,
                    suggestedNextStep: isFirstChunk ? 'continue_learning' : undefined
                });

                isFirstChunk = false;
            }
        }

        // Validate final content
        const validation = validateStreamingConstraints(accumulatedContent);

        if (!validation.isValid) {
            console.warn('Streaming response violated constraints:', validation.violations);
            accumulatedContent = validation.cleanedContent || "Das ist eine interessante Frage! Lass uns das gemeinsam entdecken. 😊";
        }

        // Final completion callback
        const finalResponse: StreamingChunk = {
            content: accumulatedContent,
            isComplete: true,
            suggestedNextStep: determineStreamingNextStep(userMessage, pedagogicalStep),
            confidenceAssessment: calculateStreamingConfidence(userMessage, accumulatedContent)
        };

        callbacks.onComplete?.(finalResponse);
        rateLimitManager.recordSuccess();

    } catch (error) {
        rateLimitManager.recordError();
        const errorObj = error instanceof Error ? error : new Error('Unknown streaming error');
        callbacks.onError?.(errorObj);

        // Send fallback response
        const fallbackChunk: StreamingChunk = {
            content: getStreamingFallbackResponse(),
            isComplete: true,
            suggestedNextStep: 'continue_learning'
        };
        callbacks.onComplete?.(fallbackChunk);
    }
}

// =============================================
// Streaming-specific Helper Functions
// =============================================

function createStreamingSystemPrompt(userContext: UserContext, currentStep: number): string {
    return `You are Buddy, a gentle Digital Learning Companion for neurodivergent learners.

RESPONDING IN STREAMING MODE: Your response will appear word by word. Keep sentences short and natural.

PERSONALITY:
- Patient, curious, encouraging, supportive, playful
- Short sentences (max 10 words)
- One question at a time
- Warm, calm, friendly tone
- Never create pressure or anxiety

USER: ${userContext.name} (Grade ${userContext.gradeLevel})
INTERESTS: ${userContext.interests.map(i => i.interest_name).join(', ')}
SENSITIVITY: ${userContext.sensitivitySettings.cognitive_load} cognitive load preference

ABSOLUTE PROHIBITIONS:
NEVER use: correct, wrong, good job, perfect, score, test, progress, hurry, should, better than
NEVER mention grades, points, levels, achievements, competition, comparison

STREAMING GUIDELINES:
- Start with short, warm responses
- Build naturally without long paragraphs
- Use natural pauses and conversational flow
- Keep it under 2-3 sentences total
- Make it feel like real conversation

Remember: Your relationship matters more than any learning objective.`;
}

function validateStreamingConstraints(content: string): {
    isValid: boolean;
    violations: string[];
    cleanedContent: string;
} {
    const violations: string[] = [];
    let cleanedContent = content;

    // Check for streaming-specific issues
    const forbiddenWords = ['richtig', 'falsch', 'super', 'perfekt', 'besser', 'schlechter', 'schnell', 'langsam'];

    forbiddenWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(content)) {
            violations.push(`Streaming constraint violation: "${word}"`);
            cleanedContent = cleanedContent.replace(regex, '');
        }
    });

    // Check sentence length (more lenient for streaming)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 15);
    if (longSentences.length > 0) {
        violations.push(`${longSentences.length} sentences too long for streaming (>15 words)`);
    }

    return {
        isValid: violations.length === 0,
        violations,
        cleanedContent: cleanedContent.trim()
    };
}

function determineStreamingNextStep(userMessage: string, currentStep: number): 'continue_learning' | 'take_break' | 'change_topic' | 'end_session' {
    const message = userMessage.toLowerCase();

    // Check for clear break indicators
    if (['müde', 'pause', 'später', 'keine lust', 'aufhören'].some(indicator => message.includes(indicator))) {
        return 'take_break';
    }

    // Check for topic change requests
    if (['was anderes', 'anderes thema', 'etwas anderes', 'thema wechseln'].some(indicator => message.includes(indicator))) {
        return 'change_topic';
    }

    // Check for session end
    if (['tschüss', 'auf wiedersehen', 'bis später', 'fertig'].some(indicator => message.includes(indicator))) {
        return 'end_session';
    }

    // Check for positive engagement
    if (['ja', 'cool', 'interessant', 'lustig', 'toll'].some(indicator => message.includes(indicator))) {
        return 'continue_learning';
    }

    // Default based on flow
    return currentStep < 3 ? 'continue_learning' : 'take_break';
}

function calculateStreamingConfidence(userMessage: string, buddyResponse: string): number {
    // Simple heuristic confidence calculation
    let confidence = 0.5; // Base confidence

    // Positive indicators
    if (userMessage.length > 10) confidence += 0.1;
    if (userMessage.includes('weil') || userMessage.includes('denn')) confidence += 0.1;
    if (userMessage.split(' ').length > 5) confidence += 0.1;

    // Negative indicators
    if (userMessage.length < 5) confidence -= 0.2;
    if (['ich weiß nicht', 'keine ahnung', 'keine idee'].some(phrase => userMessage.toLowerCase().includes(phrase))) {
        confidence -= 0.2;
    }

    // Response quality indicators
    if (buddyResponse.includes('😊') || buddyResponse.includes('🤔') || buddyResponse.includes('🌟')) {
        confidence += 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
}

function getStreamingFallbackResponse(): string {
    const fallbacks = [
        "Das ist interessant! Lass uns das gemeinsam entdecken. 😊",
        "Danke für deine Nachricht! Magst du mir mehr erzählen?",
        "Kluge Frage! Was meinst du dazu? 🤔",
        "Das ist schön! Wie denkst du darüber? 🌟"
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// =============================================
// Advanced Streaming Features
// =============================================

/**
 * Streaming with typing indicators and delays for natural conversation flow
 */
export async function generateNaturalStreamingResponse(
    userMessage: string,
    userContext: UserContext,
    conversationHistory: LearningMessage[] = [],
    callbacks: StreamingCallbacks = {}
): Promise<void> {
    // Simulate "thinking" delay before starting stream
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    // Show typing indicator
    callbacks.onChunk?.({
        content: '...',
        isComplete: false
    });

    // Short delay to simulate typing
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    // Generate actual streaming response
    await generateStreamingBuddyResponse(userMessage, userContext, conversationHistory, 1, {
        onChunk: (chunk) => {
            // Add small delays between chunks for natural typing effect
            setTimeout(() => {
                callbacks.onChunk?.(chunk);
            }, 50 + Math.random() * 100);
        },
        onComplete: callbacks.onComplete,
        onError: callbacks.onError
    });
}

/**
 * Adaptive streaming that adjusts speed based on user's cognitive load preference
 */
export async function generateAdaptiveStreamingResponse(
    userMessage: string,
    userContext: UserContext,
    conversationHistory: LearningMessage[] = [],
    callbacks: StreamingCallbacks = {}
): Promise<void> {
    const cognitiveLoad = userContext.sensitivitySettings.cognitive_load;

    // Adjust delays based on cognitive load preference
    const baseDelays = {
        low: { thinking: 500, between: 30, typing: 200 },
        medium: { thinking: 800, between: 50, typing: 300 },
        high: { thinking: 1200, between: 80, typing: 500 }
    };

    const delays = baseDelays[cognitiveLoad];

    // Simulate thinking
    await new Promise(resolve => setTimeout(resolve, delays.thinking));

    // Show typing indicator
    callbacks.onChunk?.({
        content: '...',
        isComplete: false
    });

    await new Promise(resolve => setTimeout(resolve, delays.typing));

    let accumulatedContent = '';
    let lastChunkTime = Date.now();

    // Stream with adaptive pacing
    const adaptiveCallbacks: StreamingCallbacks = {
        onChunk: (chunk) => {
            const now = Date.now();
            const timeSinceLastChunk = now - lastChunkTime;

            // Ensure minimum delay between chunks
            const actualDelay = Math.max(delays.between - timeSinceLastChunk, 0);

            setTimeout(() => {
                callbacks.onChunk?.(chunk);
                lastChunkTime = Date.now();
            }, actualDelay);
        },
        onComplete: callbacks.onComplete,
        onError: callbacks.onError
    };

    await generateStreamingBuddyResponse(userMessage, userContext, conversationHistory, 1, adaptiveCallbacks);
}

// =============================================
// Streaming Error Handling and Recovery
// =============================================

export class StreamingErrorHandler {
    private consecutiveErrors: number = 0;
    private maxRetries: number = 3;

    async handleStreamingError(
        error: Error,
        userMessage: string,
        userContext: UserContext,
        conversationHistory: LearningMessage[],
        originalCallbacks: StreamingCallbacks
    ): Promise<void> {
        this.consecutiveErrors++;

        console.error(`Streaming error #${this.consecutiveErrors}:`, error);

        if (this.consecutiveErrors >= this.maxRetries) {
            // Max retries reached, use fallback
            originalCallbacks.onComplete?.({
                content: this.getFallbackForError(error),
                isComplete: true,
                suggestedNextStep: 'continue_learning',
                error: error.message
            });
            this.consecutiveErrors = 0;
            return;
        }

        // Exponential backoff
        const backoffTime = Math.min(1000 * Math.pow(2, this.consecutiveErrors), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffTime));

        // Retry with simpler approach
        try {
            await generateStreamingBuddyResponse(userMessage, userContext, conversationHistory, 1, {
                ...originalCallbacks,
                onComplete: (chunk) => {
                    this.consecutiveErrors = 0; // Reset on success
                    originalCallbacks.onComplete?.(chunk);
                }
            });
        } catch (retryError) {
            await this.handleStreamingError(
                retryError instanceof Error ? retryError : new Error('Retry failed'),
                userMessage,
                userContext,
                conversationHistory,
                originalCallbacks
            );
        }
    }

    private getFallbackForError(error: Error): string {
        const errorMessages = [
            "Oh, da ist etwas passiert! Lass uns das einfach nochmal versuchen. 😊",
            "Kleine technische Pause! Was möchtest du mir gerne erzählen? 🌟",
            "Ups, da war etwas im Weg! Erzähl doch einfach, was dich beschäftigt. 🤔",
            "Technische Kleinigkeit! Ich bin wieder da. Was wollen wir erforschen? 😊"
        ];

        return errorMessages[Math.floor(Math.random() * errorMessages.length)];
    }
}

// Export singleton instance
export const streamingErrorHandler = new StreamingErrorHandler();