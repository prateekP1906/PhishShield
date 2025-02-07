// Common phishing patterns
const SUSPICIOUS_PATTERNS = [
    /paypal.*\.com(?!\.)/i,
    /apple.*\.com(?!\.)/i,
    /microsoft.*\.com(?!\.)/i,
    /amazon.*\.com(?!\.)/i,
    /google.*\.com(?!\.)/i,
    /signin|login|account|secure|update|verify/i
];

// Known phishing domains (this would be regularly updated in a real implementation)
const KNOWN_PHISHING_DOMAINS = new Set([
    'fake-paypal.com',
    'secure-banking-login.com',
    'verify-account-now.com'
]);

export async function isPhishingURL(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        // Check against known phishing domains
        if (KNOWN_PHISHING_DOMAINS.has(domain)) {
            return true;
        }

        // Check for suspicious patterns
        for (const pattern of SUSPICIOUS_PATTERNS) {
            if (pattern.test(domain)) {
                return true;
            }
        }

        // Check for suspicious URL characteristics
        if (hasPhishingCharacteristics(url, domain)) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error analyzing URL:', error);
        return false;
    }
}

function hasPhishingCharacteristics(url, domain) {
    // Check for IP address instead of domain
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(domain)) {
        return true;
    }

    // Check for excessive subdomains
    if (domain.split('.').length > 4) {
        return true;
    }

    // Check for suspicious characters in domain
    if (/[^a-zA-Z0-9-.]/.test(domain)) {
        return true;
    }

    // Check for long URLs (potential obfuscation)
    if (url.length > 100) {
        return true;
    }

    return false;
}
