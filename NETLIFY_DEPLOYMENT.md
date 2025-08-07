# Netlify Deployment Guide

## Quick Deployment Steps

### Option 1: Deploy via Netlify UI (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com) and sign up/login
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your `prompt-lab` repository
   - Netlify will automatically detect it's a React app
   - Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Configuration

The `netlify.toml` file is already configured with:
- Build command: `npm run build`
- Publish directory: `build`
- Node.js version: 18
- SPA redirects for React Router

## Environment Variables

If your app uses environment variables, add them in the Netlify dashboard:
1. Go to Site settings > Environment variables
2. Add any required variables (e.g., API keys)

## Custom Domain (Optional)

After deployment:
1. Go to Site settings > Domain management
2. Add your custom domain
3. Follow the DNS configuration instructions

## Build Settings

- **Build command**: `npm run build`
- **Publish directory**: `build`
- **Node.js version**: 18

The deployment should work automatically with these settings! 