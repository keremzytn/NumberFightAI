using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using CardGame.API.Models;
using CardGame.API.Services;

namespace CardGame.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthController(IUserService userService, IConfiguration configuration, IEmailService emailService)
        {
            _userService = userService;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _userService.GetUserByEmailAsync(request.Email);
                if (existingUser != null)
                {
                    return BadRequest(new { message = "User with this email already exists" });
                }

                // Check if username is taken
                var existingUsername = await _userService.GetUserByUsernameAsync(request.Username);
                if (existingUsername != null)
                {
                    return BadRequest(new { message = "Username is already taken" });
                }

                // Create new user
                var user = new User
                {
                    Email = request.Email,
                    Username = request.Username,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    Avatar = "default_avatar.png"
                };

                await _userService.CreateUserAsync(user);

                // Generate JWT token
                var token = GenerateJwtToken(user);

                var response = new AuthResponse
                {
                    Token = token,
                    User = MapToUserProfile(user)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Registration failed", error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                var user = await _userService.GetUserByEmailAsync(request.Email);
                if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Update last login
                user.LastLoginAt = DateTime.UtcNow;
                await _userService.UpdateUserAsync(user);

                var token = GenerateJwtToken(user);

                var response = new AuthResponse
                {
                    Token = token,
                    User = MapToUserProfile(user)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Login failed", error = ex.Message });
            }
        }

        [HttpPost("google-login")]
        public async Task<ActionResult<AuthResponse>> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            try
            {
                // Verify Google ID token (implementation depends on Google.Apis.Auth library)
                var payload = await VerifyGoogleTokenAsync(request.IdToken);
                if (payload == null)
                {
                    return Unauthorized(new { message = "Invalid Google token" });
                }

                // Check if user exists
                var user = await _userService.GetUserByEmailAsync(payload.Email);
                if (user == null)
                {
                    // Create new user from Google profile
                    user = new User
                    {
                        Email = payload.Email,
                        Username = payload.Name ?? payload.Email.Split('@')[0],
                        Avatar = payload.Picture ?? "default_avatar.png"
                        // No password hash for OAuth users
                    };

                    await _userService.CreateUserAsync(user);
                }

                user.LastLoginAt = DateTime.UtcNow;
                await _userService.UpdateUserAsync(user);

                var token = GenerateJwtToken(user);

                var response = new AuthResponse
                {
                    Token = token,
                    User = MapToUserProfile(user)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Google login failed", error = ex.Message });
            }
        }

        [HttpPost("apple-login")]
        public async Task<ActionResult<AuthResponse>> AppleLogin([FromBody] AppleLoginRequest request)
        {
            try
            {
                // Verify Apple identity token (implementation depends on Apple Sign-In verification)
                var appleUser = await VerifyAppleTokenAsync(request.IdentityToken, request.AuthorizationCode);
                if (appleUser == null)
                {
                    return Unauthorized(new { message = "Invalid Apple token" });
                }

                // Check if user exists
                var user = await _userService.GetUserByEmailAsync(appleUser.Email);
                if (user == null)
                {
                    // Create new user from Apple profile
                    user = new User
                    {
                        Email = appleUser.Email,
                        Username = appleUser.Email.Split('@')[0], // Apple doesn't always provide name
                        Avatar = "default_avatar.png"
                    };

                    await _userService.CreateUserAsync(user);
                }

                user.LastLoginAt = DateTime.UtcNow;
                await _userService.UpdateUserAsync(user);

                var token = GenerateJwtToken(user);

                var response = new AuthResponse
                {
                    Token = token,
                    User = MapToUserProfile(user)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Apple login failed", error = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] PasswordResetRequest request)
        {
            try
            {
                var user = await _userService.GetUserByEmailAsync(request.Email);
                if (user == null)
                {
                    // Don't reveal if email exists for security
                    return Ok(new { message = "If the email exists, a reset link has been sent" });
                }

                var resetToken = GeneratePasswordResetToken();
                await _userService.SavePasswordResetTokenAsync(user.Id, resetToken);

                await _emailService.SendPasswordResetEmailAsync(user.Email, resetToken);

                return Ok(new { message = "If the email exists, a reset link has been sent" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Password reset failed", error = ex.Message });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] PasswordResetConfirmRequest request)
        {
            try
            {
                var userId = await _userService.ValidatePasswordResetTokenAsync(request.Token);
                if (userId == null)
                {
                    return BadRequest(new { message = "Invalid or expired reset token" });
                }

                var user = await _userService.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return BadRequest(new { message = "User not found" });
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _userService.UpdateUserAsync(user);
                await _userService.InvalidatePasswordResetTokenAsync(request.Token);

                return Ok(new { message = "Password reset successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Password reset failed", error = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<ActionResult<UserProfile>> GetProfile()
        {
            try
            {
                var userId = GetCurrentUserId();
                var user = await _userService.GetUserByIdAsync(userId);
                
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                var friends = await _userService.GetFriendsAsync(userId);
                var profile = MapToUserProfile(user);
                profile.Friends = friends.Select(f => new FriendInfo
                {
                    Id = f.Id,
                    Username = f.Username,
                    Avatar = f.Avatar,
                    IsOnline = false // TODO: Implement online status tracking
                }).ToList();

                return Ok(profile);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get profile", error = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<ActionResult<UserProfile>> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var user = await _userService.GetUserByIdAsync(userId);
                
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                if (!string.IsNullOrEmpty(request.Username))
                {
                    // Check if username is taken by another user
                    var existingUser = await _userService.GetUserByUsernameAsync(request.Username);
                    if (existingUser != null && existingUser.Id != userId)
                    {
                        return BadRequest(new { message = "Username is already taken" });
                    }
                    user.Username = request.Username;
                }

                if (!string.IsNullOrEmpty(request.Avatar))
                {
                    user.Avatar = request.Avatar;
                }

                await _userService.UpdateUserAsync(user);

                return Ok(MapToUserProfile(user));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update profile", error = ex.Message });
            }
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(30),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        private UserProfile MapToUserProfile(User user)
        {
            return new UserProfile
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Avatar = user.Avatar,
                Statistics = user.Statistics,
                Friends = new List<FriendInfo>()
            };
        }

        private async Task<GoogleJsonWebSignature.Payload> VerifyGoogleTokenAsync(string idToken)
        {
            // Implementation would use Google.Apis.Auth library
            // This is a placeholder for the actual Google token verification
            throw new NotImplementedException("Google token verification needs to be implemented with Google.Apis.Auth");
        }

        private async Task<AppleUserInfo> VerifyAppleTokenAsync(string identityToken, string authorizationCode)
        {
            // Implementation would verify Apple Sign-In tokens
            // This is a placeholder for the actual Apple token verification
            throw new NotImplementedException("Apple token verification needs to be implemented");
        }

        private string GeneratePasswordResetToken()
        {
            return Guid.NewGuid().ToString("N");
        }
    }

    public class AppleUserInfo
    {
        public string Email { get; set; }
        public string Name { get; set; }
    }
}