using CardGame.Models;
using System.Collections.Concurrent;

namespace CardGame.API.Services
{
    // In-memory implementation for demo purposes
    // In production, this would use Entity Framework with a database
    public class GameService : IGameService
    {
        private readonly ConcurrentDictionary<string, Game> _games = new();
        private readonly ConcurrentDictionary<string, List<string>> _userGames = new();

        public Task<Game> CreateGameAsync(Game game)
        {
            _games[game.Id] = game;

            // Track games for each player
            AddGameToUserHistory(game.Player1.Id, game.Id);
            if (!game.Player2.IsAI)
            {
                AddGameToUserHistory(game.Player2.Id, game.Id);
            }

            return Task.FromResult(game);
        }

        public Task<Game> GetGameAsync(string gameId)
        {
            _games.TryGetValue(gameId, out var game);
            return Task.FromResult(game);
        }

        public Task<Game> UpdateGameAsync(Game game)
        {
            _games[game.Id] = game;
            return Task.FromResult(game);
        }

        public Task<List<Game>> GetUserGameHistoryAsync(string userId, int page, int pageSize)
        {
            if (!_userGames.TryGetValue(userId, out var gameIds))
            {
                return Task.FromResult(new List<Game>());
            }

            var games = gameIds
                .Select(id => _games.TryGetValue(id, out var game) ? game : null)
                .Where(g => g != null && g.State == GameState.Completed)
                .OrderByDescending(g => g.CompletedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Task.FromResult(games);
        }

        private void AddGameToUserHistory(string userId, string gameId)
        {
            _userGames.AddOrUpdate(userId, 
                new List<string> { gameId },
                (key, existingList) => 
                {
                    existingList.Add(gameId);
                    return existingList;
                });
        }
    }
}