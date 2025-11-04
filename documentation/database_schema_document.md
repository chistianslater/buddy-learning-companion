# Database Schema Documentation
## Der Digitale Lernbegleiter - Learning Companion System

### Overview

This document describes the complete database schema for the Digital Learning Companion system, designed specifically for neurodivergent learners. The schema follows Row Level Security (RLS) principles and integrates with Clerk authentication for secure user data management.

---

## Core Tables

### 1. `user_interests`
**Purpose**: Stores user interests that serve as anchors for personalized learning experiences.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | TEXT | Foreign key to auth.users(id) |
| `interest_name` | TEXT | Name of the interest (e.g., "Minecraft", "Dinosaurs") |
| `intensity_level` | INTEGER | Interest intensity: 1 (low) to 5 (passionate) |
| `created_at` | TIMESTAMP | Auto-generated creation timestamp |
| `updated_at` | TIMESTAMP | Auto-update on record changes |

**RLS Policies**: Users can only access their own interests.

**Usage Examples**:
```sql
-- Get user's top interests
SELECT * FROM user_interests
WHERE user_id = 'user_id'
ORDER BY intensity_level DESC;

-- Add new interest
INSERT INTO user_interests (user_id, interest_name, intensity_level)
VALUES ('user_id', 'Minecraft', 5);
```

---

### 2. `competencies`
**Purpose**: German curriculum competencies aligned with federal educational standards.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `domain` | ENUM | Subject domain (Mathematik, Deutsch, etc.) |
| `title` | TEXT | Competency title |
| `description` | TEXT | Detailed description |
| `grade_level` | INTEGER | School grade (1-10) |
| `federal_state` | ENUM | German federal state |
| `prerequisites` | TEXT[] | Array of prerequisite competency IDs |
| `learning_objectives` | TEXT[] | Array of learning objectives |
| `created_at` | TIMESTAMP | Auto-generated creation timestamp |
| `updated_at` | TIMESTAMP | Auto-update on record changes |

**Domain Values**:
- `Mathematik` (Mathematics)
- `Deutsch` (German Language)
- `Sachkunde` (General Studies)
- `Englisch` (English)
- `Kunst` (Art)
- `Musik` (Music)
- `Sport` (Physical Education)

**Federal State Values**: All 16 German federal states including Bayern, Baden-Württemberg, Berlin, etc.

**RLS Policies**: Readable by all authenticated users (curriculum data).

---

### 3. `competency_progress`
**Purpose**: Tracks individual user progress through competencies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | TEXT | Foreign key to auth.users(id) |
| `competency_id` | UUID | Foreign key to competencies(id) |
| `status` | ENUM | Progress status |
| `confidence_score` | DECIMAL | Confidence: 0.00 (none) to 1.00 (mastery) |
| `last_interaction` | TIMESTAMP | Last learning interaction |
| `attempts` | INTEGER | Number of attempts |
| `session_count` | INTEGER | Learning sessions completed |
| `total_time_minutes` | INTEGER | Total time spent (minutes) |
| `created_at` | TIMESTAMP | Auto-generated creation timestamp |
| `updated_at` | TIMESTAMP | Auto-update on record changes |

**Status Values**:
- `not_started` - No interaction yet
- `in_progress` - Currently working on competency
- `mastered` - Successfully completed
- `struggling` - Having difficulties, needs support

**RLS Policies**: Users can only access their own progress data.

**Unique Constraint**: (user_id, competency_id) ensures one progress record per user-competency pair.

---

### 4. `learning_context`
**Purpose**: Stores user preferences and engagement patterns for personalization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | TEXT | Foreign key to auth.users(id) |
| `preferred_times` | TEXT[] | Preferred learning time slots |
| `session_duration` | ENUM | Preferred session length |
| `engagement_patterns` | JSONB | Historical engagement data |
| `learning_style_preferences` | JSONB | Learning style preferences |
| `sensitivity_settings` | JSONB | Stimulus sensitivity settings |
| `last_session_at` | TIMESTAMP | Last session timestamp |
| `total_sessions` | INTEGER | Total sessions completed |
| `created_at` | TIMESTAMP | Auto-generated creation timestamp |
| `updated_at` | TIMESTAMP | Auto-update on record changes |

**Session Duration Values**:
- `short_15` - 15 minutes
- `medium_30` - 30 minutes (default)
- `long_45` - 45 minutes
- `flexible` - User-determined

**Sensitivity Settings Structure**:
```json
{
  "visual_stimulus": "low|medium|high",
  "auditory_stimulus": "low|medium|high",
  "cognitive_load": "low|medium|high"
}
```

**RLS Policies**: Users can only access their own learning context.

**Unique Constraint**: (user_id) ensures one context record per user.

---

## Database Functions

### `get_next_competency(user_id, grade_level, federal_state)`
**Purpose**: Intelligent competency selection based on user progress and curriculum requirements.

**Returns**: Table with competency information and priority score.

**Priority Logic**:
- `not_started`: 3 points (highest priority)
- `struggling`: 2 points (needs support)
- `in_progress`: 1 point (continue progress)
- `mastered`: 0 points (completed)

**Usage**:
```sql
SELECT * FROM get_next_competency('user_123', 3, 'Bayern');
```

### `update_engagement_metrics(user_id, session_duration_minutes)`
**Purpose**: Updates user engagement metrics after learning sessions.

**Updates**:
- Increments total_sessions
- Updates last_session_at
- Stores session duration in engagement_patterns

**Usage**:
```sql
SELECT update_engagement_metrics('user_123', 25);
```

### `requesting_user_id()`
**Purpose**: Helper function to get current authenticated user ID from JWT claims.

**Returns**: Current user's ID or NULL if not authenticated.

**Usage in RLS Policies**:
```sql
CREATE POLICY "Users can view own data" ON table_name
FOR SELECT USING (requesting_user_id() = user_id);
```

---

## Indexes and Performance

### Primary Indexes
- All tables have primary key indexes on `id` columns

### Performance Indexes
```sql
-- User interests optimization
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_name ON user_interests(interest_name);

-- Competencies optimization
CREATE INDEX idx_competencies_domain ON competencies(domain);
CREATE INDEX idx_competencies_grade_level ON competencies(grade_level);
CREATE INDEX idx_competencies_federal_state ON competencies(federal_state);
CREATE INDEX idx_competencies_domain_grade ON competencies(domain, grade_level);

-- Progress tracking optimization
CREATE INDEX idx_competency_progress_user_id ON competency_progress(user_id);
CREATE INDEX idx_competency_progress_status ON competency_progress(status);
CREATE INDEX idx_competency_progress_user_status ON competency_progress(user_id, status);

-- Learning context optimization
CREATE INDEX idx_learning_context_user_id ON learning_context(user_id);
```

---

## Row Level Security (RLS)

### Security Principles
1. **Data Isolation**: Users can only access their own data
2. **Curriculum Access**: All authenticated users can read competency data
3. **Admin Override**: Service role can bypass RLS for system operations

### Policy Structure
```sql
-- Example: User interests policies
CREATE POLICY "Users can view own interests" ON user_interests
FOR SELECT USING (requesting_user_id() = user_id);

CREATE POLICY "Users can insert own interests" ON user_interests
FOR INSERT WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can update own interests" ON user_interests
FOR UPDATE USING (requesting_user_id() = user_id);

CREATE POLICY "Users can delete own interests" ON user_interests
FOR DELETE USING (requesting_user_id() = user_id);
```

---

## Trigger Functions

### `handle_updated_at()`
**Purpose**: Automatically updates `updated_at` timestamp on row modifications.

**Applied to**: All tables with `updated_at` columns.

```sql
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Data Types and Enums

### Progress Status Enum
```sql
CREATE TYPE progress_status AS ENUM (
    'not_started',
    'in_progress',
    'mastered',
    'struggling'
);
```

### Competency Domain Enum
```sql
CREATE TYPE competency_domain AS ENUM (
    'Mathematik',
    'Deutsch',
    'Sachkunde',
    'Englisch',
    'Kunst',
    'Musik',
    'Sport'
);
```

### Federal State Enum
All 16 German federal states for curriculum alignment.

### Session Duration Enum
```sql
CREATE TYPE session_duration_preference AS ENUM (
    'short_15',
    'medium_30',
    'long_45',
    'flexible'
);
```

---

## Seed Data Strategy

### German Curriculum Data
- **80+ competencies** across multiple subjects and grades
- **Grade levels 1-6** with progression logic
- **Federal state variations** for regional curriculum differences
- **Prerequisites and objectives** for structured learning paths

### Sample Data Structure
```sql
INSERT INTO competencies (
    domain, title, description, grade_level, federal_state,
    prerequisites, learning_objectives
) VALUES (
    'Mathematik',
    'Flächeninhalte berechnen',
    'Flächeninhalte von Rechtecken berechnen, Flächen vergleichen',
    5, 'Bayern',
    '{"geometrische Grundformen kennen"}',
    '{"Rechtecksflächen berechnen", "Flächen schätzen"}'
);
```

---

## Integration with Application Code

### TypeScript Support
Complete TypeScript definitions in `types/database.types.ts` with:
- Table types (Row, Insert, Update)
- Enum types
- Function return types
- Relationship definitions

### Server-Side Helpers
Comprehensive utility functions in `utils/supabase/server.ts`:
- `getUserInterests()` - Retrieve user interests
- `addUserInterest()` - Add new user interest
- `getUserCompetencyProgress()` - Get progress data
- `getNextCompetencyTarget()` - Get next learning target
- `updateCompetencyProgress()` - Update progress tracking
- `getUserLearningContext()` - Get user preferences
- `updateUserEngagementMetrics()` - Track engagement
- `getAvailableCompetencies()` - Get curriculum data

---

## Performance Considerations

### Query Optimization
- Indexed queries for common access patterns
- Composite indexes for multi-column filters
- Function-based indexes for computed priorities

### Scaling Strategy
- Partitioning by federal_state for large datasets
- Materialized views for complex competency queries
- Connection pooling for high concurrent access

### Monitoring
- Track query performance on competency_progress table
- Monitor RLS policy overhead
- Cache frequently accessed competency data

---

## Security and Compliance

### Data Protection
- GDPR-compliant data handling
- No PII in competency or interest data
- Secure user identification through Clerk

### Access Control
- RLS ensures data isolation
- Service role for administrative operations
- JWT-based authentication integration

### Audit Trail
- Created/updated timestamps on all records
- User tracking through requesting_user_id()
- Session logging through engagement metrics

---

## Migration Strategy

### Initial Setup
1. Run `20250125124435_init.sql` for base system
2. Run `20250125124500_learning_companion_schema.sql` for learning tables
3. Run `20250125124510_seed_german_curriculum.sql` for curriculum data

### Updates
- New migrations follow timestamp naming convention
- Backward-compatible changes preferred
- RLS policies updated with schema changes

---

## Usage Examples

### Complete Learning Flow
```sql
-- 1. Get user interests
SELECT * FROM user_interests WHERE user_id = requesting_user_id();

-- 2. Get next competency target
SELECT * FROM get_next_competency(requesting_user_id(), 3, 'Bayern');

-- 3. Update progress after learning session
UPDATE competency_progress
SET status = 'in_progress',
    confidence_score = 0.6,
    last_interaction = NOW()
WHERE user_id = requesting_user_id()
  AND competency_id = 'competency_uuid';

-- 4. Track engagement
SELECT update_engagement_metrics(requesting_user_id(), 30);
```

### Competency Discovery
```sql
-- Find all math competencies for grade 3 in Bavaria
SELECT * FROM competencies
WHERE domain = 'Mathematik'
  AND grade_level = 3
  AND federal_state = 'Bayern'
ORDER BY created_at;

-- Get user progress across all domains
SELECT
    c.domain,
    COUNT(*) as total_competencies,
    COUNT(cp.id) as attempted_competencies,
    AVG(cp.confidence_score) as avg_confidence
FROM competencies c
LEFT JOIN competency_progress cp ON c.id = cp.competency_id
    AND cp.user_id = requesting_user_id()
WHERE c.grade_level = 3 AND c.federal_state = 'Bayern'
GROUP BY c.domain;
```

This comprehensive schema provides the foundation for a personalized, neurodivergent-friendly learning experience while maintaining security, performance, and scalability.