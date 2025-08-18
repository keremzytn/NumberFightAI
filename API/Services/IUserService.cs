using CardGame.API.Models;

namespace CardGame.API.Services
{
    public interface IUserService
    {
        Task<User> GetUserByIdAsync(string id);
        Task<User> GetUserByEmailAsync(string email);
        Task<User> GetUserByUsernameAsync(string username);
        Task<User> CreateUserAsync(User user);
        Task<User> UpdateUserAsync(User user);
        Task<List<User>> GetFriendsAsync(string userId);
        Task<List<LeaderboardEntry>> GetLeaderboardAsync(int limit);
        Task SavePasswordResetTokenAsync(string userId, string token);
        Task<string> ValidatePasswordResetTokenAsync(string token);
        Task InvalidatePasswordResetTokenAsync(string token);
    }

    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetToken);
    }

    public interface IGameService
    {
        Task<Game> CreateGameAsync(Game game);
        Task<Game> GetGameAsync(string gameId);
        Task<Game> UpdateGameAsync(Game game);
        Task<List<Game>> GetUserGameHistoryAsync(string userId, int page, int pageSize);
    }
}