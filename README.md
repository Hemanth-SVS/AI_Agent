# VOTER - Voter Registration Portal with AI Agent

A comprehensive full-stack voter registration system with an AI-powered chatbot assistant that helps users register to vote through natural conversation.

## 🏗️ Project Structure

```
VOTER/
├── Backend/          → Main voter portal API (Port 5000)
├── Frontend/          → Main portal UI (served by Backend)
├── AI_Backend/       → AI agent API (Port 4000)
└── AI_Frontend/      → AI chat UI (Port 3000)
```

## ✨ Features

### Main Portal (Backend + Frontend)
- ✅ User authentication (signup/login with OTP verification)
- ✅ Voter registration with Aadhaar integration
- ✅ Application status tracking
- ✅ Voter search (by Voter ID or name)
- ✅ Protected routes with JWT middleware
- ✅ Rate limiting and error handling

### AI Agent (AI_Backend + AI_Frontend)
- ✅ AI-powered chatbot using Google Gemini
- ✅ Natural language conversation interface
- ✅ Conversation history management
- ✅ User memory system (remembers user details)
- ✅ Browser automation (Puppeteer) for portal interaction
- ✅ Auto signup/login capability
- ✅ Automated voter registration submission

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or connection string)
- Google Gemini API key

### 1. Backend Setup

```bash
cd Backend
npm install

# Create .env file
MONGO_URI=mongodb://localhost:27017/voter-portal
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
PORT=5000
FRONTEND_URL=http://localhost:3000
VOTER_PORTAL_URL=http://localhost:5000

# Start server
npm run dev
```

### 2. AI Backend Setup

```bash
cd AI_Backend
npm install

# Create .env file
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash
MONGO_URI=mongodb://localhost:27017/voter-agent-db
PORT=4000
FRONTEND_URL=http://localhost:3000
VOTER_PORTAL_URL=http://localhost:5000

# Start server
npm run dev
```

### 3. AI Frontend Setup

```bash
cd AI_Frontend
npm install

# Start development server
npm start
```

The main Frontend is served by the Backend server at `http://localhost:5000`.

## 📋 API Endpoints

### Main Backend (Port 5000)

#### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login user
- `POST /api/otp/send` - Send OTP
- `POST /api/otp/verify` - Verify OTP

#### Registration
- `POST /api/register/fetch-aadhaar` - Fetch Aadhaar details
- `POST /api/register/submit` - Submit voter registration
- `GET /api/register/status` - Check application status

#### Search
- `GET /api/search/voter` - Search voter by ID or name

### AI Backend (Port 4000)

- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history/:userId` - Get conversation history
- `POST /api/chat/clear` - Clear conversation

## 🤖 AI Agent Functions

The AI agent can automatically:
1. **autoSignupAndLogin** - Create account and login
2. **submitVoterRegistration** - Submit complete registration
3. **checkApplicationStatus** - Check application status
4. **searchVoter** - Search for voter information

## 🗄️ Database Models

### Main Backend
- `User` - User accounts
- `Application` - Voter registration applications
- `Aadhaar` - Aadhaar database
- `OTP` - OTP verification
- `PollingStation` - Polling station data

### AI Backend
- `Conversation` - Chat conversation history
- `UserMemory` - Persistent user details and preferences

## 🔧 Configuration

### Environment Variables

#### Backend/.env
```env
MONGO_URI=mongodb://localhost:27017/voter-portal
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
PORT=5000
FRONTEND_URL=http://localhost:3000
VOTER_PORTAL_URL=http://localhost:5000
```

#### AI_Backend/.env
```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash
MONGO_URI=mongodb://localhost:27017/voter-agent-db
PORT=4000
FRONTEND_URL=http://localhost:3000
VOTER_PORTAL_URL=http://localhost:5000
```

## 🛠️ Technologies Used

### Backend
- Node.js, Express
- MongoDB, Mongoose
- JWT, bcryptjs
- Express Rate Limit

### AI Backend
- Node.js, Express
- Google Gemini AI (@google/genai)
- Puppeteer (Browser Automation)
- MongoDB, Mongoose

### Frontend
- Vanilla JavaScript, HTML, CSS
- React, Tailwind CSS (AI Frontend)
- Zustand (State Management)
- Framer Motion (Animations)

## 📝 Usage

1. **Start MongoDB** (if running locally)
2. **Start Backend**: `cd Backend && npm run dev`
3. **Start AI Backend**: `cd AI_Backend && npm run dev`
4. **Start AI Frontend**: `cd AI_Frontend && npm start`

5. Access:
   - Main Portal: http://localhost:5000
   - AI Chat Interface: http://localhost:3000

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API routes
- Input validation and sanitization
- CORS configuration
- Protected routes with middleware

## 🔒 Security Features

- Input sanitization on all user inputs
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API routes
- CORS configuration
- Error handling that doesn't expose sensitive data
- Environment variable validation

## 📊 Health Checks

Both backends include health check endpoints:
- Main Backend: `GET /api/health`
- AI Backend: `GET /health`

These endpoints return:
- Server status
- Database connection status
- Uptime
- Memory usage
- Model information (AI Backend)

## 🚀 Production Deployment

See `PRODUCTION_CHECKLIST.md` for complete production deployment guide.

### Quick Production Setup

1. Set `NODE_ENV=production` in `.env` files
2. Use strong JWT_SECRET (min 32 characters)
3. Configure proper CORS origins
4. Set `DEMO_MODE=false` to disable OTP in responses
5. Enable headless mode for Puppeteer (automatically enabled in production)

## 📄 License

This project is for educational/demonstration purposes.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 Changelog

### Production-Ready Updates
- ✅ Added comprehensive error handling
- ✅ Added input sanitization
- ✅ Added structured logging
- ✅ Added health check endpoints
- ✅ Added environment variable validation
- ✅ Added error boundaries in React
- ✅ Improved security measures
- ✅ Added production configurations

