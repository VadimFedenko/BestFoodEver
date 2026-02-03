/**
 * Fast synchronous check for onboarding status from localStorage.
 * This is used BEFORE React loads to determine if we need to prioritize onboarding.
 * 
 * @returns {boolean} true if user has seen onboarding, false otherwise
 */
export function hasSeenOnboardingSync() {
  try {
    const STORAGE_KEY = 'bfe_prefs_v2';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    
    const stored = JSON.parse(raw);
    if (!stored || typeof stored !== 'object') return false;
    
    // Check hasSeenOnboarding flag
    return typeof stored.hasSeenOnboarding === 'boolean' ? stored.hasSeenOnboarding : false;
  } catch {
    // If anything fails, assume onboarding is needed
    return false;
  }
}

/**
 * Alias for naming consistency in UI code.
 * Under the hood we keep the persisted pref key as `hasSeenOnboarding` to avoid migrations.
 *
 * @returns {boolean}
 */
export function hasSeenGuideSync() {
  return hasSeenOnboardingSync();
}

