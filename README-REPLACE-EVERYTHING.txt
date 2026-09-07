AMERICAN SAVAGES - FULL WEBSITE REPLACEMENT

Replace the current GitHub repository contents with EVERYTHING in this folder.

Important:
- Delete the stray root-level espn.js if it exists.
- The only ESPN server file should be: api/espn.js
- Keep: assets/league-logo.png
- Upload all HTML, CSS, JS, package.json and vercel.json at the repo root.
- Commit to main. Vercel should redeploy automatically.

Included fixes:
- Historical ESPN endpoint for 2019-2025.
- Current ESPN endpoint for 2026.
- Fallback historical request method.
- Normalized leagueHistory responses.
- Record Book checks every year 2019-2026 and displays which years loaded.
- Better champion detection.
- All-time rivalries across available seasons.
- Draft season selector.
- Playoff season selector.
- Transparent league logo with Chicago star at the bottom.
