import 'dotenv/config';

import axios  from 'axios';
import NodeCache from 'node-cache';
import Fuse from 'fuse.js';


// Cache for 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600 });

class USDAService {
  constructor() {
    this.apiKey = process.env.USDA_API_KEY;
    this.baseURL = process.env.USDA_API_BASE_URL;
    
    if (!this.apiKey) {
      throw new Error('USDA API key is required');
    }
  }

  /**
   * Search for food items using USDA API
   * @param {string} query - Search query
   * @param {number} pageSize - Number of results to return
   * @returns {Promise<Array>} Array of food items
   */
  async searchFoods(query, pageSize = 25) {
    try {
      const cacheKey = `search_${query}_${pageSize}`;
      const cachedResult = cache.get(cacheKey);
      
      if (cachedResult) {
        console.log(`Cache hit for query: ${query}`);
        return cachedResult;
      }

      const response = await axios.get(`${this.baseURL}/foods/search`, {
        params: {
          query: query.trim(),
          api_key: this.apiKey,
          pageSize,
          // dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)']
        },
        timeout: 10000 // 10 second timeout
      });

      const foods = response.data.foods || [];
      cache.set(cacheKey, foods);
      
      console.log(`USDA API call for query: ${query}, found ${foods.length} results`);
      return foods;
      
    } catch (error) {
      console.error('USDA API Error:', {
        message: error.message,
        query,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      if (error.response?.status === 429) {
        throw new Error('USDA API rate limit exceeded. Please try again later.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Invalid USDA API key or access denied.');
      }
      
      throw new Error('Failed to fetch food data from USDA API');
    }
  }

  /**
   * Find the best matching food item using fuzzy search
   * @param {Array} foods - Array of food items from USDA
   * @param {string} query - Original search query
   * @returns {Object|null} Best matching food item
   */
  findBestMatch(foods, query) {
    if (!foods || foods.length === 0) {
      return null;
    }

    // If only one result, return it
    if (foods.length === 1) {
      return foods[0];
    }

    // Configure Fuse.js for fuzzy matching
    const fuseOptions = {
      keys: [
        { name: 'description', weight: 0.7 },
        { name: 'brandName', weight: 0.2 },
        { name: 'ingredients', weight: 0.1 }
      ],
      threshold: 0.6, // Lower = more strict matching
      includeScore: true,
      minMatchCharLength: 2
    };

    const fuse = new Fuse(foods, fuseOptions);
    const results = fuse.search(query);

    // Return the best match (lowest score)
    if (results.length > 0) {
      console.log(`Best match for "${query}": ${results[0].item.description} (score: ${results[0].score})`);
      return results[0].item;
    }

    // Fallback to first result if no good fuzzy match
    console.log(`No good fuzzy match for "${query}", using first result: ${foods[0].description}`);
    return foods[0];
  }

  /**
   * Extract calorie information from food item
   * @param {Object} food - Food item from USDA API
   * @returns {number|null} Calories per 100g
   */
  extractCalories(food) {
    try {
      if (!food.foodNutrients || !Array.isArray(food.foodNutrients)) {
        return null;
      }

      // Look for energy/calorie nutrients (nutrient ID 1008 is Energy in kcal)
      const energyNutrient = food.foodNutrients.find(nutrient => 
        nutrient.nutrientId === 1008 || 
        (nutrient.nutrientName && nutrient.nutrientName.toLowerCase().includes('energy'))
      );

      if (energyNutrient && energyNutrient.value) {
        return parseFloat(energyNutrient.value);
      }

      return null;
    } catch (error) {
      console.error('Error extracting calories:', error);
      return null;
    }
  }

  /**
   * Get calories for a specific dish
   * @param {string} dishName - Name of the dish
   * @param {number} servings - Number of servings
   * @returns {Promise<Object>} Calorie information
   */
  async getCalories(dishName, servings) {
    try {
      // Search for the dish
      const foods = await this.searchFoods(dishName);
      
      if (!foods || foods.length === 0) {
        throw new Error(`No nutrition data found for "${dishName}"`);
      }

      // Find the best matching food
      const bestMatch = this.findBestMatch(foods, dishName);
      
      if (!bestMatch) {
        throw new Error(`Could not find a suitable match for "${dishName}"`);
      }

      // Extract calories
      const caloriesPer100g = this.extractCalories(bestMatch);
      
      if (caloriesPer100g === null || caloriesPer100g === undefined) {
        throw new Error(`Calorie information not available for "${dishName}"`);
      }

      // Estimate serving size (100g is a typical serving)
      // This is a simplified approach - in reality, serving sizes vary greatly
      const estimatedServingSizeG = 100;
      const caloriesPerServing = Math.round(caloriesPer100g);
      const totalCalories = Math.round(caloriesPerServing * servings);

      return {
        dish_name: dishName,
        servings: servings,
        calories_per_serving: caloriesPerServing,
        total_calories: totalCalories,
        source: 'USDA FoodData Central',
        matched_food: bestMatch.description,
        food_id: bestMatch.fdcId
      };

    } catch (error) {
      console.error('Get calories error:', error.message);
      throw error;
    }
  }
}

const usdaService = new USDAService();
export default usdaService;