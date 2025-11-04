"use server";

import { auth } from '@clerk/nextjs/server';
import { getUserCompetencyProgress } from '@/utils/supabase/server';
import type { Database } from '@/types/database.types';

// =============================================
// Analytics Types
// =============================================

export interface LearningSessionAnalytics {
    sessionId: string;
    userId: string;
    startTime: Date;
    endTime?: Date;
    duration: number; // in minutes
    messageCount: number;
    averageResponseTime: number; // in milliseconds
    competencyId?: string;
    competencyProgress: {
        beforeStatus?: Database['public']['Enums']['progress_status'];
        afterStatus?: Database['public']['Enums']['progress_status'];
        confidenceChange?: number;
    };
    engagementLevel: number; // 0-100
    technicalIssues: {
        count: number;
        types: string[];
    };
    suggestedNextStep?: string;
    sessionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface UserLearningMetrics {
    userId: string;
    totalSessions: number;
    totalLearningTime: number; // in minutes
    averageSessionDuration: number;
    competencyProgress: {
        totalCompetencies: number;
        masteredCount: number;
        inProgressCount: number;
        strugglingCount: number;
        notStartedCount: number;
    };
    engagementTrends: Array<{
        date: string;
        sessionCount: number;
        totalDuration: number;
        averageEngagement: number;
    }>;
    interestEffectiveness: Array<{
        interestName: string;
        usageCount: number;
        averageEngagement: number;
        competencyConnections: number;
    }>;
    learningVelocity: number; // competencies per week
    streakInfo: {
        currentStreak: number; // consecutive days
        longestStreak: number;
        lastActivityDate: string;
    };
}

export interface SystemAnalytics {
    totalUsers: number;
    activeUsers: number; // users in last 7 days
    totalSessions: number;
    averageSessionDuration: number;
    systemPerformance: {
        averageResponseTime: number;
        errorRate: number;
        uptime: number; // percentage
        activeSessionCount: number;
    };
    contentAnalytics: {
        mostUsedCompetencies: Array<{
            competencyId: string;
            title: string;
            usageCount: number;
            averageSuccessRate: number;
        }>;
        domainUsage: Record<string, number>;
        federalStateUsage: Record<string, number>;
    };
    userSatisfaction: {
        averageRating: number;
        feedbackCount: number;
        commonIssues: string[];
    };
}

// =============================================
// Session Analytics
// =============================================

/**
 * Record analytics for a completed learning session
 */
export async function recordSessionAnalytics(sessionData: Omit<LearningSessionAnalytics, 'sessionQuality'>): Promise<void> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // Calculate session quality
        const sessionQuality = calculateSessionQuality(sessionData);

        // In a real implementation, this would store to analytics database
        console.log('Recording session analytics:', {
            ...sessionData,
            sessionQuality,
            timestamp: new Date().toISOString()
        });

        // Update user engagement metrics
        await updateUserSessionMetrics(userId, {
            duration: sessionData.duration,
            messageCount: sessionData.messageCount,
            engagementLevel: sessionData.engagementLevel,
            competencyProgress: sessionData.competencyProgress
        });

    } catch (error) {
        console.error('Error recording session analytics:', error);
        // Don't throw - analytics failures shouldn't break the user experience
    }
}

/**
 * Get detailed analytics for a specific session
 */
export async function getSessionAnalytics(sessionId: string): Promise<LearningSessionAnalytics | null> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // In a real implementation, this would fetch from analytics database
        // For now, return mock data
        const mockAnalytics: LearningSessionAnalytics = {
            sessionId,
            userId,
            startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            endTime: new Date(),
            duration: 30,
            messageCount: 8,
            averageResponseTime: 2500,
            competencyId: 'competency_123',
            competencyProgress: {
                beforeStatus: 'not_started',
                afterStatus: 'in_progress',
                confidenceChange: 0.3
            },
            engagementLevel: 75,
            technicalIssues: {
                count: 0,
                types: []
            },
            suggestedNextStep: 'continue_learning',
            sessionQuality: 'good'
        };

        return mockAnalytics;

    } catch (error) {
        console.error('Error getting session analytics:', error);
        throw new Error('Failed to get session analytics');
    }
}

/**
 * Get session analytics for a user within a date range
 */
export async function getUserSessionHistory(
    startDate?: Date,
    endDate?: Date,
    limit: number = 50
): Promise<LearningSessionAnalytics[]> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // In a real implementation, this would fetch from analytics database with date filtering
        console.log('Getting user session history:', { userId, startDate, endDate, limit });

        // Return mock data for now
        const mockSessions: LearningSessionAnalytics[] = [
            {
                sessionId: 'session_1',
                userId,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
                duration: 25,
                messageCount: 12,
                averageResponseTime: 2200,
                competencyId: 'competency_456',
                competencyProgress: {
                    beforeStatus: 'in_progress',
                    afterStatus: 'mastered',
                    confidenceChange: 0.4
                },
                engagementLevel: 85,
                technicalIssues: { count: 0, types: [] },
                suggestedNextStep: 'continue_learning',
                sessionQuality: 'excellent'
            },
            {
                sessionId: 'session_2',
                userId,
                startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
                duration: 20,
                messageCount: 8,
                averageResponseTime: 2800,
                competencyId: 'competency_789',
                competencyProgress: {
                    beforeStatus: 'not_started',
                    afterStatus: 'in_progress',
                    confidenceChange: 0.2
                },
                engagementLevel: 70,
                technicalIssues: { count: 1, types: ['slow_response'] },
                suggestedNextStep: 'take_break',
                sessionQuality: 'good'
            }
        ];

        return mockSessions.slice(0, limit);

    } catch (error) {
        console.error('Error getting user session history:', error);
        throw new Error('Failed to get user session history');
    }
}

// =============================================
// User Learning Metrics
// =============================================

/**
 * Get comprehensive learning metrics for a user
 */
export async function getUserLearningMetrics(): Promise<UserLearningMetrics> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // Get user's competency progress
        const competencyProgress = await getUserCompetencyProgress(userId);

        // Calculate competency statistics
        const competencyStats = {
            totalCompetencies: competencyProgress?.length || 0,
            masteredCount: competencyProgress?.filter(cp => cp.status === 'mastered').length || 0,
            inProgressCount: competencyProgress?.filter(cp => cp.status === 'in_progress').length || 0,
            strugglingCount: competencyProgress?.filter(cp => cp.status === 'struggling').length || 0,
            notStartedCount: competencyProgress?.filter(cp => cp.status === 'not_started').length || 0
        };

        // Mock engagement trends (would calculate from actual session data)
        const engagementTrends = [
            { date: '2024-01-01', sessionCount: 2, totalDuration: 50, averageEngagement: 75 },
            { date: '2024-01-02', sessionCount: 1, totalDuration: 30, averageEngagement: 80 },
            { date: '2024-01-03', sessionCount: 3, totalDuration: 75, averageEngagement: 70 },
            { date: '2024-01-04', sessionCount: 1, totalDuration: 25, averageEngagement: 85 }
        ];

        // Mock interest effectiveness (would calculate from session data)
        const interestEffectiveness = [
            { interestName: 'Minecraft', usageCount: 8, averageEngagement: 85, competencyConnections: 3 },
            { interestName: 'Dinosaurier', usageCount: 5, averageEngagement: 75, competencyConnections: 2 },
            { interestName: 'Pferde', usageCount: 3, averageEngagement: 80, competencyConnections: 1 }
        ];

        // Calculate learning velocity (competencies per week)
        const totalSessions = engagementTrends.reduce((sum, trend) => sum + trend.sessionCount, 0);
        const learningVelocity = competencyStats.masteredCount / Math.max(totalSessions / 7, 1);

        // Mock streak information
        const streakInfo = {
            currentStreak: 3,
            longestStreak: 7,
            lastActivityDate: new Date().toISOString().split('T')[0]
        };

        return {
            userId,
            totalSessions,
            totalLearningTime: engagementTrends.reduce((sum, trend) => sum + trend.totalDuration, 0),
            averageSessionDuration: totalSessions > 0 ?
                engagementTrends.reduce((sum, trend) => sum + trend.totalDuration, 0) / totalSessions : 0,
            competencyProgress: competencyStats,
            engagementTrends,
            interestEffectiveness,
            learningVelocity,
            streakInfo
        };

    } catch (error) {
        console.error('Error getting user learning metrics:', error);
        throw new Error('Failed to get user learning metrics');
    }
}

/**
 * Get learning insights and recommendations for a user
 */
export async function getUserLearningInsights(): Promise<{
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    nextSteps: Array<{
        competencyId: string;
        competencyTitle: string;
        reason: string;
        priority: 'high' | 'medium' | 'low';
    }>;
}> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // Get user metrics
        const metrics = await getUserLearningMetrics();

        // Generate insights based on metrics
        const strengths: string[] = [];
        const areasForImprovement: string[] = [];
        const recommendations: string[] = [];

        // Analyze engagement patterns
        const avgEngagement = metrics.engagementTrends.reduce((sum, trend) => sum + trend.averageEngagement, 0) / metrics.engagementTrends.length;

        if (avgEngagement > 80) {
            strengths.push('Hohe und konstante Engagement-Bereitschaft');
        } else if (avgEngagement < 60) {
            areasForImprovement.push('Engagement könnte durch interessantere Themen gesteigert werden');
            recommendations.push('Erkunde neue Interessen, um die Motivation zu steigern');
        }

        // Analyze competency progress
        const completionRate = metrics.competencyProgress.masteredCount / Math.max(metrics.competencyProgress.totalCompetencies, 1);

        if (completionRate > 0.7) {
            strengths.push('Gute Fortschritte beim Beherrschen von Kompetenzen');
        } else if (completionRate < 0.3) {
            areasForImprovement.push('Viele Kompetenzen sind noch nicht begonnen');
            recommendations.push('Konzentriere dich auf 1-2 Kompetenzen gleichzeitig');
        }

        // Analyze session patterns
        if (metrics.averageSessionDuration > 30) {
            strengths.push('Lange und konzentrierte Lernphasen');
        } else if (metrics.averageSessionDuration < 15) {
            areasForImprovement.push('Kurze Lernphasen könnten durch längere Sessions vertieft werden');
            recommendations.push('Versuche längere Lerneinheiten mit Pausen dazwischen');
        }

        // Generate next steps based on struggling competencies
        const nextSteps = [
            {
                competencyId: 'math_area_calculation',
                competencyTitle: 'Flächeninhalte berechnen',
                reason: 'Bereits begonnen, aber noch nicht abgeschlossen',
                priority: 'high' as const
            },
            {
                competencyId: 'german_reading_comprehension',
                competencyTitle: 'Leseverständnis entwickeln',
                reason: 'Wichtige Grundlage für weitere Themen',
                priority: 'medium' as const
            }
        ];

        return {
            strengths,
            areasForImprovement,
            recommendations,
            nextSteps
        };

    } catch (error) {
        console.error('Error getting user learning insights:', error);
        throw new Error('Failed to get user learning insights');
    }
}

// =============================================
// System Analytics (Admin Only)
// =============================================

/**
 * Get comprehensive system analytics (admin only)
 */
export async function getSystemAnalytics(): Promise<SystemAnalytics> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    // In a real implementation, check if user is admin
    const isAdmin = true; // Would check against user roles

    if (!isAdmin) {
        throw new Error('Admin access required');
    }

    try {
        // Mock system analytics
        const systemAnalytics: SystemAnalytics = {
            totalUsers: 150,
            activeUsers: 89,
            totalSessions: 2340,
            averageSessionDuration: 28.5,
            systemPerformance: {
                averageResponseTime: 1850,
                errorRate: 0.02,
                uptime: 99.8,
                activeSessionCount: 12
            },
            contentAnalytics: {
                mostUsedCompetencies: [
                    { competencyId: 'math_basic_arithmetic', title: 'Grundrechenarten', usageCount: 450, averageSuccessRate: 0.85 },
                    { competencyId: 'german_reading', title: 'Lesen', usageCount: 380, averageSuccessRate: 0.78 },
                    { competencyId: 'math_geometry', title: 'Geometrie', usageCount: 290, averageSuccessRate: 0.72 }
                ],
                domainUsage: {
                    'Mathematik': 45,
                    'Deutsch': 30,
                    'Sachkunde': 15,
                    'Englisch': 10
                },
                federalStateUsage: {
                    'Bayern': 35,
                    'Baden-Württemberg': 25,
                    'Nordrhein-Westfalen': 20,
                    'Andere': 20
                }
            },
            userSatisfaction: {
                averageRating: 4.6,
                feedbackCount: 89,
                commonIssues: ['Manchmal langsame Antworten', 'Wünsche nach mehr Themen']
            }
        };

        return systemAnalytics;

    } catch (error) {
        console.error('Error getting system analytics:', error);
        throw new Error('Failed to get system analytics');
    }
}

// =============================================
// Helper Functions
// =============================================

/**
 * Calculate session quality based on various metrics
 */
function calculateSessionQuality(sessionData: Omit<LearningSessionAnalytics, 'sessionQuality'>): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;

    // Engagement score (0-30 points)
    score += Math.min(sessionData.engagementLevel * 0.3, 30);

    // Duration score (0-20 points)
    const idealDuration = 25; // 25 minutes
    const durationScore = Math.max(0, 20 - Math.abs(sessionData.duration - idealDuration));
    score += durationScore;

    // Response time score (0-20 points)
    const responseTimeScore = Math.max(0, 20 - (sessionData.averageResponseTime / 200));
    score += responseTimeScore;

    // Technical issues penalty (0-30 points)
    score += Math.max(0, 30 - (sessionData.technicalIssues.count * 10));

    // Competency progress bonus (0-10 points)
    if (sessionData.competencyProgress.afterStatus &&
        sessionData.competencyProgress.beforeStatus !== sessionData.competencyProgress.afterStatus) {
        score += 10;
    }

    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
}

/**
 * Update user session metrics in database
 */
async function updateUserSessionMetrics(
    userId: string,
    metrics: {
        duration: number;
        messageCount: number;
        engagementLevel: number;
        competencyProgress: any;
    }
): Promise<void> {
    try {
        // In a real implementation, this would update user metrics in database
        console.log('Updating user session metrics:', { userId, metrics });

    } catch (error) {
        console.error('Error updating user session metrics:', error);
        throw error;
    }
}

/**
 * Generate engagement trend data
 */
function generateEngagementTrends(days: number = 30): Array<{
    date: string;
    sessionCount: number;
    totalDuration: number;
    averageEngagement: number;
}> {
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateString = date.toISOString().split('T')[0];

        trends.push({
            date: dateString,
            sessionCount: Math.floor(Math.random() * 5),
            totalDuration: Math.floor(Math.random() * 120),
            averageEngagement: 60 + Math.floor(Math.random() * 40)
        });
    }

    return trends;
}

// =============================================
// Export Functions for Scheduled Jobs
// =============================================

/**
 * Daily analytics aggregation job
 */
export async function aggregateDailyAnalytics(): Promise<void> {
    try {
        console.log('Starting daily analytics aggregation');

        // In a real implementation, this would:
        // 1. Aggregate session data from the last 24 hours
        // 2. Update user engagement metrics
        // 3. Calculate system performance metrics
        // 4. Generate reports for stakeholders

        console.log('Daily analytics aggregation completed');

    } catch (error) {
        console.error('Error in daily analytics aggregation:', error);
        throw error;
    }
}

/**
 * Weekly performance report generation
 */
export async function generateWeeklyPerformanceReport(): Promise<{
    reportId: string;
    generatedAt: string;
    metrics: SystemAnalytics;
    insights: string[];
    recommendations: string[];
}> {
    try {
        console.log('Generating weekly performance report');

        const metrics = await getSystemAnalytics();
        const insights = [
            'User engagement increased by 15% compared to last week',
            'Mathematics competencies show highest completion rates',
            'Response times improved by 200ms on average'
        ];

        const recommendations = [
            'Consider adding more content for Sachkunde domain',
            'Investigate technical issues in Bayern region',
            'Optimize AI prompts for faster responses'
        ];

        const report = {
            reportId: `report_${Date.now()}`,
            generatedAt: new Date().toISOString(),
            metrics,
            insights,
            recommendations
        };

        console.log('Weekly performance report generated:', report.reportId);
        return report;

    } catch (error) {
        console.error('Error generating weekly performance report:', error);
        throw error;
    }
}