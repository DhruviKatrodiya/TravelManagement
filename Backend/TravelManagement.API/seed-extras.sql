-- Fix Bhutan image to the actual Tiger's Nest (Paro Taktsang) photo from Wikimedia
UPDATE Tours
SET ImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Paro_Taktsang%2C_Bhutan_%28edited%29.jpg/1200px-Paro_Taktsang%2C_Bhutan_%28edited%29.jpg'
WHERE Id = 3;

-- Add 5 new tours (idempotent: only inserts if Id doesn't already exist)
SET IDENTITY_INSERT Tours ON;

IF NOT EXISTS (SELECT 1 FROM Tours WHERE Id = 5)
INSERT INTO Tours (Id, Name, Destination, Region, Description, Highlights, ImageUrl, IsActive, CreatedAt)
VALUES (5, 'Rajasthan Royal Escape', 0, 'Jaipur-Udaipur-Jaisalmer',
        'Forts, palaces and desert dunes across the heart of Rajasthan.',
        'Amber Fort, City Palace, Sam Sand Dunes, Lake Pichola',
        'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
        1, '2024-01-01T00:00:00');

IF NOT EXISTS (SELECT 1 FROM Tours WHERE Id = 6)
INSERT INTO Tours (Id, Name, Destination, Region, Description, Highlights, ImageUrl, IsActive, CreatedAt)
VALUES (6, 'Ladakh High Altitude Adventure', 0, 'Leh-Nubra-Pangong',
        'High passes, alpine lakes and Buddhist monasteries in the Himalayas.',
        'Pangong Lake, Khardung La, Nubra Valley, Thiksey Monastery',
        'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800',
        1, '2024-01-01T00:00:00');

IF NOT EXISTS (SELECT 1 FROM Tours WHERE Id = 7)
INSERT INTO Tours (Id, Name, Destination, Region, Description, Highlights, ImageUrl, IsActive, CreatedAt)
VALUES (7, 'Goa Beach Holiday', 0, 'North & South Goa',
        'Sun, sand, seafood and Portuguese-era charm by the Arabian Sea.',
        'Calangute, Anjuna, Old Goa churches, Dudhsagar Falls',
        'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800',
        1, '2024-01-01T00:00:00');

IF NOT EXISTS (SELECT 1 FROM Tours WHERE Id = 8)
INSERT INTO Tours (Id, Name, Destination, Region, Description, Highlights, ImageUrl, IsActive, CreatedAt)
VALUES (8, 'Kashmir Paradise', 0, 'Srinagar-Gulmarg-Pahalgam',
        'Shikara rides on Dal Lake, Mughal gardens and snow-clad meadows.',
        'Dal Lake, Gulmarg Gondola, Betaab Valley, Mughal Gardens',
        'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800',
        1, '2024-01-01T00:00:00');

IF NOT EXISTS (SELECT 1 FROM Tours WHERE Id = 9)
INSERT INTO Tours (Id, Name, Destination, Region, Description, Highlights, ImageUrl, IsActive, CreatedAt)
VALUES (9, 'Sikkim & Darjeeling Charm', 0, 'Gangtok-Darjeeling-Pelling',
        'Tea gardens, toy train rides and Kanchenjunga sunrise vistas.',
        'Tiger Hill sunrise, Tsomgo Lake, Nathula Pass, Pelling',
        'https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?w=800',
        1, '2024-01-01T00:00:00');

SET IDENTITY_INSERT Tours OFF;

-- Add one package per new tour so the home page shows "From ₹X / person"
SET IDENTITY_INSERT TourPackages ON;

IF NOT EXISTS (SELECT 1 FROM TourPackages WHERE Id = 6)
INSERT INTO TourPackages (Id, TourId, Name, DurationDays, DurationNights, PricePerPerson, ChildPrice, MinPersons, MaxPersons, Description, Inclusions, Exclusions, IsCustomizable, IsActive, CreatedAt)
VALUES (6, 5, 'Rajasthan 6D/5N Royal', 6, 5, 28999, 18999, 2, 12,
        'Jaipur, Pushkar, Udaipur and Jaisalmer dunes safari.',
        'Heritage hotel, breakfast, AC transport, guide',
        'Flights, lunch & dinner, monuments fees',
        1, 1, '2024-01-01T00:00:00');

IF NOT EXISTS (SELECT 1 FROM TourPackages WHERE Id = 7)
INSERT INTO TourPackages (Id, TourId, Name, DurationDays, DurationNights, PricePerPerson, ChildPrice, MinPersons, MaxPersons, Description, Inclusions, Exclusions, IsCustomizable, IsActive, CreatedAt)
VALUES (7, 6, 'Ladakh 7D/6N Explorer', 7, 6, 34999, 22999, 2, 10,
        'Leh acclimatisation, Nubra dune safari and Pangong overnight.',
        'Hotel/camp, all meals, permits, oxygen support',
        'Flights, insurance, personal expenses',
        0, 1, '2024-01-01T00:00:00');

IF NOT EXISTS (SELECT 1 FROM TourPackages WHERE Id = 8)
INSERT INTO TourPackages (Id, TourId, Name, DurationDays, DurationNights, PricePerPerson, ChildPrice, MinPersons, MaxPersons, Description, Inclusions, Exclusions, IsCustomizable, IsActive, CreatedAt)
VALUES (8, 7, 'Goa 4D/3N Beach Break', 4, 3, 12999, 8999, 2, 10,
        'Beachside resort, North + South Goa sightseeing, cruise.',
        'Beach hotel, breakfast, AC transport, sunset cruise',
        'Flights, lunch & dinner, water sports',
        1, 1, '2024-01-01T00:00:00');

IF NOT EXISTS (SELECT 1 FROM TourPackages WHERE Id = 9)
INSERT INTO TourPackages (Id, TourId, Name, DurationDays, DurationNights, PricePerPerson, ChildPrice, MinPersons, MaxPersons, Description, Inclusions, Exclusions, IsCustomizable, IsActive, CreatedAt)
VALUES (9, 8, 'Kashmir 5D/4N Paradise', 5, 4, 19999, 13999, 2, 10,
        'Srinagar houseboat night, Gulmarg gondola and Pahalgam.',
        'Houseboat + hotel, breakfast & dinner, transport',
        'Flights, lunch, gondola tickets',
        1, 1, '2024-01-01T00:00:00');

IF NOT EXISTS (SELECT 1 FROM TourPackages WHERE Id = 10)
INSERT INTO TourPackages (Id, TourId, Name, DurationDays, DurationNights, PricePerPerson, ChildPrice, MinPersons, MaxPersons, Description, Inclusions, Exclusions, IsCustomizable, IsActive, CreatedAt)
VALUES (10, 9, 'Sikkim & Darjeeling 6D/5N', 6, 5, 21999, 14999, 2, 12,
        'Gangtok, Tsomgo Lake, Darjeeling tea gardens and Tiger Hill.',
        'Hotel, breakfast, transport, permits',
        'Flights, lunch & dinner, Nathula extra',
        1, 1, '2024-01-01T00:00:00');

SET IDENTITY_INSERT TourPackages OFF;

SELECT Id, Name, ImageUrl FROM Tours ORDER BY Id;
