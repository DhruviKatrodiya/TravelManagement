using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Auth;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register(RegisterRequest req)
    {
        var res = await _auth.RegisterCustomerAsync(req);
        return Ok(ApiResponse<AuthResponse>.Ok(res, "Registration successful"));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login(LoginRequest req)
    {
        var res = await _auth.LoginAsync(req);
        return Ok(ApiResponse<AuthResponse>.Ok(res, "Login successful"));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> Me()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var u = await _auth.GetCurrentUserAsync(id);
        return Ok(ApiResponse<UserDto>.Ok(u));
    }

    [HttpPost("send-change-password-otp")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> SendChangePasswordOtp(SendChangePasswordOtpRequest req)
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _auth.SendChangePasswordOtpAsync(id, req);
        return Ok(ApiResponse<object>.Ok(new { }, "OTP sent to your email."));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> ChangePassword(ChangePasswordRequest req)
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _auth.ChangePasswordAsync(id, req);
        return Ok(ApiResponse<object>.Ok(new { }, "Password changed."));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateProfile(UpdateProfileRequest req)
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var u = await _auth.UpdateProfileAsync(id, req);
        return Ok(ApiResponse<UserDto>.Ok(u, "Profile updated."));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> ForgotPassword(ForgotPasswordRequest req)
    {
        await _auth.ForgotPasswordAsync(req);
        return Ok(ApiResponse<object>.Ok(new { }, "OTP sent to your email."));
    }

    [HttpPost("verify-forgot-password-otp")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> VerifyForgotPasswordOtp(VerifyForgotPasswordOtpRequest req)
    {
        await _auth.VerifyForgotPasswordOtpAsync(req);
        return Ok(ApiResponse<object>.Ok(new { }, "Identity verified. Check your email for the temporary password."));
    }

}
