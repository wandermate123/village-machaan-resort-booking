# Villa Image Naming Guide

## 📁 Required File Structure

Please organize your villa images exactly as shown below:

```
public/images/
├── glass-cottage/
│   ├── main.jpg          ← Primary exterior view (REQUIRED)
│   ├── interior.jpg      ← Interior/living space (optional)
│   └── deck.jpg          ← Private deck view (optional)
├── hornbill/
│   ├── main.jpg          ← Primary exterior view (REQUIRED)
│   ├── exterior.jpg      ← Additional exterior view (optional)
│   ├── interior.jpg      ← Interior/living space (optional)
│   └── garden.jpg        ← Garden/outdoor area (optional)
└── kingfisher/
    ├── main.jpg          ← Primary exterior view (REQUIRED)
    ├── pool.jpg          ← Private pool area (optional)
    ├── suite.jpg         ← Premium suite interior (optional)
    └── lake-view.jpg     ← Lake view (optional)
```

## 🔧 Step-by-Step Renaming Instructions

### For Glass Cottage:
1. Rename your current image to: `main.jpg`
2. Place in: `public/images/glass-cottage/`

### For Hornbill Villa:
1. Choose your best exterior image → rename to: `main.jpg`
2. Rename other images to: `exterior.jpg`, `interior.jpg`, `garden.jpg`
3. Place all in: `public/images/hornbill/`

### For Kingfisher Villa:
1. Choose your best exterior image → rename to: `main.jpg`
2. Place in: `public/images/kingfisher/`

## ✅ File Requirements

- **Format**: .jpg (preferred) or .png
- **Size**: Recommended 1200x800px or similar aspect ratio
- **File size**: Under 500KB for faster loading
- **Names**: Exactly as shown above (case-sensitive)

## 🔍 Debug Information

The application now includes image debugging that will:
- Show loading status for each image
- Display error messages if images fail to load
- Log successful image loads to browser console
- Show the exact file path being requested

## 🚨 Common Issues

1. **Wrong file extension**: Make sure files are .jpg, not .jpeg or .png
2. **Case sensitivity**: Use lowercase names exactly as shown
3. **File location**: Files must be in the exact folder structure shown
4. **File permissions**: Make sure files are readable

## 🧪 Testing Your Images

After renaming:
1. Open browser developer tools (F12)
2. Go to Console tab
3. Refresh the page
4. Look for messages like "✅ Image loaded successfully" or "❌ Failed to load image"
5. Check Network tab to see if image requests are returning 404 errors

## 📞 If Images Still Don't Show

If you're still having issues, please check:
1. Browser console for error messages
2. Network tab in developer tools for 404 errors
3. Verify file names match exactly (including case)
4. Try accessing images directly: `http://localhost:5173/images/glass-cottage/main.jpg`