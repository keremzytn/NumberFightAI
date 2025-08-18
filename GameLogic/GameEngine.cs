using System;
using System.Collections.Generic;
using System.Linq;
using CardGame.Models;
using CardGame.AI;

namespace CardGame.GameLogic
{
    /// <summary>
    /// Main game engine that orchestrates the card game logic
    /// </summary>
    public class GameEngine
    {
        public static Game CreateNewGame(Player player1, Player player2)
        {
            return new Game(player1, player2);
        }

        public static bool ValidateMove(Game game, string playerId, int cardValue)
        {
            var player = game.Player1.Id == playerId ? game.Player1 : game.Player2;
            if (player == null) return false;

            return player.CanPlayCard(cardValue);
        }

        public static RoundResult ExecuteRound(Game game, int player1Card, int player2Card)
        {
            return game.PlayRound(player1Card, player2Card);
        }

        public static int GetAIMove(Player aiPlayer, Player opponent, Game game)
        {
            if (!aiPlayer.IsAI)
                throw new ArgumentException("Player is not an AI");

            var strategy = AIStrategyFactory.CreateStrategy(aiPlayer.AILevel);
            return strategy.SelectCard(aiPlayer, opponent, game);
        }

        /// <summary>
        /// Analyzes the current game state and provides strategic recommendations
        /// </summary>
        public static GameAnalysis AnalyzeGameState(Game game, string playerId)
        {
            var player = game.Player1.Id == playerId ? game.Player1 : game.Player2;
            var opponent = game.Player1.Id == playerId ? game.Player2 : game.Player1;

            if (player == null)
                throw new ArgumentException("Player not found in game");

            var analysis = new GameAnalysis
            {
                CurrentRound = game.CurrentRound,
                PlayerScore = player.Score,
                OpponentScore = opponent.Score,
                AvailableCards = player.GetAvailableCards().Select(c => c.Value).ToList(),
                OpponentPossibleCards = opponent.GetAvailableCards().Select(c => c.Value).ToList(),
                IsWinning = player.Score > opponent.Score,
                RoundsRemaining = 8 - game.CurrentRound,
                CanActivateSpecialRule = false
            };

            // Check for Round 5 special rule opportunity
            if (game.CurrentRound == 5)
            {
                analysis.CanActivateSpecialRule = CheckRound5SpecialRuleOpportunity(player);
                analysis.SpecialRuleCards = GetSpecialRuleCards(player);
            }

            // Calculate win probability for each available card
            analysis.CardRecommendations = CalculateCardRecommendations(player, opponent, game);

            return analysis;
        }

        private static bool CheckRound5SpecialRuleOpportunity(Player player)
        {
            var availableValues = player.Hand.Where(c => !c.IsUsed).Select(c => c.Value).OrderBy(v => v).ToList();
            
            for (int i = 0; i <= availableValues.Count - 3; i++)
            {
                if (availableValues[i + 1] == availableValues[i] + 1 && 
                    availableValues[i + 2] == availableValues[i] + 2)
                {
                    return true;
                }
            }

            return false;
        }

        private static List<int> GetSpecialRuleCards(Player player)
        {
            var availableValues = player.Hand.Where(c => !c.IsUsed).Select(c => c.Value).OrderBy(v => v).ToList();
            var specialCards = new List<int>();
            
            for (int i = 0; i <= availableValues.Count - 3; i++)
            {
                if (availableValues[i + 1] == availableValues[i] + 1 && 
                    availableValues[i + 2] == availableValues[i] + 2)
                {
                    specialCards.Add(availableValues[i + 1]); // Middle card
                }
            }

            return specialCards;
        }

        private static List<CardRecommendation> CalculateCardRecommendations(Player player, Player opponent, Game game)
        {
            var recommendations = new List<CardRecommendation>();
            var availableCards = player.GetAvailableCards();
            var opponentCards = opponent.GetAvailableCards().Select(c => c.Value).ToList();

            foreach (var card in availableCards)
            {
                var winProbability = CalculateWinProbability(card.Value, opponentCards);
                var strategicValue = CalculateStrategicValue(card.Value, player, game);

                recommendations.Add(new CardRecommendation
                {
                    CardValue = card.Value,
                    WinProbability = winProbability,
                    StrategicValue = strategicValue,
                    OverallScore = (winProbability + strategicValue) / 2,
                    Reasoning = GenerateReasoning(card.Value, winProbability, strategicValue, game)
                });
            }

            return recommendations.OrderByDescending(r => r.OverallScore).ToList();
        }

        private static double CalculateWinProbability(int myCard, List<int> opponentCards)
        {
            if (!opponentCards.Any()) return 1.0;

            var cardsWeBeat = opponentCards.Count(opponentCard => myCard > opponentCard);
            return (double)cardsWeBeat / opponentCards.Count;
        }

        private static double CalculateStrategicValue(int cardValue, Player player, Game game)
        {
            double value = 0.0;

            // Late game: higher cards are more valuable
            if (game.CurrentRound >= 5)
            {
                value += (cardValue - 4) * 0.2;
            }

            // Consider card locking implications
            if (game.CurrentRound < 7)
            {
                var nextRoundLocks = CountNextRoundLocks(cardValue, player);
                value -= nextRoundLocks * 0.1;
            }

            // Round 5 special rule consideration
            if (game.CurrentRound == 5)
            {
                var specialCards = GetSpecialRuleCards(player);
                if (specialCards.Contains(cardValue))
                {
                    value += 0.3; // Bonus for special rule activation
                }
            }

            return Math.Max(0.0, Math.Min(1.0, value + 0.5)); // Normalize to 0-1 range
        }

        private static int CountNextRoundLocks(int cardValue, Player player)
        {
            int locks = 0;
            var hand = player.Hand;

            var lowerNeighbor = hand.FirstOrDefault(c => c.Value == cardValue - 1);
            var upperNeighbor = hand.FirstOrDefault(c => c.Value == cardValue + 1);

            if (lowerNeighbor != null && !lowerNeighbor.IsUsed)
                locks++;
            if (upperNeighbor != null && !upperNeighbor.IsUsed)
                locks++;

            return locks;
        }

        private static string GenerateReasoning(int cardValue, double winProbability, double strategicValue, Game game)
        {
            var reasons = new List<string>();

            if (winProbability > 0.7)
                reasons.Add("High chance to win round");
            else if (winProbability < 0.3)
                reasons.Add("Low chance to win round");

            if (strategicValue > 0.7)
                reasons.Add("Good strategic value");

            if (game.CurrentRound >= 5 && cardValue >= 6)
                reasons.Add("High card for late game");

            if (game.CurrentRound == 5)
                reasons.Add("Consider special rule");

            return reasons.Any() ? string.Join(", ", reasons) : "Neutral play";
        }
    }

    public class GameAnalysis
    {
        public int CurrentRound { get; set; }
        public int PlayerScore { get; set; }
        public int OpponentScore { get; set; }
        public List<int> AvailableCards { get; set; }
        public List<int> OpponentPossibleCards { get; set; }
        public bool IsWinning { get; set; }
        public int RoundsRemaining { get; set; }
        public bool CanActivateSpecialRule { get; set; }
        public List<int> SpecialRuleCards { get; set; }
        public List<CardRecommendation> CardRecommendations { get; set; }
    }

    public class CardRecommendation
    {
        public int CardValue { get; set; }
        public double WinProbability { get; set; }
        public double StrategicValue { get; set; }
        public double OverallScore { get; set; }
        public string Reasoning { get; set; }
    }
}