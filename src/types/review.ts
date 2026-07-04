export interface Review {
  id: string;
  userId: string;
  vendorId: string;
  serviceId?: string;
  bookingId?: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    fullName: string;
    profileImage?: string;
  };
  vendorprofile?: {
    businessName: string;
  };
  service?: {
    title: string;
  };
}
