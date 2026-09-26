export type VolunteerLocationCreate = {
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  speed?: number;
  heading?: number;
  recorded_at: string;
};