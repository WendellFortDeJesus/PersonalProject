
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
  'College of Informatics and Computing Sciences (CICS)',
  'College of Engineering and Technology (CET)',
  'College of Arts and Sciences (CAS)',
  'College of Business Administration (CBA)',
  'College of Education (CED)',
  'College of Nursing (CON)',
  'College of Law (COL)',
  'College of Music (COM)',
  'College of Communication (COC)',
  'College of Criminology (CC)',
  'College of Agriculture',
  'College of Medicine',
  'School of Graduate Studies (SGS)',
  'Senior High School (SHS)',
  'Junior High School (JHS)',
  'Elementary Department',
  'Administrative Staff / Faculty',
  'Maintenance and Security',
  'External Guest / Visitor'
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
