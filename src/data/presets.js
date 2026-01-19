// In-bundle presets to avoid a startup fetch.
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
        name: 'Лучшая Еда',
        description: 'Персональный рейтинг еды. Нажмите меня!',
      },
      ua: {
        name: 'Найкраща Їжа',
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
    id: 'best-food-ever-ethics',
    name: 'Best Food Ever (w/ Ethics)',
    description: 'Personal Food Leaderboard. Click me!',
    translations: {
      en: {
        name: 'Best Food Ever (w/ Ethics)',
        description: 'Personal Food Leaderboard. Click me!',
      },
      ru: {
        name: 'Лучшая Еда (с Этикой)',
        description: 'Персональный рейтинг еды. Нажмите меня!',
      },
      ua: {
        name: 'Найкраща Їжа (з Етикою)',
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
        ethics: 10,
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
        name: 'Худшая Еда',
        description: 'Злой рейтинг еды с худшими возможными характеристиками',
      },
      ua: {
        name: 'Найгірша Їжа',
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
  {
    id: 'worst-food-ever-ethics',
    name: 'Worst Food Ever (w/ Ethics)',
    description: 'Evil Food Leaderboard with worst possible traits',
    translations: {
      en: {
        name: 'Worst Food Ever (w/ Ethics)',
        description: 'Evil Food Leaderboard with worst possible traits',
      },
      ru: {
        name: 'Худшая Еда (с Этикой)',
        description: 'Злой рейтинг еды с худшими возможными характеристиками',
      },
      ua: {
        name: 'Найгірша Їжа (з Етикою)',
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
        ethics: 10,
      },
      priceUnit: 'per1000kcal',
      isOptimized: true,
      tasteScoreMethod: 'taste_score',
      selectedZone: null,
    },
  },
  {
    id: 'i-want-to-die-diet',
    name: "'I Want to Die' Diet",
    description: 'Diet with worst possible health traits',
    translations: {
      en: {
        name: "'I Want to Die' Diet",
        description: 'Diet with worst possible health traits',
      },
      ru: {
        name: 'Диета "Хочу Умереть"',
        description: 'Диета с худшими возможными характеристиками здоровья',
      },
      ua: {
        name: 'Дієта "Хочу Померти"',
        description: 'Дієта з найгіршими можливими характеристиками здоров\'я',
      },
    },
    settings: {
      priorities: {
        taste: 0,
        health: -10,
        cheapness: 0,
        speed: 0,
        satiety: 0,
        lowCalorie: 0,
        ethics: 0,
      },
    },
  },
  {
    id: 'student-top',
    name: 'Student Food Top',
    description: 'Cheapness, speed, taste, and high calories with a slight compromise of fragile health',
    translations: {
      en: {
        name: 'Student Top',
        description: 'Cheapness, speed, taste, and high calories with a slight compromise of fragile health',
      },
      ru: {
        name: 'Студенческий Топ',
        description: 'Дешевизна, скорость, вкус и нажористость с лёгкой компрометацией неокрепшего здоровья',
      },
      ua: {
        name: 'Студентський Топ',
        description: 'Дешевизна, швидкість, смак і нажорстість з легкою компрометацією некріпкого здоров\'я',
      },
    },
    settings: {
      priorities: {
        taste: 2,
        health: 0,
        cheapness: 10,
        speed: 10,
        satiety: 0,
        lowCalorie: -5,
        ethics: 0,
      },
      priceUnit: 'per1000kcal',
      isOptimized: true,
      tasteScoreMethod: 'taste_score',
      selectedZone: null,
    },
  },
  {
    id: 'bryan-johnson-top',
    name: 'Bryan Johnson Food Top',
    description: '100% focus on health and nutrients.. and ethics',
    translations: {
      en: {
        name: 'Bryan Johnson Food Top',
        description: '100% focus on health and nutrients..and ethics',
      },
      ru: {
        name: 'Брайан Джонсон Топ',
        description: '100% фокуса на здоровье и нутриентах..и этике..',
      },
      ua: {
        name: 'Брайан Джонсон Топ',
        description: '100% фокусу на здоров\'ї та нутрієнтах.. та етиці',
      },
    },
    settings: {
      priorities: {
        taste: 0,
        health: 10,
        cheapness: 0,
        speed: 0,
        satiety: 0,
        lowCalorie: 2,
        ethics: 2,
      },
      priceUnit: 'per1000kcal',
      isOptimized: true,
      tasteScoreMethod: 'taste_score',
      selectedZone: 'north_american',
    },
  },
  {
    id: 'most-unethical-food',
    name: 'Most Unethical Food',
    description: 'Food with the worst possible ethical traits',
    translations: {
      en: {
        name: 'Most Unethical Food',
        description: 'Food with the worst possible ethical traits',
      },
      ru: {
        name: 'Самая Неэтичная Еда',
        description: 'Еда с худшими возможными этическими характеристиками',
      },
      ua: {
        name: 'Найнеетична Їжа',
        description: 'Їжа з найгіршими можливими етичними характеристиками',
      },
    },
    settings: {
      priorities: {
        taste: 0,
        health: 0,
        cheapness: 0,
        speed: 0,
        satiety: 0,
        lowCalorie: 0,
        ethics: -10,
      },
      priceUnit: 'per1000kcal',
      isOptimized: true,
      tasteScoreMethod: 'taste_score',
      selectedZone: null,
    },
  },
  {
    id: 'most-ethical-food',
    name: 'Most Ethical Food',
    description: 'Food with the best possible ethical traits',
    translations: {
      en: {
        name: 'Most Ethical Food',
        description: 'Food with the best possible ethical traits',
      },
      ru: {
        name: 'Самая Этичная Еда',
        description: 'Еда с лучшими возможными этическими характеристиками',
      },
      ua: {
        name: 'Найетична Їжа',
        description: 'Їжа з найкращими можливими етичними характеристиками',
      },
    },
    settings: {
      priorities: {
        taste: 0,
        health: 0,
        cheapness: 0,
        speed: 0,
        satiety: 0,
        lowCalorie: 0,
        ethics: 10,
      },
      priceUnit: 'per1000kcal',
      isOptimized: true,
      tasteScoreMethod: 'taste_score',
      selectedZone: null,
    },
  },
];


