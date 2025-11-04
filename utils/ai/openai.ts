import { OpenAI } from "openai";
import { ChatCompletionCreateParamsBase, ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { Database } from '@/types/database.types';

// =============================================
// Type Definitions for Learning Companion
// =============================================

export interface UserInterest {
    id: string;
    interest_name: string;
    intensity_level: number;
}

export interface Competency {
    id: string;
    domain: Database['public']['Enums']['competency_domain'];
    title: string;
    description: string;
    grade_level: number;
    federal_state: Database['public']['Enums']['federal_state'];
    learning_objectives: string[];
}

export interface UserContext {
    id: string;
    name: string;
    interests: UserInterest[];
    currentCompetency?: Competency;
    gradeLevel: number;
    federalState: string;
    sessionDuration?: Database['public']['Enums']['session_duration_preference'];
    sensitivitySettings: {
        visual_stimulus: 'low' | 'medium' | 'high';
        auditory_stimulus: 'low' | 'medium' | 'high';
        cognitive_load: 'low' | 'medium' | 'high';
    };
}

export interface LearningMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: {
        competencyId?: string;
        stepInPedagogicalFlow?: number;
        confidenceLevel?: number;
    };
}

export interface BuddyResponse {
    message: string;
    suggestedNextStep?: 'continue_learning' | 'take_break' | 'change_topic' | 'end_session';
    confidenceAssessment?: number;
    pedagogicalNotes?: string;
}

// =============================================
// Buddy Personality Configuration
// =============================================

const BUDDY_PERSONALITY = {
    name: "Buddy",
    traits: {
        patient: "Never rushes the user, comfortable with silence",
        curious: "Genuinely interested in user's thoughts and passions",
        encouraging: "Celebrates effort and thinking process, not just answers",
        supportive: "Safe space for mistakes, no judgment ever",
        playful: "Creative connections to user interests, makes learning fun"
    },
    communicationStyle: {
        sentenceLength: "Short, simple sentences (max 10-12 words)",
        questionStyle: "One clear question at a time",
        emotionalTone: "Warm, calm, friendly",
        pacing: "Gentle, unhurried"
    }
};

// =============================================
// Constraint System - ABSOLUTE PROHIBITIONS
// =============================================

const FORBIDDEN_LANGUAGE = {
    evaluative: [
        'correct', 'wrong', 'right', 'incorrect', 'good job', 'bad job',
        'perfect', 'excellent', 'poor', 'failed', 'succeeded',
        'better', 'worse', 'improve', 'master', 'struggle'
    ],
    performance: [
        'points', 'score', 'grade', 'level', 'rank', 'percent',
        'progress', 'achievement', 'badge', 'reward', 'star',
        'test', 'exam', 'quiz', 'assessment', 'evaluation'
    ],
    pressure: [
        'hurry', 'quick', 'fast', 'slow', 'faster', 'slower',
        'deadline', 'time limit', 'race', 'competition', 'beat',
        'should', 'must', 'have to', 'need to', 'expect'
    ],
    comparison: [
        'other students', 'most kids', 'average', 'normal',
        'better than', 'worse than', 'compared to', 'like others'
    ]
};

// =============================================
// Pedagogical Strategy Functions
// =============================================

/**
 * Step 1: Identify Anchor Interest
 * Finds the user's strongest interest to use as learning anchor
 */
export function identifyAnchorInterest(userContext: UserContext): UserInterest | null {
    if (!userContext.interests || userContext.interests.length === 0) {
        return null;
    }

    // Sort by intensity level (highest first) and return top interest
    return userContext.interests
        .sort((a, b) => b.intensity_level - a.intensity_level)[0];
}

/**
 * Step 2: Select Target Competency
 * Chooses appropriate competency based on user's progress and curriculum
 */
export function selectTargetCompetency(userContext: UserContext, availableCompetencies: Competency[]): Competency | null {
    if (!availableCompetencies || availableCompetencies.length === 0) {
        return null;
    }

    // Filter by user's grade level and federal state
    const appropriateCompetencies = availableCompetencies.filter(
        comp => comp.grade_level === userContext.gradeLevel &&
                comp.federal_state === userContext.federalState
    );

    if (appropriateCompetencies.length === 0) {
        return null;
    }

    // For now, return the first appropriate competency
    // In real implementation, this would consider user's progress
    return appropriateCompetencies[0];
}

/**
 * Step 3: Build Bridge Question
 * Creates a playful connection between user's interest and the competency
 */
export function buildBridgeQuestion(interest: UserInterest, competency: Competency): string {
    const bridgeTemplates = {
        'Mathematik': [
            `Hey {userName}! Ich war gerade am Überlegen, wie wir {interestName} mit Mathe verbinden können. Wenn du in {interestName} {competencyTitle} machen würdest, wie würdest du das anpacken? 🤔`,
            `{userName}, ich habe eine coole Idee! Stell dir vor, du bist in der Welt von {interestName} und musst {competencyTitle} lösen. Was wäre deine erste Idee? 😊`,
            `Weißt du noch, wie sehr du {interestName} magst? Ich habe mich gefragt, wie {competencyTitle} in {interestName} vorkommen könnte. Hast du eine Vermutung? 🌟`
        ],
        'Deutsch': [
            `Hallo {userName}! Ich habe an {interestName} gedacht und überlegt, wie man {competencyTitle} damit beschreiben könnte. Was würdest du erzählen? 📚`,
            `{userName}, was für eine Geschichte über {interestName} würdest du schreiben, wenn {competencyTitle} dabei wichtig wäre? 📝`,
            `Ich bin so neugierig auf deine Gedanken! Wie würdest du {competencyTitle} in die Welt von {interestName} bringen? 🌈`
        ],
        'Sachkunde': [
            `Hey {userName}! Wusstest du, dass {competencyTitle} auch in {interestName} eine Rolle spielt? Wie meinst du, das funktioniert? 🔍`,
            `Ich habe etwas Spannendes entdeckt! {competencyTitle} und {interestName} hängen zusammen. Wie denkst du, das ist? 🌿`,
            `{userName}, lass uns gemeinsam forschen! Wie könnten {competencyTitle} und {interestName} zusammengehören? 🧪`
        ],
        'default': [
            `Hallo {userName}! Ich habe an {interestName} gedacht und mich gefragt, wie {competencyTitle} damit zu tun hat. Was meinst du? 🤔`,
            `Hey {userName}! Stell dir vor, {interestName} trifft auf {competencyTitle}. Was würde passieren? 😊`,
            `{userName}, ich bin so neugierig! Wie könnten {interestName} und {competencyTitle} zusammenpassen? 🌟`
        ]
    };

    const domainTemplates = bridgeTemplates[competency.domain] || bridgeTemplates['default'];
    const template = domainTemplates[Math.floor(Math.random() * domainTemplates.length)];

    return template
        .replace('{userName}', userContext.name)
        .replace('{interestName}', interest.interest_name)
        .replace('{competencyTitle}', competency.title.toLowerCase());
}

/**
 * Step 4: Guide Discovery
 * Provides scaffolding questions to help user discover the answer
 */
export function guideDiscovery(
    userMessage: string,
    competency: Competency,
    currentStep: number = 1
): string[] {
    const scaffoldingQuestions = {
        1: [
            "Das ist eine tolle Frage! Lass uns das Schritt für Schritt erkunden.",
            "Keine Sorge, wenn du nicht sofort weißt, wie das geht. Wir finden das zusammen heraus.",
            "Gute Idee! Schauen wir uns das mal genauer an."
        ],
        2: [
            "Was meinst du, wäre der erste kleine Schritt?",
            "Wenn du nur einen Teil davon machen müsstest, welcher wäre das?",
            "Lass uns ganz einfach anfangen. Was fällt dir als Erstes auf?"
        ],
        3: [
            "Genau! Und was würde dann als Nächstes kommen?",
            "Super! Wie können wir das noch genauer anschauen?",
            "Das ist eine kluge Beobachtung! Was bedeutet das für unser Problem?"
        ]
    };

    const stepQuestions = scaffoldingQuestions[Math.min(currentStep, 3) as keyof typeof scaffoldingQuestions];
    return stepQuestions[Math.floor(Math.random() * stepQuestions.length)];
}

/**
 * Step 5: Reinforce Concept
 * Praises thinking process and connects back to the concept
 */
export function reinforceConcept(
    userAnswer: string,
    competency: Competency,
    interest: UserInterest
): string {
    const reinforcementTemplates = [
        `Wow, {userName}! Das ist wirklich cleveres Denken. Du hast gerade herausgefunden, wie {competencyTitle} funktioniert! Das ist super, besonders weil du es mit {interestName} verbunden hast. 🌟`,
        `Das ist fantastisch, {userName}! Deine Art, das zu durchdenken, ist ganz besonders. Du hast {competencyTitle} auf deine eigene Weise verstanden - genau wie es in {interestName} vorkommt. 😊`,
        `Ich bin so beeindruckt, {userName}! Du hast das ganz toll herausgefunden. {competencyTitle} kann manchmal knifflig sein, aber du hast einen klugen Weg gefunden. Das erinnert mich an {interestName}! 🎉`
    ];

    const template = reinforcementTemplates[Math.floor(Math.random() * reinforcementTemplates.length)];
    return template
        .replace('{userName}', "du") // Using "du" instead of name for more natural German
        .replace('{competencyTitle}', competency.title.toLowerCase())
        .replace('{interestName}', interest.interest_name);
}

// =============================================
// Constraint Validation System
// =============================================

export function validateConstraints(content: string): {
    isValid: boolean;
    violations: string[];
    cleanedContent: string;
} {
    const violations: string[] = [];
    let cleanedContent = content;

    // Check for forbidden language
    Object.entries(FORBIDDEN_LANGUAGE).forEach(([category, words]) => {
        words.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(content)) {
                violations.push(`Forbidden ${category} language: "${word}"`);
                // Remove or replace forbidden language
                cleanedContent = cleanedContent.replace(regex, '');
            }
        });
    });

    // Check sentence length
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 12);
    if (longSentences.length > 0) {
        violations.push(`${longSentences.length} sentences too long (>12 words)`);
    }

    // Check for multiple questions
    const questionMarks = (content.match(/\?/g) || []).length;
    if (questionMarks > 1) {
        violations.push(`Multiple questions in one message (${questionMarks})`);
    }

    return {
        isValid: violations.length === 0,
        violations,
        cleanedContent: cleanedContent.trim()
    };
}

// =============================================
// System Prompt Templates
// =============================================

const createSystemPrompt = (userContext: UserContext, currentStep: number = 1): string => {
    const stepContext = {
        1: "You are introducing a new learning concept connected to the user's interests.",
        2: "You are guiding the user through discovery with scaffolding questions.",
        3: "You are reinforcing understanding and connecting to the concept.",
        4: "You are updating progress and transitioning to next steps."
    };

    return `You are ${BUDDY_PERSONALITY.name}, a Digital Learning Companion for neurodivergent learners.

CURRENT STEP: ${stepContext[currentStep as keyof typeof stepContext] || "General conversation"}

YOUR PERSONALITY:
- Patient & Calm: ${BUDDY_PERSONALITY.traits.patient}
- Curious & Encouraging: ${BUDDY_PERSONALITY.traits.curious}
- Supportive & Non-Judgmental: ${BUDDY_PERSONALITY.traits.supportive}
- Playful & Creative: ${BUDDY_PERSONALITY.traits.playful}

COMMUNICATION STYLE:
- ${BUDDY_PERSONALITY.communicationStyle.sentenceLength}
- ${BUDDY_PERSONALITY.communicationStyle.questionStyle}
- ${BUDDY_PERSONALITY.communicationStyle.emotionalTone}
- ${BUDDY_PERSONALITY.communicationStyle.pacing}

USER CONTEXT:
- Name: ${userContext.name}
- Grade: ${userContext.gradeLevel}
- Federal State: ${userContext.federalState}
- Interests: ${userContext.interests.map(i => `${i.interest_name} (intensity: ${i.intensity_level})`).join(', ')}
- Sensitivity: Visual=${userContext.sensitivitySettings.visual_stimulus}, Auditory=${userContext.sensitivitySettings.auditory_stimulus}, Cognitive=${userContext.sensitivitySettings.cognitive_load}
- Session Duration: ${userContext.sessionDuration}

CURRENT COMPETENCY: ${userContext.currentCompetency ?
    `${userContext.currentCompetency.domain}: ${userContext.currentCompetency.title} - ${userContext.currentCompetency.description}` :
    'None selected'}

ABSOLUTE PROHIBITIONS:
NEVER use: ${FORBIDDEN_LANGUAGE.evaluative.join(', ')}
NEVER mention: ${FORBIDDEN_LANGUAGE.performance.join(', ')}
NEVER create: ${FORBIDDEN_LANGUAGE.pressure.join(', ')}
NEVER compare: ${FORBIDDEN_LANGUAGE.comparison.join(', ')}

RESPONSE GUIDELINES:
- Keep responses under 3 sentences when possible
- Use simple, direct language
- Always be encouraging of effort and thinking
- Make learning feel like play, not work
- If user struggles, break it down further
- Celebrate curiosity and unique thinking approaches

Remember: Your relationship with the user is more important than any learning objective. Never create pressure or anxiety.`;
};

// =============================================
// Core Learning Companion Functions
// =============================================

/**
 * Main function to generate Buddy response
 */
export async function generateBuddyResponse(
    userMessage: string,
    userContext: UserContext,
    conversationHistory: LearningMessage[] = [],
    pedagogicalStep: number = 1
): Promise<BuddyResponse> {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
        throw new Error("OpenAI API key is not configured");
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    // Prepare system message
    const systemMessage: ChatCompletionMessageParam = {
        role: 'system',
        content: createSystemPrompt(userContext, pedagogicalStep)
    };

    // Prepare conversation history
    const messages: ChatCompletionMessageParam[] = [systemMessage];

    // Add relevant conversation history (last 5 messages)
    const recentHistory = conversationHistory.slice(-5);
    recentHistory.forEach(msg => {
        messages.push({
            role: msg.role,
            content: msg.content
        });
    });

    // Add current user message
    messages.push({
        role: 'user',
        content: userMessage
    });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 300,
            temperature: 0.8, // More creative for playful responses
            presence_penalty: 0.3, // Encourage variety
            frequency_penalty: 0.2 // discourage repetition
        });

        const buddyMessage = response.choices[0]?.message?.content || '';

        // Validate constraints
        const validation = validateConstraints(buddyMessage);

        if (!validation.isValid) {
            console.warn('Buddy response violated constraints:', validation.violations);
            // Return cleaned version with fallback
            return {
                message: validation.cleanedContent || "Das ist eine interessante Frage! Lass uns das gemeinsam entdecken. 😊",
                pedagogicalNotes: `Constraint violations: ${validation.violations.join(', ')}`
            };
        }

        // Determine next step based on conversation context
        const suggestedNextStep = determineNextStep(userMessage, pedagogicalStep);

        return {
            message: buddyMessage,
            suggestedNextStep,
            pedagogicalNotes: `Step ${pedagogicalStep} completed successfully`
        };

    } catch (error) {
        console.error("Error generating Buddy response:", error);

        // Fallback responses that always comply with constraints
        const fallbackResponses = [
            "Das ist eine tolle Frage! Lass uns das in Ruhe gemeinsam überlegen. 😊",
            "Ich finde deine Gedanken dazu wirklich spannend! Magst du mir mehr erzählen?",
            "Danke, dass du das mit mir teilst! Lass uns das Schritt für Schritt anschauen.",
            "Wie klug von dir, das zu bemerken! Was meinst du, könnten wir als Nächstes tun?"
        ];

        return {
            message: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
            pedagogicalNotes: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Determine the next step in the pedagogical flow
 */
function determineNextStep(userMessage: string, currentStep: number): BuddyResponse['suggestedNextStep'] {
    // Simple heuristic based on user engagement indicators
    const shortResponses = ['ok', 'ja', 'nein', 'ich weiß nicht', 'keine ahnung'];
    const fatigueIndicators = ['müde', 'keine lust', 'später', 'pausieren'];
    const enthusiasmIndicators = ['cool', 'super', 'toll', 'interessant', 'lustig'];

    const message = userMessage.toLowerCase();

    // Check for fatigue or disengagement
    if (fatigueIndicators.some(indicator => message.includes(indicator))) {
        return 'take_break';
    }

    // Check for short responses that might indicate confusion
    if (shortResponses.includes(message.trim()) && currentStep === 1) {
        return 'continue_learning';
    }

    // Check for enthusiasm
    if (enthusiasmIndicators.some(indicator => message.includes(indicator))) {
        return 'continue_learning';
    }

    // Default based on current step
    if (currentStep < 3) {
        return 'continue_learning';
    }

    return Math.random() > 0.7 ? 'take_break' : 'continue_learning';
}

/**
 * Complete 6-step pedagogical flow implementation
 */
export class BuddyLearningFlow {
    private userContext: UserContext;
    private currentStep: number = 1;
    private anchorInterest: UserInterest | null = null;
    private targetCompetency: Competency | null = null;

    constructor(userContext: UserContext) {
        this.userContext = userContext;
    }

    async initialize(availableCompetencies: Competency[]): Promise<string> {
        // Step 1: Identify Anchor Interest
        this.anchorInterest = identifyAnchorInterest(this.userContext);

        if (!this.anchorInterest) {
            return "Hallo! Bevor wir anfangen, würde ich gerne wissen, was du wirklich gerne magst. Was sind deine Lieblingssachen? 😊";
        }

        // Step 2: Select Target Competency
        this.targetCompetency = selectTargetCompetency(this.userContext, availableCompetencies);

        if (!this.targetCompetency) {
            return `Das ist super, dass du ${this.anchorInterest.interest_name} magst! Lass uns heute einfach etwas Schönes darüber entdecken. Was findest du besonders spannend daran? 🌟`;
        }

        // Step 3: Build Bridge Question
        this.currentStep = 1;
        return buildBridgeQuestion(this.anchorInterest, this.targetCompetency);
    }

    async processUserResponse(userMessage: string): Promise<BuddyResponse> {
        if (this.currentStep === 1) {
            // Step 4: Guide Discovery
            const guidance = guideDiscovery(userMessage, this.targetCompetency!, this.currentStep);
            this.currentStep = 2;

            return {
                message: guidance,
                suggestedNextStep: 'continue_learning'
            };
        } else if (this.currentStep === 2) {
            // Continue scaffolding or move to reinforcement
            this.currentStep = 3;
            const reinforcement = reinforceConcept(
                userMessage,
                this.targetCompetency!,
                this.anchorInterest!
            );

            return {
                message: reinforcement,
                suggestedNextStep: 'continue_learning'
            };
        } else {
            // Step 5: Continue with new concept or transition
            return await generateBuddyResponse(userMessage, this.userContext, [], 4);
        }
    }

    // Step 6: Update Backend (to be called after session)
    updateProgress(confidenceScore: number, timeSpentMinutes: number): void {
        // This would be implemented to update the database
        console.log(`Progress update: confidence=${confidenceScore}, time=${timeSpentMinutes}min`);
    }
}

// =============================================
// Fallback and Error Handling
// =============================================

export const FALLBACK_RESPONSES = {
    startSession: [
        "Hallo! Ich freu mich, dich zu sehen 😊 Was möchtest du heute gerne entdecken?",
        "Hey! Schön, dass du da bist. Worauf hast du gerade Lust?",
        "Hallo zusammen! Was für spannendes können wir heute erforschen?"
    ],
    confusion: [
        "Keine Sorge, das finden wir gemeinsam heraus! Lass uns das anders anschauen.",
        "Das ist eine gute Frage! Manchmal braucht man etwas Zeit, um Dinge zu verstehen.",
        "Das ist völlig okay! Lass uns das Schritt für Schritt durchgehen."
    ],
    technicalError: [
        "Oh, da hat sich etwas technisches eingeschlichen. Lass uns das in Ruhe nochmal versuchen.",
        "Kleine technische Pause! Das passiert manchmal. Wollen wir es frisch angehen?",
        "Upps, ein kleines technische Problem! Das macht nichts, wir probieren es einfach nochmal."
    ],
    endSession: [
        "Das war eine richtig schöne Zeit mit dir! Bis zum nächsten Mal! 🌟",
        "Danke für unser Gespräch! Ich freu mich schon, dich wiederzusehen. 😊",
        "Das war super heute! Schlaf gut und bis bald! 🌙"
    ]
};

// =============================================
// Rate Limiting and Exponential Backoff
// =============================================

export class RateLimitManager {
    private lastRequestTime: number = 0;
    private minInterval: number = 1000; // 1 second minimum between requests
    private consecutiveErrors: number = 0;

    async waitForRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minInterval) {
            const waitTime = this.minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Exponential backoff for consecutive errors
        if (this.consecutiveErrors > 0) {
            const backoffTime = Math.min(1000 * Math.pow(2, this.consecutiveErrors), 10000);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
        }

        this.lastRequestTime = Date.now();
    }

    recordError(): void {
        this.consecutiveErrors++;
    }

    recordSuccess(): void {
        this.consecutiveErrors = 0;
    }
}

// Export the rate limit manager instance
export const rateLimitManager = new RateLimitManager();

// Legacy function for backward compatibility
export async function generateCompletion(args: {
    chat: ChatCompletionMessageParam[];
    maxTokens?: number;
    onComplete?: (data: any) => void;
    responseFormatType?: any;
    model?: string;
    toolParams?: any;
}): Promise<string> {
    await rateLimitManager.waitForRateLimit();

    try {
        const response = await generateBuddyResponse(
            args.chat[args.chat.length - 1]?.content || '',
            {} as UserContext, // Would need proper user context
            args.chat.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: new Date().toISOString()
            }))
        );

        rateLimitManager.recordSuccess();
        args.onComplete?.({ choices: [{ message: { content: response.message } }] });

        return response.message;
    } catch (error) {
        rateLimitManager.recordError();
        throw error;
    }
}