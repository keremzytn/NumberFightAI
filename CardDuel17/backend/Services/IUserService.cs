using CardDuelBackend.Models;

namespace CardDuelBackend.Services;

public interface IUserService
{
    Task<Guid> CreateOrGetUserAsync(string username);
    Task<User?> GetUserByIdAsync(Guid userId);
    Task<UserStatsDto?> GetUserStatsAsync(Guid userId);
    Task UpdateUserStatsAsync(Guid userId, int score, bool won, TimeSpan duration);
    Task<List<MatchHistory>> GetMatchHistoryAsync(Guid userId, int limit = 10);
}
