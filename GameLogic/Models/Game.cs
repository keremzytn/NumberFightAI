using System;
using System.Collections.Generic;
using System.Linq;

namespace CardGame.Models
{
    public class Game
    {
        public string Id { get; set; }
        public Player Player1 { get; set; }
        public Player Player2 { get; set; }
        public int CurrentRound { get; set; }
        public GameState State { get; set; }
        public List<RoundResult> RoundHistory { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public Player Winner { get; set; }
        public bool Round5SpecialRuleApplied { get; set; }

        public Game(Player player1, Player player2)
        {
            Id = Guid.NewGuid().ToString();
            Player1 = player1;
            Player2 = player2;
            CurrentRound = 1;
            State = GameState.WaitingForMoves;
            RoundHistory = new List<RoundResult>();
            CreatedAt = DateTime.UtcNow;
            Round5SpecialRuleApplied = false;

            // Initialize hands
            Player1.InitializeHand();
            Player2.InitializeHand();
        }

        public bool IsGameComplete => CurrentRound > 7;

        public Player GetCurrentWinner()
        {
            if (Player1.Score > Player2.Score)
                return Player1;
            else if (Player2.Score > Player1.Score)
                return Player2;
            else
                return null; // Tie
        }

        public RoundResult PlayRound(int player1Card, int player2Card)
        {
            if (CurrentRound > 7)
                throw new InvalidOperationException("Game is already complete");

            // Validate moves
            if (!Player1.CanPlayCard(player1Card))
                throw new InvalidOperationException($"Player1 cannot play card {player1Card}");
            if (!Player2.CanPlayCard(player2Card))
                throw new InvalidOperationException($"Player2 cannot play card {player2Card}");

            // Check for round 5 special rule
            bool skipNeighborLock = false;
            if (CurrentRound == 5)
            {
                skipNeighborLock = CheckAndApplyRound5SpecialRule(Player1, player1Card) ||
                                 CheckAndApplyRound5SpecialRule(Player2, player2Card);
            }

            // Play cards
            Player1.PlayCard(player1Card);
            Player2.PlayCard(player2Card);

            // Determine winner and award points
            Player roundWinner = null;
            if (player1Card > player2Card)
            {
                Player1.Score++;
                roundWinner = Player1;
            }
            else if (player2Card > player1Card)
            {
                Player2.Score++;
                roundWinner = Player2;
            }
            // If cards are equal, no points awarded

            // Record card usage in statistics
            Player1.Statistics.RecordCardUsage(player1Card);
            Player2.Statistics.RecordCardUsage(player2Card);

            // Create round result
            var roundResult = new RoundResult
            {
                Round = CurrentRound,
                Player1Card = player1Card,
                Player2Card = player2Card,
                Winner = roundWinner,
                Player1Score = Player1.Score,
                Player2Score = Player2.Score,
                SpecialRuleApplied = skipNeighborLock
            };

            RoundHistory.Add(roundResult);

            // Apply neighbor card locks for next round (unless special rule applied)
            if (!skipNeighborLock && CurrentRound < 7)
            {
                // Unlock all cards first
                Player1.UnlockAllCards();
                Player2.UnlockAllCards();

                // Lock neighbor cards
                Player1.LockNeighborCards(player1Card);
                Player2.LockNeighborCards(player2Card);
            }

            CurrentRound++;

            // Check if game is complete
            if (IsGameComplete)
            {
                State = GameState.Completed;
                CompletedAt = DateTime.UtcNow;
                Winner = GetCurrentWinner();

                // Update player statistics
                if (Winner != null)
                {
                    Winner.Statistics.RecordGameResult(true);
                    var loser = Winner == Player1 ? Player2 : Player1;
                    loser.Statistics.RecordGameResult(false);
                }
                else
                {
                    // Tie game
                    Player1.Statistics.RecordGameResult(false);
                    Player2.Statistics.RecordGameResult(false);
                }
            }

            return roundResult;
        }

        private bool CheckAndApplyRound5SpecialRule(Player player, int selectedCard)
        {
            var availableCards = player.Hand.Where(c => !c.IsUsed).Select(c => c.Value).OrderBy(v => v).ToList();
            
            // Check for consecutive sequences of 3
            for (int i = 0; i <= availableCards.Count - 3; i++)
            {
                if (availableCards[i + 1] == availableCards[i] + 1 && 
                    availableCards[i + 2] == availableCards[i] + 2)
                {
                    // Found a sequence, check if selected card is the middle one
                    int middleCard = availableCards[i + 1];
                    if (selectedCard == middleCard)
                    {
                        Round5SpecialRuleApplied = true;
                        return true;
                    }
                }
            }

            return false;
        }
    }

    public enum GameState
    {
        WaitingForMoves,
        Completed,
        Cancelled
    }

    public class RoundResult
    {
        public int Round { get; set; }
        public int Player1Card { get; set; }
        public int Player2Card { get; set; }
        public Player Winner { get; set; }
        public int Player1Score { get; set; }
        public int Player2Score { get; set; }
        public bool SpecialRuleApplied { get; set; }
    }
}