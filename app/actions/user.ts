"use server";

import { auth } from '@clerk/nextjs/server';
import {
    getUserInterests,
    addUserInterest as addInterestToDb,
    getUserLearningContext,
    updateUserEngagementMetrics,
    getUserCompetencyProgress
} from '@/utils/supabase/server';
import type { Database } from '@/types/database.types';

// =============================================
// User Profile Management
// =============================================

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    gradeLevel: number;
    federalState: string;
    sessionDuration: Database['public']['Enums']['session_duration_preference'];
    sensitivitySettings: {
        visual_stimulus: 'low' | 'medium' | 'high';
        auditory_stimulus: 'low' | 'medium' | 'high';
        cognitive_load: 'low' | 'medium' | 'high';
    };
    preferences: {
        communicationStyle: 'gentle' | 'encouraging' | 'playful';
        feedbackFrequency: 'minimal' | 'moderate' | 'frequent';
        learningPace: 'relaxed' | 'moderate' | 'structured';
    };
}

/**
 * Get complete user profile including learning preferences
 */
export async function getUserProfile(): Promise<UserProfile | null> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // Get user data from Clerk and our database
        const learningContext = await getUserLearningContext(userId);

        if (!learningContext) {
            // Create default learning context for new user
            await createDefaultLearningContext(userId);
            return await getDefaultUserProfile(userId);
        }

        // Build complete user profile
        const profile: UserProfile = {
            id: userId,
            name: "Freund", // Would get from Clerk user profile
            email: "user@example.com", // Would get from Clerk
            gradeLevel: 3, // Default, would be stored in user profile
            federalState: 'Bayern', // Default, would be stored in user profile
            sessionDuration: learningContext.session_duration || 'medium_30',
            sensitivitySettings: learningContext.sensitivity_settings as any || {
                visual_stimulus: 'low',
                auditory_stimulus: 'low',
                cognitive_load: 'low'
            },
            preferences: {
                communicationStyle: 'gentle',
                feedbackFrequency: 'minimal',
                learningPace: 'relaxed'
            }
        };

        return profile;

    } catch (error) {
        console.error('Error getting user profile:', error);
        throw new Error('Failed to get user profile');
    }
}

/**
 * Update user profile settings
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // In a real implementation, this would update the user profile in the database
        console.log('Updating user profile:', { userId, updates });

        // For now, just return the updated profile
        const currentProfile = await getUserProfile();
        if (!currentProfile) {
            throw new Error('User profile not found');
        }

        const updatedProfile = { ...currentProfile, ...updates };
        return updatedProfile;

    } catch (error) {
        console.error('Error updating user profile:', error);
        throw new Error('Failed to update user profile');
    }
}

// =============================================
// Interest Management
// =============================================

/**
 * Get all user interests
 */
export async function getUserInterestsData(): Promise<Database['public']['Tables']['user_interests']['Row'][]> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        return await getUserInterests(userId);
    } catch (error) {
        console.error('Error getting user interests:', error);
        throw new Error('Failed to get user interests');
    }
}

/**
 * Add a new user interest
 */
export async function addUserInterest(
    interestName: string,
    intensityLevel: number = 1
): Promise<Database['public']['Tables']['user_interests']['Row']> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    // Validate inputs
    if (!interestName || interestName.trim().length === 0) {
        throw new Error('Interest name is required');
    }

    if (intensityLevel < 1 || intensityLevel > 5) {
        throw new Error('Intensity level must be between 1 and 5');
    }

    try {
        return await addInterestToDb(userId, interestName.trim(), intensityLevel);
    } catch (error) {
        console.error('Error adding user interest:', error);
        throw new Error('Failed to add user interest');
    }
}

/**
 * Update an existing user interest
 */
export async function updateUserInterest(
    interestId: string,
    updates: {
        interest_name?: string;
        intensity_level?: number;
    }
): Promise<Database['public']['Tables']['user_interests']['Row']> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // In a real implementation, this would update the interest in the database
        console.log('Updating user interest:', { userId, interestId, updates });

        // For now, just return the updated interest
        const currentInterests = await getUserInterests(userId);
        const interest = currentInterests.find(i => i.id === interestId);

        if (!interest) {
            throw new Error('Interest not found');
        }

        const updatedInterest = { ...interest, ...updates };
        return updatedInterest;

    } catch (error) {
        console.error('Error updating user interest:', error);
        throw new Error('Failed to update user interest');
    }
}

/**
 * Remove a user interest
 */
export async function removeUserInterest(interestId: string): Promise<void> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // In a real implementation, this would delete the interest from the database
        console.log('Removing user interest:', { userId, interestId });

        // For now, just log the action
        const currentInterests = await getUserInterests(userId);
        const exists = currentInterests.some(i => i.id === interestId);

        if (!exists) {
            throw new Error('Interest not found');
        }

    } catch (error) {
        console.error('Error removing user interest:', error);
        throw new Error('Failed to remove user interest');
    }
}

// =============================================
// Learning Context Management
// =============================================

/**
 * Update user learning context preferences
 */
export async function updateLearningContext(updates: {
    preferred_times?: string[];
    session_duration?: Database['public']['Enums']['session_duration_preference'];
    engagement_patterns?: Record<string, any>;
    learning_style_preferences?: Record<string, any>;
    sensitivity_settings?: {
        visual_stimulus: 'low' | 'medium' | 'high';
        auditory_stimulus: 'low' | 'medium' | 'high';
        cognitive_load: 'low' | 'medium' | 'high';
    };
}): Promise<Database['public']['Tables']['learning_context']['Row']> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // In a real implementation, this would update the learning context in the database
        console.log('Updating learning context:', { userId, updates });

        // For now, just return the updated context
        const currentContext = await getUserLearningContext(userId);
        if (!currentContext) {
            await createDefaultLearningContext(userId);
            return await getUserLearningContext(userId) as any;
        }

        const updatedContext = { ...currentContext, ...updates };
        return updatedContext;

    } catch (error) {
        console.error('Error updating learning context:', error);
        throw new Error('Failed to update learning context');
    }
}

/**
 * Get user's learning analytics
 */
export async function getUserLearningAnalytics(): Promise<{
    totalSessions: number;
    averageSessionDuration: number;
    competencyProgress: {
        totalCompetencies: number;
        masteredCount: number;
        inProgressCount: number;
        notStartedCount: number;
    };
    engagementTrends: {
        date: string;
        sessionCount: number;
        averageDuration: number;
    }[];
    topInterests: Array<{
        name: string;
        intensityLevel: number;
        usageCount: number;
    }>;
}> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // Get user data
        const [interests, competencyProgress, learningContext] = await Promise.all([
            getUserInterests(userId),
            getUserCompetencyProgress(userId),
            getUserLearningContext(userId)
        ]);

        // Calculate analytics
        const totalSessions = learningContext?.total_sessions || 0;
        const averageSessionDuration = 30; // Default, would calculate from actual data

        // Competency progress breakdown
        const competencyStats = {
            totalCompetencies: competencyProgress?.length || 0,
            masteredCount: competencyProgress?.filter(cp => cp.status === 'mastered').length || 0,
            inProgressCount: competencyProgress?.filter(cp => cp.status === 'in_progress').length || 0,
            notStartedCount: competencyProgress?.filter(cp => cp.status === 'not_started').length || 0
        };

        // Engagement trends (mock data for now)
        const engagementTrends = [
            { date: '2024-01-01', sessionCount: 3, averageDuration: 25 },
            { date: '2024-01-02', sessionCount: 2, averageDuration: 30 },
            { date: '2024-01-03', sessionCount: 4, averageDuration: 20 }
        ];

        // Top interests
        const topInterests = (interests || [])
            .sort((a, b) => b.intensity_level - a.intensity_level)
            .slice(0, 5)
            .map(interest => ({
                name: interest.interest_name,
                intensityLevel: interest.intensity_level,
                usageCount: Math.floor(Math.random() * 10) + 1 // Mock data
            }));

        return {
            totalSessions,
            averageSessionDuration,
            competencyProgress: competencyStats,
            engagementTrends,
            topInterests
        };

    } catch (error) {
        console.error('Error getting user learning analytics:', error);
        throw new Error('Failed to get user learning analytics');
    }
}

// =============================================
// Data Export and Import
// =============================================

/**
 * Export user data for privacy compliance
 */
export async function exportUserData(): Promise<{
    profile: UserProfile;
    interests: Database['public']['Tables']['user_interests']['Row'][];
    competencyProgress: any[];
    learningContext: Database['public']['Tables']['learning_context']['Row'];
    exportDate: string;
}> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        const [profile, interests, competencyProgress, learningContext] = await Promise.all([
            getUserProfile(),
            getUserInterests(userId),
            getUserCompetencyProgress(userId),
            getUserLearningContext(userId)
        ]);

        if (!profile || !learningContext) {
            throw new Error('Incomplete user data');
        }

        return {
            profile,
            interests,
            competencyProgress,
            learningContext,
            exportDate: new Date().toISOString()
        };

    } catch (error) {
        console.error('Error exporting user data:', error);
        throw new Error('Failed to export user data');
    }
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(): Promise<void> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    try {
        // In a real implementation, this would:
        // 1. Delete user interests
        // 2. Delete competency progress
        // 3. Delete learning context
        // 4. Delete user profile
        // 5. Handle any other related data

        console.log('Deleting user account:', userId);

        // For now, just log the action
        // In production, this would be a cascading delete operation

    } catch (error) {
        console.error('Error deleting user account:', error);
        throw new Error('Failed to delete user account');
    }
}

// =============================================
// Helper Functions
// =============================================

/**
 * Create default learning context for new users
 */
async function createDefaultLearningContext(userId: string): Promise<void> {
    try {
        // In a real implementation, this would insert a default learning context
        console.log('Creating default learning context for user:', userId);

    } catch (error) {
        console.error('Error creating default learning context:', error);
        throw error;
    }
}

/**
 * Get default user profile for new users
 */
async function getDefaultUserProfile(userId: string): Promise<UserProfile> {
    return {
        id: userId,
        name: "Freund",
        email: "user@example.com",
        gradeLevel: 3,
        federalState: 'Bayern',
        sessionDuration: 'medium_30',
        sensitivitySettings: {
            visual_stimulus: 'low',
            auditory_stimulus: 'low',
            cognitive_load: 'low'
        },
        preferences: {
            communicationStyle: 'gentle',
            feedbackFrequency: 'minimal',
            learningPace: 'relaxed'
        }
    };
}

/**
 * Validate user input data
 */
function validateUserData(data: any): boolean {
    // Basic validation logic
    if (!data || typeof data !== 'object') {
        return false;
    }

    // Add more specific validation as needed
    return true;
}

// =============================================
// Background Jobs and Scheduled Tasks
// =============================================

/**
 * Update engagement metrics for all active users
 * This would typically be called by a scheduled job
 */
export async function updateAllUserEngagementMetrics(): Promise<void> {
    try {
        // In a real implementation, this would:
        // 1. Get all active users
        // 2. Calculate engagement metrics
        // 3. Update database with new metrics
        // 4. Send notifications if needed

        console.log('Updating engagement metrics for all users');

    } catch (error) {
        console.error('Error updating user engagement metrics:', error);
    }
}

/**
 * Cleanup old user data and perform maintenance
 */
export async function performUserDataMaintenance(): Promise<{
    deletedSessions: number;
    archivedProgress: number;
    updatedProfiles: number;
}> {
    try {
        // In a real implementation, this would:
        // 1. Archive old progress data
        // 2. Clean up expired sessions
        // 3. Update user profiles based on activity
        // 4. Remove orphaned data

        console.log('Performing user data maintenance');

        return {
            deletedSessions: 0,
            archivedProgress: 0,
            updatedProfiles: 0
        };

    } catch (error) {
        console.error('Error performing user data maintenance:', error);
        throw error;
    }
}