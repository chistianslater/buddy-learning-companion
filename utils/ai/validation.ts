import { validateConstraints } from './openai';

// =============================================
// AI System Validation and Testing
// =============================================

export interface ValidationResult {
    score: number; // 0-100
    violations: string[];
    suggestions: string[];
    passed: boolean;
}

export interface PromptTestCase {
    name: string;
    userContext: any;
    userInput: string;
    expectedBehavior: string;
    constraints: string[];
}

// =============================================
// Constraint Validation Tests
// =============================================

export class ConstraintValidator {
    private forbiddenPatterns: Map<string, RegExp[]> = new Map();

    constructor() {
        this.initializeForbiddenPatterns();
    }

    private initializeForbiddenPatterns() {
        // Evaluative language patterns
        this.forbiddenPatterns.set('evaluative', [
            /\b(richtig|falsch|korrekt|inkorrekt|gut|schlecht|perfekt|exzellent|mangelhaft)\b/gi,
            /\b(gut gemacht|super|toll|fantastisch|schlecht gemacht|misserfolg)\b/gi
        ]);

        // Performance and scoring patterns
        this.forbiddenPatterns.set('performance', [
            /\b(punkte|score|note|zensur|note|level|stufe|rang|platz)\b/gi,
            /\b(fortschritt|fortschritte|erfolg|leistung|ergebnis|test|prüfung)\b/gi
        ]);

        // Pressure and urgency patterns
        this.forbiddenPatterns.set('pressure', [
            /\b(schnell|rasch|eilig|beeil dich|hurry up|jetzt sofort)\b/gi,
            /\b(musst du|solltest du|notwendig|erforderlich|deadline|zeitlimit)\b/gi
        ]);

        // Comparison patterns
        this.forbiddenPatterns.set('comparison', [
            /\b(besser als|schlechter als|im vergleich zu|wie andere)\b/gi,
            /\b(durchschnittlich|normal|üblich|anderen schülern|meisten kinder)\b/gi
        ]);

        // Multiple questions pattern
        this.forbiddenPatterns.set('multiple_questions', [
            /\?.*\?/g // Two or more question marks
        ]);
    }

    validateResponse(response: string, strict: boolean = true): ValidationResult {
        const violations: string[] = [];
        const suggestions: string[] = [];
        let totalScore = 100;

        // Check each forbidden category
        this.forbiddenPatterns.forEach((patterns, category) => {
            patterns.forEach(pattern => {
                const matches = response.match(pattern);
                if (matches) {
                    violations.push(`${category}: Found "${matches.join(', ')}"`);
                    totalScore -= strict ? 25 : 15;

                    if (category === 'evaluative') {
                        suggestions.push('Replace evaluative words with process-focused praise');
                    } else if (category === 'performance') {
                        suggestions.push('Remove any references to scores, grades, or performance');
                    } else if (category === 'pressure') {
                        suggestions.push('Use gentle, unhurried language without urgency');
                    } else if (category === 'comparison') {
                        suggestions.push('Focus on individual journey without comparisons');
                    } else if (category === 'multiple_questions') {
                        suggestions.push('Ask only one question at a time');
                    }
                }
            });
        });

        // Check sentence length
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 12);
        if (longSentences.length > 0) {
            violations.push(`Long sentences: ${longSentences.length} sentences exceed 12 words`);
            totalScore -= longSentences.length * 5;
            suggestions.push('Break down long sentences into shorter, simpler ones');
        }

        // Check for emotional appropriateness
        const negativePatterns = [
            /\b(dumm|blöd|peinlich|erniedrigend|enttäuschend)\b/gi,
            /\b(störst|störung|problem|schwierigkeit|fehler)\b/gi
        ];

        negativePatterns.forEach(pattern => {
            if (pattern.test(response)) {
                violations.push('Negative or discouraging language detected');
                totalScore -= 20;
                suggestions.push('Use encouraging, positive language even when challenges arise');
            }
        });

        // Check for Buddy personality traits
        const positiveTraits = [
            /😊|🤔|🌟|✨/, // Emojis
            /\b(lass uns|gemeinsam|zusammen|erforschen|entdecken)\b/gi, // Collaborative language
            /\b(interessant|spannend|toll|klug|clever)\b/gi // Encouraging words
        ];

        let positiveTraitCount = 0;
        positiveTraits.forEach(trait => {
            if (trait.test(response)) {
                positiveTraitCount++;
            }
        });

        if (positiveTraitCount === 0 && response.length > 20) {
            violations.push('Missing Buddy personality traits');
            totalScore -= 10;
            suggestions.push('Include warm, encouraging language or gentle emojis');
        }

        return {
            score: Math.max(0, totalScore),
            violations,
            suggestions,
            passed: totalScore >= (strict ? 85 : 75)
        };
    }

    // Test multiple responses and return aggregate statistics
    validateBatch(responses: string[], strict: boolean = true): {
        averageScore: number;
        passRate: number;
        commonViolations: string[];
        detailedResults: ValidationResult[];
    } {
        const results = responses.map(response => this.validateResponse(response, strict));

        const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
        const passRate = results.filter(result => result.passed).length / results.length;

        // Find most common violations
        const violationCounts = new Map<string, number>();
        results.forEach(result => {
            result.violations.forEach(violation => {
                const category = violation.split(':')[0];
                violationCounts.set(category, (violationCounts.get(category) || 0) + 1);
            });
        });

        const commonViolations = Array.from(violationCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category]) => category);

        return {
            averageScore,
            passRate,
            commonViolations,
            detailedResults: results
        };
    }
}

// =============================================
// Prompt Engineering Test Suite
// =============================================

export const PROMPT_TEST_CASES: PromptTestCase[] = [
    {
        name: "Welcome Message",
        userContext: {
            name: "Max",
            interests: [{ interest_name: "Minecraft", intensity_level: 5 }],
            gradeLevel: 3,
            sensitivitySettings: { cognitive_load: "low" }
        },
        userInput: "Hallo",
        expectedBehavior: "Warm welcome with single question",
        constraints: ["no_evaluative", "no_pressure", "single_question", "short_sentences"]
    },
    {
        name: "Math Learning with Interest",
        userContext: {
            name: "Lisa",
            interests: [{ interest_name: "Pferde", intensity_level: 4 }],
            gradeLevel: 4,
            currentCompetency: { domain: "Mathematik", title: "Flächenberechnung" }
        },
        userInput: "Ich mag Pferde",
        expectedBehavior: "Connect horses to area calculation",
        constraints: ["interest_connection", "no_performance", "encouraging"]
    },
    {
        name: "Student Struggling",
        userContext: {
            name: "Tom",
            interests: [{ interest_name: "Dinosaurier", intensity_level: 3 }],
            gradeLevel: 2
        },
        userInput: "Ich weiß nicht",
        expectedBehavior: "Gentle scaffolding without pressure",
        constraints: ["no_pressure", "encouraging", "scaffolding", "no_comparison"]
    },
    {
        name: "Student Confident",
        userContext: {
            name: "Anna",
            interests: [{ interest_name: "Prinzessinnen", intensity_level: 5 }],
            gradeLevel: 5
        },
        userInput: "Das ist easy! 10 mal 8 ist 80!",
        expectedBehavior: "Acknowledge thinking process, not just answer",
        constraints: ["no_evaluative", "process_focus", "encourage_thinking"]
    },
    {
        name: "Session Fatigue",
        userContext: {
            name: "Ben",
            interests: [{ interest_name: "Autos", intensity_level: 4 }],
            gradeLevel: 3
        },
        userInput: "Ich bin müde",
        expectedBehavior: "Offer break without pressure",
        constraints: ["no_pressure", "empathetic", "break_suggestion"]
    }
];

// =============================================
// Automated Testing Framework
// =============================================

export class AITestSuite {
    private validator: ConstraintValidator;

    constructor() {
        this.validator = new ConstraintValidator();
    }

    async runPromptTests(testCases: PromptTestCase[] = PROMPT_TEST_CASES): Promise<{
        totalTests: number;
        passedTests: number;
        failedTests: number;
        averageScore: number;
        testResults: Array<{
            testCase: PromptTestCase;
            result: ValidationResult;
            passed: boolean;
        }>;
    }> {
        const testResults = [];
        let passedTests = 0;

        for (const testCase of testCases) {
            try {
                // This would normally call the actual AI system
                // For testing, we'll use mock responses based on expected behavior
                const mockResponse = this.generateMockResponse(testCase);
                const result = this.validator.validateResponse(mockResponse);

                testResults.push({
                    testCase,
                    result,
                    passed: result.passed
                });

                if (result.passed) {
                    passedTests++;
                }

            } catch (error) {
                testResults.push({
                    testCase,
                    result: {
                        score: 0,
                        violations: [`Test error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                        suggestions: ['Fix test execution'],
                        passed: false
                    },
                    passed: false
                });
            }
        }

        const totalTests = testCases.length;
        const averageScore = testResults.reduce((sum, tr) => sum + tr.result.score, 0) / totalTests;

        return {
            totalTests,
            passedTests,
            failedTests: totalTests - passedTests,
            averageScore,
            testResults
        };
    }

    private generateMockResponse(testCase: PromptTestCase): string {
        // Generate mock responses that should pass validation
        const responses = {
            "Welcome Message": "Hallo Max! Ich freu mich, dich zu sehen. Was möchtest du heute gerne entdecken? 😊",
            "Math Learning with Interest": "Das ist super, Lisa! Stell dir vor, deine Pferde brauchen eine neue Weide. Wie könnten wir die Größe ausrechnen? 🤔",
            "Student Struggling": "Keine Sorge, Tom! Das finden wir gemeinsam heraus. Was ist der erste kleine Schritt, der dir einfällt? 🌟",
            "Student Confident": "Das ist interessante Herangehensweise, Anna! Wie bist du auf diese Lösung gekommen? 😊",
            "Session Fatigue": "Danke, dass du das sagst, Ben. Möchtest du eine kleine Pause machen oder später weiterreden?"
        };

        return responses[testCase.name] || "Das ist eine interessante Frage! Lass uns das gemeinsam erforschen. 😊";
    }

    // Continuous monitoring function
    async monitorResponses(responses: Array<{
        userInput: string;
        buddyResponse: string;
        timestamp: string;
        userContext: any;
    }>): Promise<{
        overallScore: number;
        criticalIssues: string[];
        improvementSuggestions: string[];
        trendData: { date: string; score: number }[];
    }> {
        if (responses.length === 0) {
            return {
                overallScore: 0,
                criticalIssues: ['No responses to analyze'],
                improvementSuggestions: ['Start collecting response data'],
                trendData: []
            };
        }

        const validationResults = responses.map(r =>
            this.validator.validateResponse(r.buddyResponse)
        );

        const overallScore = validationResults.reduce((sum, result) => sum + result.score, 0) / validationResults.length;

        // Find critical issues (score < 70)
        const criticalResponses = validationResults.filter(r => r.score < 70);
        const criticalIssues = criticalResponses.flatMap(r => r.violations);

        // Generate improvement suggestions
        const commonViolations = new Map<string, number>();
        validationResults.forEach(result => {
            result.violations.forEach(violation => {
                const category = violation.split(':')[0];
                commonViolations.set(category, (commonViolations.get(category) || 0) + 1);
            });
        });

        const improvementSuggestions = Array.from(commonViolations.entries())
            .filter(([_, count]) => count > responses.length * 0.2) // More than 20% occurrence
            .map(([category]) => {
                switch (category) {
                    case 'evaluative': return 'Focus on process praise instead of evaluative language';
                    case 'performance': return 'Remove all references to scores, grades, or performance metrics';
                    case 'pressure': return 'Use more gentle, unhurried language';
                    case 'multiple_questions': return 'Ask only one question at a time';
                    default: return `Address ${category} violations`;
                }
            });

        // Create trend data
        const trendData = responses.map((response, index) => ({
            date: new Date(response.timestamp).toISOString().split('T')[0],
            score: validationResults[index].score
        }));

        return {
            overallScore,
            criticalIssues: [...new Set(criticalIssues)], // Remove duplicates
            improvementSuggestions,
            trendData
        };
    }
}

// =============================================
// Real-time Response Analysis
// =============================================

export class ResponseAnalyzer {
    private validator: ConstraintValidator;

    constructor() {
        this.validator = new ConstraintValidator();
    }

    analyzeResponseInRealTime(response: string): {
        isAcceptable: boolean;
        issues: string[];
        quickFixes: string[];
        shouldIntervene: boolean;
    } {
        const validation = this.validator.validateResponse(response, false); // Less strict for real-time

        const criticalIssues = validation.violations.filter(v =>
            v.includes('evaluative') || v.includes('pressure') || v.includes('comparison')
        );

        const shouldIntervene = criticalIssues.length > 0 || validation.score < 60;

        const quickFixes = validation.violations.map(violation => {
            if (violation.includes('evaluative')) {
                return 'Replace evaluative words with "interesting thinking" or "clever approach"';
            } else if (violation.includes('pressure')) {
                return 'Remove urgency words, use "take your time" instead';
            } else if (violation.includes('comparison')) {
                return 'Focus on individual journey, remove comparisons';
            } else if (violation.includes('multiple_questions')) {
                return 'Keep only one question mark';
            } else {
                return 'Review for constraint compliance';
            }
        });

        return {
            isAcceptable: validation.score >= 70,
            issues: validation.violations,
            quickFixes,
            shouldIntervene
        };
    }

    generateInterventionMessage(originalResponse: string, issues: string[]): string {
        // Generate a safe, compliant replacement message
        const safeMessages = [
            "Das ist eine interessante Frage! Lass uns das gemeinsam entdecken. 😊",
            "Danke für deine Gedanken! Was meinst du dazu? 🤔",
            "Kluge Idee! Erzähl mir mehr darüber. 🌟",
            "Das ist spannend! Wie wärst du dabei vorgegangen? 😊"
        ];

        return safeMessages[Math.floor(Math.random() * safeMessages.length)];
    }
}

// Export singleton instances
export const constraintValidator = new ConstraintValidator();
export const aiTestSuite = new AITestSuite();
export const responseAnalyzer = new ResponseAnalyzer();