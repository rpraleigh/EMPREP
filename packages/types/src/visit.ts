import type { FollowUpInterval } from './followup';

export type VisitAction = 'found' | 'delivered' | 'recommended' | 'removed' | 'expired';

export interface VisitRecord {
  id:                string;
  appointmentId:     string;
  employeeId:        string;
  summary:           string | null;
  recommendations:   string | null;
  followUpNeeded:    boolean;
  followUpInterval:  FollowUpInterval | null;
  completedAt:       string;
  createdAt:         string;
}

export interface VisitSupplyAction {
  id:            string;
  visitRecordId: string;
  supplyItemId:  string;
  action:        VisitAction;
  quantity:      number;
  condition:     string | null;
  notes:         string | null;
  createdAt:     string;
}

export interface CreateVisitRecordInput {
  appointmentId:    string;
  employeeId:       string;
  summary?:         string;
  recommendations?: string;
  followUpNeeded:   boolean;
  followUpInterval?: FollowUpInterval;
  supplyActions:    Array<{
    supplyItemId: string;
    action:       VisitAction;
    quantity:     number;
    condition?:   string;
    notes?:       string;
  }>;
}
