/**
 * Pattern matching utilities
 *
 * Functions for matching hostnames against whitelist/blacklist patterns.
 */

/**
 * Check if a hostname matches any pattern in a list.
 * Matches if either contains the other (substring match).
 */
export function matchesAnyPattern(hostname: string, patterns: string[]): boolean {
    return patterns.some((pattern) => matchesPattern(hostname, pattern));
}

/**
 * Check if a hostname matches a single pattern.
 * Returns true if either string contains the other.
 */
export function matchesPattern(hostname: string, pattern: string): boolean {
    if (!hostname || !pattern) {
        return false;
    }
    return hostname.includes(pattern) || pattern.includes(hostname);
}

/**
 * Get the current page hostname.
 */
export function getHostname(): string {
    return window.location.hostname;
}
