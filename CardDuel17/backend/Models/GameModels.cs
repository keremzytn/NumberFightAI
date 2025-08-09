using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CardDuelBackend.Models;

public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastActive { get; set; } = DateTime.UtcNow;
    
    // Statistics
    public int GamesPlayed { get; set; } = 0;
    public int GamesWon { get; set; } = 0;
    public int TotalScore { get; set; } = 0;
    public double AverageGameDuration { get; set; } = 0;
    public int? FavoriteCard { get; set; }
    
    [Column(TypeName = "decimal(5,2)")]
    public decimal WinRate => GamesPlayed > 0 ? (decimal)GamesWon / GamesPlayed * 100 : 0;
    
    // Navigation properties
    public virtual ICollection<GameRoom> HostedRooms { get; set; } = new List<GameRoom>();
    public virtual ICollection<GameParticipant> GameParticipations { get; set; } = new List<GameParticipant>();
    public virtual ICollection<MatchHistory> MatchHistories { get; set; } = new List<MatchHistory>();
}

public class GameRoom
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [StringLength(10)]
    public string Code { get; set; } = string.Empty;
    
    [Required]
    public Guid HostId { get; set; }
    
    public GameMode Mode { get; set; }
    public GameRoomStatus Status { get; set; } = GameRoomStatus.Waiting;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    // Game state as JSON
    public string? GameStateJson { get; set; }
    
    // Navigation properties
    [ForeignKey("HostId")]
    public virtual User Host { get; set; } = null!;
    public virtual ICollection<GameParticipant> Participants { get; set; } = new List<GameParticipant>();
}

public class GameParticipant
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid RoomId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    public int PlayerIndex { get; set; } // 0 or 1
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsConnected { get; set; } = true;
    
    // Navigation properties
    [ForeignKey("RoomId")]
    public virtual GameRoom Room { get; set; } = null!;
    
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

public class MatchHistory
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid RoomId { get; set; }
    
    [Required]
    public Guid Player1Id { get; set; }
    
    [Required]
    public Guid Player2Id { get; set; }
    
    public Guid? WinnerId { get; set; }
    public int Player1Score { get; set; }
    public int Player2Score { get; set; }
    public GameMode Mode { get; set; }
    public int TotalRounds { get; set; }
    public TimeSpan Duration { get; set; }
    public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
    
    // Round-by-round data as JSON
    public string RoundHistoryJson { get; set; } = "[]";
    
    // Navigation properties
    [ForeignKey("RoomId")]
    public virtual GameRoom Room { get; set; } = null!;
    
    [ForeignKey("Player1Id")]
    public virtual User Player1 { get; set; } = null!;
    
    [ForeignKey("Player2Id")]
    public virtual User Player2 { get; set; } = null!;
    
    [ForeignKey("WinnerId")]
    public virtual User? Winner { get; set; }
}

public class RoundMove
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid RoomId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    public int Round { get; set; }
    public int Card { get; set; }
    public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("RoomId")]
    public virtual GameRoom Room { get; set; } = null!;
    
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

// Enums
public enum GameMode
{
    SinglePlayer = 0,
    Online = 1,
    Friend = 2
}

public enum GameRoomStatus
{
    Waiting = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3
}

public enum AILevel
{
    Easy = 0,
    Medium = 1,
    Hard = 2
}

// DTOs for API responses
public class UserStatsDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public int GamesPlayed { get; set; }
    public int GamesWon { get; set; }
    public decimal WinRate { get; set; }
    public int TotalScore { get; set; }
    public double AverageGameDuration { get; set; }
    public int? FavoriteCard { get; set; }
    public DateTime LastActive { get; set; }
}

public class GameRoomDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string HostUsername { get; set; } = string.Empty;
    public GameMode Mode { get; set; }
    public GameRoomStatus Status { get; set; }
    public int ParticipantCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateRoomRequest
{
    [Required]
    public GameMode Mode { get; set; }
}

public class JoinRoomRequest
{
    [Required]
    [StringLength(10)]
    public string Code { get; set; } = string.Empty;
}

public class PlayCardRequest
{
    [Required]
    public Guid RoomId { get; set; }
    
    [Range(1, 7)]
    public int Card { get; set; }
}