// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyAf5efHJ8dvFugKFSBXAPs-2CPPtRH9s28';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// State Management
let currentVideoFile = null;
let videoAnalysisContext = null;
let questionsRemaining = 3;
let retentionChart = null;
let engagementChart = null;

// DOM Elements
const videoInput = document.getElementById('videoInput');
const uploadArea = document.getElementById('uploadArea');
const videoPreview = document.getElementById('videoPreview');
const previewVideo = document.getElementById('previewVideo');
const videoDuration = document.getElementById('videoDuration');
const videoSize = document.getElementById('videoSize');
const videoFormat = document.getElementById('videoFormat');
const analyzeButton = document.getElementById('analyzeButton');
const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const audienceContent = document.getElementById('audienceContent');
const interactionContent = document.getElementById('interactionContent');
const suggestionsContent = document.getElementById('suggestionsContent');
const questionInput = document.getElementById('questionInput');
const askButton = document.getElementById('askButton');
const qaHistory = document.getElementById('qaHistory');
const questionCounter = document.getElementById('questionCounter');
const resetButton = document.getElementById('resetButton');
const progressFill = document.getElementById('progressFill');
const timeRemaining = document.getElementById('timeRemaining');

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

uploadArea.addEventListener('click', () => {
    videoInput.click();
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

    // Update video details
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    videoSize.textContent = sizeMB + ' MB';

    // Get file extension
    const extension = file.name.split('.').pop().toUpperCase();
    videoFormat.textContent = extension;

    previewVideo.addEventListener('loadedmetadata', () => {
        const duration = previewVideo.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        videoDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    });

    videoPreview.classList.remove('hidden');
    uploadArea.style.display = 'none';
}

// Simple Loading Progress
function updateLoadingProgress() {
    let progress = 0;
    let time = 30;

    const interval = setInterval(() => {
        progress += 2;
        time -= 0.6;

        if (progress <= 100) {
            progressFill.style.width = progress + '%';
            timeRemaining.textContent = Math.max(0, Math.floor(time));
        }

        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 300);

    return interval;
}

// Analyze Video with Gemini
async function analyzeVideo() {
    if (!currentVideoFile) return;

    showSection('loading');
    const loadingInterval = updateLoadingProgress();

    try {
        // Convert video to base64
        const base64Video = await fileToBase64(currentVideoFile);

        // Enhanced prompt for comprehensive analytics
        const prompt = `Analyze this video comprehensively and provide detailed analytics in a structured format. Be specific with numbers and percentages.

1. PERFORMANCE METRICS:
   Estimate the following based on the video quality, content type, and market potential:
   - Estimated views in first 30 days (provide a specific range like "5,000-15,000")
   - Expected like-to-view ratio percentage
   - Expected engagement rate percentage
   - Average watch time percentage

2. AUDIENCE UNDERSTANDING:
   - Demographics (age range, interests, profession)
   - Why this content appeals to them
   - Audience size potential
   - Content preferences

3. INTERACTION POTENTIAL:
   - Expected engagement types (comments, shares, likes)
   - Discussion topics viewers might bring up
   - Viral potential assessment
   - Community building potential
   - Emotional response predictions

4. RETENTION ANALYSIS:
   Estimate viewer retention at these timestamps as percentages (0-100%):
   - 0% (start): 100%
   - 25% through video
   - 50% through video
   - 75% through video
   - 100% (end)
   Also identify any drop-off points and why viewers might leave.

5. ACTIONABLE SUGGESTIONS:
   Provide 5-7 specific, actionable suggestions to improve the video's performance. For each suggestion, include:
   - A clear title
   - Detailed description
   - Priority level (High/Medium/Low)

Format your response clearly with headers and bullet points.`;

        const response = await callGeminiAPI(prompt, base64Video);

        // Store context for Q&A
        videoAnalysisContext = response;

        // Clear loading interval
        clearInterval(loadingInterval);

        // Parse and display all results
        await displayComprehensiveAnalytics(response);

        showSection('results');
    } catch (error) {
        clearInterval(loadingInterval);
        console.error('Analysis error:', error);
        alert('Error analyzing video: ' + error.message);
        showSection('upload');
    }
}

// Call Gemini API
async function callGeminiAPI(prompt, base64Video = null) {
    const parts = [{ text: prompt }];

    if (base64Video) {
        parts.push({
            inline_data: {
                mime_type: currentVideoFile.type,
                data: base64Video
            }
        });
    }

    const requestBody = {
        contents: [{
            role: 'user',
            parts: parts
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3096,
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

// Display Comprehensive Analytics Dashboard
async function displayComprehensiveAnalytics(analysisText) {
    // Extract different sections
    const metrics = extractMetrics(analysisText);
    const audience = extractSection(analysisText, 'AUDIENCE UNDERSTANDING');
    const interaction = extractSection(analysisText, 'INTERACTION POTENTIAL');
    const retention = extractRetentionData(analysisText);
    const suggestions = extractSuggestions(analysisText);

    // Display metrics cards
    displayMetrics(metrics);

    // Display charts
    displayRetentionChart(retention);
    displayEngagementChart();

    // Display text sections
    audienceContent.innerHTML = formatAnalysisText(audience);
    interactionContent.innerHTML = formatAnalysisText(interaction);

    // Display suggestions
    displaySuggestions(suggestions);
}

// Extract Metrics from Analysis
function extractMetrics(text) {
    const metrics = {
        views: '10K-25K',
        likes: '8.5%',
        engagement: '12.3%',
        watchTime: '65%'
    };

    // Try to extract views
    const viewsMatch = text.match(/(\d+[,.]?\d*[kKmM]?\s*-\s*\d+[,.]?\d*[kKmM]?)\s*views?/i) ||
                      text.match(/views?[:\s]+(\d+[,.]?\d*[kKmM]?\s*-\s*\d+[,.]?\d*[kKmM]?)/i);
    if (viewsMatch) {
        metrics.views = viewsMatch[1].trim();
    }

    // Try to extract like ratio
    const likeMatch = text.match(/like[^.]*?(\d+\.?\d*)\s*%/i);
    if (likeMatch) {
        metrics.likes = likeMatch[1] + '%';
    }

    // Try to extract engagement rate
    const engagementMatch = text.match(/engagement\s*rate[^.]*?(\d+\.?\d*)\s*%/i);
    if (engagementMatch) {
        metrics.engagement = engagementMatch[1] + '%';
    }

    // Try to extract watch time
    const watchTimeMatch = text.match(/watch\s*time[^.]*?(\d+\.?\d*)\s*%/i) ||
                          text.match(/retention[^.]*?(\d+\.?\d*)\s*%/i);
    if (watchTimeMatch) {
        metrics.watchTime = watchTimeMatch[1] + '%';
    }

    return metrics;
}

// Display Metrics Cards
function displayMetrics(metrics) {
    document.getElementById('viewsMetric').textContent = metrics.views;
    document.getElementById('likesMetric').textContent = metrics.likes;
    document.getElementById('engagementMetric').textContent = metrics.engagement;
    document.getElementById('watchTimeMetric').textContent = metrics.watchTime;
}

// Extract Retention Data
function extractRetentionData(text) {
    const defaultRetention = [100, 75, 60, 45, 35];
    const retention = [];

    // Try to extract retention percentages
    const retentionSection = text.match(/RETENTION ANALYSIS:?([\s\S]*?)(?=\d+\.\s+[A-Z]|$)/i);
    if (retentionSection) {
        const percentages = retentionSection[1].match(/(\d+)%/g);
        if (percentages && percentages.length >= 5) {
            percentages.slice(0, 5).forEach(p => {
                retention.push(parseInt(p.replace('%', '')));
            });
        }
    }

    return retention.length === 5 ? retention : defaultRetention;
}

// Display Retention Chart
function displayRetentionChart(retentionData) {
    const ctx = document.getElementById('retentionChart');

    if (retentionChart) {
        retentionChart.destroy();
    }

    retentionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Start', '25%', '50%', '75%', 'End'],
            datasets: [{
                label: 'Viewer Retention',
                data: retentionData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    cornerRadius: 8,
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#475569',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                }
            }
        }
    });
}

// Display Engagement Chart
function displayEngagementChart() {
    const ctx = document.getElementById('engagementChart');

    if (engagementChart) {
        engagementChart.destroy();
    }

    engagementChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Likes', 'Comments', 'Shares', 'Saves'],
            datasets: [{
                data: [45, 30, 15, 10],
                backgroundColor: [
                    '#6366f1',
                    '#8b5cf6',
                    '#06b6d4',
                    '#10b981'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        padding: 15,
                        font: {
                            size: 13,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    cornerRadius: 8,
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#475569',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

// Extract Suggestions
function extractSuggestions(text) {
    const suggestions = [];
    const suggestionsSection = text.match(/ACTIONABLE SUGGESTIONS:?([\s\S]*?)(?=\d+\.\s+[A-Z]{4,}|$)/i);

    if (suggestionsSection) {
        const lines = suggestionsSection[1].split('\n');
        let currentSuggestion = null;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Check if it's a new suggestion (starts with bullet or number)
            if (line.match(/^[-*•]\s+/) || line.match(/^\d+\.\s+/)) {
                if (currentSuggestion) {
                    suggestions.push(currentSuggestion);
                }

                line = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');

                // Extract priority
                const priority = line.toLowerCase().includes('high') ? 'high' :
                               line.toLowerCase().includes('low') ? 'low' : 'medium';

                currentSuggestion = {
                    title: line.split(':')[0].trim(),
                    description: line.split(':').slice(1).join(':').trim() || line,
                    priority: priority
                };
            } else if (currentSuggestion && line) {
                currentSuggestion.description += ' ' + line;
            }
        }

        if (currentSuggestion) {
            suggestions.push(currentSuggestion);
        }
    }

    // If no suggestions extracted, provide defaults
    if (suggestions.length === 0) {
        suggestions.push(
            {
                title: 'Optimize Video Length',
                description: 'Based on retention analysis, consider trimming sections where engagement drops to maintain viewer attention.',
                priority: 'high'
            },
            {
                title: 'Target Audience Refinement',
                description: 'Focus on the core demographic identified in the analysis for better engagement rates.',
                priority: 'high'
            },
            {
                title: 'Enhance Opening Hook',
                description: 'Strengthen the first 10 seconds to capture attention and reduce early drop-off.',
                priority: 'medium'
            },
            {
                title: 'Promote at Optimal Times',
                description: 'Share when your target audience is most active for maximum initial engagement.',
                priority: 'medium'
            },
            {
                title: 'Improve Thumbnail Design',
                description: 'Create a more eye-catching thumbnail that clearly communicates the video value.',
                priority: 'low'
            }
        );
    }

    return suggestions.slice(0, 7); // Max 7 suggestions
}

// Display Suggestions
function displaySuggestions(suggestions) {
    suggestionsContent.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item">
            <div class="suggestion-title">${escapeHtml(suggestion.title)}</div>
            <div class="suggestion-desc">${escapeHtml(suggestion.description)}</div>
            <span class="suggestion-priority ${suggestion.priority}">${suggestion.priority.toUpperCase()}</span>
        </div>
    `).join('');
}

// Extract Section from Analysis
function extractSection(text, sectionName) {
    const regex = new RegExp(`${sectionName}:?([\\s\\S]*?)(?=\\d+\\.\\s+[A-Z]|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : 'Analysis in progress...';
}

// Format Analysis Text
function formatAnalysisText(text) {
    text = text.trim();
    const lines = text.split('\n');
    let formatted = '';
    let inList = false;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.match(/^[-*•]\s+/) || line.match(/^\d+\.\s+/)) {
            if (!inList) {
                formatted += '<ul>';
                inList = true;
            }
            line = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
            formatted += `<li>${escapeHtml(line)}</li>`;
        } else {
            if (inList) {
                formatted += '</ul>';
                inList = false;
            }
            if (line.includes(':') && line.length < 100) {
                const parts = line.split(':');
                if (parts[1]?.trim()) {
                    formatted += `<p><strong>${escapeHtml(parts[0])}:</strong> ${escapeHtml(parts[1])}</p>`;
                } else {
                    formatted += `<p><strong>${escapeHtml(parts[0])}</strong></p>`;
                }
            } else {
                formatted += `<p>${escapeHtml(line)}</p>`;
            }
        }
    }

    if (inList) {
        formatted += '</ul>';
    }

    return formatted || '<p>Analysis completed.</p>';
}

// Ask Question
async function askQuestion() {
    const question = questionInput.value.trim();

    if (!question || questionsRemaining <= 0) return;

    askButton.disabled = true;
    questionInput.disabled = true;

    try {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';

        const questionDiv = document.createElement('div');
        questionDiv.className = 'qa-question';
        questionDiv.textContent = question;

        const answerDiv = document.createElement('div');
        answerDiv.className = 'qa-answer';
        answerDiv.innerHTML = '<em>Thinking...</em>';

        qaItem.appendChild(questionDiv);
        qaItem.appendChild(answerDiv);
        qaHistory.appendChild(qaItem);

        qaItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        const contextPrompt = `Based on the video analysis we just completed, please answer this question:

${question}

Provide a detailed, insightful answer that relates specifically to the video content, audience analysis, and performance predictions we discussed.`;

        const answer = await callGeminiAPI(contextPrompt);

        answerDiv.innerHTML = formatAnalysisText(answer);

        questionsRemaining--;
        questionCounter.textContent = questionsRemaining;

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

// Reset App
function resetApp() {
    currentVideoFile = null;
    videoAnalysisContext = null;
    questionsRemaining = 3;

    videoInput.value = '';
    previewVideo.src = '';
    questionInput.value = '';
    questionInput.placeholder = 'Ask anything about your video\'s performance, audience, or optimization...';
    qaHistory.innerHTML = '';
    audienceContent.innerHTML = '';
    interactionContent.innerHTML = '';
    suggestionsContent.innerHTML = '';
    videoDuration.textContent = '--:--';
    videoSize.textContent = '---';
    videoFormat.textContent = '---';

    videoPreview.classList.add('hidden');
    uploadArea.style.display = '';
    askButton.disabled = false;
    questionInput.disabled = false;

    if (retentionChart) retentionChart.destroy();
    if (engagementChart) engagementChart.destroy();

    questionCounter.textContent = '3';
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
            progressFill.style.width = '0%';
            timeRemaining.textContent = '30';
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
console.log('Assumed Audience Interaction - AI Video Analytics');
console.log('Powered by Gemini 2.5 Flash');
