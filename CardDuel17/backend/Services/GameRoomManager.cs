using System.Collections.Concurrent;
using System.Text.Json;

namespace CardDuelBackend.Services;

public class GameRoomManager : IGameRoomManager
{
    private readonly ConcurrentDictionary<Guid, GameRoomState> _activeRooms = new();
    private readonly ILogger<GameRoomManager> _logger;

    public GameRoomManager(ILogger<GameRoomManager> logger)
    {
        _logger = logger;
    }

    public void AddActiveRoom(Guid roomId, object gameState)
    {
        var roomState = new GameRoomState
        {
            RoomId = roomId,
            GameState = gameState,
            PlayerMoves = new ConcurrentDictionary<Guid, int>(),
            LastActivity = DateTime.UtcNow
        };

        _activeRooms.TryAdd(roomId, roomState);
    }

    public object? GetGameState(Guid roomId)
    {
        _activeRooms.TryGetValue(roomId, out var roomState);
        return roomState?.GameState;
    }

    public GamePlayResult PlayCard(Guid roomId, Guid userId, int card)
    {
        if (!_activeRooms.TryGetValue(roomId, out var roomState))
        {
            return new GamePlayResult
            {
                Success = false,
                ErrorMessage = "Room not found"
            };
        }

        try
        {
            // Parse current game state
            var gameStateJson = JsonSerializer.Serialize(roomState.GameState);
            var gameState = JsonSerializer.Deserialize<GameStateData>(gameStateJson);

            if (gameState == null)
            {
                return new GamePlayResult
                {
                    Success = false,
                    ErrorMessage = "Invalid game state"
                };
            }

            // Find player
            var playerIndex = Array.FindIndex(gameState.Players, p => p.Id == userId);
            if (playerIndex == -1)
            {
                return new GamePlayResult
                {
                    Success = false,
                    ErrorMessage = "Player not in game"
                };
            }

            var player = gameState.Players[playerIndex];

            // Validate card play
            if (!player.Cards.Contains(card))
            {
                return new GamePlayResult
                {
                    Success = false,
                    ErrorMessage = "Card not in hand"
                };
            }

            if (player.LockedCards.Contains(card))
            {
                return new GamePlayResult
                {
                    Success = false,
                    ErrorMessage = "Card is locked"
                };
            }

            // Record the move
            roomState.PlayerMoves.TryAdd(userId, card);
            roomState.LastActivity = DateTime.UtcNow;

            // Check if both players have played
            bool roundComplete = roomState.PlayerMoves.Count == 2;
            bool gameComplete = false;

            if (roundComplete)
            {
                // Process the round
                var moves = roomState.PlayerMoves.ToArray();
                var player1Card = moves.First(m => m.Key == gameState.Players[0].Id).Value;
                var player2Card = moves.First(m => m.Key == gameState.Players[1].Id).Value;

                // Apply game logic
                gameState = ProcessRound(gameState, player1Card, player2Card);
                gameComplete = gameState.Phase == "game_end";

                // Clear moves for next round
                roomState.PlayerMoves.Clear();
            }
            else
            {
                // Remove card from player's hand
                player.Cards = player.Cards.Where(c => c != card).ToArray();
            }

            // Update room state
            roomState.GameState = gameState;

            return new GamePlayResult
            {
                Success = true,
                GameState = gameState,
                CurrentRound = gameState.CurrentRound,
                RoundComplete = roundComplete,
                GameComplete = gameComplete
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing card play");
            return new GamePlayResult
            {
                Success = false,
                ErrorMessage = "Error processing move"
            };
        }
    }

    public void RemoveRoom(Guid roomId)
    {
        _activeRooms.TryRemove(roomId, out _);
    }

    public void RemovePlayer(Guid roomId, Guid userId)
    {
        if (_activeRooms.TryGetValue(roomId, out var roomState))
        {
            roomState.PlayerMoves.TryRemove(userId, out _);
        }
    }

    private GameStateData ProcessRound(GameStateData gameState, int player1Card, int player2Card)
    {
        // Remove cards from players' hands
        gameState.Players[0].Cards = gameState.Players[0].Cards.Where(c => c != player1Card).ToArray();
        gameState.Players[1].Cards = gameState.Players[1].Cards.Where(c => c != player2Card).ToArray();

        // Determine round winner
        string roundWinner = "tie";
        if (player1Card > player2Card)
        {
            roundWinner = "player1";
            gameState.Players[0].Score++;
        }
        else if (player2Card > player1Card)
        {
            roundWinner = "player2";
            gameState.Players[1].Score++;
        }

        // Add to round history
        var roundResult = new RoundResult
        {
            Round = gameState.CurrentRound,
            PlayerCards = new int[] { player1Card, player2Card },
            Winner = roundWinner,
            Scores = new int[] { gameState.Players[0].Score, gameState.Players[1].Score }
        };

        var roundHistory = gameState.RoundHistory.ToList();
        roundHistory.Add(roundResult);
        gameState.RoundHistory = roundHistory.ToArray();

        // Apply Rule 2: Lock adjacent cards
        ApplyAdjacentCardLock(gameState, player1Card, player2Card);

        // Check for Rule 4.4: 5th round exception
        if (gameState.CurrentRound == 5)
        {
            CheckFifthRoundException(gameState, player1Card, player2Card);
        }

        // Move to next round or end game
        if (gameState.CurrentRound >= 7)
        {
            gameState.Phase = "game_end";
            gameState.Winner = DetermineGameWinner(gameState);
        }
        else
        {
            gameState.CurrentRound++;
            gameState.Phase = "card_selection";
            gameState.RoundStartTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            
            // Clear locked cards for new round (except during 6th round exception)
            if (gameState.CurrentRound != 6 || !HasFifthRoundException(gameState))
            {
                gameState.Players[0].LockedCards = new int[0];
                gameState.Players[1].LockedCards = new int[0];
            }
        }

        return gameState;
    }

    private void ApplyAdjacentCardLock(GameStateData gameState, int player1Card, int player2Card)
    {
        // Lock adjacent cards for both players
        var cards = new int[] { player1Card, player2Card };
        
        for (int i = 0; i < 2; i++)
        {
            var player = gameState.Players[i];
            var playedCard = cards[i];
            var adjacentCards = GetAdjacentCards(playedCard);
            
            // Add adjacent cards to locked cards if they exist in player's hand
            var lockedCards = player.LockedCards.ToList();
            foreach (var adjCard in adjacentCards)
            {
                if (player.Cards.Contains(adjCard) && !lockedCards.Contains(adjCard))
                {
                    lockedCards.Add(adjCard);
                }
            }
            player.LockedCards = lockedCards.ToArray();
        }
    }

    private int[] GetAdjacentCards(int card)
    {
        var adjacent = new List<int>();
        if (card > 1) adjacent.Add(card - 1);
        if (card < 7) adjacent.Add(card + 1);
        return adjacent.ToArray();
    }

    private void CheckFifthRoundException(GameStateData gameState, int player1Card, int player2Card)
    {
        var cards = new int[] { player1Card, player2Card };
        
        for (int i = 0; i < 2; i++)
        {
            var player = gameState.Players[i];
            var playedCard = cards[i];
            
            // Check if player has 3 consecutive cards and played the middle one
            if (HasPlayedMiddleOfConsecutive(player.Cards.Concat(new[] { playedCard }).ToArray(), playedCard))
            {
                // Mark for 6th round exception (don't apply adjacent card lock in 6th round)
                player.FifthRoundException = true;
            }
        }
    }

    private bool HasPlayedMiddleOfConsecutive(int[] cards, int playedCard)
    {
        var sortedCards = cards.OrderBy(c => c).ToArray();
        
        // Find all consecutive triplets
        for (int i = 0; i <= sortedCards.Length - 3; i++)
        {
            if (sortedCards[i + 1] == sortedCards[i] + 1 && 
                sortedCards[i + 2] == sortedCards[i + 1] + 1 &&
                sortedCards[i + 1] == playedCard)
            {
                return true;
            }
        }
        return false;
    }

    private bool HasFifthRoundException(GameStateData gameState)
    {
        return gameState.Players.Any(p => p.FifthRoundException);
    }

    private string? DetermineGameWinner(GameStateData gameState)
    {
        var player1Score = gameState.Players[0].Score;
        var player2Score = gameState.Players[1].Score;
        
        if (player1Score > player2Score)
            return gameState.Players[0].Id.ToString();
        else if (player2Score > player1Score)
            return gameState.Players[1].Id.ToString();
        
        return null; // Tie
    }

    private class GameRoomState
    {
        public Guid RoomId { get; set; }
        public object GameState { get; set; } = null!;
        public ConcurrentDictionary<Guid, int> PlayerMoves { get; set; } = new();
        public DateTime LastActivity { get; set; }
    }

    private class GameStateData
    {
        public Guid Id { get; set; }
        public string Mode { get; set; } = string.Empty;
        public PlayerData[] Players { get; set; } = Array.Empty<PlayerData>();
        public int CurrentRound { get; set; }
        public int MaxRounds { get; set; }
        public long RoundStartTime { get; set; }
        public int RoundDuration { get; set; }
        public string Phase { get; set; } = string.Empty;
        public RoundResult[] RoundHistory { get; set; } = Array.Empty<RoundResult>();
        public int CurrentPlayerIndex { get; set; }
        public string? Winner { get; set; }
    }

    private class PlayerData
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int[] Cards { get; set; } = Array.Empty<int>();
        public int[] LockedCards { get; set; } = Array.Empty<int>();
        public int Score { get; set; }
        public bool IsAI { get; set; }
        public bool FifthRoundException { get; set; }
    }

    private class RoundResult
    {
        public int Round { get; set; }
        public int[] PlayerCards { get; set; } = Array.Empty<int>();
        public string Winner { get; set; } = string.Empty;
        public int[] Scores { get; set; } = Array.Empty<int>();
    }
}