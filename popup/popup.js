document.addEventListener('DOMContentLoaded', function() {
    const toggleProtection = document.getElementById('toggleProtection');
    const statusText = document.getElementById('statusText');
    const blockedCount = document.getElementById('blockedCount');
    const threatList = document.getElementById('threatList');

    // Load initial state
    chrome.storage.local.get(['enabled', 'blockedCount', 'threatHistory'], function(result) {
        toggleProtection.checked = result.enabled !== false;
        blockedCount.textContent = result.blockedCount || 0;
        updateStatusText(toggleProtection.checked);
        updateThreatHistory(result.threatHistory || []);
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

    // Update threat history display
    function updateThreatHistory(threats) {
        threatList.innerHTML = '';
        threats.slice(0, 5).forEach(threat => {
            const threatElement = document.createElement('div');
            threatElement.className = `threat-item ${threat.threatLevel}`;

            const date = new Date(threat.timestamp);
            const timeAgo = getTimeAgo(date);

            threatElement.innerHTML = `
                <div class="domain">${threat.domain}</div>
                <div class="details">
                    Threat Level: ${threat.threatLevel.toUpperCase()}
                    (Score: ${threat.score}/100)
                </div>
                <div class="timestamp">${timeAgo}</div>
            `;

            threatList.appendChild(threatElement);
        });

        if (threats.length === 0) {
            threatList.innerHTML = '<div class="no-threats">No threats detected yet</div>';
        }
    }

    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }

        return 'Just now';
    }

    // Listen for updates to blocked count and threat history
    chrome.storage.onChanged.addListener(function(changes) {
        if (changes.blockedCount) {
            blockedCount.textContent = changes.blockedCount.newValue;
        }
        if (changes.threatHistory) {
            updateThreatHistory(changes.threatHistory.newValue || []);
        }
    });
});