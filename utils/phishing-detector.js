// Common phishing patterns
const SUSPICIOUS_PATTERNS = [
    /paypal.*\.com(?!\.)/i,
    /apple.*\.com(?!\.)/i,
    /microsoft.*\.com(?!\.)/i,
    /amazon.*\.com(?!\.)/i,
    /google.*\.com(?!\.)/i,
    /signin|login|account|secure|update|verify/i
];

// Known phishing domains
const KNOWN_PHISHING_DOMAINS = new Set([
    'fake-paypal.com',
    'secure-banking-login.com',
    'verify-account-now.com'
]);

// Threat severity levels
const SEVERITY = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

export async function isPhishingURL(url) {
    try {
        const analysis = await analyzeThreat(url);
        return {
            isPhishing: analysis.threatLevel !== 'safe',
            analysis: analysis
        };
    } catch (error) {
        console.error('Error analyzing URL:', error);
        return {
            isPhishing: false,
            analysis: {
                threatLevel: 'error',
                details: ['Error analyzing URL'],
                score: 0
            }
        };
    }
}

async function analyzeThreat(url) {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const threats = [];
    let score = 0;

    // Check against known phishing domains
    if (KNOWN_PHISHING_DOMAINS.has(domain)) {
        threats.push({
            type: 'known_phishing',
            description: 'Domain is in known phishing list',
            severity: SEVERITY.HIGH
        });
        score += 100;
    }

    // Check for suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(domain)) {
            threats.push({
                type: 'suspicious_pattern',
                description: `Domain matches suspicious pattern: ${pattern}`,
                severity: SEVERITY.MEDIUM
            });
            score += 40;
        }
    }

    // Check URL characteristics
    const urlCharacteristics = analyzeURLCharacteristics(url, domain);
    threats.push(...urlCharacteristics.threats);
    score += urlCharacteristics.score;

    // SSL certificate check
    const sslAnalysis = analyzeSSL(url);
    if (sslAnalysis.threat) {
        threats.push(sslAnalysis.threat);
        score += sslAnalysis.score;
    }

    return {
        threatLevel: determineThreatLevel(score),
        details: threats,
        score: score,
        domain: domain,
        timestamp: new Date().toISOString()
    };
}

function analyzeURLCharacteristics(url, domain) {
    const threats = [];
    let score = 0;

    // Check for IP address instead of domain
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(domain)) {
        threats.push({
            type: 'ip_address',
            description: 'Uses IP address instead of domain name',
            severity: SEVERITY.HIGH
        });
        score += 60;
    }

    // Check for excessive subdomains
    if (domain.split('.').length > 4) {
        threats.push({
            type: 'excessive_subdomains',
            description: 'Contains excessive number of subdomains',
            severity: SEVERITY.MEDIUM
        });
        score += 30;
    }

    // Check for suspicious characters
    if (/[^a-zA-Z0-9-.]/.test(domain)) {
        threats.push({
            type: 'suspicious_characters',
            description: 'Contains suspicious special characters',
            severity: SEVERITY.MEDIUM
        });
        score += 40;
    }

    // Check URL length
    if (url.length > 100) {
        threats.push({
            type: 'long_url',
            description: 'Unusually long URL',
            severity: SEVERITY.LOW
        });
        score += 20;
    }

    return { threats, score };
}

function analyzeSSL(url) {
    const isHTTPS = url.startsWith('https://');
    if (!isHTTPS) {
        return {
            threat: {
                type: 'no_ssl',
                description: 'No SSL certificate (not using HTTPS)',
                severity: SEVERITY.MEDIUM
            },
            score: 40
        };
    }
    return { threat: null, score: 0 };
}

function determineThreatLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score > 0) return 'low';
    return 'safe';
}