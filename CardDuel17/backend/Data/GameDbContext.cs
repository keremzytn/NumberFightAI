using Microsoft.EntityFrameworkCore;
using CardDuelBackend.Models;

namespace CardDuelBackend.Data;

public class GameDbContext : DbContext
{
    public GameDbContext(DbContextOptions<GameDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<GameRoom> GameRooms { get; set; }
    public DbSet<GameParticipant> GameParticipants { get; set; }
    public DbSet<MatchHistory> MatchHistories { get; set; }
    public DbSet<RoundMove> RoundMoves { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.WinRate).HasComputedColumnSql("CASE WHEN \"GamesPlayed\" > 0 THEN CAST(\"GamesWon\" AS DECIMAL) / \"GamesPlayed\" * 100 ELSE 0 END");
        });

        // GameRoom configuration
        modelBuilder.Entity<GameRoom>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasOne(e => e.Host)
                  .WithMany(e => e.HostedRooms)
                  .HasForeignKey(e => e.HostId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // GameParticipant configuration
        modelBuilder.Entity<GameParticipant>(entity =>
        {
            entity.HasIndex(e => new { e.RoomId, e.PlayerIndex }).IsUnique();
            entity.HasOne(e => e.Room)
                  .WithMany(e => e.Participants)
                  .HasForeignKey(e => e.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany(e => e.GameParticipations)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // MatchHistory configuration
        modelBuilder.Entity<MatchHistory>(entity =>
        {
            entity.HasOne(e => e.Room)
                  .WithMany()
                  .HasForeignKey(e => e.RoomId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Player1)
                  .WithMany()
                  .HasForeignKey(e => e.Player1Id)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Player2)
                  .WithMany()
                  .HasForeignKey(e => e.Player2Id)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Winner)
                  .WithMany(e => e.MatchHistories)
                  .HasForeignKey(e => e.WinnerId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // RoundMove configuration
        modelBuilder.Entity<RoundMove>(entity =>
        {
            entity.HasIndex(e => new { e.RoomId, e.UserId, e.Round }).IsUnique();
            entity.HasOne(e => e.Room)
                  .WithMany()
                  .HasForeignKey(e => e.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Seed data
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Username = "TestPlayer1",
                CreatedAt = DateTime.UtcNow,
                LastActive = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Username = "TestPlayer2",
                CreatedAt = DateTime.UtcNow,
                LastActive = DateTime.UtcNow
            }
        );
    }
}