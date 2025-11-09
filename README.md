# 🎬 Assumed Audience Interaction

An AI-powered web application that analyzes videos to understand potential audience engagement and interaction patterns using Google Gemini 2.5 Flash.

## Features

- **Video Upload**: Drag-and-drop or click to upload any video file
- **AI-Powered Analysis**: Uses Gemini 2.5 Flash to analyze:
  - Audience demographics and preferences
  - Expected interaction and engagement patterns
  - Community building potential
  - Viral moments and emotional triggers
- **Interactive Q&A**: Ask up to 3 questions per video about audience insights
- **Modern UI**: Beautiful, responsive interface with smooth animations
- **Real-time Processing**: Get instant feedback and analysis

## How It Works

1. **Upload Your Video**: Choose a video file from your device
2. **AI Analysis**: Gemini 2.5 Flash analyzes the content and provides:
   - Detailed audience understanding
   - Interaction potential insights
3. **Ask Questions**: Get answers to 3 specific questions about your video's audience engagement
4. **Iterate**: Analyze another video to continue learning

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI Engine**: Google Gemini 2.5 Flash API
- **Hosting**: GitHub Pages
- **Design**: Modern, gradient-based UI with dark theme

## Setup for GitHub Pages

This website is designed to work with GitHub Pages:

1. Push the repository to GitHub
2. Go to repository Settings → Pages
3. Select the branch to deploy (e.g., `main` or `claude/build-website-gemini-011CUxAgx7CHHaccpug62w2x`)
4. Your site will be available at: `https://<username>.github.io/<repository-name>/`

## API Configuration

The application uses the Gemini API with the following configuration:
- **Model**: gemini-2.0-flash-exp
- **API Key**: Configured in `app.js`
- **Endpoint**: Google Generative Language API

> **Note**: The API key is embedded in the client-side code for demo purposes. For production use, consider implementing a backend proxy to secure the API key.

## File Structure

```
Average-Audience-Interaction/
├── index.html          # Main HTML structure
├── styles.css          # Styling and animations
├── app.js             # Application logic and Gemini integration
└── README.md          # This file
```

## Features Breakdown

### Audience Understanding
- Demographics analysis
- Interest identification
- Content preference patterns
- Audience size estimation

### Interaction Potential
- Expected engagement types
- Discussion topic predictions
- Community building opportunities
- Viral moment identification
- Emotional response analysis

### Interactive Q&A
- 3 questions per video
- Context-aware responses
- Real-time AI answers
- Beautiful chat interface

## Browser Compatibility

Works best on modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - Feel free to use and modify as needed.

## Credits

Powered by Google Gemini 2.5 Flash
