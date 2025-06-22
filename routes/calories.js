import express from 'express';
import usdaService from '../services/usdaService.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  validateCalorieRequest,
  handleValidationErrors
} from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 requests per windowMs for API calls
  message: {
    error: 'Rate limit exceeded. Maximum 15 requests per 15 minutes.'
  }
});

/**
 * @route   POST /get-calories
 * @desc    Get calorie information for a dish
 * @access  Private (requires authentication)
 */
router.post('/get-calories',
  authenticate, // Require authentication
  strictLimiter, // Add rate limiter here
  validateCalorieRequest,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { dish_name, servings } = req.body;
    
    console.log(`🔍 Calorie request from ${req.user.email}: ${dish_name} x ${servings} servings`);

    try {
      const calorieData = await usdaService.getCalories(dish_name, servings);
      
      // Log successful request
      console.log(` Calorie data found for "${dish_name}": ${calorieData.total_calories} total calories`);
      
      res.json(calorieData);
      
    } catch (error) {
      console.error(` Calorie lookup failed for "${dish_name}":`, error.message);
      
      // Handle specific error types
      if (error.message.includes('No nutrition data found')) {
        return res.status(404).json({
          error: 'Dish not found',
          message: `We couldn't find nutrition information for "${dish_name}". Try using a more specific or common dish name.`
        });
      }
      
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'Service temporarily unavailable',
          message: 'Too many requests. Please try again in a few minutes.'
        });
      }
      
      // Generic error response
      res.status(500).json({
        error: 'Unable to fetch calorie information',
        message: 'Please try again with a different dish name or contact support if the problem persists.'
      });
    }
  })
);

export default router;