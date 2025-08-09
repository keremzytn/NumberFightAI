export type Card = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  lockedCards: Card[];
  score: number;
  isAI?: boolean;
  difficulty?: AILevel;
}

export type AILevel = 'easy' | 'medium' | 'hard';

export type GameMode = 'singleplayer' | 'online' | 'friend';

export interface GameState {
  id: string;
  mode: GameMode;
  players: [Player, Player];
  currentRound: number;
  maxRounds: number;
  roundStartTime: number;
  roundDuration: number; // in seconds
  phase: GamePhase;
  winner?: string;
  roundHistory: RoundResult[];
  currentPlayerIndex: number;
}

export type GamePhase = 
  | 'waiting'
  | 'card_selection'
  | 'revealing'
  | 'round_end'
  | 'game_end';

export interface RoundResult {
  round: number;
  playerCards: [Card | null, Card | null];
  winner: 'player1' | 'player2' | 'tie';
  scores: [number, number];
}

export interface CardPlay {
  playerId: string;
  card: Card;
  timestamp: number;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  averageGameDuration: number;
  favoriteCard?: Card;
  winRate: number;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  gameState?: GameState;
  createdAt: number;
  isActive: boolean;
}

// Special rule types
export interface SpecialRuleState {
  fifthRoundException: boolean; // Rule 4.4 - 5th round exception for consecutive cards
  consecutiveCards?: [Card, Card, Card]; // The three consecutive cards
  middleCard?: Card; // The middle card that was played
}

// AI decision making
export interface AIContext {
  playerCards: Card[];
  opponentPlayedCards: Card[];
  lockedCards: Card[];
  currentRound: number;
  scores: [number, number];
  roundHistory: RoundResult[];
  difficulty: AILevel;
}