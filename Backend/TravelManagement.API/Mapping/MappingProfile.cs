using AutoMapper;
using TravelManagement.API.DTOs.Auth;
using TravelManagement.API.DTOs.Booking;
using TravelManagement.API.DTOs.Common;
using TravelManagement.API.DTOs.Payment;
using TravelManagement.API.DTOs.Tour;
using TravelManagement.API.Models;

namespace TravelManagement.API.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>();

        CreateMap<Models.Tour, TourDto>()
            .ForMember(d => d.Packages, o => o.MapFrom(s => s.Packages))
            .ForMember(d => d.AverageRating, o => o.MapFrom(s => s.Reviews.Where(r => r.IsApproved).Any() ? s.Reviews.Where(r => r.IsApproved).Average(r => r.Rating) : 0))
            .ForMember(d => d.ReviewCount, o => o.MapFrom(s => s.Reviews.Count(r => r.IsApproved)));

        CreateMap<TourCreateRequest, Models.Tour>();
        CreateMap<TourUpdateRequest, Models.Tour>();

        CreateMap<TourPackage, TourPackageDto>()
            .ForMember(d => d.Itineraries, o => o.MapFrom(s => s.Itineraries.OrderBy(i => i.DayNumber)))
            .ForMember(d => d.Facilities, o => o.MapFrom(s => s.PackageFacilities));

        CreateMap<TourPackageCreateRequest, TourPackage>()
            .ForMember(d => d.PackageFacilities, o => o.Ignore());
        CreateMap<TourPackageUpdateRequest, TourPackage>()
            .ForMember(d => d.PackageFacilities, o => o.Ignore());

        CreateMap<Itinerary, ItineraryDto>();
        CreateMap<ItineraryCreateRequest, Itinerary>();

        CreateMap<Facility, FacilityDto>();
        CreateMap<FacilityCreateRequest, Facility>();

        CreateMap<PackageFacility, PackageFacilityDto>()
            .ForMember(d => d.FacilityName, o => o.MapFrom(s => s.Facility.Name))
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Facility.Type))
            .ForMember(d => d.Cost, o => o.MapFrom(s => s.Facility.Cost));

        CreateMap<TourSchedule, TourScheduleDto>()
            .ForMember(d => d.TourName, o => o.MapFrom(s => s.Tour.Name))
            .ForMember(d => d.PackageName, o => o.MapFrom(s => s.TourPackage.Name));
        CreateMap<TourScheduleCreateRequest, TourSchedule>();

        CreateMap<Models.Booking, BookingDto>()
            .ForMember(d => d.CustomerName, o => o.MapFrom(s => s.Customer.User.FullName))
            .ForMember(d => d.CustomerEmail, o => o.MapFrom(s => s.Customer.User.Email))
            .ForMember(d => d.TourName, o => o.MapFrom(s => s.TourPackage.Tour.Name))
            .ForMember(d => d.PackageName, o => o.MapFrom(s => s.TourPackage.Name));

        CreateMap<Payment, PaymentDto>()
            .ForMember(d => d.BookingReference, o => o.MapFrom(s => s.Booking.BookingReference));

        CreateMap<Customer, CustomerDto>()
            .ForMember(d => d.FullName, o => o.MapFrom(s => s.User.FullName))
            .ForMember(d => d.Email, o => o.MapFrom(s => s.User.Email))
            .ForMember(d => d.Phone, o => o.MapFrom(s => s.User.Phone))
            .ForMember(d => d.IsActive, o => o.MapFrom(s => s.User.IsActive))
            .ForMember(d => d.CreatedAt, o => o.MapFrom(s => s.User.CreatedAt))
            .ForMember(d => d.TotalBookings, o => o.MapFrom(s => s.Bookings.Count))
            .ForMember(d => d.TotalSpent, o => o.MapFrom(s => s.Bookings.Sum(b => b.AmountPaid)));

        CreateMap<Staff, StaffDto>()
            .ForMember(d => d.FullName, o => o.MapFrom(s => s.User.FullName))
            .ForMember(d => d.Email, o => o.MapFrom(s => s.User.Email))
            .ForMember(d => d.Phone, o => o.MapFrom(s => s.User.Phone))
            .ForMember(d => d.IsActive, o => o.MapFrom(s => s.User.IsActive));

        CreateMap<Driver, DriverDto>();
        CreateMap<DriverCreateRequest, Driver>();

        CreateMap<Vehicle, VehicleDto>();
        CreateMap<VehicleCreateRequest, Vehicle>();

        CreateMap<VehicleAllocation, VehicleAllocationDto>()
            .ForMember(d => d.VehicleName, o => o.MapFrom(s => s.Vehicle.Name))
            .ForMember(d => d.DriverName, o => o.MapFrom(s => s.Driver != null ? s.Driver.FullName : null))
            .ForMember(d => d.StaffIds, o => o.MapFrom(s => s.StaffAssignments.Select(sa => sa.StaffId).ToList()))
            .ForMember(d => d.StaffNames, o => o.MapFrom(s => s.StaffAssignments.Where(sa => sa.Staff != null).Select(sa => sa.Staff!.User.FullName).ToList()))
            .ForMember(d => d.BookingReference, o => o.MapFrom(s => s.Booking != null ? s.Booking.BookingReference : null));
        CreateMap<VehicleAllocationCreateRequest, VehicleAllocation>()
            .ForMember(d => d.StaffAssignments, o => o.Ignore());

        CreateMap<Expense, ExpenseDto>()
            .ForMember(d => d.BookingReference, o => o.MapFrom(s => s.Booking != null ? s.Booking.BookingReference : null))
            .ForMember(d => d.PackageName, o => o.MapFrom(s => s.TourPackage != null ? s.TourPackage.Name : null));
        CreateMap<ExpenseCreateRequest, Expense>();

        CreateMap<Refund, RefundDto>()
            .ForMember(d => d.BookingReference, o => o.MapFrom(s => s.Booking.BookingReference))
            .ForMember(d => d.CustomerName, o => o.MapFrom(s => s.Booking.Customer.User.FullName));

        CreateMap<Review, ReviewDto>()
            .ForMember(d => d.CustomerName, o => o.MapFrom(s => s.Customer.User.FullName))
            .ForMember(d => d.TourName, o => o.MapFrom(s => s.Tour.Name));

        CreateMap<Notification, NotificationDto>();
    }
}
