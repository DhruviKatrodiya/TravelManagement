namespace TravelManagement.API.Models;

public class HomeDestinationTour
{
    public int HomeDestinationId { get; set; }
    public HomeDestination? HomeDestination { get; set; }

    public int TourId { get; set; }
    public Tour? Tour { get; set; }

    public int SortOrder { get; set; }
}
