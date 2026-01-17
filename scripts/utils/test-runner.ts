/**
 * Test Runner
 *
 * A simple test framework with testable-style output using [+]/[-] symbols,
 * green/red ANSI colors, and 3-space indentation.
 */

// ANSI color codes
const ANSI = {
    reset: "\x1b[0m",
    brightGreen: "\x1b[92m",
    brightRed: "\x1b[91m",
    brightYellow: "\x1b[93m",
};

const INDENT = "   "; // 3 spaces

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    children: TestResult[];
}

interface TestContext {
    results: TestResult[];
    currentDescribe: TestResult | null;
}

const context: TestContext = {
    results: [],
    currentDescribe: null,
};

let passedCount = 0;
let failedCount = 0;

/**
 * Define a test suite
 */
export function describe(name: string, fn: () => void): void {
    const describeResult: TestResult = {
        name,
        passed: true,
        children: [],
    };

    const previousDescribe = context.currentDescribe;

    if (previousDescribe) {
        previousDescribe.children.push(describeResult);
    } else {
        context.results.push(describeResult);
    }

    context.currentDescribe = describeResult;
    fn();
    context.currentDescribe = previousDescribe;

    // Update passed status based on children
    describeResult.passed = describeResult.children.every((child) => child.passed);
}

/**
 * Define a test case
 */
export function it(name: string, fn: () => void): void {
    const testResult: TestResult = {
        name,
        passed: true,
        children: [],
    };

    try {
        fn();
        passedCount++;
    } catch (error) {
        testResult.passed = false;
        testResult.error = error instanceof Error ? error.message : String(error);
        failedCount++;
    }

    if (context.currentDescribe) {
        context.currentDescribe.children.push(testResult);
    } else {
        context.results.push(testResult);
    }
}

/**
 * Expectation builder
 */
export function expect<T>(actual: T): Expectation<T> {
    return new Expectation(actual);
}

class Expectation<T> {
    private actual: T;
    private negated: boolean = false;

    constructor(actual: T) {
        this.actual = actual;
    }

    get not(): Expectation<T> {
        this.negated = true;
        return this;
    }

    private assert(condition: boolean, message: string): void {
        const finalCondition = this.negated ? !condition : condition;
        if (!finalCondition) {
            throw new Error(message);
        }
    }

    toBe(expected: T): void {
        this.assert(
            this.actual === expected,
            `Expected ${JSON.stringify(this.actual)} ${this.negated ? "not " : ""}to be ${JSON.stringify(expected)}`
        );
    }

    toEqual(expected: T): void {
        const actualStr = JSON.stringify(this.actual);
        const expectedStr = JSON.stringify(expected);
        this.assert(
            actualStr === expectedStr,
            `Expected ${actualStr} ${this.negated ? "not " : ""}to equal ${expectedStr}`
        );
    }

    toBeTruthy(): void {
        this.assert(
            Boolean(this.actual),
            `Expected ${JSON.stringify(this.actual)} ${this.negated ? "not " : ""}to be truthy`
        );
    }

    toBeFalsy(): void {
        this.assert(
            !this.actual,
            `Expected ${JSON.stringify(this.actual)} ${this.negated ? "not " : ""}to be falsy`
        );
    }

    toBeGreaterThan(expected: number): void {
        this.assert(
            (this.actual as unknown as number) > expected,
            `Expected ${this.actual} ${this.negated ? "not " : ""}to be greater than ${expected}`
        );
    }

    toBeLessThan(expected: number): void {
        this.assert(
            (this.actual as unknown as number) < expected,
            `Expected ${this.actual} ${this.negated ? "not " : ""}to be less than ${expected}`
        );
    }

    toBeGreaterThanOrEqual(expected: number): void {
        this.assert(
            (this.actual as unknown as number) >= expected,
            `Expected ${this.actual} ${this.negated ? "not " : ""}to be greater than or equal to ${expected}`
        );
    }

    toBeLessThanOrEqual(expected: number): void {
        this.assert(
            (this.actual as unknown as number) <= expected,
            `Expected ${this.actual} ${this.negated ? "not " : ""}to be less than or equal to ${expected}`
        );
    }

    toContain(expected: unknown): void {
        const arr = this.actual as unknown as unknown[];
        this.assert(
            Array.isArray(arr) && arr.includes(expected),
            `Expected array ${this.negated ? "not " : ""}to contain ${JSON.stringify(expected)}`
        );
    }

    toHaveLength(expected: number): void {
        const arr = this.actual as unknown as { length: number };
        this.assert(
            arr.length === expected,
            `Expected length ${arr.length} ${this.negated ? "not " : ""}to be ${expected}`
        );
    }

    toBeDefined(): void {
        this.assert(
            this.actual !== undefined,
            `Expected value ${this.negated ? "not " : ""}to be defined`
        );
    }

    toBeUndefined(): void {
        this.assert(
            this.actual === undefined,
            `Expected value ${this.negated ? "not " : ""}to be undefined`
        );
    }

    toBeNull(): void {
        this.assert(this.actual === null, `Expected value ${this.negated ? "not " : ""}to be null`);
    }

    toThrow(expectedMessage?: string): void {
        const fn = this.actual as unknown as () => void;
        let threw = false;
        let thrownMessage = "";

        try {
            fn();
        } catch (error) {
            threw = true;
            thrownMessage = error instanceof Error ? error.message : String(error);
        }

        if (expectedMessage) {
            this.assert(
                threw && thrownMessage.includes(expectedMessage),
                `Expected function ${this.negated ? "not " : ""}to throw "${expectedMessage}", got "${thrownMessage}"`
            );
        } else {
            this.assert(threw, `Expected function ${this.negated ? "not " : ""}to throw`);
        }
    }

    toBeInstanceOf(expected: new (...args: unknown[]) => unknown): void {
        this.assert(
            this.actual instanceof expected,
            `Expected value ${this.negated ? "not " : ""}to be instance of ${expected.name}`
        );
    }

    toMatch(pattern: RegExp): void {
        const str = this.actual as unknown as string;
        this.assert(
            pattern.test(str),
            `Expected "${str}" ${this.negated ? "not " : ""}to match ${pattern}`
        );
    }
}

/**
 * Print test results in testable format
 */
function printResults(results: TestResult[], level: number = 0): void {
    for (const result of results) {
        const indent = INDENT.repeat(level);

        if (result.children.length > 0) {
            // Describe block
            console.log(`${indent}${result.name}`);
            printResults(result.children, level + 1);
        } else {
            // Test case
            const symbol = result.passed ? "+" : "-";
            const color = result.passed ? ANSI.brightGreen : ANSI.brightRed;
            console.log(`${color}${indent}[${symbol}] ${result.name}${ANSI.reset}`);

            if (result.error) {
                console.log(`${ANSI.brightRed}${indent}${INDENT}${result.error}${ANSI.reset}`);
            }
        }
    }
}

/**
 * Run all tests and print results
 */
export function runTests(): boolean {
    console.log("The tests have completed.\n");

    printResults(context.results);

    console.log();

    const passedText = `${ANSI.brightGreen}${passedCount} passed${ANSI.reset}`;
    const failedText = `${ANSI.brightRed}${failedCount} failed${ANSI.reset}`;
    console.log(`${passedText}, ${failedText}.`);

    return failedCount === 0;
}

/**
 * Reset test state (for running multiple test files)
 */
export function resetTests(): void {
    context.results = [];
    context.currentDescribe = null;
    passedCount = 0;
    failedCount = 0;
}
