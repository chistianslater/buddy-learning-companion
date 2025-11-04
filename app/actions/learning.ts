"use server";

import { auth } from '@clerk/nextjs/server';
import {
    getUserInterests,
    getNextCompetencyTarget,
    updateCompetencyProgress,
    getUserLearningContext,
    updateUserEngagementMetrics,
    getAvailableCompetencies
} from '@/utils/supabase/server';
import { BuddyLearningFlow, generateBuddyResponse, UserContext, LearningMessage } from '@/utils/ai/openai';
import type { Database } from '@/types/database.types';

// =============================================
// Type Definitions for Server Actions
// =============================================

export interface ServerUserContext extends UserContext {
    clerkId: string;
    gradeLevel: number;
    federalState: string;
    sessionDuration?: Database['public']['Enums']['session_duration_preference'];
}

export interface LearningSessionState {
    id: string;
    userId: string;
    buddyFlow: BuddyLearningFlow;
    startTime: Date;
    messageCount: number;
    currentCompetency?: string;
    totalResponseTime: number;
}

export interface ProcessMessageResult {
    buddyResponse: string;
    suggestedNextStep?: 'continue_learning' | 'take_break' | 'change_topic' | 'end_session';
    confidenceAssessment?: number;
    pedagogicalNotes?: string;
    competencyUpdated?: boolean;
}

export interface SessionMetrics {
    duration: number;
    messageCount: number;
    averageResponseTime: number;
    competencyProgress: number;
    engagementLevel: number;
}

// =============================================
// Session State Management
// =============================================

// In-memory session storage (in production, use Redis or similar)
const activeSessions = new Map<string, LearningSessionState>();

/**
 * Initialize or retrieve a learning session for the user
 */
export async function initializeLearningSession(): Promise<{
    sessionId: string;
    welcomeMessage: string;
    userContext: ServerUserContext;
}> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // Get user data from database
        const [interests, learningContext, competencyTarget] = await Promise.all([
            getUserInterests(userId),
            getUserLearningContext(userId),
            // For now, we'll get a default competency - this would be enhanced with proper logic
            getNextCompetencyTarget(userId, 3, 'Bayern') // Default grade 3, Bayern
        ]);

        // Build user context
        const userContext: ServerUserContext = {
            id: userId,
            clerkId: userId,
            name: "Freund", // Would get from user profile
            interests: interests || [],
            currentCompetency: competencyTarget || undefined,
            gradeLevel: learningContext?.session_duration ? 3 : 3, // Default to grade 3
            federalState: learningContext ? 'Bayern' : 'Bayern', // Default to Bayern
            sessionDuration: learningContext?.session_duration || 'medium_30',
            sensitivitySettings: learningContext?.sensitivity_settings as any || {
                visual_stimulus: 'low',
                auditory_stimulus: 'low',
                cognitive_load: 'low'
            }
        };

        // Create Buddy learning flow
        const buddyFlow = new BuddyLearningFlow(userContext);

        // Get available competencies
        const availableCompetencies = await getAvailableCompetencies(userContext.gradeLevel, userContext.federalState);

        // Initialize session with bridge question
        const welcomeMessage = await buddyFlow.initialize(availableCompetencies);

        // Create session state
        const sessionId = `session_${userId}_${Date.now()}`;
        const sessionState: LearningSessionState = {
            id: sessionId,
            userId,
            buddyFlow,
            startTime: new Date(),
            messageCount: 0,
            currentCompetency: competencyTarget?.id,
            totalResponseTime: 0
        };

        activeSessions.set(sessionId, sessionState);

        return {
            sessionId,
            welcomeMessage,
            userContext
        };

    } catch (error) {
        console.error('Error initializing learning session:', error);
        throw new Error('Failed to initialize learning session');
    }
}

/**
 * Process a user message and generate Buddy response
 */
export async function processUserMessage(
    sessionId: string,
    userMessage: string
): Promise<ProcessMessageResult> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    const sessionState = activeSessions.get(sessionId);
    if (!sessionState || sessionState.userId !== userId) {
        throw new Error('Invalid session');
    }

    const startTime = Date.now();

    try {
        // Process message through Buddy learning flow
        const buddyResponse = await sessionState.buddyFlow.processUserResponse(userMessage);

        // Update session metrics
        sessionState.messageCount++;
        const responseTime = Date.now() - startTime;
        sessionState.totalResponseTime += responseTime;

        // Update backend progress if competency is being worked on
        let competencyUpdated = false;
        if (sessionState.currentCompetency && buddyResponse.suggestedNextStep === 'continue_learning') {
            try {
                await updateCompetencyProgress(
                    userId,
                    sessionState.currentCompetency,
                    'in_progress',
                    buddyResponse.confidenceAssessment,
                    Math.floor(responseTime / 1000 / 60) // Convert to minutes
                );
                competencyUpdated = true;
            } catch (progressError) {
                console.warn('Failed to update competency progress:', progressError);
            }
        }

        return {
            buddyResponse: buddyResponse.message,
            suggestedNextStep: buddyResponse.suggestedNextStep,
            confidenceAssessment: buddyResponse.confidenceAssessment,
            pedagogicalNotes: buddyResponse.pedagogicalNotes,
            competencyUpdated
        };

    } catch (error) {
        console.error('Error processing user message:', error);

        // Return fallback response
        return {
            buddyResponse: "Das ist eine interessante Frage! Lass uns das gemeinsam entdecken. 😊",
            suggestedNextStep: 'continue_learning',
            pedagogicalNotes: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Get conversation history for a session
 */
export async function getSessionHistory(sessionId: string): Promise<LearningMessage[]> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    const sessionState = activeSessions.get(sessionId);
    if (!sessionState || sessionState.userId !== userId) {
        throw new Error('Invalid session');
    }

    // In a real implementation, this would fetch from database
    // For now, return empty history
    return [];
}

/**
 * End a learning session and update final metrics
 */
export async function endLearningSession(sessionId: string): Promise<{
    sessionMetrics: SessionMetrics;
    finalProgress: any;
}> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    const sessionState = activeSessions.get(sessionId);
    if (!sessionState || sessionState.userId !== userId) {
        throw new Error('Invalid session');
    }

    try {
        // Calculate session metrics
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - sessionState.startTime.getTime()) / 1000 / 60); // minutes
        const averageResponseTime = sessionState.messageCount > 0
            ? sessionState.totalResponseTime / sessionState.messageCount
            : 0;

        const sessionMetrics: SessionMetrics = {
            duration,
            messageCount: sessionState.messageCount,
            averageResponseTime,
            competencyProgress: sessionState.currentCompetency ? 1 : 0, // Simplified
            engagementLevel: calculateEngagementLevel(sessionState)
        };

        // Update user engagement metrics in database
        await updateUserEngagementMetrics(userId, duration);

        // Get final progress data
        const finalProgress = await getUserCompetencyProgress(userId);

        // Clean up session
        activeSessions.delete(sessionId);

        return {
            sessionMetrics,
            finalProgress
        };

    } catch (error) {
        console.error('Error ending learning session:', error);
        throw new Error('Failed to end learning session');
    }
}

// =============================================
// User Data Management Functions
// =============================================

/**
 * Get user's current learning context
 */
export async function getUserLearningContextData(): Promise<{
    interests: any[];
    competencyProgress: any[];
    learningContext: any;
}> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        const [interests, competencyProgress, learningContext] = await Promise.all([
            getUserInterests(userId),
            getUserCompetencyProgress(userId),
            getUserLearningContext(userId)
        ]);

        return {
            interests: interests || [],
            competencyProgress: competencyProgress || [],
            learningContext
        };

    } catch (error) {
        console.error('Error getting user learning context:', error);
        throw new Error('Failed to get user learning context');
    }
}

/**
 * Add a new user interest
 */
export async function addUserInterestData(interestName: string, intensityLevel: number = 1): Promise<any> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        return await addUserInterest(userId, interestName, intensityLevel);
    } catch (error) {
        console.error('Error adding user interest:', error);
        throw new Error('Failed to add user interest');
    }
}

/**
 * Get next recommended competency for user
 */
export async function getNextRecommendedCompetency(
    gradeLevel: number,
    federalState: string
): Promise<any> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        return await getNextCompetencyTarget(userId, gradeLevel, federalState);
    } catch (error) {
        console.error('Error getting next competency:', error);
        throw new Error('Failed to get next competency');
    }
}

/**
 * Update competency progress manually
 */
export async function updateCompetencyProgressData(
    competencyId: string,
    status: Database['public']['Enums']['progress_status'],
    confidenceScore?: number
): Promise<any> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        return await updateCompetencyProgress(userId, competencyId, status, confidenceScore);
    } catch (error) {
        console.error('Error updating competency progress:', error);
        throw new Error('Failed to update competency progress');
    }
}

// =============================================
// Analytics and Monitoring Functions
// =============================================

/**
 * Track engagement metrics
 */
export async function trackEngagementMetrics(
    sessionId: string,
    metrics: {
        responseTime: number;
        userEngagement: number;
        sessionQuality: number;
        technicalIssues: boolean;
    }
): Promise<void> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    const sessionState = activeSessions.get(sessionId);
    if (!sessionState || sessionState.userId !== userId) {
        return; // Silently ignore invalid sessions
    }

    try {
        // In a real implementation, this would store to analytics database
        console.log('Engagement metrics tracked:', {
            userId,
            sessionId,
            ...metrics,
            timestamp: new Date().toISOString()
        });

        // Update session state if needed
        if (metrics.technicalIssues) {
            console.warn('Technical issues detected in session:', sessionId);
        }

    } catch (error) {
        console.error('Error tracking engagement metrics:', error);
        // Don't throw - analytics failures shouldn't break the user experience
    }
}

/**
 * Get system health metrics
 */
export async function getSystemHealthMetrics(): Promise<{
    activeSessions: number;
    averageResponseTime: number;
    errorRate: number;
    systemStatus: 'healthy' | 'degraded' | 'critical';
}> {
    try {
        const activeSessionCount = activeSessions.size;

        // Calculate average response time across active sessions
        const responseTimes = Array.from(activeSessions.values())
            .filter(session => session.messageCount > 0)
            .map(session => session.totalResponseTime / session.messageCount);

        const averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            : 0;

        // Simple health assessment
        let systemStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
        let errorRate = 0;

        if (averageResponseTime > 5000) { // 5 seconds
            systemStatus = 'degraded';
        }
        if (averageResponseTime > 10000) { // 10 seconds
            systemStatus = 'critical';
        }

        return {
            activeSessions: activeSessionCount,
            averageResponseTime,
            errorRate,
            systemStatus
        };

    } catch (error) {
        console.error('Error getting system health metrics:', error);
        return {
            activeSessions: 0,
            averageResponseTime: 0,
            errorRate: 1,
            systemStatus: 'critical'
        };
    }
}

// =============================================
// Helper Functions
// =============================================

/**
 * Calculate engagement level based on session metrics
 */
function calculateEngagementLevel(sessionState: LearningSessionState): number {
    // Simple engagement calculation based on message frequency and response time
    const sessionDuration = (Date.now() - sessionState.startTime.getTime()) / 1000 / 60; // minutes
    const messagesPerMinute = sessionState.messageCount / Math.max(sessionDuration, 1);
    const averageResponseTime = sessionState.messageCount > 0
        ? sessionState.totalResponseTime / sessionState.messageCount
        : 0;

    // Higher engagement for more messages and quicker responses
    let engagementScore = 0;

    // Message frequency component (0-50 points)
    engagementScore += Math.min(messagesPerMinute * 10, 50);

    // Response time component (0-50 points, faster is better)
    const responseTimeScore = Math.max(0, 50 - (averageResponseTime / 100));
    engagementScore += responseTimeScore;

    return Math.min(100, Math.max(0, engagementScore));
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const maxSessionAge = 2 * 60 * 60 * 1000; // 2 hours

    for (const [sessionId, sessionState] of activeSessions.entries()) {
        const sessionAge = now - sessionState.startTime.getTime();
        if (sessionAge > maxSessionAge) {
            console.log(`Cleaning up expired session: ${sessionId}`);
            activeSessions.delete(sessionId);
        }
    }
}

// Clean up sessions every 30 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupExpiredSessions, 30 * 60 * 1000);
}

/**
 * Get user competency progress (helper function)
 */
async function getUserCompetencyProgress(userId: string) {
    try {
        // Import here to avoid circular dependencies
        const { getUserCompetencyProgress } = await import('@/utils/supabase/server');
        return await getUserCompetencyProgress(userId);
    } catch (error) {
        console.error('Error getting competency progress:', error);
        return [];
    }
}

// Export for testing
export { activeSessions };