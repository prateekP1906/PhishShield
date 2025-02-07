import { isPhishingURL } from '../utils/phishing-detector.js';

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        enabled: true,
        blockedCount: 0,
        threatHistory: []
    });
});

// Monitor URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        const isEnabled = (await chrome.storage.local.get('enabled')).enabled;

        if (!isEnabled) return;

        const result = await isPhishingURL(changeInfo.url);
        if (result.isPhishing) {
            // Store threat in history
            const current = await chrome.storage.local.get(['blockedCount', 'threatHistory']);
            const newHistory = [result.analysis, ...(current.threatHistory || [])].slice(0, 100);

            chrome.storage.local.set({ 
                blockedCount: (current.blockedCount || 0) + 1,
                threatHistory: newHistory
            });

            // Show detailed warning
            const warningHTML = generateWarningHTML(changeInfo.url, result.analysis);
            chrome.tabs.update(tabId, {
                url: `data:text/html,${encodeURIComponent(warningHTML)}`
            });
        }
    }
});

function generateWarningHTML(url, analysis) {
    const severityColors = {
        critical: '#d32f2f',
        high: '#f44336',
        medium: '#ff9800',
        low: '#ffeb3b',
        safe: '#4caf50'
    };

    const threatColor = severityColors[analysis.threatLevel] || severityColors.medium;

    return `
    <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #ffebee;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .warning-header {
                    text-align: center;
                    color: ${threatColor};
                    margin-bottom: 20px;
                }
                .threat-details {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .threat-item {
                    margin: 10px 0;
                    padding: 10px;
                    border-left: 4px solid ${threatColor};
                    background: #fff5f5;
                }
                .score-indicator {
                    text-align: center;
                    font-size: 24px;
                    margin: 20px 0;
                }
                .action-buttons {
                    text-align: center;
                    margin-top: 20px;
                }
                button {
                    padding: 10px 20px;
                    margin: 0 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }
                .back-button {
                    background: #2196F3;
                    color: white;
                }
                .proceed-button {
                    background: #ff9800;
                    color: white;
                }
            </style>
        </head>
        <body>
            <div class="warning-header">
                <h1>⚠️ Phishing Threat Detected!</h1>
                <h2>Threat Level: ${analysis.threatLevel.toUpperCase()}</h2>
            </div>

            <div class="score-indicator">
                Threat Score: ${analysis.score}/100
            </div>

            <div class="threat-details">
                <h3>Detailed Analysis:</h3>
                ${analysis.details.map(threat => `
                    <div class="threat-item">
                        <strong>${threat.type}:</strong> ${threat.description}
                        <br>
                        <small>Severity: ${threat.severity}</small>
                    </div>
                `).join('')}

                <p><strong>Analyzed Domain:</strong> ${analysis.domain}</p>
                <p><strong>Analysis Time:</strong> ${new Date(analysis.timestamp).toLocaleString()}</p>
            </div>

            <div class="action-buttons">
                <button class="back-button" onclick="history.back()">
                    ← Go Back to Safety
                </button>
                <button class="proceed-button" onclick="window.location.href='${url}'">
                    Proceed Anyway (Not Recommended)
                </button>
            </div>
        </body>
    </html>`;
}