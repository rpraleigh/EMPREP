export type AppointmentType   = 'evaluation' | 'delivery' | 'follow_up';
export type AppointmentStatus = 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
  id:             string;
  customerId:     string;
  employeeId:     string | null;
  type:           AppointmentType;
  status:         AppointmentStatus;
  scheduledAt:    string | null;
  completedAt:    string | null;
  customerNotes:  string | null;
  adminNotes:     string | null;
  createdAt:      string;
  updatedAt:      string;
}

export interface CreateAppointmentInput {
  customerId:     string;
  type:           AppointmentType;
  scheduledAt?:   string;
  customerNotes?: string;
}

export interface AssignAppointmentInput {
  appointmentId: string;
  employeeId:    string;
  scheduledAt?:  string;
  adminNotes?:   string;
}
