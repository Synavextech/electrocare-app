export interface Repair {
    id: number;
    user_id: number;
    technician_id: number | null;
    device_type: string;
    issue: string;
    status: 'pending' | 'in_progress' | 'completed';
    delivery: boolean;
    tracking_number: string;
    cost: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface TrackingUpdate {
    id: number;
    repair_id: number;
    status_update: string;
    created_at: string; // Timestamp
  }

  
  // Add other models as needed (User, Sale, etc.)