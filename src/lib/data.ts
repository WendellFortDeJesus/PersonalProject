
export type UserStatus = 'active' | 'blocked';

export interface Patron {
  id: string;
  name: string;
  email: string;
  rfid?: string;
  role: 'Student' | 'Faculty' | 'Staff' | 'Visitor';
  department: string; // Updated from Program/Course to Department
  status: UserStatus;
  lastVisit?: string;
}

export interface Visit {
  id: string;
  patronId: string;
  patronName: string;
  purpose: string;
  timestamp: string;
}

export const PURPOSES = [
  { id: 'reading', label: 'Reading books', icon: 'BookOpen' },
  { id: 'research', label: 'Research in thesis', icon: 'Search' },
  { id: 'computer', label: 'Use of computer', icon: 'Monitor' },
  { id: 'assignments', label: 'Doing assignments', icon: 'FileText' },
  { id: 'meeting', label: 'Meeting', icon: 'Users' },
];

export const MOCK_PATRONS: Patron[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@neu.edu.ph', rfid: '2021-100456', role: 'Student', department: 'College of Engineering', status: 'active', lastVisit: '2024-05-20T10:30:00Z' },
  { id: '2', name: 'Dr. Robert Smith', email: 'robert.smith@neu.edu.ph', rfid: 'EMP-998', role: 'Faculty', department: 'College of Arts and Sciences', status: 'active', lastVisit: '2024-05-21T09:15:00Z' },
  { id: '3', name: 'Sarah Miller', email: 'sarah.miller@neu.edu.ph', role: 'Staff', department: 'Office of the Registrar', status: 'blocked', lastVisit: '2024-04-15T14:00:00Z' },
  { id: '4', name: 'John Doe', email: 'j.doe@visitor.com', role: 'Visitor', department: 'External Visitor', status: 'active', lastVisit: '2024-05-19T11:45:00Z' },
];

export const MOCK_VISITS: Visit[] = [
  { id: 'v1', patronId: '1', patronName: 'Alice Johnson', purpose: 'Reading books', timestamp: '2024-05-20T10:30:00Z' },
  { id: 'v2', patronId: '2', patronName: 'Dr. Robert Smith', purpose: 'Research in thesis', timestamp: '2024-05-21T09:15:00Z' },
  { id: 'v3', patronId: '4', patronName: 'John Doe', purpose: 'Meeting', timestamp: '2024-05-19T11:45:00Z' },
  { id: 'v4', patronId: '1', patronName: 'Alice Johnson', purpose: 'Use of computer', timestamp: '2024-05-22T08:00:00Z' },
  { id: 'v5', patronId: '2', patronName: 'Dr. Robert Smith', purpose: 'Doing assignments', timestamp: '2024-05-22T09:30:00Z' },
];
