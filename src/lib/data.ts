export type UserStatus = 'active' | 'blocked';

export interface Patron {
  id: string;
  name: string;
  email: string;
  rfid?: string;
  role: 'Student' | 'Faculty' | 'Staff' | 'Visitor';
  departments: string[];
  status: UserStatus;
  lastVisit?: string;
  photoUrl?: string;
  age?: number;
  gender?: string;
}

export interface Visit {
  id: string;
  patronId: string;
  patronName: string;
  patronDepartments: string[];
  purpose: string;
  timestamp: string;
}

export const PURPOSES = [
  { id: 'reading', label: 'Reading Books', icon: 'BookOpen' },
  { id: 'research', label: 'Research / Thesis', icon: 'Search' },
  { id: 'computer', label: 'Use of Computer', icon: 'Monitor' },
  { id: 'assignments', label: 'Doing Assignments', icon: 'FileText' },
];

export const DEPARTMENTS = [
  'College of Engineering',
  'College of Informatics and Computing Sciences',
  'College of Arts and Sciences',
  'College of Business Administration',
  'College of Education',
  'College of Nursing',
  'Office of the Registrar',
  'Library Administration',
  'External Visitor'
];

export const GENDERS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say'
];

export const MOCK_PATRONS: Patron[] = [
  { 
    id: '1', 
    name: 'Alice Johnson', 
    email: 'alice@neu.edu.ph', 
    rfid: '2021-100456', 
    role: 'Student', 
    departments: ['College of Engineering'], 
    status: 'active', 
    lastVisit: '2024-05-20T10:30:00Z',
    photoUrl: 'https://picsum.photos/seed/alice/300/300',
    age: 20,
    gender: 'Female'
  },
  { 
    id: '2', 
    name: 'Dr. Robert Smith', 
    email: 'robert.smith@neu.edu.ph', 
    rfid: 'EMP-998', 
    role: 'Faculty', 
    departments: ['College of Informatics and Computing Sciences', 'College of Engineering'], 
    status: 'active', 
    lastVisit: '2024-05-21T09:15:00Z',
    photoUrl: 'https://picsum.photos/seed/robert/300/300',
    age: 45,
    gender: 'Male'
  },
  { 
    id: '3', 
    name: 'Sarah Miller', 
    email: 'sarah.miller@neu.edu.ph', 
    rfid: 'EMP-102',
    role: 'Staff', 
    departments: ['Office of the Registrar'], 
    status: 'blocked', 
    lastVisit: '2024-04-15T14:00:00Z' 
  },
  { 
    id: '4', 
    name: 'John Doe', 
    email: 'j.doe@visitor.com', 
    rfid: 'VIS-001',
    role: 'Visitor', 
    departments: ['External Visitor'], 
    status: 'active', 
    lastVisit: '2024-05-19T11:45:00Z' 
  },
];

export const MOCK_VISITS: Visit[] = [
  { id: 'v1', patronId: '1', patronName: 'Alice Johnson', patronDepartments: ['College of Engineering'], purpose: 'Reading Books', timestamp: '2024-05-20T10:30:00Z' },
  { id: 'v2', patronId: '2', patronName: 'Dr. Robert Smith', patronDepartments: ['College of Informatics and Computing Sciences'], purpose: 'Research / Thesis', timestamp: '2024-05-21T09:15:00Z' },
  { id: 'v3', patronId: '4', patronName: 'John Doe', patronDepartments: ['External Visitor'], purpose: 'Use of Computer', timestamp: '2024-05-19T11:45:00Z' },
  { id: 'v4', patronId: '1', patronName: 'Alice Johnson', patronDepartments: ['College of Engineering'], purpose: 'Doing Assignments', timestamp: '2024-05-22T08:00:00Z' },
];
