
import { Recipe, DayPlan, UserSettings, DietaryPreference, Ingredient, ShoppingList, ShoppingItem, EconomicInsight, Season, RecipeStructuredStep, RecipeStepPhase } from './types';
import { MOCK_RECIPES, DAYS } from './constants';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY as string | undefined;

const mistralChat = async (prompt: string, imageDataUrl?: string): Promise<string | null> => {
  if (!MISTRAL_API_KEY) return null;
  const content: any = imageDataUrl
    ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: imageDataUrl }]
    : prompt;
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_API_KEY}` },
    body: JSON.stringify({ model: imageDataUrl ? 'pixtral-large-latest' : 'mistral-small-latest', messages: [{ role: 'user', content }], temperature: 0.4 })
  });
  if (!response.ok) throw new Error(`Mistral API ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? null;
};

const extractJson = (text: string) => {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const a = cleaned.indexOf('{'), b = cleaned.lastIndexOf('}');
  return JSON.parse(a >= 0 && b >= a ? cleaned.slice(a, b + 1) : cleaned);
};

const normalizeIngredientName = (name: string): string => {
  return name.toLowerCase().trim().replace(/s$/, '');
};

const PRICE_DATABASE: Record<string, number> = {
  'pâte': 1.20, 'riz': 1.50, 'lentille': 2.20, 'poireau': 0.45, 'jambon': 0.45,
  'lait': 1.10, 'thon': 11.00, 'maï': 0.85, 'œuf': 0.22, 'poulet': 9.50,
  'carotte': 1.20, 'oignon': 0.15, 'ail': 0.40, 'farine': 0.85, 'beurre': 8.00,
  'parmesan': 18.00, 'basilic': 1.20, 'épinard': 3.50, 'pois chiche': 2.50,
  'tomate': 3.00, 'potiron': 2.00, 'spaghetti': 1.20, 'bœuf haché': 12.00,
  'courgette': 0.80, 'feta': 15.00, 'nouille': 1.80, 'sauce soja': 5.00,
  'pomme de terre': 1.80, 'default': 0.50
};

const ECO_ALTERNATIVES: Record<string, string> = {
  'poulet': 'Lentilles corail',
  'bœuf haché': 'Protéines de soja',
  'parmesan': 'Emmental râpé',
  'basilic': 'Persil plat',
  'thon': 'Œufs durs',
  'feta': 'Tofu ferme'
};

const getBestLocation = (category: string): ShoppingItem['bestLocation'] => {
  switch (category) {
    case 'Fruits & Légumes': return 'Marché';
    case 'Épicerie': return 'Hard Discount';
    case 'Boucherie': return 'MDD (Marque Distributeur)';
    case 'Produits Frais': return 'Supermarché';
    default: return 'Hard Discount';
  }
};

const calculateIngredientUnitPrice = (ing: Ingredient): number => {
  const name = normalizeIngredientName(ing.name);
  const basePrice = Object.entries(PRICE_DATABASE).find(([k]) => name.includes(k))?.[1] || PRICE_DATABASE.default;
  const unit = ing.unit.toLowerCase();
  if (unit === 'g' || unit === 'ml') return basePrice / 1000;
  if (unit === 'kg' || unit === 'l' || unit === 'litre') return basePrice;
  if (unit.includes('pièce') || unit.includes('unité') || unit === 'p') {
    if (name.includes('œuf') || name.includes('jambon') || name.includes('tranche')) return basePrice;
    return basePrice * 0.15;
  }
  return basePrice;
};

export const getSeasonFromDate = (date: Date): Season => {
  const month = date.getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'printemps';
  if (month >= 5 && month <= 7) return 'été';
  if (month >= 8 && month <= 10) return 'automne';
  return 'hiver';
};

export const generateShoppingList = (plan: DayPlan[], guests: number, allRecipes: Recipe[], previousList: ShoppingList = {}): ShoppingList => {
  const list: ShoppingList = {};
  plan.forEach((day, dayIndex) => {
    const lunchGuests = day.lunchGuests || guests;
    const dinnerGuests = day.dinnerGuests || guests;
    // Si le dîner est « restes du midi », on cuisine dès le déjeuner les portions du soir.
    const effectiveLunchGuests = lunchGuests + (day.leftoverType === 'same-day' ? dinnerGuests : 0);
    // Si demain soir est « restes d'hier », on cuisine ce soir les portions supplémentaires de demain.
    const nextDay = plan[dayIndex + 1];
    const extraForTomorrow = nextDay?.leftoverType === 'previous-day' ? (nextDay.dinnerGuests || guests) : 0;

    const mealData = [
      { id: day.lunchId, guests: effectiveLunchGuests },
      ...(day.leftoverType === 'none' ? [{ id: day.dinnerId, guests: dinnerGuests + extraForTomorrow }] : [])
    ];
    mealData.forEach(meal => {
      const recipe = allRecipes.find(r => r.id === meal.id);
      recipe?.ingredients.forEach(ing => {
        const key = normalizeIngredientName(ing.name);
        let qty = ing.quantity * meal.guests;
        let unit = ing.unit;
        if (unit.includes('pièce') || unit.includes('unité')) {
           if (key.includes('pomme de terre') || key.includes('oignon') || key.includes('carotte') || key.includes('poireau')) {
               qty = qty * 150;
               unit = 'g';
           }
        }
        if (list[key]) {
          list[key].quantity += qty;
        } else {
          list[key] = {
            quantity: qty,
            unit: unit,
            category: ing.category,
            checked: previousList[key]?.checked || false,
            inPantry: previousList[key]?.inPantry || false,
            estimatedPrice: calculateIngredientUnitPrice({ ...ing, unit }),
            bestLocation: getBestLocation(ing.category)
          };
        }
      });
    });
  });
  return list;
};

export const calculateWeeklyStats = (plan: DayPlan[], guests: number, allRecipes: Recipe[]) => {
  let totalCost = 0;
  let savings = 0;
  plan.forEach((day, dayIndex) => {
    const l = allRecipes.find(r => r.id === day.lunchId);
    const d = allRecipes.find(r => r.id === day.dinnerId);
    const lunchGuests = day.lunchGuests || guests;
    const dinnerGuests = day.dinnerGuests || guests;

    if (l) {
      const lCost = l.ingredients.reduce((acc, ing) => acc + (calculateIngredientUnitPrice(ing) * ing.quantity), 0);
      const effectiveLunchGuests = lunchGuests + (day.leftoverType === 'same-day' ? dinnerGuests : 0);
      totalCost += lCost * effectiveLunchGuests;
    }
    if (d) {
      const dCost = d.ingredients.reduce((acc, ing) => acc + (calculateIngredientUnitPrice(ing) * ing.quantity), 0);
      if (day.leftoverType === 'none') {
        const nextDay = plan[dayIndex + 1];
        const extraForTomorrow = nextDay?.leftoverType === 'previous-day' ? (nextDay.dinnerGuests || guests) : 0;
        totalCost += dCost * (dinnerGuests + extraForTomorrow);
      } else {
        // Économie indicative : ce dîner n'exige pas une nouvelle recette séparée.
        savings += dCost * dinnerGuests;
      }
    }
  });
  return { 
    savings: savings.toFixed(2), 
    totalCost: totalCost.toFixed(2),
    avgCostPerMeal: (totalCost / Math.max(1, plan.length * 2)).toFixed(2)
  };
};

export const calculateEconomicInsights = async (shoppingList: ShoppingList, stats: any): Promise<EconomicInsight> => {
  const items = Object.entries(shoppingList) as [string, ShoppingItem][];
  const totalCost = items.reduce((acc, [_, item]) => acc + (item.quantity * item.estimatedPrice), 0);
  const categories: Record<string, number> = {};
  items.forEach(([_, item]) => {
    categories[item.category] = (categories[item.category] || 0) + (item.quantity * item.estimatedPrice);
  });
  const breakdown = Object.entries(categories).map(([category, cost]) => ({
    category, cost, percentage: Math.round((cost / totalCost) * 100)
  })).sort((a, b) => b.cost - a.cost);
  const expensive = items
    .map(([name, item]) => ({ name, cost: item.quantity * item.estimatedPrice }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3)
    .map(item => ({ ...item, alternative: ECO_ALTERNATIVES[item.name.toLowerCase()] || "Marque distributeur" }));
  let score = 75;
  if (parseFloat(stats.savings) > 15) score += 15;
  if (categories['Boucherie'] > (totalCost * 0.4)) score -= 15;
  score = Math.min(Math.max(score, 0), 100);
  let iaAdvice = "Optimisez vos achats en privilégiant le vrac pour les féculents.";
  try {
    const text = await mistralChat(`Expert économie domestique. Liste courses (Total: ${totalCost.toFixed(2)}€). Ingrédients chers: ${expensive.map(e => e.name).join(', ')}. Donne un conseil court et concret en français.`);
    iaAdvice = text || iaAdvice;
  } catch (e) { console.error(e); }
  return { score, expensiveItems: expensive, categoryBreakdown: breakdown, iaAdvice };
};

const normalizeFoodText = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const ingredientText = (recipe: Recipe) => recipe.ingredients.map(i => normalizeFoodText(i.name)).join(' | ');
const containsAny = (text: string, terms: string[]) => terms.some(term => text.includes(normalizeFoodText(term)));

export const filterRecipes = (recipes: Recipe[], settingsOrPreferences: UserSettings | DietaryPreference[], targetDate: Date = new Date()): Recipe[] => {
  const settings = Array.isArray(settingsOrPreferences) ? null : settingsOrPreferences;
  const preferences = Array.isArray(settingsOrPreferences) ? settingsOrPreferences : settingsOrPreferences.preferences;
  const currentSeason = getSeasonFromDate(targetDate);

  const allergyTerms: Record<string, string[]> = {
    lactose: ['lait', 'creme', 'beurre', 'fromage', 'parmesan', 'feta', 'yaourt', 'mozzarella', 'emmental'],
    eggs: ['oeuf', 'œuf'],
    nuts: ['amande', 'noix', 'noisette', 'pistache', 'cajou', 'pecan'],
    peanuts: ['arachide', 'cacahuete'],
    soy: ['soja', 'tofu'],
    sesame: ['sesame'],
    shellfish: ['crevette', 'crabe', 'homard', 'langoustine', 'moule', 'huitre'],
  };
  const meatTerms = ['poulet', 'boeuf', 'bœuf', 'porc', 'jambon', 'lardon', 'saucisse', 'dinde', 'veau', 'agneau', 'knacki'];
  const fishTerms = ['saumon', 'thon', 'cabillaud', 'poisson', 'sardine', 'truite', 'crevette', 'crabe'];
  const animalTerms = [...meatTerms, ...fishTerms, 'oeuf', 'œuf', 'lait', 'creme', 'beurre', 'fromage', 'parmesan', 'feta', 'yaourt', 'mozzarella', 'miel'];
  const specializedEquipment = ['air fryer', 'mixeur', 'robot', 'blender', 'cookeo', 'thermomix'];

  return recipes.filter(recipe => {
    const text = ingredientText(recipe);
    const matchPrefs = preferences.every(pref => {
      if (pref === 'vegetarian') return recipe.tags.includes('vegetarian') || (!containsAny(text, meatTerms) && !containsAny(text, fishTerms));
      if (pref === 'no-fish') return !containsAny(text, fishTerms);
      if (pref === 'gluten-free') return recipe.tags.includes('gluten-free');
      if (pref === 'low-calorie') return recipe.calories < 400;
      return true;
    });
    if (!matchPrefs) return false;

    if (settings) {
      if (settings.foodDiet === 'vegetarian' && (containsAny(text, meatTerms) || containsAny(text, fishTerms))) return false;
      if (settings.foodDiet === 'pescatarian' && containsAny(text, meatTerms)) return false;
      if (settings.foodDiet === 'vegan' && containsAny(text, animalTerms)) return false;
      if (settings.allergies.includes('gluten') && containsAny(text, ['pate', 'pâtes', 'pain', 'farine', 'nouille', 'couscous', 'semoule', 'chapelure', 'feuilletee', 'feuilletée'])) return false;
      for (const allergy of settings.allergies) {
        if (allergy !== 'gluten' && containsAny(text, allergyTerms[allergy] || [])) return false;
      }
      if (settings.excludedFoods.some(food => normalizeFoodText(food) && text.includes(normalizeFoodText(food)))) return false;
      const requiredSpecial = recipe.equipment.filter(eq => specializedEquipment.includes(normalizeFoodText(eq)));
      if (settings.availableEquipment.length > 0 && requiredSpecial.length && requiredSpecial.some(eq => !settings.availableEquipment.some(have => normalizeFoodText(have) === normalizeFoodText(eq)))) return false;
    }

    if (!recipe.seasons || recipe.seasons.length === 0) return true;
    return recipe.seasons.includes(currentSeason);
  });
};

export const generateWeeklyPlan = (settings: UserSettings, targetDate: Date = new Date(), recipes: Recipe[] = MOCK_RECIPES): DayPlan[] => {
  // Le moteur travaille sur le catalogue réellement actif (y compris les recettes ajoutées en admin),
  // et non plus uniquement sur les recettes de démonstration.
  let recipePool = filterRecipes(recipes, settings, targetDate);
  // S'il reste trop peu de recettes à cause de la saison, on garde les contraintes alimentaires et on relâche seulement la saison.
  if (recipePool.length < 5) {
    recipePool = filterRecipes(recipes.map(r => ({ ...r, seasons: [] })), settings, targetDate);
  }
  if (recipePool.length < 1) return [];

  const recipeCost = (recipe: Recipe) => recipe.ingredients.reduce((sum, ing) => sum + calculateIngredientUnitPrice(ing) * ing.quantity * settings.guests, 0);
  const costs = new Map(recipePool.map(r => [r.id, recipeCost(r)]));
  const cheapest = [...recipePool].sort((a, b) => (costs.get(a.id) || 0) - (costs.get(b.id) || 0))[0];
  const cheapestCost = costs.get(cheapest.id) || 0;
  const strictBudgetPossible = cheapestCost * 14 <= settings.weeklyBudget;
  const ingredientUse = new Map<string, number>();
  const usedCounts = new Map<string, number>();
  const chosen: Recipe[] = [];
  let running = 0;

  for (let slot = 0; slot < 14; slot++) {
    const mealsLeftAfter = 13 - slot;
    const reserve = cheapestCost * mealsLeftAfter;
    const maxForThisMeal = strictBudgetPossible ? settings.weeklyBudget - running - reserve : Infinity;
    let eligible = recipePool.filter(r => (costs.get(r.id) || 0) <= maxForThisMeal + 0.0001);
    if (!eligible.length) eligible = [cheapest];

    const scored = eligible.map(recipe => {
      const overlap = recipe.ingredients.reduce((n, ing) => n + (ingredientUse.has(normalizeIngredientName(ing.name)) ? 1 : 0), 0);
      const used = usedCounts.get(recipe.id) || 0;
      // Tant que le catalogue le permet, on évite franchement les répétitions.
      // Un second passage reste possible si les contraintes/budget réduisent fortement le choix.
      const repeatPenalty = used * (recipePool.length >= 10 ? 14 : 8);
      const previousPenalty = chosen.at(-1)?.id === recipe.id ? 30 : 0;
      const recentPenalty = chosen.slice(-4).some(r => r.id === recipe.id) ? 10 : 0;
      const affordability = Math.max(0, 4 - ((costs.get(recipe.id) || 0) / Math.max(1, settings.weeklyBudget / 14)));
      const lightBonus = settings.preferences.includes('low-calorie') && recipe.calories < 400 ? 2 : 0;
      const quickLunchBonus = slot % 2 === 0 && recipe.prepTime <= 25 ? 1.25 : 0;
      const batchBonus = slot % 2 === 1 && recipe.batchInfo?.storageFridge ? 0.75 : 0;
      // Petit aléa contrôlé : deux clics sur « nouvelle semaine » ne doivent pas redonner
      // exactement le même planning lorsque plusieurs solutions sont équivalentes.
      const varietyJitter = Math.random() * 3.5;
      return { recipe, score: overlap * 2 + affordability + lightBonus + quickLunchBonus + batchBonus + varietyJitter - repeatPenalty - previousPenalty - recentPenalty };
    }).sort((a, b) => b.score - a.score);

    const selected = scored[0].recipe;
    chosen.push(selected);
    running += costs.get(selected.id) || 0;
    usedCounts.set(selected.id, (usedCounts.get(selected.id) || 0) + 1);
    selected.ingredients.forEach(ing => {
      const key = normalizeIngredientName(ing.name);
      ingredientUse.set(key, (ingredientUse.get(key) || 0) + 1);
    });
  }

  return DAYS.map((day, index) => ({
    day,
    lunchId: chosen[index * 2].id,
    dinnerId: chosen[index * 2 + 1].id,
    leftoverType: 'none',
    isLunchLocked: false,
    isDinnerLocked: false,
  }));
};

export const generateAIRecipeFromFridge = async (ingredients: string): Promise<Recipe | null> => {
  try {
    const text = await mistralChat(`Chef Batch Cooking. Restes disponibles: ${ingredients}. Crée UNE recette économique. Réponds uniquement en JSON avec: name (string), ingredients (tableau d'objets name, quantity nombre, unit, category), steps (tableau de strings), batchInfo (objet storageFridge, reheatInstructions).`);
    if (!text) return null;
    const data = extractJson(text);
    return { ...data, id: `ai-${Date.now()}`, imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80', tags: ['vegetarian'], calories: 450, nutrition: { protein: 20, carbs: 55, fat: 15 }, equipment: ['Poêle'], pricePerPortion: 1.5, prepTime: 20, difficulty: 'Facile' } as Recipe;
  } catch (e) { console.error('Mistral recipe error', e); return null; }
};

export const generateRecipeImage = async (_recipeName: string, _ingredients: string[]): Promise<string | null> => {
  // Mistral est utilisé pour l'intelligence texte/vision. On conserve l'image existante si présente.
  return null;
};

export const analyzeReceipt = async (base64Image: string): Promise<number | null> => {
  try {
    const text = await mistralChat('Extrais le montant total TTC de ce ticket de caisse. Réponds uniquement avec le nombre décimal, par exemple 45.20.', base64Image);
    if (!text) return null;
    const match = text.replace(',', '.').match(/\d+(?:\.\d{1,2})?/);
    return match ? parseFloat(match[0]) : null;
  } catch (e) { console.error('Mistral receipt error', e); return null; }
};

// ---- Batch cooking engine (Step 6) -----------------------------------------

const STEP_PHASE_LABELS: Record<RecipeStepPhase, string> = {
  setup: 'MISE EN PLACE', prep: 'PRÉPARATIONS', cook: 'CUISSONS', assemble: 'ASSEMBLAGE', cool: 'REFROIDISSEMENT', store: 'CONSERVATION'
};

const inferPhase = (text: string): RecipeStepPhase => {
  const t = text.toLowerCase();
  if (/préchauff|préparez le four|chauffez le four/.test(t)) return 'setup';
  if (/réserv|refroid|laissez tiédir|mettre au frais|réfrig/.test(t)) return 'cool';
  if (/conserv|portion|boîte|bac|étiquet/.test(t)) return 'store';
  if (/enfour|cuire|cuisson|mijot|revenir|bouill|poêle|vapeur|grill|dorer|saisir|frire|rôtir/.test(t)) return 'cook';
  if (/mélang|incorpor|assemble|nappez|enroul|garnir|dresser|servir|ajoutez.*sauce/.test(t)) return 'assemble';
  return 'prep';
};

const inferDuration = (text: string, phase: RecipeStepPhase): number => {
  const matches = [...text.matchAll(/(\d+)\s*(?:à|-)?\s*(\d+)?\s*(?:min|minute)/gi)];
  if (matches.length) {
    const m = matches[matches.length - 1];
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    return Math.max(1, Math.round((a + b) / 2));
  }
  if (phase === 'cook') return 10;
  if (phase === 'prep') return 4;
  if (phase === 'assemble') return 4;
  if (phase === 'setup') return 2;
  if (phase === 'cool') return 5;
  return 3;
};

const inferPassive = (text: string, phase: RecipeStepPhase) => {
  const t = text.toLowerCase();
  return phase === 'cook' && /enfour|mijot|cuire.*(?:four|eau|vapeur)|laissez.*cuire|porter? à ébullition/.test(t);
};

const inferTemperature = (text: string): number | undefined => {
  const m = text.match(/(\d{2,3})\s*°?\s*c/i);
  return m ? Number(m[1]) : undefined;
};

const splitCulinaryStep = (text: string): string[] => {
  const sentenceParts = text
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý])/u)
    .flatMap(part => part.split(/\s+(?:puis|ensuite|et)\s+(?=(?:faites|ajoutez|incorporez|mélangez|coupez|lavez|égouttez|enfournez|versez|rincez|placez|servez|réservez|préchauffez|baissez|laissez|saupoudrez|mixez|hachez))/i))
    .map(part => part.trim())
    .filter(Boolean);
  return sentenceParts.length ? sentenceParts : [text.trim()];
};

export const getStructuredRecipeSteps = (recipe: Recipe): RecipeStructuredStep[] => {
  if (recipe.structuredSteps?.length) return recipe.structuredSteps;
  return (recipe.steps || []).flatMap(original => splitCulinaryStep(original).map(text => {
    const phase = inferPhase(text);
    return {
      text,
      phase,
      durationMin: inferDuration(text, phase),
      passive: inferPassive(text, phase),
      equipment: recipe.equipment || [],
      temperatureC: inferTemperature(text),
    };
  }));
};

export interface BatchEngineTask {
  id: string;
  desc: string;
  tip: string;
  recipes: string[];
  duration: number;
  phase: RecipeStepPhase;
  passive: boolean;
}
export interface BatchEnginePhase {
  id: string;
  title: string;
  phase: RecipeStepPhase;
  estimate: string;
  tasks: BatchEngineTask[];
}

export const buildProfessionalBatchSession = (recipes: Recipe[]): BatchEnginePhase[] => {
  if (!recipes.length) return [];
  const pointers = new Map(recipes.map(r => [r.id, 0]));
  const structured = new Map(recipes.map(r => [r.id, getStructuredRecipeSteps(r)]));
  const sequence: BatchEngineTask[] = [];
  const phasePriority: Record<RecipeStepPhase, number> = { setup: 0, prep: 1, cook: 2, assemble: 3, cool: 4, store: 5 };

  // Topological orchestration: only the next step of each recipe is eligible.
  // This guarantees that no step can appear before its prerequisite in that recipe.
  while (true) {
    const candidates = recipes.flatMap(recipe => {
      const index = pointers.get(recipe.id) || 0;
      const step = structured.get(recipe.id)?.[index];
      return step ? [{ recipe, index, step }] : [];
    });
    if (!candidates.length) break;
    candidates.sort((a, b) => {
      const p = phasePriority[a.step.phase] - phasePriority[b.step.phase];
      if (p) return p;
      // Passive cooking first: once launched, the user can continue with another task.
      if (a.step.passive !== b.step.passive) return a.step.passive ? -1 : 1;
      return a.step.durationMin - b.step.durationMin;
    });
    const chosen = candidates[0];
    const step = chosen.step;
    const id = `${chosen.recipe.id}-${chosen.index}`;
    sequence.push({
      id,
      desc: step.text,
      tip: step.passive
        ? 'Temps majoritairement passif : lancez cette étape puis poursuivez avec la tâche suivante pendant la cuisson.'
        : `Étape ${chosen.index + 1}/${structured.get(chosen.recipe.id)?.length || 1} de la recette. Respectez cet ordre avant de passer à l’étape suivante de ce plat.`,
      recipes: [chosen.recipe.name],
      duration: step.durationMin,
      phase: step.phase,
      passive: !!step.passive,
    });
    pointers.set(chosen.recipe.id, chosen.index + 1);
  }

  // Merge contiguous tasks into readable operational blocks. A phase may reappear later
  // if recipe dependencies require it; this is intentional and preserves culinary logic.
  const phases: BatchEnginePhase[] = [];
  sequence.forEach((task, idx) => {
    const last = phases[phases.length - 1];
    if (!last || last.phase !== task.phase) {
      phases.push({ id: `batch-${idx}-${task.phase}`, title: STEP_PHASE_LABELS[task.phase], phase: task.phase, estimate: '', tasks: [task] });
    } else last.tasks.push(task);
  });
  phases.forEach(p => {
    const minutes = p.tasks.reduce((sum, t) => sum + t.duration, 0);
    p.estimate = `~${minutes} min`;
  });
  return phases;
};
