// In-bundle presets to avoid a startup fetch for `/presets.json`.
// Keep in sync with `public/presets.json`.
export const PRESETS = [
  {
    id: 'best-food-ever',
    name: 'Best Food Ever',
    description: 'Personal Food Leaderboard. Click me!',
    translations: {
      en: {
        name: 'Best Food Ever',
        description: 'Personal Food Leaderboard. Click me!',
      },
      ru: {
        name: 'Лучшая Еда Навсегда',
        description: 'Персональный рейтинг еды. Нажмите меня!',
      },
      ua: {
        name: 'Найкраща Їжа Назавжди',
        description: 'Персональний рейтинг їжі. Натисніть мене!',
      },
    },
    settings: {
      priorities: {
        taste: 10,
        health: 10,
        cheapness: 10,
        speed: 10,
        satiety: 0,
        lowCalorie: 0,
        ethics: 0,
      },
      priceUnit: 'per1000kcal',
      isOptimized: true,
      tasteScoreMethod: 'taste_score',
      selectedZone: null,
    },
  },
  {
    id: 'worst-food-ever',
    name: 'Worst Food Ever',
    description: 'Evil Food Leaderboard with worst possible traits',
    translations: {
      en: {
        name: 'Worst Food Ever',
        description: 'Evil Food Leaderboard with worst possible traits',
      },
      ru: {
        name: 'Худшая Еда Навсегда',
        description: 'Злой рейтинг еды с худшими возможными характеристиками',
      },
      ua: {
        name: 'Найгірша Їжа Назавжди',
        description: 'Злий рейтинг їжі з найгіршими можливими характеристиками',
      },
    },
    settings: {
      priorities: {
        taste: -10,
        health: -10,
        cheapness: -10,
        speed: -10,
        satiety: 0,
        lowCalorie: 0,
        ethics: 0,
      },
      priceUnit: 'per1000kcal',
      isOptimized: true,
      tasteScoreMethod: 'taste_score',
      selectedZone: null,
    },
  },
];


