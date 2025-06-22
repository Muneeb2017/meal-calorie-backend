# Calorie Tracker Backend Service

A professional Node.js backend service that provides calorie information for dishes using the USDA FoodData Central API. The service includes user authentication, rate limiting, caching, and comprehensive error handling.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **Calorie Lookup**: Integration with USDA FoodData Central API for accurate nutrition data
- **Fuzzy Matching**: Smart dish matching using Fuse.js for better search results
- **Rate Limiting**: Protection against API abuse with configurable limits
- **Caching**: Redis-style caching for improved performance
- **Input Validation**: Comprehensive validation using Joi and express-validator
- **Error Handling**: Centralized error handling with detailed logging
- **Security**: Helmet.js, CORS, and other security best practices


## 🛠 Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi & express-validator
- **Testing**: Jest & Supertest
- **External API**: USDA FoodData Central API
- **Caching**: node-cache
- **Fuzzy Search**: Fuse.js

## 📋 Prerequisites

- Node.js 16 or higher
- MongoDB (local or cloud instance)
- USDA API Key (free from https://fdc.nal.usda.gov/api-key-signup.html)

## 🔧 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd calorie-tracker-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/calorie-tracker
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   JWT_EXPIRES_IN=7d
   USDA_API_KEY=your-usda-api-key-here
   USDA_API_BASE_URL=https://api.nal.usda.gov/fdc/v1
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Run the application**:
   ```bash
   npm run dev  # Development mode with nodemon
   npm start    # Production mode
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (201)**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200)**:
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "lastLogin": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

### Calorie Endpoints

#### Get Calories
```http
POST /get-calories
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "dish_name": "chicken biryani",
  "servings": 2
}
```

**Response (200)**:
```json
{
  "dish_name": "chicken biryani",
  "servings": 2,
  "calories_per_serving": 280,
  "total_calories": 560,
  "source": "USDA FoodData Central",
  "matched_food": "Chicken biryani, with rice",
  "food_id": "123456"
}
```

### Health Check
```http
GET /health
```

**Response (200)**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

## 🔒 Security Features

- **Password Security**: bcrypt with salt rounds of 12
- **JWT Security**: Secure token generation with configurable expiration
- **Rate Limiting**: 100 requests per 15 minutes globally, 15 requests per 15 minutes for calorie endpoint
- **Input Validation**: Comprehensive validation for all endpoints
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express apps
- **Error Handling**: No sensitive data exposure in error responses