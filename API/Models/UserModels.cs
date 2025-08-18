using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace CardGame.API.Models
{
    public class User
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string Avatar { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastLoginAt { get; set; }
        public UserStatistics Statistics { get; set; }
        public List<string> FriendIds { get; set; }

        public User()
        {
            Id = Guid.NewGuid().ToString();
            CreatedAt = DateTime.UtcNow;
            Statistics = new UserStatistics();
            FriendIds = new List<string>();
        }
    }

    public class UserStatistics
    {
        public int TotalGames { get; set; }
        public int Wins { get; set; }
        public int Losses { get; set; }
        public Dictionary<int, int> CardUsageCount { get; set; }
        public double WinRate => TotalGames > 0 ? (double)Wins / TotalGames : 0;
        public int MostUsedCard => CardUsageCount?.OrderByDescending(x => x.Value).FirstOrDefault().Key ?? 0;

        public UserStatistics()
        {
            CardUsageCount = new Dictionary<int, int>();
            for (int i = 1; i <= 7; i++)
            {
                CardUsageCount[i] = 0;
            }
        }
    }

    // DTOs for API requests/responses
    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MinLength(3)]
        public string Username { get; set; }

        [Required]
        [MinLength(6)]
        public string Password { get; set; }
    }

    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class GoogleLoginRequest
    {
        [Required]
        public string IdToken { get; set; }
    }

    public class AppleLoginRequest
    {
        [Required]
        public string IdentityToken { get; set; }
        
        [Required]
        public string AuthorizationCode { get; set; }
    }

    public class AuthResponse
    {
        public string Token { get; set; }
        public UserProfile User { get; set; }
    }

    public class UserProfile
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string Avatar { get; set; }
        public UserStatistics Statistics { get; set; }
        public List<FriendInfo> Friends { get; set; }
    }

    public class FriendInfo
    {
        public string Id { get; set; }
        public string Username { get; set; }
        public string Avatar { get; set; }
        public bool IsOnline { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string Username { get; set; }
        public string Avatar { get; set; }
    }

    public class PasswordResetRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }

    public class PasswordResetConfirmRequest
    {
        [Required]
        public string Token { get; set; }

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; }
    }
}