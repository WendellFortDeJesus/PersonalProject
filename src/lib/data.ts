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
  { id: 'group_study', label: 'Group Study', icon: 'Users' },
];

export const DEPARTMENTS = [
  'College of Informatics and Computing Sciences',
  'College of Engineering',
  'College of Arts and Sciences',
  'College of Business Administration',
  'College of Education',
  'College of Nursing',
  'College of Law',
  'College of Music',
  'College of Communication',
  'College of Criminology',
  'School of Graduate Studies',
  'Senior High School',
  'Administrative Staff',
  'External Guest'
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
