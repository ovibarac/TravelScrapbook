export interface Photo {
  id?: string;
  url: string;
  name: string;
  date: Date;
  userId: string;
  latitude?: number;
  longitude?: number;
  caption?: string;
  description?: string;
  tripId?: string;
}
