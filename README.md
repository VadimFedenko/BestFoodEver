# BestFoodEver

**Your personal food leaderboard!**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blueviolet)]()
[![Offline First](https://img.shields.io/badge/Offline-First-green)]()

 The Story
Ever tried to eat healthy, only to watch your grocery bill skyrocket? Or wanted to cook something delicious, but had no time?

Here's an idea: take as many dishes as you can, rate each one on a 10-point scale across Taste, Health, Time, and Cost. Average the scores, and the top result is your optimal meal.

This concept came to me in 2020. I feel like this changed my life radically. But I always approximated the scores in my head. This idea begged for automation.

**BestFoodEver** is the result of analyzing massive datasets—from scraping culinary sites to economic databases and scientific nutritional reviews—to build the world's first personalized food ranking system.


## Usage

1. **Set Your Priorities:** Drag sliders (0-10) for Price, Health, Taste, etc. Tap a category to **invert** it (e.g., prioritize *Expensive* meals).
2. **Select Region:** Choose your economic zone for accurate pricing (e.g., *Mediterranean* for cheap produce, *Northern Import* for expensive goods).
3. **Browse the Top:** The list updates instantly to show *your* best food matches.
4. **Save preset** for fast access.
5. **Edit/Override:** Click any dish -> "Score Breakdown" -> "Edit" to save your own ratings locally.

## Data & Methodology
The app runs on a pre-compiled analysis of thousands of data points. Here is how the scores are calculated:

◾️Cost:
Calculated dynamically using real-world prices across 11 Economic Zones (from Western EU to Agrarian LatAm). The algorithm accounts for the Yield Ratio (edible part vs. waste like bones/peels).

◾️Health:
Based on the hierarchy of scientific evidence: Cochrane Reviews > Meta-analyses > RCTs.
Scale: From 0 (Harmful/Processed) to 10 (Longevity/Superfoods). Adds penalties depending on cooking methods (e.g., deep frying).

◾️Time:
The app calculates speed using two distinct metrics:
Standard Mode: Based on aggregated averages from culinary databases.

Optimized Mode: Derived from restaurant & café workflows. This metric accounts for parallel processing ("mise en place") and the mathematics of batch cooking, capturing how the time-per-serving drops when preparing multiple portions at once.

◾️Taste:
Derived from Sentiment Analysis of user reviews (Yelp, Amazon Food) and AI polarization scoring. It quantifies the general public consensus on a dish's flavor.

◾️Ethics:
A composite index (0-10) factoring in Animal Welfare, Labor Conditions, and Carbon Footprint.
0 = Factory farming & heavy pollution.
10 = Sustainable, plant-based, cruelty-free.

All data is customizable. You can override any score (e.g. give 0/10 taste to the Oatmeal), and the algorithm will recalculate your personal top.

## Technical Details

The project is built as a static web application/PWA. It relies on two core JSON databases:

**`dishes.json`**
```json
{
  "dish": "Scrambled Eggs",
  "ingredients": [
    {"name": "Eggs", "g": 100, "state": "fried"},
    {"name": "Butter", "g": 10, "state": "melted"}
  ],
  "prep_t": 1,
  "cook_t": 5,
  "taste_score": 8.8,
  ...
}
```

**`ingredients.json`**
```json
{
  "ingredient": "00 Flour",
  "prices": {
    "east_euro_agrarian": 1.5,
    "developed_asia": 4.5
  },
  "health_index": 5.5,
  "ethics_index": 7
}
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bestfoodever
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Preview production build:
```bash
npm run preview
```

The app will be available at `http://localhost:5173` (or the port shown in terminal).

**For PWA usage:** Build the project and serve the `dist` folder. You can "Add to Home Screen" from your browser to install as a PWA.

Stack
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **i18next** - Internationalization (EN, RU, UA)
- **PWA** - Progressive Web App support (offline-first)
- **Workbox** - Service Worker for caching

## License

This project is open-source and free to use. [MIT License](LICENSE).

***
*Created with ❤️ to inspire you to cook better, faster, and cheaper.*