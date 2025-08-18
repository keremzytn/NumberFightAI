using System;
using System.Collections.Generic;
using System.Linq;
using CardGame.Models;

namespace CardGame.AI
{
    public interface IAIStrategy
    {
        int SelectCard(Player aiPlayer, Player opponent, Game game);
    }

    public class EasyAIStrategy : IAIStrategy
    {
        private readonly Random _random = new Random();

        public int SelectCard(Player aiPlayer, Player opponent, Game game)
        {
            var availableCards = aiPlayer.GetAvailableCards();
            if (!availableCards.Any())
                throw new InvalidOperationException("No available cards to play");

            var randomCard = availableCards[_random.Next(availableCards.Count)];
            return randomCard.Value;
        }
    }

    public class MediumAIStrategy : IAIStrategy
    {
        private readonly Random _random = new Random();
        private const double ERROR_RATE = 0.3;

        public int SelectCard(Player aiPlayer, Player opponent, Game game)
        {
            var availableCards = aiPlayer.GetAvailableCards();
            if (!availableCards.Any())
                throw new InvalidOperationException("No available cards to play");

            // 30% chance to make a random (error) move
            if (_random.NextDouble() < ERROR_RATE)
            {
                var randomCard = availableCards[_random.Next(availableCards.Count)];
                return randomCard.Value;
            }

            // Analyze opponent's playing patterns
            var opponentHistory = opponent.PlayedCards;
            var predictedOpponentCard = PredictOpponentCard(opponent, opponentHistory);

            // Try to play a card that beats the predicted card
            var winningCards = availableCards.Where(c => c.Value > predictedOpponentCard).ToList();
            if (winningCards.Any())
            {
                // Play the lowest winning card to conserve higher cards
                return winningCards.OrderBy(c => c.Value).First().Value;
            }

            // If we can't win, play the lowest available card
            return availableCards.OrderBy(c => c.Value).First().Value;
        }

        private int PredictOpponentCard(Player opponent, List<int> history)
        {
            var availableToOpponent = opponent.Hand.Where(c => !c.IsUsed && !c.IsLocked).Select(c => c.Value).ToList();
            
            if (!availableToOpponent.Any())
                return 1; // Default prediction

            // Simple pattern analysis: look for trends in opponent's play
            if (history.Count >= 2)
            {
                var lastTwo = history.TakeLast(2).ToList();
                var trend = lastTwo[1] - lastTwo[0];
                
                var predictedValue = lastTwo[1] + trend;
                if (availableToOpponent.Contains(predictedValue))
                {
                    return predictedValue;
                }
            }

            // If no pattern detected, predict middle value of available cards
            return availableToOpponent.OrderBy(x => x).ElementAt(availableToOpponent.Count / 2);
        }
    }

    public class HardAIStrategy : IAIStrategy
    {
        public int SelectCard(Player aiPlayer, Player opponent, Game game)
        {
            var availableCards = aiPlayer.GetAvailableCards();
            if (!availableCards.Any())
                throw new InvalidOperationException("No available cards to play");

            // Check for round 5 special rule opportunity
            if (game.CurrentRound == 5)
            {
                var specialRuleCard = CheckRound5SpecialRule(aiPlayer);
                if (specialRuleCard.HasValue && availableCards.Any(c => c.Value == specialRuleCard.Value))
                {
                    return specialRuleCard.Value;
                }
            }

            // Calculate win probability for each available card
            var bestCard = availableCards
                .Select(card => new
                {
                    Card = card,
                    WinProbability = CalculateWinProbability(card.Value, aiPlayer, opponent, game)
                })
                .OrderByDescending(x => x.WinProbability)
                .ThenByDescending(x => x.Card.Value) // Prefer higher cards if probabilities are equal
                .First();

            return bestCard.Card.Value;
        }

        private int? CheckRound5SpecialRule(Player player)
        {
            var availableValues = player.Hand.Where(c => !c.IsUsed).Select(c => c.Value).OrderBy(v => v).ToList();
            
            // Look for consecutive sequences of 3
            for (int i = 0; i <= availableValues.Count - 3; i++)
            {
                if (availableValues[i + 1] == availableValues[i] + 1 && 
                    availableValues[i + 2] == availableValues[i] + 2)
                {
                    // Return the middle card of the sequence
                    return availableValues[i + 1];
                }
            }

            return null;
        }

        private double CalculateWinProbability(int myCard, Player aiPlayer, Player opponent, Game game)
        {
            var opponentAvailableCards = opponent.GetAvailableCards().Select(c => c.Value).ToList();
            
            if (!opponentAvailableCards.Any())
                return 1.0; // We win by default

            // Count how many opponent cards we can beat
            var cardsWeBeat = opponentAvailableCards.Count(opponentCard => myCard > opponentCard);
            var totalOpponentCards = opponentAvailableCards.Count;

            double baseProbability = (double)cardsWeBeat / totalOpponentCards;

            // Adjust probability based on game context
            double contextMultiplier = CalculateContextMultiplier(myCard, aiPlayer, opponent, game);

            return Math.Min(1.0, baseProbability * contextMultiplier);
        }

        private double CalculateContextMultiplier(int myCard, Player aiPlayer, Player opponent, Game game)
        {
            double multiplier = 1.0;

            // Late game: prefer higher cards
            if (game.CurrentRound >= 5)
            {
                multiplier += (myCard - 4) * 0.1; // Bonus for higher cards
            }

            // If we're behind, take more risks with higher cards
            if (aiPlayer.Score < opponent.Score)
            {
                multiplier += (myCard - 4) * 0.15;
            }

            // If we're ahead, be more conservative
            if (aiPlayer.Score > opponent.Score)
            {
                multiplier += (4 - myCard) * 0.1; // Slight preference for lower cards
            }

            // Consider card locking implications for next round
            if (game.CurrentRound < 7)
            {
                var nextRoundLocks = CountNextRoundLocks(myCard, aiPlayer);
                multiplier -= nextRoundLocks * 0.05; // Penalty for locking many cards
            }

            return Math.Max(0.1, multiplier); // Ensure multiplier doesn't go too low
        }

        private int CountNextRoundLocks(int cardValue, Player player)
        {
            int locks = 0;
            var hand = player.Hand;

            // Check if playing this card will lock valuable cards next round
            var lowerNeighbor = hand.FirstOrDefault(c => c.Value == cardValue - 1);
            var upperNeighbor = hand.FirstOrDefault(c => c.Value == cardValue + 1);

            if (lowerNeighbor != null && !lowerNeighbor.IsUsed)
                locks++;
            if (upperNeighbor != null && !upperNeighbor.IsUsed)
                locks++;

            return locks;
        }
    }

    public static class AIStrategyFactory
    {
        public static IAIStrategy CreateStrategy(AILevel level)
        {
            return level switch
            {
                AILevel.Easy => new EasyAIStrategy(),
                AILevel.Medium => new MediumAIStrategy(),
                AILevel.Hard => new HardAIStrategy(),
                _ => throw new ArgumentException($"Invalid AI level: {level}")
            };
        }
    }
}