using System;
using System.Linq;
using CardGame.Models;

namespace CardGame.GameLogic.Utils
{
    public static class GameValidator
    {
        public static ValidationResult ValidateGameState(Game game)
        {
            var errors = new List<string>();

            // Basic game state validation
            if (game.CurrentRound < 1 || game.CurrentRound > 7)
                errors.Add($"Invalid round number: {game.CurrentRound}");

            if (game.Player1 == null || game.Player2 == null)
                errors.Add("Missing players");

            // Validate player hands
            var player1Validation = ValidatePlayerHand(game.Player1);
            var player2Validation = ValidatePlayerHand(game.Player2);

            errors.AddRange(player1Validation.Errors);
            errors.AddRange(player2Validation.Errors);

            // Validate scores
            if (game.Player1.Score < 0 || game.Player1.Score > 7)
                errors.Add($"Invalid Player1 score: {game.Player1.Score}");

            if (game.Player2.Score < 0 || game.Player2.Score > 7)
                errors.Add($"Invalid Player2 score: {game.Player2.Score}");

            // Validate round history
            if (game.RoundHistory.Count != game.CurrentRound - 1)
                errors.Add("Round history count doesn't match current round");

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                Errors = errors
            };
        }

        public static ValidationResult ValidatePlayerHand(Player player)
        {
            var errors = new List<string>();

            if (player.Hand.Count != 7)
                errors.Add($"Player {player.Name} doesn't have 7 cards");

            // Check for duplicate card values
            var cardValues = player.Hand.Select(c => c.Value).ToList();
            var duplicates = cardValues.GroupBy(v => v).Where(g => g.Count() > 1).Select(g => g.Key);
            if (duplicates.Any())
                errors.Add($"Player {player.Name} has duplicate cards: {string.Join(", ", duplicates)}");

            // Check for invalid card values
            var invalidCards = cardValues.Where(v => v < 1 || v > 7);
            if (invalidCards.Any())
                errors.Add($"Player {player.Name} has invalid card values: {string.Join(", ", invalidCards)}");

            // Check for missing card values
            var missingCards = Enumerable.Range(1, 7).Except(cardValues);
            if (missingCards.Any())
                errors.Add($"Player {player.Name} is missing cards: {string.Join(", ", missingCards)}");

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                Errors = errors
            };
        }

        public static ValidationResult ValidateMove(Game game, string playerId, int cardValue)
        {
            var errors = new List<string>();

            // Check if game is in valid state for moves
            if (game.State != GameState.WaitingForMoves)
                errors.Add("Game is not accepting moves");

            if (game.IsGameComplete)
                errors.Add("Game is already complete");

            // Find the player
            var player = game.Player1.Id == playerId ? game.Player1 : 
                        game.Player2.Id == playerId ? game.Player2 : null;

            if (player == null)
                errors.Add("Player not found in this game");
            else
            {
                // Validate card selection
                if (cardValue < 1 || cardValue > 7)
                    errors.Add("Invalid card value");

                var card = player.Hand.FirstOrDefault(c => c.Value == cardValue);
                if (card == null)
                    errors.Add("Card not found in player's hand");
                else
                {
                    if (card.IsUsed)
                        errors.Add("Card has already been used");

                    if (card.IsLocked)
                        errors.Add("Card is currently locked");
                }
            }

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                Errors = errors
            };
        }

        public static bool IsValidCardSequence(List<int> cards)
        {
            if (cards.Count < 3) return false;

            cards = cards.OrderBy(c => c).ToList();
            for (int i = 0; i <= cards.Count - 3; i++)
            {
                if (cards[i + 1] == cards[i] + 1 && cards[i + 2] == cards[i] + 2)
                {
                    return true;
                }
            }
            return false;
        }

        public static List<int> FindConsecutiveSequences(List<int> cards)
        {
            var sequences = new List<int>();
            cards = cards.OrderBy(c => c).ToList();

            for (int i = 0; i <= cards.Count - 3; i++)
            {
                if (cards[i + 1] == cards[i] + 1 && cards[i + 2] == cards[i] + 2)
                {
                    sequences.Add(cards[i + 1]); // Add middle card
                }
            }

            return sequences;
        }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }
}