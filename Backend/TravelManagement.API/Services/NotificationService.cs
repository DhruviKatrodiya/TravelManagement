using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TravelManagement.API.Data;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.Models;
using TravelManagement.API.Models.Enums;
using TravelManagement.API.Services.Interfaces;

namespace TravelManagement.API.Services;

public class NotificationService : INotificationService
{
    private readonly TravelDbContext _db;
    private readonly IMapper _mapper;

    public NotificationService(TravelDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task CreateAsync(int userId, NotificationType type, string title, string message, string? link = null)
    {
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            Link = link
        });
        await _db.SaveChangesAsync();
    }

    public async Task<IEnumerable<NotificationDto>> GetForUserAsync(int userId, bool onlyUnread = false)
    {
        var q = _db.Notifications.Where(n => n.UserId == userId);
        if (onlyUnread) q = q.Where(n => !n.IsRead);
        var items = await q.OrderByDescending(n => n.CreatedAt).Take(100).ToListAsync();
        return _mapper.Map<List<NotificationDto>>(items);
    }

    public async Task MarkReadAsync(int userId, int notificationId)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId);
        if (n != null && !n.IsRead)
        {
            n.IsRead = true;
            await _db.SaveChangesAsync();
        }
    }

    public async Task MarkAllReadAsync(int userId)
    {
        var unread = await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        foreach (var n in unread) n.IsRead = true;
        await _db.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(int userId, int notificationId)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId);
        if (n == null) return false;
        _db.Notifications.Remove(n);
        await _db.SaveChangesAsync();
        return true;
    }
}
