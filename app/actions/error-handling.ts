"use server";

import { auth } from '@clerk/nextjs/server';

// =============================================
// Error Types
// =============================================

export enum ErrorType {
    AUTHENTICATION = 'AUTHENTICATION',
    AUTHORIZATION = 'AUTHORIZATION',
    VALIDATION = 'VALIDATION',
    DATABASE = 'DATABASE',
    AI_SERVICE = 'AI_SERVICE',
    RATE_LIMIT = 'RATE_LIMIT',
    SYSTEM = 'SYSTEM',
    USER_INPUT = 'USER_INPUT'
}

export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface ErrorContext {
    userId?: string;
    sessionId?: string;
    action?: string;
    userAgent?: string;
    ipAddress?: string;
    timestamp: string;
    requestId?: string;
    additionalData?: Record<string, any>;
}

export interface LearningError extends Error {
    type: ErrorType;
    severity: ErrorSeverity;
    context: ErrorContext;
    userMessage?: string;
    technicalDetails?: string;
    retryable: boolean;
    suggestions?: string[];
}

// =============================================
// Error Creation Factory
// =============================================

export class LearningErrorFactory {
    static createError(
        type: ErrorType,
        message: string,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        context: Partial<ErrorContext> = {},
        userMessage?: string,
        retryable: boolean = false
    ): LearningError {
        const error = new Error(message) as LearningError;

        error.type = type;
        error.severity = severity;
        error.context = {
            timestamp: new Date().toISOString(),
            ...context
        };
        error.userMessage = userMessage || this.getDefaultUserMessage(type);
        error.retryable = retryable;
        error.suggestions = this.getSuggestions(type);

        return error;
    }

    private static getDefaultUserMessage(type: ErrorType): string {
        const messages = {
            [ErrorType.AUTHENTICATION]: 'Bitte melde dich an, um fortzufahren.',
            [ErrorType.AUTHORIZATION]: 'Du hast keine Berechtigung für diese Aktion.',
            [ErrorType.VALIDATION]: 'Die Eingabe ist nicht korrekt. Bitte überprüfe deine Daten.',
            [ErrorType.DATABASE]: 'Technisches Problem. Bitte versuche es erneut.',
            [ErrorType.AI_SERVICE]: 'Der Lernbegleiter ist gerade beschäftigt. Bitte warte einen Moment.',
            [ErrorType.RATE_LIMIT]: 'Du hast zu viele Anfragen gesendet. Bitte warte kurz.',
            [ErrorType.SYSTEM]: 'System ist nicht verfügbar. Bitte versuche es später erneut.',
            [ErrorType.USER_INPUT]: 'Ich konnte deine Anfrage nicht verstehen. Bitte formuliere sie anders.'
        };

        return messages[type] || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
    }

    private static getSuggestions(type: ErrorType): string[] {
        const suggestions = {
            [ErrorType.AUTHENTICATION]: [
                'Überprüfe deine Anmeldedaten',
                'Versuche dich neu anzumelden'
            ],
            [ErrorType.VALIDATION]: [
                'Überprüfe deine Eingabe auf Tippfehler',
                'Stelle sicher, dass alle Pflichtfelder ausgefüllt sind'
            ],
            [ErrorType.DATABASE]: [
                'Warte einen Moment und versuche es erneut',
                'Lade die Seite neu'
            ],
            [ErrorType.AI_SERVICE]: [
                'Warte einen Moment und versuche es erneut',
                'Formuliere deine Frage einfacher'
            ],
            [ErrorType.RATE_LIMIT]: [
                'Warte ein paar Minuten',
                'Vermeide zu schnelle aufeinanderfolgende Anfragen'
            ]
        };

        return suggestions[type] || ['Versuche es später erneut'];
    }
}

// =============================================
// Error Handling Service
// =============================================

export class ErrorHandlingService {
    private static instance: ErrorHandlingService;
    private errorLog: LearningError[] = [];
    private maxLogSize = 1000;

    static getInstance(): ErrorHandlingService {
        if (!ErrorHandlingService.instance) {
            ErrorHandlingService.instance = new ErrorHandlingService();
        }
        return ErrorHandlingService.instance;
    }

    async handleError(error: LearningError): Promise<{
        userMessage: string;
        shouldRetry: boolean;
        errorId: string;
    }> {
        const errorId = this.generateErrorId();

        // Add request ID to context
        error.context.requestId = errorId;

        // Log the error
        await this.logError(error);

        // Send to monitoring service if critical
        if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
            await this.sendToMonitoring(error);
        }

        // Clean up old logs
        this.cleanupLogs();

        return {
            userMessage: error.userMessage || 'Ein unerwarteter Fehler ist aufgetreten.',
            shouldRetry: error.retryable,
            errorId
        };
    }

    async logError(error: LearningError): Promise<void> {
        // Add to in-memory log
        this.errorLog.push(error);

        // Log to console with appropriate level
        const logMessage = `[${error.severity.toUpperCase()}] ${error.type}: ${error.message}`;

        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                console.error(logMessage, error.context);
                break;
            case ErrorSeverity.HIGH:
                console.error(logMessage, error.context);
                break;
            case ErrorSeverity.MEDIUM:
                console.warn(logMessage, error.context);
                break;
            case ErrorSeverity.LOW:
                console.log(logMessage, error.context);
                break;
        }

        // In production, this would log to external service (e.g., Sentry, LogRocket)
        await this.persistError(error);
    }

    private async persistError(error: LearningError): Promise<void> {
        try {
            // In a real implementation, this would send to logging service
            console.log('Persisting error:', {
                type: error.type,
                message: error.message,
                severity: error.severity,
                context: error.context,
                timestamp: error.context.timestamp
            });
        } catch (persistError) {
            console.error('Failed to persist error:', persistError);
        }
    }

    private async sendToMonitoring(error: LearningError): Promise<void> {
        try {
            // In a real implementation, this would send to monitoring/alerting service
            console.log('Sending critical error to monitoring:', {
                errorId: error.context.requestId,
                type: error.type,
                message: error.message,
                severity: error.severity,
                userId: error.context.userId
            });
        } catch (monitoringError) {
            console.error('Failed to send error to monitoring:', monitoringError);
        }
    }

    private generateErrorId(): string {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private cleanupLogs(): void {
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }
    }

    // Analytics methods
    getErrorStatistics(timeRangeHours: number = 24): {
        totalErrors: number;
        errorsByType: Record<ErrorType, number>;
        errorsBySeverity: Record<ErrorSeverity, number>;
        topErrors: Array<{
            message: string;
            count: number;
            type: ErrorType;
        }>;
    } {
        const cutoffTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);

        const recentErrors = this.errorLog.filter(
            error => new Date(error.context.timestamp).getTime() > cutoffTime
        );

        const errorsByType = {} as Record<ErrorType, number>;
        const errorsBySeverity = {} as Record<ErrorSeverity, number>;
        const errorMessageCounts = new Map<string, { count: number; type: ErrorType }>();

        recentErrors.forEach(error => {
            errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
            errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;

            const existing = errorMessageCounts.get(error.message);
            if (existing) {
                existing.count++;
            } else {
                errorMessageCounts.set(error.message, { count: 1, type: error.type });
            }
        });

        const topErrors = Array.from(errorMessageCounts.entries())
            .map(([message, data]) => ({ message, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalErrors: recentErrors.length,
            errorsByType,
            errorsBySeverity,
            topErrors
        };
    }
}

// =============================================
// Error Boundary Functions
// =============================================

/**
 * Wrap async functions with error handling
 */
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorType: ErrorType = ErrorType.SYSTEM,
    context: Partial<ErrorContext> = {},
    fallbackValue?: T
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        const errorService = ErrorHandlingService.getInstance();

        let learningError: LearningError;

        if (error instanceof Error && 'type' in error) {
            learningError = error as LearningError;
        } else {
            learningError = LearningErrorFactory.createError(
                errorType,
                error instanceof Error ? error.message : 'Unknown error',
                ErrorSeverity.MEDIUM,
                context
            );
        }

        await errorService.handleError(learningError);

        if (fallbackValue !== undefined) {
            return fallbackValue;
        }

        throw learningError;
    }
}

/**
 * Authentication error handler
 */
export async function handleAuthError(operation: () => Promise<any>): Promise<any> {
    const { userId } = await auth();

    if (!userId) {
        const authError = LearningErrorFactory.createError(
            ErrorType.AUTHENTICATION,
            'User not authenticated',
            ErrorSeverity.HIGH,
            { action: 'authentication_required' }
        );

        const errorService = ErrorHandlingService.getInstance();
        const result = await errorService.handleError(authError);

        throw new Error(result.userMessage);
    }

    return withErrorHandling(
        operation,
        ErrorType.AUTHORIZATION,
        { userId, action: 'authenticated_operation' }
    );
}

// =============================================
// Specific Error Handlers
// =============================================

export class ValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class DatabaseError extends Error {
    constructor(message: string, public query?: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class AIServiceError extends Error {
    constructor(message: string, public retryable: boolean = true) {
        super(message);
        this.name = 'AIServiceError';
    }
}

// =============================================
// Error Monitoring and Alerting
// =============================================

export class ErrorMonitor {
    private static instance: ErrorMonitor;
    private alertThresholds = {
        criticalErrorsPerHour: 5,
        totalErrorsPerHour: 50,
        consecutiveErrors: 10
    };

    static getInstance(): ErrorMonitor {
        if (!ErrorMonitor.instance) {
            ErrorMonitor.instance = new ErrorMonitor();
        }
        return ErrorMonitor.instance;
    }

    async checkAlertConditions(): Promise<{
        shouldAlert: boolean;
        alerts: string[];
    }> {
        const errorService = ErrorHandlingService.getInstance();
        const stats = errorService.getErrorStatistics(1); // Last hour

        const alerts: string[] = [];
        let shouldAlert = false;

        // Check critical errors
        if (stats.errorsBySeverity[ErrorSeverity.CRITICAL] >= this.alertThresholds.criticalErrorsPerHour) {
            alerts.push(`High number of critical errors: ${stats.errorsBySeverity[ErrorSeverity.CRITICAL]}/hour`);
            shouldAlert = true;
        }

        // Check total errors
        if (stats.totalErrors >= this.alertThresholds.totalErrorsPerHour) {
            alerts.push(`High error rate: ${stats.totalErrors}/hour`);
            shouldAlert = true;
        }

        // Check for specific error patterns
        const aiServiceErrors = stats.errorsByType[ErrorType.AI_SERVICE] || 0;
        if (aiServiceErrors > 10) {
            alerts.push(`AI service errors: ${aiServiceErrors}/hour`);
            shouldAlert = true;
        }

        if (shouldAlert) {
            await this.sendAlert(alerts);
        }

        return { shouldAlert, alerts };
    }

    private async sendAlert(alerts: string[]): Promise<void> {
        try {
            // In a real implementation, this would send to alerting service
            console.error('SYSTEM ALERT:', alerts.join('; '));

            // Could integrate with services like:
            // - Slack/Teams notifications
            // - Email alerts
            // - PagerDuty
            // - Custom monitoring dashboard
        } catch (error) {
            console.error('Failed to send alert:', error);
        }
    }
}

// =============================================
// Logging Utilities
// =============================================

export class Logger {
    static info(message: string, context?: Record<string, any>): void {
        console.log(`[INFO] ${message}`, context || '');
    }

    static warn(message: string, context?: Record<string, any>): void {
        console.warn(`[WARN] ${message}`, context || '');
    }

    static error(message: string, error?: Error, context?: Record<string, any>): void {
        console.error(`[ERROR] ${message}`, {
            error: error?.message || 'Unknown error',
            stack: error?.stack,
            ...context
        });
    }

    static debug(message: string, context?: Record<string, any>): void {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${message}`, context || '');
        }
    }

    static userAction(action: string, userId: string, context?: Record<string, any>): void {
        console.log(`[USER] ${action}`, {
            userId,
            timestamp: new Date().toISOString(),
            ...context
        });
    }

    static performance(operation: string, duration: number, context?: Record<string, any>): void {
        console.log(`[PERF] ${operation}: ${duration}ms`, context || '');
    }
}

// Export singleton instances
export const errorHandlingService = ErrorHandlingService.getInstance();
export const errorMonitor = ErrorMonitor.getInstance();

// Check alerts every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        errorMonitor.checkAlertConditions().catch(console.error);
    }, 5 * 60 * 1000);
}