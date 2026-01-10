/**
 * RankingEngine.js
 *
 * Backwards-compatibility barrel file.
 * The actual implementation lives in `src/lib/ranking/engine.js`.
 *
 * This keeps existing imports working while we split the engine by responsibility.
 * All functions are re-exported from the main engine implementation.
 */

export * from './ranking/engine.js';
