export interface Employee {
  id:        string;
  userId:    string;
  fullName:  string;
  email:     string;
  phone:     string | null;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  userId:   string;
  fullName: string;
  email:    string;
  phone?:   string;
}
