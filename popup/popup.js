document.addEventListener('DOMContentLoaded', function() {
    const toggleProtection = document.getElementById('toggleProtection');
    const statusText = document.getElementById('statusText');
    const blockedCount = document.getElementById('blockedCount');

    // Load initial state
    chrome.storage.local.get(['enabled', 'blockedCount'], function(result) {
        toggleProtection.checked = result.enabled !== false;
        blockedCount.textContent = result.blockedCount || 0;
        updateStatusText(toggleProtection.checked);
    });

    // Handle toggle changes
    toggleProtection.addEventListener('change', function() {
        const enabled = toggleProtection.checked;
        chrome.storage.local.set({ enabled });
        updateStatusText(enabled);
    });

    function updateStatusText(enabled) {
        statusText.textContent = enabled ? 'Protection Active' : 'Protection Disabled';
        statusText.style.color = enabled ? '#2196F3' : '#666';
    }

    // Listen for updates to blocked count
    chrome.storage.onChanged.addListener(function(changes) {
        if (changes.blockedCount) {
            blockedCount.textContent = changes.blockedCount.newValue;
        }
    });
});
