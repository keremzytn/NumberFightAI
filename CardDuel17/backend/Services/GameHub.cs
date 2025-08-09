using Microsoft.AspNetCore.SignalR;
using CardDuelBackend.Models;
using System.Text.Json;

namespace CardDuelBackend.Services;

public class GameHub : Hub
{
    private readonly IGameService _gameService;
    private readonly IGameRoomManager _roomManager;
    private readonly ILogger<GameHub> _logger;

    public GameHub(IGameService gameService, IGameRoomManager roomManager, ILogger<GameHub> logger)
    {
        _gameService = gameService;
        _roomManager = roomManager;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"Client connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.Items["UserId"] as Guid?;
        if (userId.HasValue)
        {
            await HandlePlayerDisconnect(userId.Value);
        }

        _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinRoom(string roomCode, Guid userId)
    {
        try
        {
            // Store user ID in connection context
            Context.Items["UserId"] = userId;

            var result = await _gameService.JoinRoomAsync(roomCode, userId);
            if (result.Success)
            {
                // Add connection to room group
                await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

                // Notify all clients in the room
                await Clients.Group(roomCode).SendAsync("PlayerJoined", new
                {
                    UserId = userId,
                    Username = result.Username,
                    RoomState = result.RoomState
                });

                // If room is full, start the game
                if (result.RoomState?.ParticipantCount == 2)
                {
                    var gameState = await _gameService.StartGameAsync(result.RoomState.Id);
                    await Clients.Group(roomCode).SendAsync("GameStarted", gameState);
                }
            }
            else
            {
                await Clients.Caller.SendAsync("JoinRoomFailed", result.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in JoinRoom");
            await Clients.Caller.SendAsync("Error", "Failed to join room");
        }
    }

    public async Task CreateRoom(GameMode mode, Guid userId)
    {
        try
        {
            Context.Items["UserId"] = userId;

            var result = await _gameService.CreateRoomAsync(mode, userId);
            if (result.Success)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, result.RoomCode!);
                await Clients.Caller.SendAsync("RoomCreated", new
                {
                    RoomCode = result.RoomCode,
                    RoomState = result.RoomState
                });
            }
            else
            {
                await Clients.Caller.SendAsync("CreateRoomFailed", result.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in CreateRoom");
            await Clients.Caller.SendAsync("Error", "Failed to create room");
        }
    }

    public async Task PlayCard(Guid roomId, int card)
    {
        try
        {
            var userId = Context.Items["UserId"] as Guid?;
            if (!userId.HasValue)
            {
                await Clients.Caller.SendAsync("Error", "User not identified");
                return;
            }

            var result = await _gameService.PlayCardAsync(roomId, userId.Value, card);
            if (result.Success)
            {
                var roomCode = await _gameService.GetRoomCodeAsync(roomId);
                if (roomCode != null)
                {
                    // Notify all players in the room
                    await Clients.Group(roomCode).SendAsync("CardPlayed", new
                    {
                        UserId = userId.Value,
                        Card = card,
                        GameState = result.GameState
                    });

                    // If round is complete, process results
                    if (result.RoundComplete)
                    {
                        await ProcessRoundComplete(roomCode, result.GameState!);
                    }

                    // If game is complete, handle game end
                    if (result.GameComplete)
                    {
                        await ProcessGameComplete(roomCode, result.GameState!);
                    }
                }
            }
            else
            {
                await Clients.Caller.SendAsync("PlayCardFailed", result.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in PlayCard");
            await Clients.Caller.SendAsync("Error", "Failed to play card");
        }
    }

    public async Task LeaveRoom(Guid roomId)
    {
        try
        {
            var userId = Context.Items["UserId"] as Guid?;
            if (!userId.HasValue) return;

            var roomCode = await _gameService.GetRoomCodeAsync(roomId);
            if (roomCode != null)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
                await _gameService.LeaveRoomAsync(roomId, userId.Value);

                await Clients.Group(roomCode).SendAsync("PlayerLeft", new
                {
                    UserId = userId.Value
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in LeaveRoom");
        }
    }

    public async Task SendChatMessage(Guid roomId, string message)
    {
        try
        {
            var userId = Context.Items["UserId"] as Guid?;
            if (!userId.HasValue) return;

            var roomCode = await _gameService.GetRoomCodeAsync(roomId);
            if (roomCode != null)
            {
                await Clients.Group(roomCode).SendAsync("ChatMessage", new
                {
                    UserId = userId.Value,
                    Message = message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SendChatMessage");
        }
    }

    private async Task ProcessRoundComplete(string roomCode, object gameState)
    {
        await Clients.Group(roomCode).SendAsync("RoundComplete", new
        {
            GameState = gameState,
            Timestamp = DateTime.UtcNow
        });

        // Add delay for showing round results
        await Task.Delay(3000);

        await Clients.Group(roomCode).SendAsync("NextRoundStarted", new
        {
            GameState = gameState
        });
    }

    private async Task ProcessGameComplete(string roomCode, object gameState)
    {
        await Clients.Group(roomCode).SendAsync("GameComplete", new
        {
            GameState = gameState,
            Timestamp = DateTime.UtcNow
        });

        // Optionally clean up the room after some time
        _ = Task.Run(async () =>
        {
            await Task.Delay(TimeSpan.FromMinutes(5));
            await _gameService.CleanupRoomAsync(roomCode);
        });
    }

    private async Task HandlePlayerDisconnect(Guid userId)
    {
        try
        {
            // Find active rooms for this user
            var activeRooms = await _gameService.GetActiveRoomsForUserAsync(userId);
            
            foreach (var room in activeRooms)
            {
                await Clients.Group(room.Code).SendAsync("PlayerDisconnected", new
                {
                    UserId = userId,
                    Timestamp = DateTime.UtcNow
                });

                // Mark player as disconnected but keep room alive for reconnection
                await _gameService.MarkPlayerDisconnectedAsync(room.Id, userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling player disconnect");
        }
    }

    public async Task Reconnect(Guid userId, Guid roomId)
    {
        try
        {
            Context.Items["UserId"] = userId;

            var roomCode = await _gameService.GetRoomCodeAsync(roomId);
            if (roomCode != null)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
                await _gameService.MarkPlayerConnectedAsync(roomId, userId);

                var gameState = await _gameService.GetCurrentGameStateAsync(roomId);
                
                await Clients.Caller.SendAsync("Reconnected", new
                {
                    GameState = gameState,
                    RoomCode = roomCode
                });

                await Clients.Group(roomCode).SendAsync("PlayerReconnected", new
                {
                    UserId = userId,
                    Timestamp = DateTime.UtcNow
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Reconnect");
            await Clients.Caller.SendAsync("Error", "Failed to reconnect");
        }
    }
}