const TASK_BACKGROUND_FILES = [
  "1 B - Windy 2.png",
  "10 - Shot 2.png",
  "11 - Sweet 2.png",
  "12 B - Freeze 2.png",
  "13 - Arrow 2.png",
  "14 A - Dark 2.png",
  "14 B - Dark 2.png",
  "15 A - Light 2.png",
  "15 B - Light 2.png",
  "16 - Twin 2.png",
  "17 - Wood 2.png",
  "18 - Shield 2.png",
  "19 - Power 2.png",
  "2 - Shadow 2.png",
  "20 - Loop 2.png",
  "21 A - Mirror 2.png",
  "21 B - Mirror.png",
  "22 - Big 2.png",
  "23 - Change 2.png",
  "24 A - Firey 2.png",
  "24 B - Firey.png",
  "25 - Voice 2.png",
  "26 B - Lock 2.png",
  "27 - Cloud 2.png",
  "28 - Rain 2.png",
  "29 B - Watery.png",
  "3 B - Illusion 2.png",
  "30 - Jump 2.png",
  "31 - Silent 2.png",
  "32 - Time 2.png",
  "33 A - Return 2.png",
  "34 A Erase.png",
  "35 - Dash 2.png",
  "36 - Create 2.png",
  "37 - Sleep 2.png",
  "38 - Bubbles 2.png",
  "39 - Wave 2.png",
  "4 - Flower 2.png",
  "40 - Sand 2.png",
  "41 - Fly 2.png",
  "42 - Thunder 2.png",
  "43 - Sword 2.png",
  "44 - Move 2.png",
  "45 A - Glow 2.png",
  "46 - Little 2.png",
  "47 A - Maze 2.png",
  "48 B - Snow 2.png",
  "49 A - Through 2.png",
  "5 A - Mist 2.png",
  "50 A - Libra 2.png",
  "51 B - Dream 2.png",
  "52 A - Earthy 2.png",
  "53 B - Nothing 2.png",
  "54 - Nameless.png",
  "55 - Hope 2.png",
  "6.- Storm.png",
  "7 B - Float 2.png",
  "8 - Fight 2.png",
  "9 A.- Song.png",
];

export const TASK_BACKGROUNDS = TASK_BACKGROUND_FILES.map(
  (filename) => `/img/${filename.split("/").map(encodeURIComponent).join("/")}`
);

export const selectTaskBackground = (
  previousBackground,
  random = Math.random,
  unavailableBackgrounds = []
) => {
  const unavailable = new Set(unavailableBackgrounds);
  const available = TASK_BACKGROUNDS.filter(
    (background) => !unavailable.has(background)
  );
  if (available.length === 0) return null;

  const candidates =
    available.length > 1
      ? available.filter((background) => background !== previousBackground)
      : available;
  const randomIndex = Math.min(
    candidates.length - 1,
    Math.floor(Math.max(0, random()) * candidates.length)
  );
  return candidates[randomIndex] || null;
};
