# YouTube Power Playback & LLM Summarizer

## 🌟 Overview

This is a browser extension designed to supercharge your YouTube viewing experience with advanced playback controls and AI-powered video summarization.

**Tired of watching long lectures or tutorials at just 1.5x?** This extension allows for playback speeds up to 5x.

**Don't have time to watch a whole video?** Get the key takeaways instantly with a Gemini-powered summarization button.

## ✨ Features

* **Extreme Playback Speeds:** Adds options for 2x, 2.5x, 3x, 3.5x, and **4x** video playback speed.
* **LLM Summarization:** A dedicated button on the video page to fetch the transcript, pass it to the **Gemini 3 API** (free tier), and display a concise summary.
* **Intuitive UI Integration:** Seamlessly integrates new controls into the standard YouTube player interface.

## 🛠 Installation

### Prerequisites

* A modern web browser (Google Chrome, Mozilla Firefox, or a Chromium-based browser like Brave or Edge).
* A **Gemini API Key** (required for the summarization feature).

### Steps (for development/testing)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/youtube-power-playback.git](https://github.com/your-username/youtube-power-playback.git)
    cd youtube-power-playback
    ```
2.  **Install Dependencies (if applicable):**
    ```bash
    # e.g., if using a build tool like Webpack
    npm install
    ```
3.  **Load the Extension:**
    * Open your browser's extensions page (e.g., `chrome://extensions` for Chrome).
    * Enable **Developer Mode**.
    * Click **"Load unpacked"** and select the extension's root directory.

## ⚙️ Configuration (API Key)

For the summarization feature to work, you must set your Gemini API key:

1.  Get your key from the Google AI Studio.
2.  In the extension's settings page (or a designated configuration file within the extension), input your key. *Note: We must ensure the key is stored securely, ideally in the browser's local storage and used only for API calls.*

