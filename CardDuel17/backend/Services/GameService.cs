using Microsoft.EntityFrameworkCore;
using CardDuelBackend.Data;
using CardDuelBackend.Models;
using System.Text.Json;

namespace CardDuelBackend.Services;

public class GameService : IGameService
{
    private readonly GameDbContext _context;
    private readonly IGameRoomManager _roomManager;
    private readonly ILogger<GameService> _logger;

    public GameService(GameDbContext context, IGameRoomManager roomManager, ILogger<GameService> logger)
    {
        _context = context;
        _roomManager = roomManager;
        _logger = logger;
    }

    public async Task<GameServiceResult> CreateRoomAsync(GameMode mode, Guid hostId)
    {
        try
        {
            var host = await _context.Users.FindAsync(hostId);
            if (host == null)
            {
                return new GameServiceResult
                {
                    Success = false,
                    ErrorMessage = "User not found"
                };
            }

            var roomCode = GenerateRoomCode();
            var room = new GameRoom
            {
                Code = roomCode,
                HostId = hostId,
                Mode = mode,
                Status = GameRoomStatus.Waiting
            };

            _context.GameRooms.Add(room);

            // Add host as participant
            var hostParticipant = new GameParticipant
            {
                RoomId = room.Id,
                UserId = hostId,
                PlayerIndex = 0
            };

            _context.GameParticipants.Add(hostParticipant);
            await _context.SaveChangesAsync();

            var roomDto = new GameRoomDto
            {
                Id = room.Id,
                Code = roomCode,
                HostUsername = host.Username,
                Mode = mode,
                Status = GameRoomStatus.Waiting,
                ParticipantCount = 1,
                CreatedAt = room.CreatedAt
            };

            return new GameServiceResult
            {
                Success = true,
                RoomCode = roomCode,
                RoomState = roomDto
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating room");
            return new GameServiceResult
            {
                Success = false,
                ErrorMessage = "Failed to create room"
            };
        }
    }

    public async Task<GameServiceResult> JoinRoomAsync(string roomCode, Guid userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return new GameServiceResult
                {
                    Success = false,
                    ErrorMessage = "User not found"
                };
            }

            var room = await _context.GameRooms
                .Include(r => r.Host)
                .Include(r => r.Participants)
                .FirstOrDefaultAsync(r => r.Code == roomCode);

            if (room == null)
            {
                return new GameServiceResult
                {
                    Success = false,
                    ErrorMessage = "Room not found"
                };
            }

            if (room.Status != GameRoomStatus.Waiting)
            {
                return new GameServiceResult
                {
                    Success = false,
                    ErrorMessage = "Room is not available for joining"
                };
            }

            if (room.Participants.Count >= 2)
            {
                return new GameServiceResult
                {
                    Success = false,
                    ErrorMessage = "Room is full"
                };
            }

            // Check if user is already in the room
            if (room.Participants.Any(p => p.UserId == userId))
            {
                return new GameServiceResult
                {
                    Success = false,
                    ErrorMessage = "User already in room"
                };
            }

            // Add user as participant
            var participant = new GameParticipant
            {
                RoomId = room.Id,
                UserId = userId,
                PlayerIndex = 1
            };

            _context.GameParticipants.Add(participant);
            await _context.SaveChangesAsync();

            var roomDto = new GameRoomDto
            {
                Id = room.Id,
                Code = roomCode,
                HostUsername = room.Host.Username,
                Mode = room.Mode,
                Status = room.Status,
                ParticipantCount = room.Participants.Count + 1,
                CreatedAt = room.CreatedAt
            };

            return new GameServiceResult
            {
                Success = true,
                Username = user.Username,
                RoomState = roomDto
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining room");
            return new GameServiceResult
            {
                Success = false,
                ErrorMessage = "Failed to join room"
            };
        }
    }

    public async Task<object> StartGameAsync(Guid roomId)
    {
        var room = await _context.GameRooms
            .Include(r => r.Participants)
            .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null) throw new Exception("Room not found");

        room.Status = GameRoomStatus.InProgress;
        room.StartedAt = DateTime.UtcNow;

        // Initialize game state
        var gameState = new
        {
            Id = roomId,
            Mode = room.Mode.ToString(),
            Players = room.Participants.OrderBy(p => p.PlayerIndex).Select(p => new
            {
                Id = p.UserId,
                Name = p.User.Username,
                Cards = Enumerable.Range(1, 7).ToArray(),
                LockedCards = new int[0],
                Score = 0,
                IsAI = false
            }).ToArray(),
            CurrentRound = 1,
            MaxRounds = 7,
            RoundStartTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            RoundDuration = 30,
            Phase = "card_selection",
            RoundHistory = new object[0],
            CurrentPlayerIndex = 0
        };

        room.GameStateJson = JsonSerializer.Serialize(gameState);
        await _context.SaveChangesAsync();

        _roomManager.AddActiveRoom(roomId, gameState);

        return gameState;
    }

    public async Task<GameServiceResult> PlayCardAsync(Guid roomId, Guid userId, int card)
    {
        try
        {
            var gameState = _roomManager.GetGameState(roomId);
            if (gameState == null)
            {
                return new GameServiceResult
                {
                    Success = false,
                    ErrorMessage = "Game not found"
                };
            }

            // Validate card play (implement game logic validation here)
            var result = _roomManager.PlayCard(roomId, userId, card);
            
            if (!result.Success)
            {
                return new GameServiceResult
                {
                    Success = false,
                    ErrorMessage = result.ErrorMessage
                };
            }

            // Record the move in database
            var move = new RoundMove
            {
                RoomId = roomId,
                UserId = userId,
                Round = result.CurrentRound,
                Card = card
            };

            _context.RoundMoves.Add(move);

            // Update room's game state
            var room = await _context.GameRooms.FindAsync(roomId);
            if (room != null)
            {
                room.GameStateJson = JsonSerializer.Serialize(result.GameState);
                await _context.SaveChangesAsync();
            }

            // Check if game is complete
            if (result.GameComplete)
            {
                await SaveMatchHistoryAsync(roomId, result.GameState);
                room!.Status = GameRoomStatus.Completed;
                room.CompletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return new GameServiceResult
            {
                Success = true,
                GameState = result.GameState,
                RoundComplete = result.RoundComplete,
                GameComplete = result.GameComplete
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error playing card");
            return new GameServiceResult
            {
                Success = false,
                ErrorMessage = "Failed to play card"
            };
        }
    }

    public async Task<string?> GetRoomCodeAsync(Guid roomId)
    {
        var room = await _context.GameRooms.FindAsync(roomId);
        return room?.Code;
    }

    public async Task<List<GameRoomDto>> GetActiveRoomsForUserAsync(Guid userId)
    {
        return await _context.GameParticipants
            .Where(p => p.UserId == userId && p.Room.Status == GameRoomStatus.InProgress)
            .Select(p => new GameRoomDto
            {
                Id = p.Room.Id,
                Code = p.Room.Code,
                HostUsername = p.Room.Host.Username,
                Mode = p.Room.Mode,
                Status = p.Room.Status,
                ParticipantCount = p.Room.Participants.Count,
                CreatedAt = p.Room.CreatedAt
            })
            .ToListAsync();
    }

    public async Task LeaveRoomAsync(Guid roomId, Guid userId)
    {
        var participant = await _context.GameParticipants
            .FirstOrDefaultAsync(p => p.RoomId == roomId && p.UserId == userId);

        if (participant != null)
        {
            _context.GameParticipants.Remove(participant);
            await _context.SaveChangesAsync();
        }

        // Remove from in-memory room manager
        _roomManager.RemovePlayer(roomId, userId);
    }

    public async Task MarkPlayerDisconnectedAsync(Guid roomId, Guid userId)
    {
        var participant = await _context.GameParticipants
            .FirstOrDefaultAsync(p => p.RoomId == roomId && p.UserId == userId);

        if (participant != null)
        {
            participant.IsConnected = false;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkPlayerConnectedAsync(Guid roomId, Guid userId)
    {
        var participant = await _context.GameParticipants
            .FirstOrDefaultAsync(p => p.RoomId == roomId && p.UserId == userId);

        if (participant != null)
        {
            participant.IsConnected = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<object?> GetCurrentGameStateAsync(Guid roomId)
    {
        var room = await _context.GameRooms.FindAsync(roomId);
        if (room?.GameStateJson != null)
        {
            return JsonSerializer.Deserialize<object>(room.GameStateJson);
        }
        return _roomManager.GetGameState(roomId);
    }

    public async Task CleanupRoomAsync(string roomCode)
    {
        var room = await _context.GameRooms
            .Include(r => r.Participants)
            .FirstOrDefaultAsync(r => r.Code == roomCode);

        if (room != null)
        {
            _context.GameParticipants.RemoveRange(room.Participants);
            _context.GameRooms.Remove(room);
            await _context.SaveChangesAsync();
        }

        _roomManager.RemoveRoom(room?.Id ?? Guid.Empty);
    }

    private async Task SaveMatchHistoryAsync(Guid roomId, object gameState)
    {
        try
        {
            var room = await _context.GameRooms
                .Include(r => r.Participants)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null || room.Participants.Count != 2) return;

            var participants = room.Participants.OrderBy(p => p.PlayerIndex).ToList();
            
            // Parse game state to extract final scores and winner
            var gameStateJson = JsonSerializer.Serialize(gameState);
            var gameStateElement = JsonSerializer.Deserialize<JsonElement>(gameStateJson);
            
            var players = gameStateElement.GetProperty("Players").EnumerateArray().ToArray();
            var player1Score = players[0].GetProperty("Score").GetInt32();
            var player2Score = players[1].GetProperty("Score").GetInt32();
            
            Guid? winnerId = null;
            if (player1Score > player2Score)
                winnerId = participants[0].UserId;
            else if (player2Score > player1Score)
                winnerId = participants[1].UserId;

            var matchHistory = new MatchHistory
            {
                RoomId = roomId,
                Player1Id = participants[0].UserId,
                Player2Id = participants[1].UserId,
                WinnerId = winnerId,
                Player1Score = player1Score,
                Player2Score = player2Score,
                Mode = room.Mode,
                TotalRounds = gameStateElement.GetProperty("CurrentRound").GetInt32() - 1,
                Duration = DateTime.UtcNow - (room.StartedAt ?? DateTime.UtcNow),
                RoundHistoryJson = gameStateElement.GetProperty("RoundHistory").GetRawText()
            };

            _context.MatchHistories.Add(matchHistory);

            // Update user statistics
            await UpdateUserStatsAsync(participants[0].UserId, player1Score, winnerId == participants[0].UserId);
            await UpdateUserStatsAsync(participants[1].UserId, player2Score, winnerId == participants[1].UserId);

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving match history");
        }
    }

    private async Task UpdateUserStatsAsync(Guid userId, int score, bool won)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.GamesPlayed++;
            if (won) user.GamesWon++;
            user.TotalScore += score;
            user.LastActive = DateTime.UtcNow;
        }
    }

    private string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 6)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}