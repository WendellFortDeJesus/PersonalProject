
export type UserStatus = 'active' | 'blocked';

export interface Patron {
  id: string;
  name: string;
  email: string;
  rfid?: string;
  role: 'Student' | 'Faculty' | 'Staff' | 'Visitor';
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
  { id: 'study', label: 'Study', icon: 'BookOpen' },
  { id: 'research', label: 'Research', icon: 'Search' },
  { id: 'meeting', label: 'Meeting', icon: 'Users' },
  { id: 'printing', label: 'Printing', icon: 'Printer' },
  { id: 'computer', label: 'Computer Use', icon: 'Monitor' },
  { id: 'reference', label: 'Reference Help', icon: 'HelpCircle' },
];

export const MOCK_PATRONS: Patron[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@university.edu', rfid: 'RFID-123', role: 'Student', status: 'active', lastVisit: '2024-05-20T10:30:00Z' },
  { id: '2', name: 'Dr. Robert Smith', email: 'robert.smith@university.edu', rfid: 'RFID-456', role: 'Faculty', status: 'active', lastVisit: '2024-05-21T09:15:00Z' },
  { id: '3', name: 'Sarah Miller', email: 'sarah.miller@university.edu', role: 'Staff', status: 'blocked', lastVisit: '2024-04-15T14:00:00Z' },
  { id: '4', name: 'John Doe', email: 'j.doe@visitor.com', role: 'Visitor', status: 'active', lastVisit: '2024-05-19T11:45:00Z' },
];

export const MOCK_VISITS: Visit[] = [
  { id: 'v1', patronId: '1', patronName: 'Alice Johnson', purpose: 'Study', timestamp: '2024-05-20T10:30:00Z' },
  { id: 'v2', patronId: '2', patronName: 'Dr. Robert Smith', purpose: 'Research', timestamp: '2024-05-21T09:15:00Z' },
  { id: 'v3', patronId: '4', patronName: 'John Doe', purpose: 'Meeting', timestamp: '2024-05-19T11:45:00Z' },
  { id: 'v4', patronId: '1', patronName: 'Alice Johnson', purpose: 'Printing', timestamp: '2024-05-22T08:00:00Z' },
  { id: 'v5', patronId: '2', patronName: 'Dr. Robert Smith', purpose: 'Computer Use', timestamp: '2024-05-22T09:30:00Z' },
];
