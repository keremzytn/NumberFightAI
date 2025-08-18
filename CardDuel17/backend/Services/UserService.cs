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
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == username);

        if (user == null)
        {
            user = new User { Username = username };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        return user.Id;
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    public async Task<UserStatsDto?> GetUserStatsAsync(Guid userId)
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

    public async Task UpdateUserStatsAsync(Guid userId, int score, bool won, TimeSpan duration)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return;

        user.GamesPlayed++;
        if (won) user.GamesWon++;
        user.TotalScore += score;
        user.LastActive = DateTime.UtcNow;

        // Update average game duration
        var totalDuration = user.AverageGameDuration * (user.GamesPlayed - 1) + duration.TotalMinutes;
        user.AverageGameDuration = totalDuration / user.GamesPlayed;

        await _context.SaveChangesAsync();
    }

    public async Task<List<MatchHistory>> GetMatchHistoryAsync(Guid userId, int limit = 10)
    {
        return await _context.MatchHistories
            .Include(m => m.Player1)
            .Include(m => m.Player2)
            .Include(m => m.Winner)
            .Where(m => m.Player1Id == userId || m.Player2Id == userId)
            .OrderByDescending(m => m.PlayedAt)
            .Take(limit)
            .ToListAsync();
    }
}