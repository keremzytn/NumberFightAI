using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using CardGame.API.Models;
using CardGame.API.Services;
using CardGame.Models;
using CardGame.AI;

namespace CardGame.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GameController : ControllerBase
    {
        private readonly IGameService _gameService;
        private readonly IUserService _userService;

        public GameController(IGameService gameService, IUserService userService)
        {
            _gameService = gameService;
            _userService = userService;
        }

        [HttpPost("start")]
        public async Task<ActionResult<GameStateResponse>> StartMatch([FromBody] StartMatchRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUser = await _userService.GetUserByIdAsync(currentUserId);
                
                if (currentUser == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                Player player1 = new Player(currentUser.Id, currentUser.Username, currentUser.Email);
                Player player2;

                if (request.OpponentId == "AI")
                {
                    // Create AI opponent
                    player2 = new Player("AI", $"AI ({request.AILevel})")
                    {
                        IsAI = true,
                        AILevel = request.AILevel
                    };
                }
                else
                {
                    // Human opponent
                    var opponent = await _userService.GetUserByIdAsync(request.OpponentId);
                    if (opponent == null)
                    {
                        return BadRequest(new { message = "Opponent not found" });
                    }

                    player2 = new Player(opponent.Id, opponent.Username, opponent.Email);
                }

                var game = new Game(player1, player2);
                await _gameService.CreateGameAsync(game);

                var response = MapToGameStateResponse(game, currentUserId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to start match", error = ex.Message });
            }
        }

        [HttpPost("move")]
        public async Task<ActionResult<GameStateResponse>> SubmitMove([FromBody] SubmitMoveRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var game = await _gameService.GetGameAsync(request.GameId);
                
                if (game == null)
                {
                    return NotFound(new { message = "Game not found" });
                }

                if (game.State != GameState.WaitingForMoves)
                {
                    return BadRequest(new { message = "Game is not accepting moves" });
                }

                // Determine which player is making the move
                Player currentPlayer = game.Player1.Id == currentUserId ? game.Player1 : game.Player2;
                Player opponent = game.Player1.Id == currentUserId ? game.Player2 : game.Player1;

                if (currentPlayer == null)
                {
                    return Forbidden(new { message = "You are not a player in this game" });
                }

                // Validate the move
                if (!currentPlayer.CanPlayCard(request.CardValue))
                {
                    return BadRequest(new { message = "Cannot play this card (locked, used, or invalid)" });
                }

                int opponentCard;

                // If opponent is AI, get AI move
                if (opponent.IsAI)
                {
                    var aiStrategy = AIStrategyFactory.CreateStrategy(opponent.AILevel);
                    opponentCard = aiStrategy.SelectCard(opponent, currentPlayer, game);
                }
                else
                {
                    // For human vs human, this would need to wait for the other player
                    // For now, we'll simulate with a random move (this should be handled by real-time system)
                    var availableCards = opponent.GetAvailableCards();
                    if (!availableCards.Any())
                    {
                        return BadRequest(new { message = "Opponent has no available cards" });
                    }
                    opponentCard = availableCards[new Random().Next(availableCards.Count)].Value;
                }

                // Play the round
                var roundResult = game.PlayRound(request.CardValue, opponentCard);
                await _gameService.UpdateGameAsync(game);

                // Update user statistics if game is complete
                if (game.IsGameComplete)
                {
                    await UpdatePlayerStatistics(game);
                }

                var response = MapToGameStateResponse(game, currentUserId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to submit move", error = ex.Message });
            }
        }

        [HttpGet("{gameId}")]
        public async Task<ActionResult<GameStateResponse>> GetGameState(string gameId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var game = await _gameService.GetGameAsync(gameId);
                
                if (game == null)
                {
                    return NotFound(new { message = "Game not found" });
                }

                // Check if user is part of this game
                if (game.Player1.Id != currentUserId && game.Player2.Id != currentUserId)
                {
                    return Forbidden(new { message = "You are not a player in this game" });
                }

                var response = MapToGameStateResponse(game, currentUserId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get game state", error = ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<ActionResult<List<MatchHistoryResponse>>> GetMatchHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var games = await _gameService.GetUserGameHistoryAsync(currentUserId, page, pageSize);

                var response = games.Select(game => MapToMatchHistoryResponse(game, currentUserId)).ToList();
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get match history", error = ex.Message });
            }
        }

        [HttpGet("leaderboard")]
        public async Task<ActionResult<List<LeaderboardEntry>>> GetLeaderboard([FromQuery] int limit = 50)
        {
            try
            {
                var leaderboard = await _userService.GetLeaderboardAsync(limit);
                return Ok(leaderboard);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get leaderboard", error = ex.Message });
            }
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        private GameStateResponse MapToGameStateResponse(Game game, string currentUserId)
        {
            return new GameStateResponse
            {
                GameId = game.Id,
                CurrentRound = game.CurrentRound,
                State = game.State,
                Player1 = MapToPlayerGameInfo(game.Player1),
                Player2 = MapToPlayerGameInfo(game.Player2),
                LastRoundResult = game.RoundHistory.LastOrDefault(),
                IsPlayerTurn = true, // In this simple implementation, moves are immediate
                RoundStartTime = DateTime.UtcNow, // Would be tracked per round in real implementation
                Round5SpecialRuleApplied = game.Round5SpecialRuleApplied
            };
        }

        private PlayerGameInfo MapToPlayerGameInfo(Player player)
        {
            return new PlayerGameInfo
            {
                Id = player.Id,
                Name = player.Name,
                Avatar = player.Statistics?.ToString() ?? "default_avatar.png", // Placeholder
                Score = player.Score,
                IsAI = player.IsAI,
                AILevel = player.AILevel,
                Hand = player.Hand.Select(c => new CardInfo
                {
                    Value = c.Value,
                    IsLocked = c.IsLocked,
                    IsUsed = c.IsUsed
                }).ToArray()
            };
        }

        private MatchHistoryResponse MapToMatchHistoryResponse(Game game, string currentUserId)
        {
            var isPlayer1 = game.Player1.Id == currentUserId;
            var currentPlayer = isPlayer1 ? game.Player1 : game.Player2;
            var opponent = isPlayer1 ? game.Player2 : game.Player1;

            return new MatchHistoryResponse
            {
                GameId = game.Id,
                OpponentName = opponent.Name,
                OpponentAvatar = "default_avatar.png", // Placeholder
                IsAIOpponent = opponent.IsAI,
                OpponentAILevel = opponent.AILevel,
                CompletedAt = game.CompletedAt ?? DateTime.UtcNow,
                Won = game.Winner?.Id == currentUserId,
                FinalScore = currentPlayer.Score,
                OpponentFinalScore = opponent.Score,
                TotalRounds = game.RoundHistory.Count
            };
        }

        private async Task UpdatePlayerStatistics(Game game)
        {
            // Update statistics for both players
            if (!game.Player1.IsAI)
            {
                var user1 = await _userService.GetUserByIdAsync(game.Player1.Id);
                if (user1 != null)
                {
                    user1.Statistics = game.Player1.Statistics;
                    await _userService.UpdateUserAsync(user1);
                }
            }

            if (!game.Player2.IsAI)
            {
                var user2 = await _userService.GetUserByIdAsync(game.Player2.Id);
                if (user2 != null)
                {
                    user2.Statistics = game.Player2.Statistics;
                    await _userService.UpdateUserAsync(user2);
                }
            }
        }
    }
}