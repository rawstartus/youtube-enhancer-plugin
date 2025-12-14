let currentCustomSpeed = 1;

function injectSpeedControls() {
    const rightControls = document.querySelector('.ytp-right-controls');
    if (!rightControls) return;

    if (document.getElementById('ypp-speed-controls')) return;

    const container = document.createElement('div');
    container.id = 'ypp-speed-controls';

    // Insert before the settings gear (usually first or early in right controls)
    rightControls.insertBefore(container, rightControls.firstChild);

    [2, 2.5, 3, 3.5, 4].forEach(rate => {
        const btn = document.createElement('button');
        btn.textContent = `${rate}x`;
        btn.className = 'ypp-speed-btn';
        btn.title = `Set playback speed to ${rate}x`;

        btn.onclick = (e) => {
            e.stopPropagation(); // Prevent executing other YouTube shortcuts
            e.preventDefault();
            const video = document.querySelector('video');
            if (video) {
                video.playbackRate = rate;
                currentCustomSpeed = rate;
                updateActiveButton(rate);
            }
        };
        container.appendChild(btn);
    });
}

function updateActiveButton(rate) {
    document.querySelectorAll('.ypp-speed-btn').forEach(btn => {
        if (btn.textContent === `${rate}x`) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Observer to handle navigation and DOM updates
const observer = new MutationObserver((mutations) => {
    if (!document.getElementById('ypp-speed-controls')) {
        injectSpeedControls();
    }

    // Also re-apply active class if speed matches (in case UI redraws)
    const video = document.querySelector('video');
    if (video && !video.paused) {
        // Optionally keep enforcing speed, but let's trust video.playbackRate
        if (video.playbackRate >= 2) {
            updateActiveButton(video.playbackRate);
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial injection
injectSpeedControls();

// Event listener to re-apply speed after ads?
// Note: YouTube often resets speed on ad end.
document.addEventListener('durationchange', function () {
    const video = document.querySelector('video');
    if (video && currentCustomSpeed > 1) {
        // Only re-apply if we purposefully set a high speed
        // This can be annoying if user manually changed it back to 1x via normal controls.
        // So we will only update visual state
        if (video.playbackRate === currentCustomSpeed) {
            updateActiveButton(currentCustomSpeed);
        } else {
            // If video rate changed externally, clear active
            document.querySelectorAll('.ypp-speed-btn').forEach(b => b.classList.remove('active'));
        }
    }
}, true);
