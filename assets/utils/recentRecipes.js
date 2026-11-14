import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_RECIPES_KEY = 'recent_recipes';
const MAX_RECENT_RECIPES = 6;

const normalizeId = (routeName, title) => {
  const safeTitle = (title || '').trim().toLocaleLowerCase('tr-TR');
  return `${routeName || 'Recipe'}:${safeTitle}`;
};

export async function getRecentRecipes() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_RECIPES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.log('getRecentRecipes error:', e);
    return [];
  }
}

export async function recordRecentRecipe({
  title,
  sourceLabel,
  icon = 'utensils',
  routeName,
  params,
  meta = '',
}) {
  const cleanTitle = (title || '').trim();
  if (!cleanTitle || !routeName || !params) return;

  try {
    const current = await getRecentRecipes();
    const id = normalizeId(routeName, cleanTitle);

    const entry = {
      id,
      title: cleanTitle,
      sourceLabel: sourceLabel || 'Tarif',
      icon,
      routeName,
      params,
      meta,
      viewedAt: new Date().toISOString(),
    };

    const next = [entry, ...current.filter((item) => item.id !== id)].slice(0, MAX_RECENT_RECIPES);
    await AsyncStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(next));
  } catch (e) {
    console.log('recordRecentRecipe error:', e);
  }
}

export async function removeRecentRecipe(routeName, title) {
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) return;

  try {
    const current = await getRecentRecipes();
    const id = normalizeId(routeName, cleanTitle);
    const next = current.filter((item) => item.id !== id);
    await AsyncStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(next));
  } catch (e) {
    console.log('removeRecentRecipe error:', e);
  }
}
