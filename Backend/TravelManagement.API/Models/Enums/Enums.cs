namespace TravelManagement.API.Models.Enums;

public enum UserRole
{
    Customer = 0,
    Staff = 1,
    Admin = 2
}

public enum Destination
{
    India = 0,
    Bhutan = 1,
    Nepal = 2
}

public enum BookingStatus
{
    Pending = 0,
    Confirmed = 1,
    Cancelled = 2,
    Completed = 3,
    Refunded = 4
}

public enum PaymentStatus
{
    Pending = 0,
    Initiated = 1,
    Success = 2,
    Failed = 3,
    Refunded = 4
}

public enum PaymentMethod
{
    Paytm = 0,
    GooglePay = 1,
    Cash = 2,
    BankTransfer = 3
}

public enum FacilityType
{
    Breakfast = 0,
    Lunch = 1,
    Dinner = 2,
    Hotel = 3,
    Transportation = 4,
    Guide = 5,
    Other = 6
}

public enum VehicleType
{
    Car = 0,
    SUV = 1,
    MiniBus = 2,
    Bus = 3,
    Tempo = 4,
    Other = 5
}

public enum RefundStatus
{
    Requested = 0,
    Approved = 1,
    Rejected = 2,
    Processed = 3
}

public enum NotificationType
{
    BookingConfirmed = 0,
    BookingCancelled = 1,
    PaymentReceived = 2,
    TripReminder = 3,
    RefundProcessed = 4,
    General = 5
}
