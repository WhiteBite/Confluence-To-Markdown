/** Detect runtime environment */
export type Environment = 'tampermonkey' | 'extension' | 'browser';

export function getEnvironment(): Environment {
    // Check for Tampermonkey/Greasemonkey
    if (typeof GM_xmlhttpRequest !== 'undefined') {
        return 'tampermonkey';
    }

    // Check for Chrome Extension
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
        return 'extension';
    }

    // Fallback to browser
    return 'browser';
}

export const ENV = getEnvironment();
export const IS_TAMPERMONKEY = ENV === 'tampermonkey';
export const IS_EXTENSION = ENV === 'extension';
