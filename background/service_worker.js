chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarize_video') {
        summarizeVideo(request.transcript)
            .then(summary => sendResponse({ success: true, summary }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
});

async function summarizeVideo(transcriptText) {
    const data = await chrome.storage.local.get('geminiApiKey');
    const apiKey = data.geminiApiKey;

    if (!apiKey) {
        throw new Error('API Key not found. Please set it in the extension settings (click the extension icon).');
    }

    // Use Gemini 1.5 Flash for speed and efficiency
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Please summarize the following YouTube video transcript. functionality. Focus on key takeaways, educational points, and the main argument. Keep it concise (bullet points favored) and readable. \n\nTranscript Snippet:\n${transcriptText.substring(0, 40000)}`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch summary from Gemini');
    }

    const result = await response.json();
    try {
        return result.candidates[0].content.parts[0].text;
    } catch (e) {
        throw new Error('Unexpected response format from Gemini API');
    }
}
