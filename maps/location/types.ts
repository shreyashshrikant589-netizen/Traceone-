export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type GPSLocation = Coordinate & {
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
};
