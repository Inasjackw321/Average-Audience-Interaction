// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyAf5efHJ8dvFugKFSBXAPs-2CPPtRH9s28';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// State Management
let currentVideoFile = null;
let videoAnalysisContext = null;
let questionsRemaining = 3;
let uploadedFileUri = null;

// DOM Elements
const videoInput = document.getElementById('videoInput');
const uploadArea = document.getElementById('uploadArea');
const videoPreview = document.getElementById('videoPreview');
const previewVideo = document.getElementById('previewVideo');
const analyzeButton = document.getElementById('analyzeButton');
const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const audienceContent = document.getElementById('audienceContent');
const interactionContent = document.getElementById('interactionContent');
const questionInput = document.getElementById('questionInput');
const askButton = document.getElementById('askButton');
const qaHistory = document.getElementById('qaHistory');
const questionCounter = document.getElementById('questionCounter');
const resetButton = document.getElementById('resetButton');

// Event Listeners
videoInput.addEventListener('change', handleVideoSelect);
analyzeButton.addEventListener('click', analyzeVideo);
askButton.addEventListener('click', askQuestion);
resetButton.addEventListener('click', resetApp);
questionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        askQuestion();
    }
});

// Drag and Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
        handleVideoFile(files[0]);
    }
});

// Handle Video Selection
function handleVideoSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleVideoFile(file);
    }
}

function handleVideoFile(file) {
    currentVideoFile = file;
    const videoUrl = URL.createObjectURL(file);
    previewVideo.src = videoUrl;
    videoPreview.classList.remove('hidden');
}

// Analyze Video with Gemini
async function analyzeVideo() {
    if (!currentVideoFile) return;

    showSection('loading');

    try {
        // Convert video to base64
        const base64Video = await fileToBase64(currentVideoFile);

        // Prepare the prompt for initial analysis
        const prompt = `Analyze this video comprehensively and provide detailed insights about:

1. AUDIENCE UNDERSTANDING:
   - Demographics (age range, likely interests, profession/background)
   - Content preferences and consumption patterns
   - Why this content would appeal to them
   - Potential audience size and niche specificity

2. INTERACTION POTENTIAL:
   - Expected engagement types (comments, shares, likes)
   - Discussion topics viewers might bring up
   - Community building potential
   - Viral or share-worthy moments
   - Emotional responses the video might trigger

Be specific and insightful. Format your response in a clear, structured way.`;

        const response = await callGeminiAPI(prompt, base64Video);

        // Store context for Q&A
        videoAnalysisContext = response;

        // Parse and display results
        displayAnalysisResults(response);

        showSection('results');
    } catch (error) {
        console.error('Analysis error:', error);
        alert('Error analyzing video: ' + error.message);
        showSection('upload');
    }
}

// Call Gemini API
async function callGeminiAPI(prompt, base64Video = null, conversationHistory = []) {
    const contents = [];

    // Add conversation history if exists
    if (conversationHistory.length > 0) {
        contents.push(...conversationHistory);
    }

    // Add current message
    const parts = [{ text: prompt }];

    // Add video if provided
    if (base64Video) {
        parts.push({
            inline_data: {
                mime_type: currentVideoFile.type,
                data: base64Video
            }
        });
    }

    contents.push({
        role: 'user',
        parts: parts
    });

    const requestBody = {
        contents: contents,
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// Display Analysis Results
function displayAnalysisResults(analysisText) {
    // Split the analysis into sections
    const sections = analysisText.split(/\d\.\s+(?:AUDIENCE UNDERSTANDING|INTERACTION POTENTIAL)/i);

    // Extract audience understanding
    let audienceSection = sections.find(s =>
        s.toLowerCase().includes('demographic') ||
        s.toLowerCase().includes('age') ||
        sections.indexOf(s) === 1
    ) || analysisText;

    // Extract interaction potential
    let interactionSection = sections.find(s =>
        s.toLowerCase().includes('engagement') ||
        s.toLowerCase().includes('interaction') ||
        sections.indexOf(s) === 2
    ) || '';

    // If we couldn't split properly, try to find the sections differently
    if (!interactionSection) {
        const parts = analysisText.split(/INTERACTION POTENTIAL:?/i);
        if (parts.length > 1) {
            audienceSection = parts[0].replace(/AUDIENCE UNDERSTANDING:?/i, '');
            interactionSection = parts[1];
        }
    }

    // Format and display audience understanding
    audienceContent.innerHTML = formatAnalysisText(audienceSection);

    // Format and display interaction potential
    interactionContent.innerHTML = formatAnalysisText(interactionSection);
}

// Format Analysis Text
function formatAnalysisText(text) {
    // Clean up the text
    text = text.trim();

    // Convert bullet points and dashes to list items
    const lines = text.split('\n');
    let formatted = '';
    let inList = false;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Check if line is a bullet point or dash
        if (line.match(/^[-*•]\s+/) || line.match(/^\d+\.\s+/)) {
            if (!inList) {
                formatted += '<ul>';
                inList = true;
            }
            line = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
            formatted += `<li>${line}</li>`;
        } else {
            if (inList) {
                formatted += '</ul>';
                inList = false;
            }
            // Check if it's a heading (contains colon or is short and bold-looking)
            if (line.includes(':') && line.length < 100) {
                const parts = line.split(':');
                if (parts[1]?.trim()) {
                    formatted += `<p><strong>${parts[0]}:</strong> ${parts[1]}</p>`;
                } else {
                    formatted += `<p><strong>${parts[0]}</strong></p>`;
                }
            } else {
                formatted += `<p>${line}</p>`;
            }
        }
    }

    if (inList) {
        formatted += '</ul>';
    }

    return formatted || '<p>Analysis completed. See full details above.</p>';
}

// Ask Question
async function askQuestion() {
    const question = questionInput.value.trim();

    if (!question || questionsRemaining <= 0) return;

    // Disable input while processing
    askButton.disabled = true;
    questionInput.disabled = true;

    try {
        // Add question to history display
        const qaPair = document.createElement('div');
        qaPair.className = 'qa-pair';

        const questionBox = document.createElement('div');
        questionBox.className = 'question-box';
        questionBox.innerHTML = `<span class="question-label">Question:</span>${escapeHtml(question)}`;

        qaPair.appendChild(questionBox);
        qaHistory.appendChild(qaPair);

        // Show loading indicator
        const answerBox = document.createElement('div');
        answerBox.className = 'answer-box';
        answerBox.innerHTML = `<span class="answer-label">Answer:</span><em>Thinking...</em>`;
        qaPair.appendChild(answerBox);

        // Scroll to the new question
        qaPair.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Create context-aware prompt
        const contextPrompt = `Based on the video analysis we just completed, please answer this question:

${question}

Provide a detailed, insightful answer that relates specifically to the video content and the audience/interaction analysis we discussed.`;

        // Get answer from Gemini
        const answer = await callGeminiAPI(contextPrompt);

        // Update answer in the UI
        answerBox.innerHTML = `<span class="answer-label">Answer:</span>${formatAnalysisText(answer)}`;

        // Update questions remaining
        questionsRemaining--;
        updateQuestionCounter();

        // Clear input
        questionInput.value = '';

    } catch (error) {
        console.error('Question error:', error);
        alert('Error getting answer: ' + error.message);
    } finally {
        askButton.disabled = questionsRemaining <= 0;
        questionInput.disabled = questionsRemaining <= 0;

        if (questionsRemaining <= 0) {
            questionInput.placeholder = 'You have used all 3 questions for this video.';
        }
    }
}

// Update Question Counter
function updateQuestionCounter() {
    questionCounter.textContent = `${questionsRemaining} question${questionsRemaining !== 1 ? 's' : ''} remaining`;

    if (questionsRemaining <= 0) {
        questionCounter.style.background = '#64748b';
    }
}

// Reset App
function resetApp() {
    currentVideoFile = null;
    videoAnalysisContext = null;
    questionsRemaining = 3;
    uploadedFileUri = null;

    videoInput.value = '';
    previewVideo.src = '';
    questionInput.value = '';
    questionInput.placeholder = 'Ask anything about your video\'s audience or engagement potential...';
    qaHistory.innerHTML = '';
    audienceContent.innerHTML = '';
    interactionContent.innerHTML = '';

    videoPreview.classList.add('hidden');
    askButton.disabled = false;
    questionInput.disabled = false;

    updateQuestionCounter();
    showSection('upload');
}

// Show Section
function showSection(section) {
    uploadSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    resultsSection.classList.add('hidden');

    switch(section) {
        case 'upload':
            uploadSection.classList.remove('hidden');
            break;
        case 'loading':
            loadingSection.classList.remove('hidden');
            break;
        case 'results':
            resultsSection.classList.remove('hidden');
            break;
    }
}

// Utility Functions
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
console.log('Assumed Audience Interaction initialized');
console.log('Ready to analyze videos with Gemini 2.5 Flash');
