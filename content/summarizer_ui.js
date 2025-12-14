// Inject Summarize Button
function injectSummarizerBtn() {
    // Selectors for finding a place to insert the button
    // 1. New UI (Actions bar)
    let container = document.querySelector('#actions-inner #menu #top-level-buttons-computed');
    // 2. New UI (Alternative - near subscribe)
    if (!container) container = document.querySelector('#owner #subscribe-button');
    // 3. Fallback to title area
    if (!container) container = document.querySelector('#above-the-fold #title');

    if (!container) return;

    if (document.getElementById('ypp-summarize-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'ypp-summarize-btn';
    btn.className = 'ypp-summarize-btn';

    // Icon + Text
    btn.innerHTML = `
    <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 20px; height: 20px; margin-right: 6px;" class="style-scope yt-icon"><g class="style-scope yt-icon"><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z M19,3H5C3.89,3,3,3.9,3,5v14c0,1.1,0.89,2,2,2h14c1.1,0,2-0.9,2-2V5 C21,3.9,20.11,3,19,3z M19,19H5V5h14V19z" class="style-scope yt-icon" fill="currentColor"></path></g></svg>
    <span>Summarize</span>
    `;

    btn.onclick = handleSummarize;

    // Insert logic
    // If it's the specific buttons container, prepend
    if (container.id === 'top-level-buttons-computed') {
        container.insertBefore(btn, container.firstChild);
    } else {
        // Append otherwise
        container.appendChild(btn);
    }
}

// Observer to handle navigation and dynamic loading
const summarizerObserver = new MutationObserver((mutations) => {
    if (!document.getElementById('ypp-summarize-btn')) {
        injectSummarizerBtn();
    }
});
summarizerObserver.observe(document.body, { childList: true, subtree: true });


async function handleSummarize() {
    showModal('Fetching transcript and generating summary... This may take a few seconds.', true);

    try {
        const transcript = await getTranscript();
        const response = await chrome.runtime.sendMessage({
            action: 'summarize_video',
            transcript: transcript
        });

        if (response && response.success) {
            updateModalContent(response.summary);
        } else {
            updateModalContent("Error: " + (response ? response.error : "Unknown error"));
        }
    } catch (err) {
        updateModalContent("Error: " + err.message);
    }
}

async function getTranscript() {
    // 1. Fetch current page source to get caption tracks metadata
    // We include credentials to ensure we get the page as the user sees it (in case of age restriction etc, though simple fetch might not bypass everything)
    const response = await fetch(window.location.href);
    const html = await response.text();

    // 2. Regex for captionTracks
    // It's usually inside "captionTracks":[{...}]
    const captionTracksRegex = /"captionTracks":(\[.*?\])/;
    const match = captionTracksRegex.exec(html);

    if (!match) {
        throw new Error("No caption tracks found for this video. Please ensure the video has subtitles/CC enabled.");
    }

    let tracks;
    try {
        tracks = JSON.parse(match[1]);
    } catch (e) {
        throw new Error("Failed to parse caption tracks.");
    }

    // 3. Find English track or fallback to first available
    // Prioritize manual English captions (no 'kind' or kind != 'asr')
    // Then auto-generated English
    // Then any English
    // Then first available

    const enManual = tracks.find(t => t.languageCode.startsWith('en') && t.kind !== 'asr');
    const enAuto = tracks.find(t => t.languageCode.startsWith('en'));
    const anyTrack = tracks[0];

    const enTrack = enManual || enAuto || anyTrack;

    if (!enTrack) {
        throw new Error("No suitable caption track found.");
    }

    // 4. Fetch the transcript XML
    const transcriptResponse = await fetch(enTrack.baseUrl);
    const transcriptXml = await transcriptResponse.text();

    // 5. Parse XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(transcriptXml, "text/xml");
    const texts = Array.from(doc.getElementsByTagName('text'));

    if (!texts.length) {
        throw new Error("Transcript was empty.");
    }

    // Join text with spaces, decoding entities is handled by textContent
    return texts.map(t => t.textContent).join(' ');
}

// Modal Logic
function showModal(initialText, isLoading) {
    let modal = document.getElementById('ypp-summary-modal');
    let overlay = document.getElementById('ypp-overlay');

    if (!modal) {
        overlay = document.createElement('div');
        overlay.id = 'ypp-overlay';
        overlay.onclick = closeModal;
        document.body.appendChild(overlay);

        modal = document.createElement('div');
        modal.id = 'ypp-summary-modal';
        document.body.appendChild(modal);
    }

    // Reset content
    renderModalBody(modal, initialText, isLoading);

    overlay.style.display = 'block';
    modal.style.display = 'block';
}

function renderModalBody(modal, text, isLoading) {
    let contentHtml = `
        <div id="ypp-summary-header">
            <div id="ypp-summary-title">Video Summary</div>
            <button class="ypp-close-btn">&times;</button>
        </div>
        <div id="ypp-summary-content">`;

    if (isLoading) {
        contentHtml += `<div class="ypp-spinner"></div><div class="ypp-loading">${text}</div>`;
    } else {
        contentHtml += formatSummary(text);
    }

    contentHtml += `</div>`;

    modal.innerHTML = contentHtml;

    // Re-bind close button
    modal.querySelector('.ypp-close-btn').addEventListener('click', closeModal);
}

function updateModalContent(text) {
    const modal = document.getElementById('ypp-summary-modal');
    if (modal) {
        renderModalBody(modal, text, false);
    }
}

function formatSummary(text) {
    if (!text) return '';
    // Basic Markdown formatting
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/^\s*\*\s+(.*)$/gm, '<li>$1</li>'); // Bullet points

    // Wrap lists if multiple lis appear
    if (formatted.includes('<li>')) {
        // Basic list wrapping - inaccurate if mixed content but good enough for simple summaries
        formatted = formatted.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>');
    }

    // Line breaks for non-lists
    formatted = formatted.replace(/\n\n/g, '<br><br>');
    return formatted;
}

function closeModal() {
    const modal = document.getElementById('ypp-summary-modal');
    const overlay = document.getElementById('ypp-overlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}
