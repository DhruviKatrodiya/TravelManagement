namespace TravelManagement.API.Models;

public class VehicleAllocationStaff
{
    public int VehicleAllocationId { get; set; }
    public VehicleAllocation? VehicleAllocation { get; set; }

    public int StaffId { get; set; }
    public Staff? Staff { get; set; }
}
