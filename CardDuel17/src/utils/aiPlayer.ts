import { Card, AILevel, AIContext, GameState, RoundResult } from '@/types/game';
import { GameLogic } from './gameLogic';

export class AIPlayer {
  /**
   * Main entry point for AI card selection
   */
  static selectCard(context: AIContext): Card {
    const availableCards = context.playerCards.filter(
      card => !context.lockedCards.includes(card)
    );

    if (availableCards.length === 0) {
      throw new Error('No available cards to play');
    }

    switch (context.difficulty) {
      case 'easy':
        return this.selectCardEasy(availableCards);
      case 'medium':
        return this.selectCardMedium(context, availableCards);
      case 'hard':
        return this.selectCardHard(context, availableCards);
      default:
        return this.selectCardEasy(availableCards);
    }
  }

  /**
   * Easy AI: Random card selection, only follows rules
   */
  private static selectCardEasy(availableCards: Card[]): Card {
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    return availableCards[randomIndex];
  }

  /**
   * Medium AI: Considers opponent's patterns with 30% error rate
   */
  private static selectCardMedium(context: AIContext, availableCards: Card[]): Card {
    // 30% chance to make a "wrong" decision (random)
    if (Math.random() < 0.3) {
      return this.selectCardEasy(availableCards);
    }

    // Try to predict opponent's likely cards
    const opponentRemainingCards = this.getOpponentRemainingCards(context);
    const strategicCard = this.selectStrategicCard(
      availableCards, 
      opponentRemainingCards, 
      context
    );

    return strategicCard || this.selectCardEasy(availableCards);
  }

  /**
   * Hard AI: Advanced strategy with opponent tracking and optimal play
   */
  private static selectCardHard(context: AIContext, availableCards: Card[]): Card {
    const opponentRemainingCards = this.getOpponentRemainingCards(context);
    
    // Check for 5th round special case optimization
    if (context.currentRound === 5) {
      const specialCard = this.checkFifthRoundSpecialPlay(availableCards);
      if (specialCard) {
        return specialCard;
      }
    }

    // Calculate optimal card based on winning probability
    const cardScores = availableCards.map(card => ({
      card,
      score: this.calculateCardScore(card, opponentRemainingCards, context)
    }));

    // Sort by score and pick the best
    cardScores.sort((a, b) => b.score - a.score);
    return cardScores[0].card;
  }

  /**
   * Get remaining cards for opponent based on what's been played
   */
  private static getOpponentRemainingCards(context: AIContext): Card[] {
    const allCards: Card[] = [1, 2, 3, 4, 5, 6, 7];
    const playedCards = context.opponentPlayedCards;
    
    // Remove played cards from possible remaining cards
    return allCards.filter(card => !playedCards.includes(card));
  }

  /**
   * Select a strategic card based on available information
   */
  private static selectStrategicCard(
    availableCards: Card[], 
    opponentCards: Card[], 
    context: AIContext
  ): Card | null {
    // If we're behind, try to play higher cards
    const [aiScore, opponentScore] = context.scores;
    const isAIBehind = aiScore < opponentScore;
    const isAIAhead = aiScore > opponentScore;

    if (isAIBehind) {
      // Play higher cards when behind
      const highCards = availableCards.filter(card => card >= 5);
      if (highCards.length > 0) {
        return Math.max(...highCards) as Card;
      }
    } else if (isAIAhead) {
      // Play conservatively when ahead
      const lowCards = availableCards.filter(card => card <= 3);
      if (lowCards.length > 0) {
        return Math.min(...lowCards) as Card;
      }
    }

    // Default to middle strategy
    return this.selectMiddleValueCard(availableCards);
  }

  /**
   * Calculate score for a card based on winning probability
   */
  private static calculateCardScore(
    card: Card, 
    opponentCards: Card[], 
    context: AIContext
  ): number {
    let score = 0;

    // Base score: number of opponent cards this can beat
    const beatsCount = opponentCards.filter(opCard => card > opCard).length;
    const tiesCount = opponentCards.filter(opCard => card === opCard).length;
    
    score += beatsCount * 10; // 10 points for each card we can beat
    score += tiesCount * 1;   // 1 point for ties (neutral)

    // Bonus for preserving high-value cards for later rounds
    const remainingRounds = 7 - context.currentRound + 1;
    if (card >= 6 && remainingRounds > 2) {
      score -= 5; // Penalty for using high cards early
    }

    // Bonus for using low cards early
    if (card <= 2 && remainingRounds > 4) {
      score += 3;
    }

    // Strategic position bonus
    const [aiScore, opponentScore] = context.scores;
    if (aiScore < opponentScore && card >= 5) {
      score += 8; // Bonus for aggressive play when behind
    }

    return score;
  }

  /**
   * Check for optimal 5th round special rule play
   */
  private static checkFifthRoundSpecialPlay(availableCards: Card[]): Card | null {
    // Look for consecutive triplets where we can play the middle card
    const sortedCards = [...availableCards].sort((a, b) => a - b);
    
    for (let i = 0; i <= sortedCards.length - 3; i++) {
      const triplet = sortedCards.slice(i, i + 3);
      if (triplet[2] === triplet[1] + 1 && triplet[1] === triplet[0] + 1) {
        // Found consecutive triplet, return middle card
        return triplet[1];
      }
    }

    return null;
  }

  /**
   * Select a middle-value card as fallback strategy
   */
  private static selectMiddleValueCard(availableCards: Card[]): Card {
    const sortedCards = [...availableCards].sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedCards.length / 2);
    return sortedCards[middleIndex];
  }

  /**
   * Analyze opponent's playing pattern for medium and hard AI
   */
  private static analyzeOpponentPattern(roundHistory: RoundResult[]): {
    preferredRange: 'low' | 'high' | 'mixed';
    aggressiveness: number; // 0-1 scale
  } {
    if (roundHistory.length === 0) {
      return { preferredRange: 'mixed', aggressiveness: 0.5 };
    }

    const opponentCards = roundHistory
      .map(round => round.playerCards[1]) // Assuming opponent is player 2
      .filter(card => card !== null) as Card[];

    const avgCard = opponentCards.reduce((sum, card) => sum + card, 0) / opponentCards.length;
    const highCardCount = opponentCards.filter(card => card >= 5).length;
    
    const preferredRange = avgCard <= 3 ? 'low' : avgCard >= 5 ? 'high' : 'mixed';
    const aggressiveness = highCardCount / opponentCards.length;

    return { preferredRange, aggressiveness };
  }

  /**
   * Predict opponent's likely next move (for hard AI)
   */
  static predictOpponentMove(context: AIContext): Card[] {
    const opponentCards = this.getOpponentRemainingCards(context);
    const pattern = this.analyzeOpponentPattern(context.roundHistory);

    // Filter cards based on opponent's pattern
    let likelyCards = opponentCards;

    if (pattern.preferredRange === 'low') {
      likelyCards = opponentCards.filter(card => card <= 4);
    } else if (pattern.preferredRange === 'high') {
      likelyCards = opponentCards.filter(card => card >= 4);
    }

    // If no cards in preferred range, return all available
    return likelyCards.length > 0 ? likelyCards : opponentCards;
  }

  /**
   * Get AI recommendation for human player (tutorial/hint system)
   */
  static getHint(context: AIContext): {
    recommendedCard: Card;
    reasoning: string;
  } {
    const availableCards = context.playerCards.filter(
      card => !context.lockedCards.includes(card)
    );

    if (availableCards.length === 0) {
      throw new Error('No available cards');
    }

    // Use medium AI logic for hints
    const aiContext: AIContext = { ...context, difficulty: 'medium' };
    const recommendedCard = this.selectCardMedium(aiContext, availableCards);

    // Generate reasoning
    let reasoning = `Card ${recommendedCard} is recommended because `;
    
    const [playerScore, opponentScore] = context.scores;
    if (playerScore < opponentScore) {
      reasoning += "you're behind and need to play aggressively.";
    } else if (playerScore > opponentScore) {
      reasoning += "you're ahead and can play conservatively.";
    } else {
      reasoning += "the scores are tied and this maintains good balance.";
    }

    return { recommendedCard, reasoning };
  }
}