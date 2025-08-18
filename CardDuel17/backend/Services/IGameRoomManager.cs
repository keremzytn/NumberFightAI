namespace CardDuelBackend.Services;

public interface IGameRoomManager
{
    void AddActiveRoom(Guid roomId, object gameState);
    object? GetGameState(Guid roomId);
    GamePlayResult PlayCard(Guid roomId, Guid userId, int card);
    void RemoveRoom(Guid roomId);
    void RemovePlayer(Guid roomId, Guid userId);
}

public class GamePlayResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public object? GameState { get; set; }
    public int CurrentRound { get; set; }
    public bool RoundComplete { get; set; }
    public bool GameComplete { get; set; }
}