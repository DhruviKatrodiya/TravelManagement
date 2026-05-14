using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelManagement.API.DTOs.Common;

namespace TravelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Staff")]
public class UploadsController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    private const long MaxFileSize = 5 * 1024 * 1024;

    private readonly IWebHostEnvironment _env;

    public UploadsController(IWebHostEnvironment env)
    {
        _env = env;
    }

    public class UploadResponse
    {
        public string Url { get; set; } = string.Empty;
    }

    [HttpPost("image")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<ActionResult<ApiResponse<UploadResponse>>> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<UploadResponse>.Fail("No file uploaded"));

        if (file.Length > MaxFileSize)
            return BadRequest(ApiResponse<UploadResponse>.Fail("File exceeds 5 MB limit"));

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
            return BadRequest(ApiResponse<UploadResponse>.Fail("Unsupported file type. Allowed: jpg, jpeg, png, gif, webp"));

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");

        var uploadsDir = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var fullPath = Path.Combine(uploadsDir, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"{Request.Scheme}://{Request.Host}{Request.PathBase}/uploads/{fileName}";
        return Ok(ApiResponse<UploadResponse>.Ok(new UploadResponse { Url = url }, "Uploaded"));
    }
}
