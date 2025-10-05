# Vercel Deployment Guide

## 🚨 Critical Security Issue Fixed

Your OpenAI API key was exposed in the repository. This has been fixed by:
- Replacing the actual API key with a placeholder
- Ensuring .env files are properly ignored in .gitignore

## 🔧 Vercel Environment Variables Setup

To deploy your RFP Generator to Vercel, you need to configure environment variables in the Vercel dashboard:

### Required Environment Variables

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add the following variables:**

#### OpenAI Configuration
```
VITE_OPENAI_API_KEY = sk-proj-your-actual-api-key-here
VITE_OPENAI_MODEL = gpt-4-turbo-preview
VITE_OPENAI_MAX_TOKENS = 4000
VITE_OPENAI_TEMPERATURE = 7
VITE_OPENAI_ORGANIZATION = (leave empty unless you have one)
```

#### Feature Flags
```
VITE_ENABLE_AI_GENERATION = true
VITE_ENABLE_REAL_TIME_COLLABORATION = false
VITE_ENABLE_ANALYTICS = true
```

#### API Configuration
```
VITE_API_BASE_URL = https://insight-response-gen.vercel.app/api
VITE_API_TIMEOUT = 30000
VITE_API_RATE_LIMIT_REQUESTS = 100
VITE_API_RATE_LIMIT_WINDOW = 60000
```

#### Supabase Configuration (Optional)
```
VITE_SUPABASE_URL = (your-supabase-url-if-using)
VITE_SUPABASE_ANON_KEY = (your-supabase-anon-key-if-using)
VITE_SUPABASE_SERVICE_ROLE_KEY = (your-supabase-service-key-if-using)
```

## 🚀 Deployment Steps

1. **Push changes to GitHub:**
   ```bash
   git push origin main
   ```

2. **Configure Environment Variables in Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project: `insight-response-gen`
   - Go to Settings → Environment Variables
   - Add all the variables listed above

3. **Redeploy:**
   - Vercel will automatically redeploy when you push to main
   - Or manually trigger a redeploy from the Vercel dashboard

## 🔒 Security Best Practices

- ✅ Never commit API keys to the repository
- ✅ Use Vercel's environment variables for sensitive data
- ✅ Keep .env files in .gitignore
- ✅ Use different API keys for development and production

## 🐛 Common Issues & Solutions

### Issue: "OpenAI API key is required" error
**Solution:** Make sure `VITE_OPENAI_API_KEY` is set in Vercel environment variables

### Issue: API calls failing
**Solution:** Check that all environment variables are properly configured

### Issue: Build failures
**Solution:** Ensure all required environment variables are set before building

## 📝 Testing Your Deployment

1. Visit your deployed app: https://insight-response-gen.vercel.app
2. Try the RFP Analyzer feature
3. Check browser console for any errors
4. Verify AI features are working with your API key

## 🔄 Updating Environment Variables

To update environment variables:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update the values
3. Redeploy the project

## 📞 Support

If you encounter issues:
1. Check the Vercel deployment logs
2. Verify all environment variables are set correctly
3. Ensure your OpenAI API key is valid and has sufficient credits
