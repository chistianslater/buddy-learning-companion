import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export async function createClerkSupabaseClientSsr() {
    // The `useAuth()` hook is used to access the `getToken()` method
    const { getToken } = await auth()

    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                // Get the custom Supabase token from Clerk
                fetch: async (url, options = {}) => {
                    const clerkToken = await getToken({
                        template: 'supabase',
                    })

                    // Insert the Clerk Supabase token into the headers
                    const headers = new Headers(options?.headers)
                    headers.set('Authorization', `Bearer ${clerkToken}`)

                    // Now call the default fetch
                    return fetch(url, {
                        ...options,
                        headers,
                    })
                },
            },
        },
    )
}

// Helper functions for learning companion operations

export async function getUserInterests(userId: string) {
    const supabase = await createClerkSupabaseClientSsr()
    const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', userId)
        .order('intensity_level', { ascending: false })

    if (error) throw error
    return data
}

export async function addUserInterest(userId: string, interestName: string, intensityLevel: number = 1) {
    const supabase = await createClerkSupabaseClientSsr()
    const { data, error } = await supabase
        .from('user_interests')
        .insert({
            user_id: userId,
            interest_name: interestName,
            intensity_level: intensityLevel
        })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function getUserCompetencyProgress(userId: string) {
    const supabase = await createClerkSupabaseClientSsr()
    const { data, error } = await supabase
        .from('competency_progress')
        .select(`
            *,
            competencies (
                id,
                domain,
                title,
                description,
                grade_level,
                federal_state
            )
        `)
        .eq('user_id', userId)

    if (error) throw error
    return data
}

export async function getNextCompetencyTarget(userId: string, gradeLevel: number, federalState: string) {
    const supabase = await createClerkSupabaseClientSsr()
    const { data, error } = await supabase
        .rpc('get_next_competency', {
            p_user_id: userId,
            p_grade_level: gradeLevel,
            p_federal_state: federalState
        })

    if (error) throw error
    return data?.[0] || null
}

export async function updateCompetencyProgress(
    userId: string,
    competencyId: string,
    status: Database['public']['Enums']['progress_status'],
    confidenceScore?: number,
    sessionDuration?: number
) {
    const supabase = await createClerkSupabaseClientSsr()

    const { data, error } = await supabase
        .from('competency_progress')
        .upsert({
            user_id: userId,
            competency_id: competencyId,
            status,
            confidence_score: confidenceScore,
            last_interaction: new Date().toISOString(),
            attempts: 1, // This will be incremented with proper logic
            session_count: 1, // This will be incremented with proper logic
            total_time_minutes: sessionDuration || 0
        })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function getUserLearningContext(userId: string) {
    const supabase = await createClerkSupabaseClientSsr()
    const { data, error } = await supabase
        .from('learning_context')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
}

export async function updateUserEngagementMetrics(userId: string, sessionDuration: number = 0) {
    const supabase = await createClerkSupabaseClientSsr()
    const { error } = await supabase
        .rpc('update_engagement_metrics', {
            p_user_id: userId,
            p_session_duration_minutes: sessionDuration
        })

    if (error) throw error
}

export async function getAvailableCompetencies(gradeLevel: number, federalState: string) {
    const supabase = await createClerkSupabaseClientSsr()
    const { data, error } = await supabase
        .from('competencies')
        .select('*')
        .eq('grade_level', gradeLevel)
        .eq('federal_state', federalState)
        .order('domain', { ascending: true })

    if (error) throw error
    return data
}