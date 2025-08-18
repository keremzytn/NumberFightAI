using System;
using System.ComponentModel.DataAnnotations;
using CardGame.Models;

namespace CardGame.API.Models
{
    public class StartMatchRequest
    {
        [Required]
        public string OpponentId { get; set; } // Can be "AI" for AI opponent
        
        public AILevel AILevel { get; set; } = AILevel.Easy; // Only used if OpponentId is "AI"
    }

    public class SubmitMoveRequest
    {
        [Required]
        public string GameId { get; set; }

        [Required]
        [Range(1, 7)]
        public int CardValue { get; set; }
    }

    public class GameStateResponse
    {
        public string GameId { get; set; }
        public int CurrentRound { get; set; }
        public GameState State { get; set; }
        public PlayerGameInfo Player1 { get; set; }
        public PlayerGameInfo Player2 { get; set; }
        public RoundResult LastRoundResult { get; set; }
        public bool IsPlayerTurn { get; set; }
        public DateTime? RoundStartTime { get; set; }
        public bool Round5SpecialRuleApplied { get; set; }
    }

    public class PlayerGameInfo
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Avatar { get; set; }
        public int Score { get; set; }
        public bool IsAI { get; set; }
        public AILevel AILevel { get; set; }
        public CardInfo[] Hand { get; set; }
    }

    public class CardInfo
    {
        public int Value { get; set; }
        public bool IsLocked { get; set; }
        public bool IsUsed { get; set; }
        public bool IsAvailable => !IsLocked && !IsUsed;
    }

    public class MatchHistoryResponse
    {
        public string GameId { get; set; }
        public string OpponentName { get; set; }
        public string OpponentAvatar { get; set; }
        public bool IsAIOpponent { get; set; }
        public AILevel OpponentAILevel { get; set; }
        public DateTime CompletedAt { get; set; }
        public bool Won { get; set; }
        public int FinalScore { get; set; }
        public int OpponentFinalScore { get; set; }
        public int TotalRounds { get; set; }
    }

    public class LeaderboardEntry
    {
        public string Username { get; set; }
        public string Avatar { get; set; }
        public int TotalGames { get; set; }
        public int Wins { get; set; }
        public double WinRate { get; set; }
        public int Rank { get; set; }
    }
}