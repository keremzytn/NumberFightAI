using Microsoft.AspNetCore.Mvc;
using CardDuelBackend.Services;
using CardDuelBackend.Models;
using System.Threading.Tasks;

namespace CardDuelBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly IGameService _gameService;
    private readonly IUserService _userService;

    public GameController(IGameService gameService, IUserService userService)
    {
        _gameService = gameService;
        _userService = userService;
    }

    [HttpPost("create-room")]
    public async Task<ActionResult<GameRoom>> CreateRoom([FromBody] CreateRoomRequest request)
    {
        var userId = await _userService.CreateOrGetUserAsync("TestUser"); // Geçici olarak sabit kullanıcı
        var room = await _gameService.CreateGameRoomAsync(userId, request.Mode);
        return Ok(room);
    }

    [HttpGet("rooms")]
    public async Task<ActionResult<List<GameRoomDto>>> GetAvailableRooms()
    {
        var rooms = await _gameService.GetAvailableRoomsAsync();
        return Ok(rooms);
    }

    [HttpPost("join")]
    public async Task<ActionResult> JoinRoom([FromBody] JoinRoomRequest request)
    {
        var userId = await _userService.CreateOrGetUserAsync("TestUser"); // Geçici olarak sabit kullanıcı
        await _gameService.JoinGameRoomAsync(request.Code, userId);
        return Ok();
    }
}