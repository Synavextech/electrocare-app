export interface Repair {
  id: string;
  request_id?: string;
  userId?: string;
  user_id?: string;
  technicianId?: string | null;
  technician_id?: string | null;
  device_type: string;
  device_model?: string;
  issue: string;
  status: string;
  delivery: boolean;
  trackingNumber?: string;
  tracking_number?: string;
  cost?: number;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrackingUpdate {
  id: string | number;
  repair_id?: string | number;
  status_update: string;
  created_at: string;
}

  
  // Add other models as needed (User, Sale, etc.)