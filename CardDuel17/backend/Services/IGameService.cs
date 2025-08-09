using CardDuelBackend.Models;

namespace CardDuelBackend.Services;

public interface IGameService
{
    Task<GameServiceResult> CreateRoomAsync(GameMode mode, Guid hostId);
    Task<GameServiceResult> JoinRoomAsync(string roomCode, Guid userId);
    Task<GameServiceResult> PlayCardAsync(Guid roomId, Guid userId, int card);
    Task<object> StartGameAsync(Guid roomId);
    Task LeaveRoomAsync(Guid roomId, Guid userId);
    Task<string?> GetRoomCodeAsync(Guid roomId);
    Task<List<GameRoomDto>> GetActiveRoomsForUserAsync(Guid userId);
    Task MarkPlayerDisconnectedAsync(Guid roomId, Guid userId);
    Task MarkPlayerConnectedAsync(Guid roomId, Guid userId);
    Task<object?> GetCurrentGameStateAsync(Guid roomId);
    Task CleanupRoomAsync(string roomCode);
}

public class GameServiceResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? RoomCode { get; set; }
    public string? Username { get; set; }
    public GameRoomDto? RoomState { get; set; }
    public object? GameState { get; set; }
    public bool RoundComplete { get; set; }
    public bool GameComplete { get; set; }
}