export type UserStatus = 'active' | 'blocked';

export interface Patron {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  role: 'Student' | 'Faculty' | 'Staff' | 'Visitor';
  departments: string[];
  age: number;
  gender: string;
  isBlocked: boolean;
  lastVisit?: string;
  createdAt: string;
  photoUrl?: string;
}

export interface Visit {
  id: string;
  schoolId: string;
  patronId: string;
  patronName: string;
  patronDepartments: string[];
  patronAge: number;
  patronGender: string;
  purpose: string;
  timestamp: string;
  status: 'granted' | 'blocked';
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

// Mock data removed for live system migration.
export const MOCK_PATRONS: Patron[] = [];
export const MOCK_VISITS: Visit[] = [];
