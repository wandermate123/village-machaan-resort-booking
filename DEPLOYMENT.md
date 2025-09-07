# 🚀 Vercel Deployment Guide

## Prerequisites
- GitHub repository with your code
- Vercel account (free)
- Supabase project

## Step 1: Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## Step 2: Deploy to Vercel

### Option A: Deploy from GitHub (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click **"New Project"**
   - Import your GitHub repository
   - Select the repository

3. **Configure Environment Variables**:
   - In Vercel dashboard, go to your project
   - Click **Settings** → **Environment Variables**
   - Add these variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...` (your anon key) | Production, Preview, Development |

4. **Deploy**:
   - Click **"Deploy"**
   - Wait for deployment to complete

### Option B: Deploy with Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## Step 3: Configure Supabase for Production

1. **Update Supabase Settings**:
   - Go to **Settings** → **API**
   - Add your Vercel domain to **Site URL**:
     ```
     https://your-project.vercel.app
     ```
   - Add to **Additional Redirect URLs**:
     ```
     https://your-project.vercel.app/**
     ```

2. **Configure CORS** (if needed):
   - Go to **Settings** → **API**
   - Add your Vercel domain to allowed origins

## Step 4: Test Your Deployment

1. **Visit your Vercel URL**
2. **Test the booking flow**
3. **Test admin login** (if you have admin credentials)
4. **Check browser console** for any errors

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ Yes |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Service role key (for admin ops) | ❌ Optional |
| `VITE_EMAIL_SERVICE_URL` | Email service URL | ❌ Optional |
| `VITE_EMAIL_API_KEY` | Email service API key | ❌ Optional |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key ID | ❌ Optional |
| `VITE_RAZORPAY_KEY_SECRET` | Razorpay key secret | ❌ Optional |

## Troubleshooting

### Common Issues:

1. **"Database Not Connected" Error**:
   - Check if environment variables are set correctly
   - Verify Supabase URL and key are correct

2. **CORS Errors**:
   - Add your Vercel domain to Supabase allowed origins
   - Check Supabase project settings

3. **Build Errors**:
   - Check if all dependencies are in package.json
   - Verify TypeScript compilation

4. **Admin Dashboard Not Working**:
   - Ensure RLS policies are configured
   - Check if admin users exist in database

### Debug Steps:

1. **Check Environment Variables**:
   ```javascript
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
   ```

2. **Check Supabase Connection**:
   ```javascript
   console.log('Supabase configured:', isSupabaseConfigured);
   ```

3. **Check Network Tab** in browser dev tools for API calls

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase project configured with Vercel domain
- [ ] CORS settings updated
- [ ] Admin users created in database
- [ ] RLS policies configured
- [ ] Test booking flow works
- [ ] Test admin dashboard works
- [ ] Check mobile responsiveness
- [ ] Test payment integration (if enabled)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Supabase connection
4. Check environment variables are set correctly
