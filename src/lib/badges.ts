export type Badge = {
  icon: string;
  label: string;
  earned: boolean;
};

export function computeBadges(params: {
  history: { date: string; steps: number }[];
  dailyGoal: number;
  longestStreakDays: number;
  crownsWon: number;
}): Badge[] {
  const { history, dailyGoal, longestStreakDays, crownsWon } = params;
  const daysLogged = history.filter((h) => h.steps > 0).length;
  const goalDays = history.filter((h) => h.steps >= dailyGoal).length;
  const big20kDays = history.filter((h) => h.steps >= 20_000).length;

  return [
    { icon: "🔥", label: "7-Day Streak", earned: longestStreakDays >= 7 },
    { icon: "⚡", label: "14-Day Streak", earned: longestStreakDays >= 14 },
    { icon: "🌟", label: "20k Club", earned: big20kDays >= 1 },
    { icon: "👑", label: "Crown Holder", earned: crownsWon >= 1 },
    { icon: "🎯", label: "Goal Getter", earned: goalDays >= 10 },
    { icon: "🏅", label: "Veteran", earned: daysLogged >= 30 },
  ];
}
