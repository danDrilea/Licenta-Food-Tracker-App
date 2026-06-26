import * as SQLite from 'expo-sqlite';

export interface BarcodeProduct {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingGrams?: number;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
}

// Configurable endpoint flag: Set to true to test against Staging, false for Production.
export const USE_STAGING = false;

// Custom User-Agent as required by Open Food Facts terms of service
const USER_AGENT = 'LicentaFoodTracker/1.0 (danalex.dri@gmail.com)';

/**
 * Fetches product nutrition data from Open Food Facts API.
 */
export async function fetchFromOpenFoodFacts(barcode: string, useStaging: boolean = USE_STAGING): Promise<BarcodeProduct | null> {
  const baseUrl = useStaging ? 'https://world.openfoodfacts.net' : 'https://world.openfoodfacts.org';
  const url = `${baseUrl}/api/v3/product/${barcode}.json`;

  console.log(`[BarcodeService] [API CALL] Requesting OFF API: GET ${url}`);
  
  const headers: HeadersInit = {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json',
  };

  if (useStaging) {
    // Staging requires Basic Authentication (off:off)
    // btoa("off:off") is "b2ZmOm9mZg=="
    headers['Authorization'] = 'Basic b2ZmOm9mZg==';
    console.log(`[BarcodeService] [API CALL] Including Staging Basic Auth headers`);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log(`[BarcodeService] [API RESPONSE] HTTP Status: ${response.status} ${response.statusText}`);

    if (response.status === 404) {
      console.log(`[BarcodeService] [API RESULT] Product ${barcode} not found (404)`);
      return null;
    }

    if (!response.ok) {
      console.warn(`[BarcodeService] [API WARNING] Request failed with status ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data || (data.status !== 'success' && data.status !== 1)) {
      console.log(`[BarcodeService] [API RESULT] Product ${barcode} not found in database (status != success/1)`);
      return null;
    }

    const product = data.product;
    if (!product) {
      console.log(`[BarcodeService] [API RESULT] Product field is empty for barcode ${barcode}`);
      return null;
    }

    // 1. Resolve Product Name (prefer localized Romanian or English)
    const name = 
      product.product_name_ro || 
      product.product_name_en || 
      product.product_name || 
      product.generic_name || 
      'Unknown Product';

    // 2. Resolve serving quantity/weight to properly scale the 100g database values
    let servingWeight = 100; // default base weight is 100g
    let amount = '100 g';

    // Try to resolve weight from serving_quantity if unit is g or ml
    if (product.serving_quantity !== undefined && !isNaN(Number(product.serving_quantity))) {
      const quantity = Number(product.serving_quantity);
      const unit = (product.serving_quantity_unit || 'g').toLowerCase().trim();
      if (quantity > 0 && (unit === 'g' || unit === 'ml' || unit === 'cl' || unit === 'l' || unit === 'kg')) {
        servingWeight = quantity;
        if (unit === 'cl') servingWeight = quantity * 10;
        if (unit === 'l') servingWeight = quantity * 1000;
        if (unit === 'kg') servingWeight = quantity * 1000;
        amount = product.serving_size || `${quantity} ${unit}`;
      }
    } 
    
    // If not resolved from serving_quantity, try parsing from product.serving_size string using Regex
    if (servingWeight === 100 && product.serving_size) {
      const match = product.serving_size.match(/(?:^|\s|\()(\d+(?:\.\d+)?)\s*(g|grams|ml|cl|l|kg)\b/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (val > 0) {
          servingWeight = val;
          if (unit === 'cl') servingWeight = val * 10;
          if (unit === 'l') servingWeight = val * 1000;
          if (unit === 'kg') servingWeight = val * 1000;
          amount = product.serving_size;
        }
      }
    }

    // If still 100, try to parse from product.quantity (total quantity of the package)
    if (servingWeight === 100 && product.quantity) {
      const match = product.quantity.match(/(?:^|\s|\()(\d+(?:\.\d+)?)\s*(g|grams|ml|cl|l|kg)\b/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (val > 0) {
          servingWeight = val;
          if (unit === 'cl') servingWeight = val * 10;
          if (unit === 'l') servingWeight = val * 1000;
          if (unit === 'kg') servingWeight = val * 1000;
          amount = product.quantity;
        }
      }
    }

    // Append weight in grams to amount string if it's missing g/ml units (e.g. "1 vasetto" -> "1 vasetto (125 g)")
    let finalAmount = amount;
    if (servingWeight !== 100 && !amount.toLowerCase().includes('g') && !amount.toLowerCase().includes('ml')) {
      finalAmount = `${amount} (${Math.round(servingWeight)} g)`;
    }

    const multiplier = servingWeight / 100;

    // 3. Resolve Nutrition Data (per 100g, then multiply by multiplier)
    const nutriments = product.nutriments || {};
    
    // Calories (energy-kcal_100g or energy-kcal or calculate from energy_100g in kJ)
    let calories100g = 0;
    if (nutriments['energy-kcal_100g'] !== undefined) {
      calories100g = Number(nutriments['energy-kcal_100g']);
    } else if (nutriments['energy-kcal'] !== undefined) {
      calories100g = Number(nutriments['energy-kcal']);
    } else if (nutriments['energy_100g'] !== undefined) {
      // 1 kJ = 0.239006 kcal
      calories100g = Number(nutriments['energy_100g']) * 0.239006;
    }

    const protein100g = Number(nutriments.proteins_100g || nutriments.proteins || 0);
    const carbs100g = Number(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0);
    const fat100g = Number(nutriments.fat_100g || nutriments.fat || 0);

    const calories = Math.round(calories100g * multiplier);
    const protein = parseFloat((protein100g * multiplier).toFixed(1));
    const carbs = parseFloat((carbs100g * multiplier).toFixed(1));
    const fat = parseFloat((fat100g * multiplier).toFixed(1));

    const result: BarcodeProduct = {
      name,
      amount: finalAmount,
      calories,
      protein,
      carbs,
      fat,
      servingGrams: servingWeight,
      caloriesPer100g: Math.round(calories100g),
      proteinPer100g: parseFloat(protein100g.toFixed(1)),
      carbsPer100g: parseFloat(carbs100g.toFixed(1)),
      fatPer100g: parseFloat(fat100g.toFixed(1)),
    };

    console.log(`[BarcodeService] [API PARSE SUCCESS] Barcode: ${barcode} (Serving Weight: ${servingWeight}g, Multiplier: ${multiplier}) ->`, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error(`[BarcodeService] [API ERROR] Failed to fetch barcode ${barcode}:`, error);
    return null;
  }
}

/**
 * Searches the SQLite database for a cached barcode.
 */
export async function getCachedProduct(db: SQLite.SQLiteDatabase, barcode: string): Promise<BarcodeProduct | null> {
  console.log(`[BarcodeService] [CACHE LOOKUP] Searching SQLite database for barcode: "${barcode}"`);
  try {
    const row = await db.getFirstAsync<{
      name: string;
      amount: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      serving_grams: number | null;
      calories_per_100g: number | null;
      protein_per_100g: number | null;
      carbs_per_100g: number | null;
      fat_per_100g: number | null;
    }>(
      'SELECT name, amount, calories, protein, carbs, fat, serving_grams, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g FROM barcode_cache WHERE barcode = ?',
      [barcode]
    );

    if (row) {
      console.log(`[BarcodeService] [CACHE HIT] Found product inside local SQLite for barcode "${barcode}": "${row.name}"`);
      return {
        name: row.name,
        amount: row.amount,
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        servingGrams: row.serving_grams !== null ? row.serving_grams : undefined,
        caloriesPer100g: row.calories_per_100g !== null ? row.calories_per_100g : undefined,
        proteinPer100g: row.protein_per_100g !== null ? row.protein_per_100g : undefined,
        carbsPer100g: row.carbs_per_100g !== null ? row.carbs_per_100g : undefined,
        fatPer100g: row.fat_per_100g !== null ? row.fat_per_100g : undefined,
      };
    } else {
      console.log(`[BarcodeService] [CACHE MISS] Barcode "${barcode}" not found in local database`);
      return null;
    }
  } catch (error) {
    console.error(`[BarcodeService] [CACHE ERROR] Failed to query barcode_cache table:`, error);
    return null;
  }
}

/**
 * Caches a product to the SQLite database.
 */
export async function cacheProduct(db: SQLite.SQLiteDatabase, barcode: string, product: BarcodeProduct): Promise<void> {
  console.log(`[BarcodeService] [CACHE WRITE] Saving product for barcode "${barcode}" to SQLite cache:`, JSON.stringify(product));
  try {
    await db.runAsync(
      'INSERT OR REPLACE INTO barcode_cache (barcode, name, amount, calories, protein, carbs, fat, serving_grams, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        barcode, product.name, product.amount, product.calories, product.protein, product.carbs, product.fat,
        product.servingGrams ?? null, product.caloriesPer100g ?? null, product.proteinPer100g ?? null, product.carbsPer100g ?? null, product.fatPer100g ?? null
      ]
    );
    console.log(`[BarcodeService] [CACHE WRITE SUCCESS] Caching completed successfully.`);
  } catch (error) {
    console.error(`[BarcodeService] [CACHE WRITE ERROR] Failed to insert product into barcode_cache:`, error);
  }
}

/**
 * Combined logic: Queries the cache, falls back to the API on miss, and updates cache.
 */
export async function lookupBarcode(
  db: SQLite.SQLiteDatabase, 
  barcode: string, 
  useStaging: boolean = USE_STAGING
): Promise<BarcodeProduct | null> {
  // Clean the barcode input (trim whitespace)
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) {
    console.log('[BarcodeService] [LOOKUP] Empty barcode provided, skipping lookup.');
    return null;
  }

  console.log(`\n--- [BarcodeService] [START LOOKUP] Barcode: "${cleanBarcode}" ---`);

  // 1. Check local cache
  const cachedProduct = await getCachedProduct(db, cleanBarcode);
  if (cachedProduct) {
    console.log(`--- [BarcodeService] [END LOOKUP - CACHED] Returning cached data ---`);
    return cachedProduct;
  }

  // 2. Fetch from network
  const apiProduct = await fetchFromOpenFoodFacts(cleanBarcode, useStaging);
  if (apiProduct) {
    // 3. Cache fetched product
    await cacheProduct(db, cleanBarcode, apiProduct);
    console.log(`--- [BarcodeService] [END LOOKUP - NETWORK SUCCESS] Returning fresh data ---`);
    return apiProduct;
  }

  console.log(`--- [BarcodeService] [END LOOKUP - FAILED] Product not found anywhere ---`);
  return null;
}

/**
 * Searches Open Food Facts API for products matching a query.
 * Respects rate-limits by only being called explicitly on search button click.
 */
export async function searchOpenFoodFacts(
  query: string, 
  useStaging: boolean = USE_STAGING
): Promise<BarcodeProduct[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const executeQuery = async (staging: boolean): Promise<BarcodeProduct[] | null> => {
    const baseUrl = staging ? 'https://world.openfoodfacts.net' : 'https://world.openfoodfacts.org';
    // Use the v2 API search endpoint which is more robust than the website CGI search
    const url = `${baseUrl}/api/v2/search?search_terms=${encodeURIComponent(cleanQuery)}&json=true&page_size=20`;

    console.log(`[BarcodeService] [API SEARCH] Querying: GET ${url}`);
    
    const headers: HeadersInit = {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    };

    if (staging) {
      headers['Authorization'] = 'Basic b2ZmOm9mZg==';
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log(`[BarcodeService] [API SEARCH] Response HTTP Status: ${response.status}`);

      if (response.status === 503 && !staging) {
        console.warn(`[BarcodeService] [API SEARCH] Production returned 503. Triggering fallback to Staging.`);
        return null; // Signals fallback to caller
      }

      if (!response.ok) {
        console.warn(`[BarcodeService] [API SEARCH] Search request failed with status ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log(`[BarcodeService] [API SEARCH] Found ${data.count || 0} products for query "${cleanQuery}"`);

      if (!data.products || data.products.length === 0) {
        return [];
      }

      // Map matching products
      return data.products.map((product: any) => {
        const name = 
          product.product_name_ro || 
          product.product_name_en || 
          product.product_name || 
          product.generic_name || 
          'Unknown Product';

        const brand = product.brands ? `${product.brands}` : '';
        const fullName = brand ? `${brand} - ${name}` : name;

        // Determine serving weight / serving size
        let servingWeight = 100;
        let amount = product.serving_size || product.quantity || '100 g';

        if (product.serving_quantity !== undefined && !isNaN(Number(product.serving_quantity))) {
          servingWeight = Number(product.serving_quantity);
        }

        const nutriments = product.nutriments || {};
        
        let calories100g = 0;
        if (nutriments['energy-kcal_100g'] !== undefined) {
          calories100g = Number(nutriments['energy-kcal_100g']);
        } else if (nutriments['energy-kcal'] !== undefined) {
          calories100g = Number(nutriments['energy-kcal']);
        } else if (nutriments['energy_100g'] !== undefined) {
          calories100g = Number(nutriments['energy_100g']) * 0.239006;
        }

        const protein100g = Number(nutriments.proteins_100g || 0);
        const carbs100g = Number(nutriments.carbohydrates_100g || 0);
        const fat100g = Number(nutriments.fat_100g || 0);

        // We scale the calories/macros by the servingWeight if it's not 100g, so it maps to the default amount
        const multiplier = servingWeight / 100;

        let finalAmount = amount;
        if (servingWeight !== 100 && !amount.toLowerCase().includes('g') && !amount.toLowerCase().includes('ml')) {
          finalAmount = `${amount} (${Math.round(servingWeight)} g)`;
        }

        return {
          name: fullName,
          amount: finalAmount,
          calories: Math.round(calories100g * multiplier),
          protein: parseFloat((protein100g * multiplier).toFixed(1)),
          carbs: parseFloat((carbs100g * multiplier).toFixed(1)),
          fat: parseFloat((fat100g * multiplier).toFixed(1)),
          servingGrams: servingWeight,
          caloriesPer100g: Math.round(calories100g),
          proteinPer100g: parseFloat(protein100g.toFixed(1)),
          carbsPer100g: parseFloat(carbs100g.toFixed(1)),
          fatPer100g: parseFloat(fat100g.toFixed(1)),
        };
      });
    } catch (error) {
      console.error(`[BarcodeService] [API SEARCH ERROR] Execute failed for staging=${staging}:`, error);
      return staging ? [] : null; // If production fails, return null to trigger staging fallback
    }
  };

  // First try the configured environment (default is production)
  let results = await executeQuery(useStaging);
  
  // If we queried production and got a 503 or error, retry on staging as fallback!
  if (results === null && !useStaging) {
    console.log(`[BarcodeService] [API SEARCH] Retrying query on Staging Server...`);
    results = await executeQuery(true);
  }

  return results || [];
}
