# Art Taste Quiz App - Deployment Guide

## Overview
This is a standalone web application that helps users discover their aesthetic preferences through an interactive art selection quiz. It's built as a React component and can be deployed to Vercel, Netlify, or any static host.

## Project Structure

```
art-quiz-app/
├── public/
│   └── quiz_dataset.json          # Artwork metadata + image references
│   └── images/
│       ├── art_00000.jpg
│       ├── art_00001.jpg
│       └── ... (1,930 images)
├── src/
│   ├── components/
│   │   └── ArtTasteQuiz.jsx       # Main quiz component
│   ├── App.jsx
│   └── index.css
├── package.json
├── vite.config.js                 # Or next.config.js if using Next.js
└── README.md
```

## Dataset

The quiz uses `public/quiz_dataset.json` which contains:
- **1,930 artworks** with metadata (title, artist, year, date)
- **Image references** pointing to `/images/art_00000.jpg` through `/images/art_01929.jpg`
- **Movement data** for pattern analysis

### File Format
```json
{
  "metadata": {
    "total_artworks": 1930,
    "image_directory": "images/"
  },
  "artworks": [
    {
      "id": "art_00000",
      "source": "All_Art",
      "image": "images/art_00000.jpg",
      "date": "2026-06-28",
      "title": "Cadmus Slaying the Dragon",
      "artist": "Reinhold Timm",
      "year": "1619 - 1629"
    },
    ...
  ]
}
```

## Setup Instructions

### Option 1: Vercel (Recommended)

**Prerequisites:**
- Node.js 16+ installed
- Vercel CLI: `npm i -g vercel`

**Steps:**

1. Create a new Next.js project:
```bash
npx create-next-app@latest art-quiz-app --typescript
cd art-quiz-app
```

2. Copy files:
   - Place `ArtTasteQuiz.jsx` in `src/components/`
   - Place `quiz_dataset.json` in `public/`
   - Copy the `images/` folder to `public/images/`

3. Update `src/app/page.js`:
```jsx
import ArtTasteQuiz from '@/components/ArtTasteQuiz';
export default function Home() {
  return <ArtTasteQuiz />;
}
```

4. Deploy:
```bash
vercel
```

**Note on Large Deployments:**
- Vercel has a 50MB limit per function
- The 1,930 images (~80-100MB total) may exceed this
- Solution: Use Vercel Blob storage or Cloudinary CDN for images

### Option 2: Netlify

1. Create a `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Set up with React + Vite:
```bash
npm create vite@latest art-quiz-app -- --template react
cd art-quiz-app
npm install
```

3. Copy files:
   - Place `ArtTasteQuiz.jsx` in `src/components/`
   - Place `quiz_dataset.json` in `public/`
   - Copy `images/` to `public/images/`

4. Deploy:
```bash
npm run build
netlify deploy --prod --dir dist
```

### Option 3: GitHub Pages (Free)

1. Create GitHub repo: `username.github.io`

2. Set up Vite + React:
```bash
npm create vite@latest . -- --template react
```

3. Update `vite.config.js`:
```js
export default {
  base: '/',
  // ... rest of config
}
```

4. Deploy:
```bash
npm run build
git add dist
git commit -m "Deploy"
git push origin main
```

## Image Management Strategies

### Strategy A: Local Images (Small Datasets)
- Copy all images to `public/images/`
- Reference as `/images/art_00000.jpg` in JSON
- **Pros:** Simple, no external dependencies
- **Cons:** Large deployment size (~100MB+)

### Strategy B: CDN (Recommended for Scale)
Use Cloudinary, AWS S3, or similar:

1. Upload images to CDN
2. Update `quiz_dataset.json` to reference CDN URLs:
```json
{
  "image": "https://cdn.example.com/art/art_00000.jpg"
}
```
3. **Pros:** Fast delivery, smaller deployment
4. **Cons:** Requires CDN setup

### Strategy C: Lazy Loading + Progressive Images
- Use `next/image` (Next.js) for automatic optimization
- Implement lazy loading for initial page load
- Show placeholder while loading

## Dataset Optimization

For best performance:

1. **Compress images:**
```bash
# Reduce JPEG quality
for f in images/*.jpg; do 
  convert "$f" -quality 75 -strip "${f%.jpg}_opt.jpg"
done
```

2. **Create responsive variants:**
```bash
# Create thumbnails
for f in images/*.jpg; do
  convert "$f" -resize 300x300 "thumbs/${f##*/}"
done
```

3. **Minify JSON:**
```bash
# Use jq or similar
jq -c . quiz_dataset.json > quiz_dataset.min.json
```

## Performance Considerations

- **Initial Load:** ~200-300ms (with optimized images)
- **Quiz Transitions:** <100ms (pre-load next image)
- **Results Generation:** <200ms (pattern analysis runs client-side)

### Optimizations:
- Preload top 3 artworks on app start
- Lazy-load recommendation images
- Cache analysis results
- Use service worker for offline support

## Customization

### Change Quiz Size
In `ArtTasteQuiz.jsx`, line ~20:
```js
const QUIZ_SIZE = 15;  // Change to 12, 20, etc.
```

### Adjust Recommendation Algorithm
The `generateRecommendations()` function (line ~150) can be tuned:
```js
// Weights for scoring
const artistWeight = 50;    // Higher = more emphasis on artist match
const centuryWeight = 30;   // Era preference
const keywordWeight = 10;   // Title keyword similarity
```

### Customize Theme Colors
Update the `styles` object at the bottom of `ArtTasteQuiz.jsx`:
```js
// Primary color
backgroundColor: '#1a1a1a',  // Change to your brand color
// Accent color
color: '#fff',
```

## Deployment Checklist

- [ ] Dataset loaded successfully (`quiz_dataset.json`)
- [ ] All 1,930 images present in `/public/images/`
- [ ] Quiz renders without errors
- [ ] Like/Skip buttons functional
- [ ] Results page displays analysis
- [ ] Recommendations appear in grid
- [ ] Mobile responsive (test on iPhone/Android)
- [ ] Images load quickly (<3s)
- [ ] SEO metadata added (title, description, og:image)

## Troubleshooting

### Images not loading:
- Check image paths in `quiz_dataset.json`
- Verify images are in `public/images/` folder
- Check browser console for 404 errors
- Ensure filenames match exactly (case-sensitive)

### Large deployment size:
- Use CDN strategy (Strategy B above)
- Compress images with ImageMagick or similar
- Host images on separate service (S3, Cloudinary, etc.)

### Quiz freezing on large datasets:
- Reduce `QUIZ_SIZE` if needed
- Implement pagination for results
- Use Web Workers for analysis computation

## Next Steps

1. **Gather feedback:**
   - Deploy MVP with ~300 images first
   - Test with real users
   - Iterate on UX

2. **Add features:**
   - Save results to user account
   - Share results on social media
   - Compare with other users' profiles
   - API integration with museum collections

3. **Publishing:**
   - Write Medium article about findings
   - Link quiz app from blog post
   - Promote on social media

## Support

For issues or questions:
- Check browser console (F12) for errors
- Verify dataset format matches schema above
- Test with smaller dataset first (50-100 images)
- Profile performance with DevTools (Lighthouse)

---

**Built with:** React, modern JavaScript, no external UI libraries
**Dataset:** 1,930 artworks from Random Daily Art (2020-2026)
**License:** Your chosen license
