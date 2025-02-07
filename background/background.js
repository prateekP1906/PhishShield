import { isPhishingURL } from '../utils/phishing-detector.js';

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        enabled: true,
        blockedCount: 0
    });
});

// Monitor URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        const isEnabled = (await chrome.storage.local.get('enabled')).enabled;
        
        if (!isEnabled) return;

        if (await isPhishingURL(changeInfo.url)) {
            // Increment blocked count
            const current = await chrome.storage.local.get('blockedCount');
            chrome.storage.local.set({ 
                blockedCount: (current.blockedCount || 0) + 1 
            });

            // Show warning
            chrome.tabs.update(tabId, {
                url: `data:text/html,
                    <html>
                        <body style="background-color: #ffebee; font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                            <h1 style="color: #c62828;">⚠️ Phishing Warning!</h1>
                            <p>The site you're trying to visit has been detected as potentially dangerous.</p>
                            <p>URL: ${changeInfo.url}</p>
                            <button onclick="history.back()" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Go Back to Safety
                            </button>
                        </body>
                    </html>`
            });
        }
    }
});
