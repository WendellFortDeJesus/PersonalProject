export type UserStatus = 'active' | 'blocked';

export interface Patron {
  id: string; // Internal GUID
  schoolId: string; // School_ID (Primary Key/RFID)
  name: string;
  email: string;
  role: 'Student' | 'Faculty' | 'Staff' | 'Visitor';
  departments: string[]; // College_Department (Array)
  age: number;
  gender: string;
  isBlocked: boolean; // Is_Blocked (Boolean)
  lastVisit?: string;
  photoUrl?: string;
}

export interface Visit {
  id: string; // Log_ID
  schoolId: string; // Foreign Key linking to Users
  patronName: string; // Denormalized for reporting
  patronDepartments: string[]; // Denormalized
  purpose: string; // Purpose (Reading, Research, etc.)
  timestamp: string; // Timestamp (Entry)
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
    schoolId: '2021-100456', 
    name: 'Alice Johnson', 
    email: 'alice@neu.edu.ph', 
    role: 'Student', 
    departments: ['College of Engineering'], 
    age: 20,
    gender: 'Female',
    isBlocked: false,
    lastVisit: '2024-05-20T10:30:00Z',
    photoUrl: 'https://picsum.photos/seed/alice/300/300'
  },
  { 
    id: '2', 
    schoolId: 'EMP-998', 
    name: 'Dr. Robert Smith', 
    email: 'robert.smith@neu.edu.ph', 
    role: 'Faculty', 
    departments: ['College of Informatics and Computing Sciences', 'College of Engineering'], 
    age: 45,
    gender: 'Male',
    isBlocked: false,
    lastVisit: '2024-05-21T09:15:00Z',
    photoUrl: 'https://picsum.photos/seed/robert/300/300'
  },
  { 
    id: '3', 
    schoolId: 'EMP-102',
    name: 'Sarah Miller', 
    email: 'sarah.miller@neu.edu.ph', 
    role: 'Staff', 
    departments: ['Office of the Registrar'], 
    age: 32,
    gender: 'Female',
    isBlocked: true,
    lastVisit: '2024-04-15T14:00:00Z' 
  },
  { 
    id: '4', 
    schoolId: 'VIS-001',
    name: 'John Doe', 
    email: 'j.doe@visitor.com', 
    role: 'Visitor', 
    departments: ['External Visitor'], 
    age: 28,
    gender: 'Male',
    isBlocked: false,
    lastVisit: '2024-05-19T11:45:00Z' 
  },
];

export const MOCK_VISITS: Visit[] = [
  { id: 'v1', schoolId: '2021-100456', patronName: 'Alice Johnson', patronDepartments: ['College of Engineering'], purpose: 'Reading Books', timestamp: '2024-05-20T10:30:00Z' },
  { id: 'v2', schoolId: 'EMP-998', patronName: 'Dr. Robert Smith', patronDepartments: ['College of Informatics and Computing Sciences'], purpose: 'Research / Thesis', timestamp: '2024-05-21T09:15:00Z' },
  { id: 'v3', schoolId: 'VIS-001', patronName: 'John Doe', patronDepartments: ['External Visitor'], purpose: 'Use of Computer', timestamp: '2024-05-19T11:45:00Z' },
  { id: 'v4', schoolId: '2021-100456', patronName: 'Alice Johnson', patronDepartments: ['College of Engineering'], purpose: 'Doing Assignments', timestamp: '2024-05-22T08:00:00Z' },
];
