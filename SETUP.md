# Quick Setup Guide

## Get Started in 5 Minutes

### Step 1: Get Your Free API Key
1. **Visit Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
2. **Sign in** with your Google account
3. **Create API key** (it's completely free!)
4. **Copy the key** (starts with `AIza...`)

### Step 2: Add Your API Key

#### Option A: Secure .env File (Recommended)
```bash
# In your project directory
cp env.example .env

# Edit .env file and add your key
REACT_APP_GEMINI_API_KEY=AIza...your_actual_key_here
```

### Step 3: Start Experimenting!
1. **Open the app** at `http://localhost:3000`
2. **Try the demo** - it will guide you through the process of creating and iterating on a prompt
3. **Run experiments** with different parameters
4. **Rate responses** to improve future recommendations
5. **Document insights** in the lab notebook

## Security Options

### .env File (Most Secure)
- **Best for**: Production, shared computers, security-conscious users
- **Setup**: Create `.env` file with your keys
- **Security**: Keys never stored in browser
- **Pros**: Industry standard, more secure
- **Cons**: Requires file setup

## What You Can Do

### Experiment with Prompts
- **Visual Prompt Builder**: Drag and drop prompt parts
- **Parameter Tuning**: Adjust temperature, tokens, models

### Track Your Progress
- **Experiment History**: All runs are automatically saved
- **Rating System**: Rate responses 1-5 stars
- **Tagging**: Categorize responses with tags
- **Lab Notebook**: Document insights and best practices

### Learn and Improve
- **Smart Recommendations**: Get suggestions based on your feedback
- **Best Practices**: Built-in prompt engineering guide
- **Export/Import**: Backup and share your experiments
- **Free API**: Use Gemini's free tier for unlimited experiments

## Need Help?

### Common Issues
1. **"No API key" error**: Add your Gemini API key in Settings
2. **"Failed to compile"**: Make sure you're using Node.js v14+
3. **"Port 3000 in use"**: Choose 'Y' to use a different port

### Getting Your API Key
- **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
- **Free tier**: 15 requests per minute, 1500 requests per day
- **No credit card required**: Completely free to start

### Support
- **Documentation**: Check the main README.md
- **Issues**: Create an issue on GitHub
- **Questions**: The app includes built-in help and examples

## You're Ready!

Start experimenting with AI prompts, track your progress, and build your prompt engineering skills. The app learns from your feedback to provide better suggestions over time.

Happy prompting! 