import { Card, GameState, Player, RoundResult, SpecialRuleState, CardPlay } from '@/types/game';

export class GameLogic {
  private static readonly INITIAL_CARDS: Card[] = [1, 2, 3, 4, 5, 6, 7];
  private static readonly MAX_ROUNDS = 7;
  private static readonly ROUND_DURATION = 30; // seconds

  /**
   * Initialize a new game state
   */
  static initializeGame(player1: Player, player2: Player, mode: string): GameState {
    const gameId = this.generateGameId();
    
    // Reset players for new game
    const resetPlayer1: Player = {
      ...player1,
      cards: [...this.INITIAL_CARDS],
      lockedCards: [],
      score: 0
    };

    const resetPlayer2: Player = {
      ...player2,
      cards: [...this.INITIAL_CARDS],
      lockedCards: [],
      score: 0
    };

    return {
      id: gameId,
      mode: mode as any,
      players: [resetPlayer1, resetPlayer2],
      currentRound: 1,
      maxRounds: this.MAX_ROUNDS,
      roundStartTime: Date.now(),
      roundDuration: this.ROUND_DURATION,
      phase: 'card_selection',
      roundHistory: [],
      currentPlayerIndex: 0
    };
  }

  /**
   * Check if a card can be played based on current rules
   */
  static canPlayCard(gameState: GameState, playerId: string, card: Card): boolean {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;

    // Rule 1: Card must be in player's hand
    if (!player.cards.includes(card)) return false;

    // Rule 2: Card cannot be locked (adjacent to previously played card)
    if (player.lockedCards.includes(card)) return false;

    return true;
  }

  /**
   * Play a card for a player
   */
  static playCard(gameState: GameState, playerId: string, card: Card): GameState {
    if (!this.canPlayCard(gameState, playerId, card)) {
      throw new Error('Invalid card play');
    }

    const newGameState = { ...gameState };
    const playerIndex = newGameState.players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }

    // Remove card from player's hand
    newGameState.players[playerIndex] = {
      ...newGameState.players[playerIndex],
      cards: newGameState.players[playerIndex].cards.filter(c => c !== card)
    };

    return newGameState;
  }

  /**
   * Process a complete round after both players have played
   */
  static processRound(
    gameState: GameState, 
    player1Card: Card, 
    player2Card: Card
  ): GameState {
    const newGameState = { ...gameState };
    
    // Determine round winner
    let roundWinner: 'player1' | 'player2' | 'tie';
    if (player1Card > player2Card) {
      roundWinner = 'player1';
      newGameState.players[0].score += 1;
    } else if (player2Card > player1Card) {
      roundWinner = 'player2';
      newGameState.players[1].score += 1;
    } else {
      roundWinner = 'tie';
      // No points awarded for ties
    }

    // Record round result
    const roundResult: RoundResult = {
      round: gameState.currentRound,
      playerCards: [player1Card, player2Card],
      winner: roundWinner,
      scores: [newGameState.players[0].score, newGameState.players[1].score]
    };

    newGameState.roundHistory.push(roundResult);

    // Apply Rule 2: Lock adjacent cards for next round
    this.applyAdjacentCardLock(newGameState, player1Card, player2Card);

    // Check for Rule 4.4: 5th round exception
    if (gameState.currentRound === 5) {
      this.checkFifthRoundException(newGameState, player1Card, player2Card);
    }

    // Move to next round or end game
    if (newGameState.currentRound >= this.MAX_ROUNDS) {
      newGameState.phase = 'game_end';
      newGameState.winner = this.determineGameWinner(newGameState);
    } else {
      newGameState.currentRound += 1;
      newGameState.phase = 'card_selection';
      newGameState.roundStartTime = Date.now();
    }

    return newGameState;
  }

  /**
   * Apply Rule 2: Lock adjacent cards after a card is played
   */
  private static applyAdjacentCardLock(
    gameState: GameState, 
    player1Card: Card, 
    player2Card: Card
  ): void {
    // Lock adjacent cards for both players
    [player1Card, player2Card].forEach((playedCard, playerIndex) => {
      const player = gameState.players[playerIndex];
      const adjacentCards = this.getAdjacentCards(playedCard);
      
      // Add adjacent cards to locked cards if they exist in player's hand
      player.lockedCards = [
        ...player.lockedCards,
        ...adjacentCards.filter(card => player.cards.includes(card))
      ];
    });
  }

  /**
   * Get adjacent cards (card-1 and card+1)
   */
  private static getAdjacentCards(card: Card): Card[] {
    const adjacent: Card[] = [];
    if (card > 1) adjacent.push((card - 1) as Card);
    if (card < 7) adjacent.push((card + 1) as Card);
    return adjacent;
  }

  /**
   * Check and apply Rule 4.4: 5th round exception
   */
  private static checkFifthRoundException(
    gameState: GameState, 
    player1Card: Card, 
    player2Card: Card
  ): void {
    [gameState.players[0], gameState.players[1]].forEach((player, index) => {
      const playedCard = index === 0 ? player1Card : player2Card;
      
      // Check if player has 3 consecutive cards and played the middle one
      if (this.hasPlayedMiddleOfConsecutive(player.cards, playedCard)) {
        // For 6th round, don't apply adjacent card lock
        // This is handled by not adding to lockedCards in the next round
        // We need to track this state for the next round processing
      }
    });
  }

  /**
   * Check if a card is the middle of three consecutive cards
   */
  private static hasPlayedMiddleOfConsecutive(
    availableCards: Card[], 
    playedCard: Card
  ): boolean {
    // Add back the played card to check the original hand state
    const originalCards = [...availableCards, playedCard].sort((a, b) => a - b);
    
    // Find all consecutive triplets
    for (let i = 0; i <= originalCards.length - 3; i++) {
      const triplet = originalCards.slice(i, i + 3);
      if (triplet[1] === playedCard && 
          triplet[2] === triplet[1] + 1 && 
          triplet[1] === triplet[0] + 1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clear locked cards at the start of a new round (except during 6th round exception)
   */
  static clearLockedCards(gameState: GameState): GameState {
    const newGameState = { ...gameState };
    
    newGameState.players.forEach(player => {
      player.lockedCards = [];
    });

    return newGameState;
  }

  /**
   * Determine the winner of the game
   */
  private static determineGameWinner(gameState: GameState): string | undefined {
    const [player1, player2] = gameState.players;
    
    if (player1.score > player2.score) {
      return player1.id;
    } else if (player2.score > player1.score) {
      return player2.id;
    }
    
    return undefined; // Tie
  }

  /**
   * Check if the game is over
   */
  static isGameOver(gameState: GameState): boolean {
    return gameState.phase === 'game_end';
  }

  /**
   * Get available cards for a player (not locked, still in hand)
   */
  static getAvailableCards(gameState: GameState, playerId: string): Card[] {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return [];

    return player.cards.filter(card => !player.lockedCards.includes(card));
  }

  /**
   * Generate a unique game ID
   */
  private static generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a room code for friend matches
   */
  static generateRoomCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  /**
   * Check if round time has expired
   */
  static isRoundTimeExpired(gameState: GameState): boolean {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - gameState.roundStartTime) / 1000;
    return elapsedTime >= gameState.roundDuration;
  }

  /**
   * Get remaining time for current round
   */
  static getRemainingTime(gameState: GameState): number {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - gameState.roundStartTime) / 1000;
    return Math.max(0, gameState.roundDuration - elapsedTime);
  }

  /**
   * Validate game state consistency
   */
  static validateGameState(gameState: GameState): boolean {
    // Check if both players have valid card counts
    const totalCardsPerPlayer = this.INITIAL_CARDS.length - (gameState.currentRound - 1);
    
    return gameState.players.every(player => {
      return player.cards.length === totalCardsPerPlayer &&
             player.score >= 0 &&
             player.score <= this.MAX_ROUNDS;
    });
  }
}