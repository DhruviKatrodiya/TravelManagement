using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class AppSettingsService : IAppSettingsService
{
    private readonly TravelDbContext _db;

    public AppSettingsService(TravelDbContext db) => _db = db;

    public async Task<AppSettingsDto> GetAsync()
    {
        var row = await LoadOrCreateAsync();
        return Map(row);
    }

    public async Task<AppSettingsDto> UpdateAsync(AppSettingsUpdateRequest req)
    {
        var row = await LoadOrCreateAsync();
        row.LogoUrl = req.LogoUrl;
        row.BrandName = req.BrandName;
        row.ThemeMode = req.ThemeMode;
        await _db.SaveChangesAsync();
        return Map(row);
    }

    private async Task<AppSetting> LoadOrCreateAsync()
    {
        var row = await _db.AppSettings.SingleOrDefaultAsync(s => s.Id == 1);
        if (row != null) return row;

        row = new AppSetting { Id = 1 };
        _db.AppSettings.Add(row);
        await _db.SaveChangesAsync();
        return row;
    }

    private static AppSettingsDto Map(AppSetting s) => new()
    {
        LogoUrl = s.LogoUrl,
        BrandName = s.BrandName,
        ThemeMode = s.ThemeMode
    };
}
