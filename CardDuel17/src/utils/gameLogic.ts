import { Card, GameState, Player, RoundResult, SpecialRuleState } from '@/types/game';

export class GameLogic {
  private static readonly INITIAL_CARDS: Card[] = [1, 2, 3, 4, 5, 6, 7];
  private static readonly MAX_ROUNDS = 7;
  private static readonly ROUND_DURATION = 30; // seconds

  /** Initialize a new game state */
  static initializeGame(player1: Player, player2: Player, mode: string): GameState {
    const gameId = this.generateGameId();

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
      currentPlayerIndex: 0,
      specialRules: [],
      usedCards: {
        [resetPlayer1.id]: [],
        [resetPlayer2.id]: []
      }
    };
  }

  /** Check if a card can be played */
  static canPlayCard(gameState: GameState, playerId: string, card: Card): boolean {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;

    // Kart elde mi?
    if (!player.cards.includes(card)) return false;

    // Daha önce kullanıldı mı?
    if (gameState.usedCards[playerId].includes(card)) return false;

    // Kilitli mi?
    if (player.lockedCards.includes(card)) return false;

    return true;
  }

  /** Play a card (kalıcı kilit + elde çıkarma) */
  static playCard(gameState: GameState, playerId: string, card: Card): GameState {
    if (!this.canPlayCard(gameState, playerId, card)) {
      throw new Error('Invalid card play');
    }

    const newGameState = { ...gameState };
    const playerIndex = newGameState.players.findIndex(p => p.id === playerId);

    if (playerIndex === -1) {
      throw new Error('Player not found');
    }

    // Kartı oyuncunun elinden çıkar ve kalıcı kilitle
    newGameState.players[playerIndex] = {
      ...newGameState.players[playerIndex],
      cards: newGameState.players[playerIndex].cards.filter(c => c !== card),
      lockedCards: [...newGameState.players[playerIndex].lockedCards, card]
    };

    // Kalıcı kullanılan kart listesine ekle
    newGameState.usedCards[playerId] = [...newGameState.usedCards[playerId], card];

    return newGameState;
  }

  /** Process a complete round */
  static processRound(gameState: GameState, player1Card: Card, player2Card: Card): GameState {
    const newGameState = { ...gameState };

    // Round kazananı belirle
    let roundWinner: 'player1' | 'player2' | 'tie';
    if (player1Card > player2Card) {
      roundWinner = 'player1';
      newGameState.players[0].score += 1;
    } else if (player2Card > player1Card) {
      roundWinner = 'player2';
      newGameState.players[1].score += 1;
    } else {
      roundWinner = 'tie';
    }

    // Sonuç kaydet
    const roundResult: RoundResult = {
      round: gameState.currentRound,
      playerCards: [player1Card, player2Card],
      winner: roundWinner,
      scores: [newGameState.players[0].score, newGameState.players[1].score]
    };
    newGameState.roundHistory.push(roundResult);

    // Komşu kilit uygula
    this.applyAdjacentCardLock(newGameState, player1Card, player2Card);

    // 5. round istisnası kontrol et
    if (gameState.currentRound === 5) {
      this.checkFifthRoundException(newGameState, player1Card, player2Card);
    }

    // Oyun bitiş kontrolü
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

  /** Lock adjacent cards (sadece sonraki round için) */
  private static applyAdjacentCardLock(gameState: GameState, player1Card: Card, player2Card: Card): void {
    [player1Card, player2Card].forEach((playedCard, playerIndex) => {
      const player = gameState.players[playerIndex];

      // 6. round istisnası
      if (gameState.currentRound === 6 && gameState.specialRules) {
        const hasException = gameState.specialRules.some(rule =>
          rule.fifthRoundException &&
          rule.playerId === player.id &&
          rule.middleCard === playedCard
        );
        if (hasException) return; // komşular kilitlenmez
      }

      const adjacentCards = this.getAdjacentCards(playedCard);

      player.lockedCards = [
        ...player.lockedCards,
        ...adjacentCards.filter(card => player.cards.includes(card))
      ];
    });
  }

  /** Get adjacent cards */
  private static getAdjacentCards(card: Card): Card[] {
    const adjacent: Card[] = [];
    if (card > 1) adjacent.push((card - 1) as Card);
    if (card < 7) adjacent.push((card + 1) as Card);
    return adjacent;
  }

  /** Check and apply 5. round exception */
  private static checkFifthRoundException(gameState: GameState, player1Card: Card, player2Card: Card): void {
    [gameState.players[0], gameState.players[1]].forEach((player, index) => {
      const playedCard = index === 0 ? player1Card : player2Card;
      const remainingCards = player.cards;

      const sortedCards = [...remainingCards, playedCard].sort((a, b) => a - b);
      for (let i = 0; i < sortedCards.length - 2; i++) {
        if (
          sortedCards[i + 1] === playedCard &&
          sortedCards[i + 1] === sortedCards[i] + 1 &&
          sortedCards[i + 2] === sortedCards[i + 1] + 1
        ) {
          if (!gameState.specialRules) {
            gameState.specialRules = [];
          }
          gameState.specialRules.push({
            fifthRoundException: true,
            playerId: player.id,
            middleCard: playedCard
          });
        }
      }
    });
  }

  /** Clear locked cards (sadece geçici olanları temizlemek için kullanılabilir) */
  static clearLockedCards(gameState: GameState): GameState {
    const newGameState = { ...gameState };
    newGameState.players.forEach(player => {
      // sadece geçici kilitler temizlenmeli, kalıcılar (oynanan kartlar) kalmalı
      player.lockedCards = player.lockedCards.filter(card =>
        newGameState.usedCards[player.id].includes(card) // oynanan kartlar kalır
      );
    });
    return newGameState;
  }

  /** Determine the winner */
  private static determineGameWinner(gameState: GameState): string | undefined {
    const [player1, player2] = gameState.players;
    if (player1.score > player2.score) return player1.id;
    if (player2.score > player1.score) return player2.id;
    return undefined;
  }

  /** Is game over? */
  static isGameOver(gameState: GameState): boolean {
    return gameState.phase === 'game_end';
  }

  /** Get available cards for a player */
  static getAvailableCards(gameState: GameState, playerId: string): Card[] {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return [];
    return player.cards.filter(card => !player.lockedCards.includes(card));
  }

  /** Generate unique game ID */
  private static generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /** Generate room code */
  static generateRoomCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  /** Check if round time expired */
  static isRoundTimeExpired(gameState: GameState): boolean {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - gameState.roundStartTime) / 1000;
    return elapsedTime >= gameState.roundDuration;
  }

  /** Get remaining time */
  static getRemainingTime(gameState: GameState): number {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - gameState.roundStartTime) / 1000;
    return Math.max(0, gameState.roundDuration - elapsedTime);
  }

  /** Validate game state */
  static validateGameState(gameState: GameState): boolean {
    const totalCardsPerPlayer = this.INITIAL_CARDS.length - (gameState.currentRound - 1);
    return gameState.players.every(player => {
      return (
        player.cards.length <= totalCardsPerPlayer &&
        player.score >= 0 &&
        player.score <= this.MAX_ROUNDS
      );
    });
  }
}
