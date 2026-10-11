import { addDaysString, isSameOrBefore, parseDate, inclusiveDays } from '../clock';

export interface ItineraryDay {
  dayIndex: number;
  date: string;
  city: string;
  activities: string;
  accommodation: string;
}

export function generateItinerary(
  trip: {
    destination: string;
    startDate: string;
    endDate: string;
  },
  details?: {
    city?: string;
    hotelName?: string;
  }
): ItineraryDay[] {
  const days: ItineraryDay[] = [];
  const city = details?.city || trip.destination;
  const hotel = details?.hotelName || 'Confirmed City Center Hotel';

  const totalDays = inclusiveDays(trip.startDate, trip.endDate);

  const sampleActivities: Record<string, string[]> = {
    france: [
      'Arrival, airport transfer, hotel check-in, evening stroll along Seine river',
      'Visit Louvre Museum, Tuileries Garden, Place de la Concorde',
      'Eiffel Tower ascent, Champ de Mars, Seine river cruise',
      'Musée d’Orsay, Saint-Germain-des-Prés historical café exploration',
      'Day excursion to Palace of Versailles and Gardens',
      'Montmartre walking tour, Sacré-Cœur Basilica, Place du Tertre artists',
      'Centre Pompidou, Le Marais historic district, Place des Vosges',
      'Shopping at Galeries Lafayette, Opéra Garnier guided tour',
      'Latin Quarter, Panthéon, Luxembourg Gardens leisure afternoon',
      'Musée Rodin, Les Invalides, Pont Alexandre III photography',
      'Day trip to Giverny (Claude Monet House & Gardens)',
      'Le Bon Marché, culinary tasting tour and French pastry workshop',
      'Arc de Triomphe, Champs-Élysées promenade, souvenir collection',
      'Hotel check-out, final packing, transfer to airport for departure',
    ],
    japan: [
      'Arrival at Tokyo Haneda/Narita, train to hotel, Shinjuku night walk',
      'Meiji Jingu Shrine, Harajuku Takeshita Street, Shibuya Crossing',
      'Asakusa Senso-ji Temple, Nakamise shopping street, Tokyo Skytree',
      'Akihabara electronics and gaming district, Ueno Park museums',
      'Day excursion to Kamakura (Great Buddha) and Enoshima Island',
      'Shinkansen bullet train to Kyoto, Gion geisha district walk',
      'Fushimi Inari-taisha 10,000 torii gates, Kiyomizu-dera Temple',
      'Kinkaku-ji (Golden Pavilion), Arashiyama Bamboo Grove and monkey park',
      'Day trip to Nara (Todai-ji Temple, Nara Deer Park)',
      'Bullet train to Osaka, Dotonbori culinary tour, Osaka Castle',
      'Day trip to Hiroshima and Miyajima Floating Torii Gate',
      'Return to Tokyo, Ginza shopping and art gallery visits',
      'Tsukiji Outer Market food tasting, TeamLab Borderless digital museum',
      'Hotel check-out, Narita Express transfer, departure flight',
    ],
  };

  const key = trip.destination.toLowerCase().includes('japan')
    ? 'japan'
    : 'france';
  const activityList = sampleActivities[key];

  let currDate = trip.startDate;
  let idx = 1;

  while (isSameOrBefore(currDate, trip.endDate)) {
    const act =
      idx === 1
        ? `Arrival in ${city}, transfer, hotel check-in, orientation walk`
        : isSameOrBefore(trip.endDate, currDate)
        ? `Hotel check-out, luggage collection, transfer to airport for departure`
        : activityList[(idx - 1) % activityList.length];

    days.push({
      dayIndex: idx,
      date: currDate,
      city,
      activities: act,
      accommodation: hotel,
    });

    currDate = addDaysString(currDate, 1);
    idx++;
  }

  return days;
}
