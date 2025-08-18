# Card Battle - Strategic Card Game

A strategic card game where players use cards numbered 1-7 over 7 rounds, with unique mechanics including neighbor card locking and special round 5 rules.

## 🎮 Game Rules

### Basic Gameplay
- Players start with cards numbered 1-7
- Game lasts exactly 7 rounds
- Each round: players select a card, reveal simultaneously, highest card wins 1 point
- Used cards are removed permanently
- Equal cards result in no points awarded

### Neighbor Card Lock System
- After each round, cards adjacent to played cards get locked for the next round
- Example: If card 4 is played, cards 3 and 5 become locked
- Locks only last for 1 round

### Special Round 5 Rule
- If a player has 3 consecutive cards in hand at the start of round 5
- AND they play the middle card of that sequence
- THEN neighbor card locking is skipped for round 6

## 🤖 AI Difficulty Levels

- **Easy**: Random card selection (follows rules only)
- **Medium**: Analyzes opponent's history, 30% error rate
- **Hard**: Optimal play with card tracking and strategic special rule usage

## 🏗️ Project Structure

```
/workspace/
├── GameLogic/                 # Core game logic (.NET)
│   ├── Models/
│   │   ├── Card.cs           # Card model with lock/used states
│   │   ├── Player.cs         # Player model with statistics
│   │   └── Game.cs           # Game state management
│   ├── AI/
│   │   └── AIStrategy.cs     # AI difficulty implementations
│   └── GameEngine.cs         # Main game orchestration
├── API/                      # .NET Core Web API
│   ├── Controllers/
│   │   ├── AuthController.cs # Authentication endpoints
│   │   └── GameController.cs # Game management endpoints
│   ├── Models/              # API DTOs
│   ├── Services/            # Business logic services
│   └── Program.cs           # API startup configuration
└── ReactNative/             # Mobile app
    ├── src/
    │   ├── screens/         # UI screens
    │   └── services/        # API communication
    └── App.tsx              # Main app component
```

## 🚀 Getting Started

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+
- Expo CLI
- Visual Studio Code or Visual Studio

### Backend Setup (.NET Core API)

1. Navigate to the API directory:
```bash
cd /workspace/API
```

2. Restore dependencies:
```bash
dotnet restore
```

3. Run the API:
```bash
dotnet run
```

The API will be available at `https://localhost:7000` (or the port shown in console).

### Frontend Setup (React Native)

1. Navigate to the React Native directory:
```bash
cd /workspace/ReactNative
```

2. Install dependencies:
```bash
npm install
```

3. Update the API URL in `src/services/ApiService.ts`:
```typescript
const API_BASE_URL = 'https://localhost:7000/api'; // Update with your API URL
```

4. Start the Expo development server:
```bash
npx expo start
```

## 📱 Features

### Authentication
- Email/password registration and login
- Google Sign-In integration (placeholder)
- Apple Sign-In integration (placeholder)
- Password reset functionality

### Game Features
- Play against AI (3 difficulty levels)
- Real-time card state management
- Visual card locking indicators
- Round-by-round scoring
- Special rule 5 implementation
- 30-second turn timer

### User Management
- User profiles with avatars
- Game statistics tracking
- Match history
- Leaderboard system
- Friend system (placeholder)

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google-login` - Google OAuth login
- `POST /api/auth/apple-login` - Apple Sign-In login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Game Management
- `POST /api/game/start` - Start new match
- `POST /api/game/move` - Submit card move
- `GET /api/game/{gameId}` - Get game state
- `GET /api/game/history` - Get match history
- `GET /api/game/leaderboard` - Get leaderboard

## 🔧 Configuration

### API Configuration (appsettings.json)
```json
{
  "Jwt": {
    "Key": "your-secret-key-minimum-32-characters",
    "Issuer": "CardGameAPI",
    "Audience": "CardGameApp"
  }
}
```

### Security Notes
- JWT tokens expire after 30 days
- Passwords are hashed using BCrypt
- API uses HTTPS in production
- CORS configured for React Native app

## 🎨 UI/UX Features

### Visual Elements
- Clean, modern card design
- Lock icons for locked cards
- Color-coded difficulty levels
- Countdown timer for turns
- Round result animations
- Real-time score updates

### User Experience
- Intuitive card selection (tap to select, tap again to confirm)
- Visual feedback for game state
- Automatic game progression
- Error handling with user-friendly messages
- Responsive design for various screen sizes

## 🧠 AI Strategy Details

### Easy AI
- Completely random card selection
- Only follows basic game rules
- No strategic thinking

### Medium AI
- Analyzes opponent's playing patterns
- Attempts to predict next move based on history
- 30% chance to make random move (simulating human error)
- Basic pattern recognition

### Hard AI
- Tracks all opponent's remaining cards
- Calculates win probability for each possible move
- Considers long-term strategic implications
- Optimally uses Round 5 special rule
- Adapts strategy based on current score difference

## 🔄 Game Flow

1. **Game Start**: Both players receive cards 1-7
2. **Round Loop** (7 times):
   - Players select cards simultaneously
   - Cards are revealed
   - Higher card wins 1 point (ties = no points)
   - Used cards are removed
   - Neighbor cards of played cards get locked
3. **Game End**: Player with most points wins

## 📊 Statistics Tracking

- Total games played
- Win/loss record
- Win rate percentage
- Most frequently used card
- Individual card usage statistics
- Match history with detailed results

## 🚧 Future Enhancements

- Real-time multiplayer with WebSockets
- Tournament system
- Achievement system
- Card animation effects
- Sound effects and music
- Push notifications
- Social features (friend challenges, chat)
- Advanced AI with machine learning

## 🛠️ Development Notes

### Database
Currently using in-memory storage for demonstration. For production:
- Implement Entity Framework with SQL Server/PostgreSQL
- Add proper data persistence
- Implement database migrations

### Real-time Features
- Consider SignalR for real-time multiplayer
- WebSocket connections for live game updates
- Push notifications for turn reminders

### Testing
- Unit tests for game logic
- Integration tests for API endpoints
- UI testing for React Native components

## 📄 License

This project is for demonstration purposes. Please ensure proper licensing for production use.