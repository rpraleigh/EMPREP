export type FollowUpInterval = 'monthly' | 'quarterly' | 'biannual' | 'annual';

export interface FollowUpPlan {
  id:               string;
  customerId:       string;
  interval:         FollowUpInterval;
  lastVisitAt:      string | null;
  nextScheduledAt:  string | null;
  isActive:         boolean;
  createdAt:        string;
  updatedAt:        string;
}

export interface UpsertFollowUpPlanInput {
  customerId: string;
  interval:   FollowUpInterval;
  isActive?:  boolean;
}
