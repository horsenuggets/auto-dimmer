/**
 * Test Entry Point
 *
 * Runs all tests and exits with appropriate code.
 */

import { runTests } from "./utils/test-runner";

// Import all test files
import "../tests/types.test";
import "../tests/utils.test";
import "../tests/animation.test";
import "../tests/brightness.test";
import "../tests/overlay.test";
import "../tests/patterns.test";
import "../tests/settings.test";
import "../tests/storage.test";

// Run tests and exit
const passed = runTests();
process.exit(passed ? 0 : 1);
