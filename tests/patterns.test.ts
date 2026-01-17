/**
 * Patterns Tests
 *
 * Comprehensive tests for hostname pattern matching utilities.
 */

import { describe, it, expect } from "../scripts/utils/test-runner";

// Re-implement pure functions for testing (avoiding browser-only code)
function matchesPattern(hostname: string, pattern: string): boolean {
    if (!hostname || !pattern) {
        return false;
    }
    return hostname.includes(pattern) || pattern.includes(hostname);
}

function matchesAnyPattern(hostname: string, patterns: string[]): boolean {
    return patterns.some((pattern) => matchesPattern(hostname, pattern));
}

describe("matchesPattern", () => {
    describe("exact matches", () => {
        it("should match identical hostnames", () => {
            expect(matchesPattern("example.com", "example.com")).toBe(true);
        });

        it("should match identical subdomains", () => {
            expect(matchesPattern("www.example.com", "www.example.com")).toBe(true);
        });

        it("should match identical deep subdomains", () => {
            expect(matchesPattern("api.v2.example.com", "api.v2.example.com")).toBe(true);
        });
    });

    describe("partial matches - hostname contains pattern", () => {
        it("should match when hostname contains pattern at start", () => {
            expect(matchesPattern("example.com", "example")).toBe(true);
        });

        it("should match when hostname contains pattern at end", () => {
            expect(matchesPattern("mysite.example.com", ".com")).toBe(true);
        });

        it("should match when hostname contains pattern in middle", () => {
            expect(matchesPattern("api.example.org", "example")).toBe(true);
        });

        it("should match subdomain against domain pattern", () => {
            expect(matchesPattern("www.example.com", "example.com")).toBe(true);
        });
    });

    describe("partial matches - pattern contains hostname", () => {
        it("should match when pattern contains shorter hostname", () => {
            expect(matchesPattern("example", "example.com")).toBe(true);
        });

        it("should match TLD against full domain", () => {
            expect(matchesPattern(".com", "example.com")).toBe(true);
        });
    });

    describe("no matches", () => {
        it("should not match unrelated domains", () => {
            expect(matchesPattern("google.com", "facebook.com")).toBe(false);
        });

        it("should not match similar but different domains", () => {
            expect(matchesPattern("example.com", "examples.com")).toBe(false);
        });

        it("should not match partial substrings that don't exist", () => {
            expect(matchesPattern("github.com", "gitlab")).toBe(false);
        });
    });

    describe("edge cases", () => {
        it("should return false for empty hostname", () => {
            expect(matchesPattern("", "example.com")).toBe(false);
        });

        it("should return false for empty pattern", () => {
            expect(matchesPattern("example.com", "")).toBe(false);
        });

        it("should return false for both empty", () => {
            expect(matchesPattern("", "")).toBe(false);
        });

        it("should handle single character matches", () => {
            expect(matchesPattern("a", "a")).toBe(true);
        });

        it("should handle numeric hostnames", () => {
            expect(matchesPattern("127.0.0.1", "127.0")).toBe(true);
        });

        it("should handle localhost", () => {
            expect(matchesPattern("localhost", "local")).toBe(true);
        });
    });
});

describe("matchesAnyPattern", () => {
    describe("matching against lists", () => {
        it("should return true if hostname matches first pattern", () => {
            expect(matchesAnyPattern("example.com", ["example.com", "other.com"])).toBe(true);
        });

        it("should return true if hostname matches last pattern", () => {
            expect(matchesAnyPattern("other.com", ["example.com", "other.com"])).toBe(true);
        });

        it("should return true if hostname matches middle pattern", () => {
            expect(matchesAnyPattern("middle.com", ["first.com", "middle.com", "last.com"])).toBe(
                true
            );
        });

        it("should return false if no patterns match", () => {
            expect(matchesAnyPattern("nomatch.com", ["first.com", "second.com"])).toBe(false);
        });
    });

    describe("empty list handling", () => {
        it("should return false for empty pattern list", () => {
            expect(matchesAnyPattern("example.com", [])).toBe(false);
        });
    });

    describe("partial matching in lists", () => {
        it("should match partial patterns in list", () => {
            expect(matchesAnyPattern("www.example.com", ["google", "example"])).toBe(true);
        });

        it("should match subdomain against domain in list", () => {
            expect(matchesAnyPattern("api.github.com", ["facebook.com", "github.com"])).toBe(true);
        });
    });

    describe("real-world whitelist/blacklist scenarios", () => {
        it("should match YouTube subdomains", () => {
            expect(matchesAnyPattern("www.youtube.com", ["youtube.com"])).toBe(true);
            expect(matchesAnyPattern("music.youtube.com", ["youtube.com"])).toBe(true);
            expect(matchesAnyPattern("studio.youtube.com", ["youtube.com"])).toBe(true);
        });

        it("should match Google services", () => {
            expect(matchesAnyPattern("mail.google.com", ["google"])).toBe(true);
            expect(matchesAnyPattern("drive.google.com", ["google"])).toBe(true);
            expect(matchesAnyPattern("docs.google.com", ["google"])).toBe(true);
        });

        it("should distinguish between similar services", () => {
            const blacklist = ["youtube.com", "netflix.com"];
            expect(matchesAnyPattern("youtube.com", blacklist)).toBe(true);
            expect(matchesAnyPattern("hulu.com", blacklist)).toBe(false);
        });
    });
});
