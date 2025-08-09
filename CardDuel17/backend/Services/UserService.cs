using Microsoft.EntityFrameworkCore;
using CardDuelBackend.Data;
using CardDuelBackend.Models;

namespace CardDuelBackend.Services;

public class UserService : IUserService
{
    private readonly GameDbContext _context;
    private readonly ILogger<UserService> _logger;

    public UserService(GameDbContext context, ILogger<UserService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Guid> CreateOrGetUserAsync(string username)
    {
        try
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);

            if (existingUser != null)
            {
                existingUser.LastActive = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return existingUser.Id;
            }

            var newUser = new User
            {
                Username = username,
                CreatedAt = DateTime.UtcNow,
                LastActive = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return newUser.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating or getting user");
            throw;
        }
    }

    public async Task<UserStatsDto?> GetUserStatsAsync(Guid userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;

            return new UserStatsDto
            {
                Id = user.Id,
                Username = user.Username,
                GamesPlayed = user.GamesPlayed,
                GamesWon = user.GamesWon,
                WinRate = user.WinRate,
                TotalScore = user.TotalScore,
                AverageGameDuration = user.AverageGameDuration,
                FavoriteCard = user.FavoriteCard,
                LastActive = user.LastActive
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user stats");
            throw;
        }
    }

    public async Task<List<MatchHistory>> GetMatchHistoryAsync(Guid userId, int limit = 10)
    {
        try
        {
            return await _context.MatchHistories
                .Where(m => m.Player1Id == userId || m.Player2Id == userId)
                .Include(m => m.Player1)
                .Include(m => m.Player2)
                .Include(m => m.Winner)
                .OrderByDescending(m => m.PlayedAt)
                .Take(limit)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting match history");
            throw;
        }
    }
}