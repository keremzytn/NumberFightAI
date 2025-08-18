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

    public async Task<GameRoom> CreateGameRoomAsync(Guid userId, GameMode mode)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new ArgumentException("User not found", nameof(userId));

        var room = new GameRoom
        {
            HostId = userId,
            Mode = mode,
            Code = GenerateUniqueRoomCode()
        };

        _context.GameRooms.Add(room);
        await _context.SaveChangesAsync();

        return room;
    }

    public async Task<List<GameRoomDto>> GetAvailableRoomsAsync()
    {
        var rooms = await _context.GameRooms
            .Include(r => r.Host)
            .Include(r => r.Participants)
            .Where(r => r.Status == GameRoomStatus.Waiting)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new GameRoomDto
            {
                Id = r.Id,
                Code = r.Code,
                HostUsername = r.Host.Username,
                Mode = r.Mode,
                Status = r.Status,
                ParticipantCount = r.Participants.Count,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return rooms;
    }

    public async Task JoinGameRoomAsync(string roomCode, Guid userId)
    {
        var room = await _context.GameRooms
            .Include(r => r.Participants)
            .FirstOrDefaultAsync(r => r.Code == roomCode);

        if (room == null)
            throw new ArgumentException("Room not found", nameof(roomCode));

        if (room.Status != GameRoomStatus.Waiting)
            throw new InvalidOperationException("Room is not available for joining");

        if (room.Participants.Any(p => p.UserId == userId))
            throw new InvalidOperationException("User is already in the room");

        var participant = new GameParticipant
        {
            RoomId = room.Id,
            UserId = userId,
            PlayerIndex = room.Participants.Count
        };

        _context.GameParticipants.Add(participant);
        await _context.SaveChangesAsync();
    }

    private string GenerateUniqueRoomCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        string code;
        do
        {
            code = new string(Enumerable.Repeat(chars, 6)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        } while (_context.GameRooms.Any(r => r.Code == code));

        return code;
    }

    public Task<GameServiceResult> CreateRoomAsync(GameMode mode, Guid hostId)
    {
        throw new NotImplementedException();
    }

    public Task<GameServiceResult> JoinRoomAsync(string roomCode, Guid userId)
    {
        throw new NotImplementedException();
    }

    public Task<GameServiceResult> PlayCardAsync(Guid roomId, Guid userId, int card)
    {
        throw new NotImplementedException();
    }

    public Task<object> StartGameAsync(Guid roomId)
    {
        throw new NotImplementedException();
    }

    public Task LeaveRoomAsync(Guid roomId, Guid userId)
    {
        throw new NotImplementedException();
    }

    public Task<string?> GetRoomCodeAsync(Guid roomId)
    {
        throw new NotImplementedException();
    }

    public Task<List<GameRoomDto>> GetActiveRoomsForUserAsync(Guid userId)
    {
        throw new NotImplementedException();
    }

    public Task MarkPlayerDisconnectedAsync(Guid roomId, Guid userId)
    {
        throw new NotImplementedException();
    }

    public Task MarkPlayerConnectedAsync(Guid roomId, Guid userId)
    {
        throw new NotImplementedException();
    }

    public Task<object?> GetCurrentGameStateAsync(Guid roomId)
    {
        throw new NotImplementedException();
    }

    public Task CleanupRoomAsync(string roomCode)
    {
        throw new NotImplementedException();
    }
}