using CardGame.API.Models;
using System.Collections.Concurrent;

namespace CardGame.API.Services
{
    // In-memory implementation for demo purposes
    // In production, this would use Entity Framework with a database
    public class UserService : IUserService
    {
        private readonly ConcurrentDictionary<string, User> _users = new();
        private readonly ConcurrentDictionary<string, string> _emailToId = new();
        private readonly ConcurrentDictionary<string, string> _usernameToId = new();
        private readonly ConcurrentDictionary<string, PasswordResetToken> _resetTokens = new();

        public Task<User> GetUserByIdAsync(string id)
        {
            _users.TryGetValue(id, out var user);
            return Task.FromResult(user);
        }

        public Task<User> GetUserByEmailAsync(string email)
        {
            if (_emailToId.TryGetValue(email.ToLowerInvariant(), out var id))
            {
                _users.TryGetValue(id, out var user);
                return Task.FromResult(user);
            }
            return Task.FromResult<User>(null);
        }

        public Task<User> GetUserByUsernameAsync(string username)
        {
            if (_usernameToId.TryGetValue(username.ToLowerInvariant(), out var id))
            {
                _users.TryGetValue(id, out var user);
                return Task.FromResult(user);
            }
            return Task.FromResult<User>(null);
        }

        public Task<User> CreateUserAsync(User user)
        {
            _users[user.Id] = user;
            _emailToId[user.Email.ToLowerInvariant()] = user.Id;
            _usernameToId[user.Username.ToLowerInvariant()] = user.Id;
            return Task.FromResult(user);
        }

        public Task<User> UpdateUserAsync(User user)
        {
            if (_users.ContainsKey(user.Id))
            {
                _users[user.Id] = user;
                _emailToId[user.Email.ToLowerInvariant()] = user.Id;
                _usernameToId[user.Username.ToLowerInvariant()] = user.Id;
            }
            return Task.FromResult(user);
        }

        public Task<List<User>> GetFriendsAsync(string userId)
        {
            if (_users.TryGetValue(userId, out var user))
            {
                var friends = user.FriendIds
                    .Select(friendId => _users.TryGetValue(friendId, out var friend) ? friend : null)
                    .Where(f => f != null)
                    .ToList();
                return Task.FromResult(friends);
            }
            return Task.FromResult(new List<User>());
        }

        public Task<List<LeaderboardEntry>> GetLeaderboardAsync(int limit)
        {
            var leaderboard = _users.Values
                .Where(u => !string.IsNullOrEmpty(u.Email)) // Exclude AI players
                .OrderByDescending(u => u.Statistics.WinRate)
                .ThenByDescending(u => u.Statistics.Wins)
                .Take(limit)
                .Select((user, index) => new LeaderboardEntry
                {
                    Username = user.Username,
                    Avatar = user.Avatar,
                    TotalGames = user.Statistics.TotalGames,
                    Wins = user.Statistics.Wins,
                    WinRate = user.Statistics.WinRate,
                    Rank = index + 1
                })
                .ToList();

            return Task.FromResult(leaderboard);
        }

        public Task SavePasswordResetTokenAsync(string userId, string token)
        {
            _resetTokens[token] = new PasswordResetToken
            {
                UserId = userId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };
            return Task.CompletedTask;
        }

        public Task<string> ValidatePasswordResetTokenAsync(string token)
        {
            if (_resetTokens.TryGetValue(token, out var resetToken))
            {
                if (resetToken.ExpiresAt > DateTime.UtcNow)
                {
                    return Task.FromResult(resetToken.UserId);
                }
            }
            return Task.FromResult<string>(null);
        }

        public Task InvalidatePasswordResetTokenAsync(string token)
        {
            _resetTokens.TryRemove(token, out _);
            return Task.CompletedTask;
        }
    }

    public class PasswordResetToken
    {
        public string UserId { get; set; }
        public string Token { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    // Mock email service for demo purposes
    public class EmailService : IEmailService
    {
        public Task SendPasswordResetEmailAsync(string email, string resetToken)
        {
            // In production, this would send an actual email
            Console.WriteLine($"Password reset email sent to {email} with token: {resetToken}");
            return Task.CompletedTask;
        }
    }
}