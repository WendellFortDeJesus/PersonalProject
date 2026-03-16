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
  patronRole?: string;
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
  'College of Accountancy',
  'College of Agriculture',
  'College of Arts and Sciences',
  'College of Business Administration',
  'College of Communication',
  'College of Criminology',
  'College of Education',
  'College of Engineering and Technology/Architecture',
  'College of Informatics and Computing Studies',
  'College of Law',
  'College of Medicine',
  'College of Nursing',
  'College of Medical Technology',
  'College of Midwifery',
  'College of Physical Therapy/Respiratory Therapy',
  'College of Music',
  'School of International Relations',
  'School of Graduate Studies'
];
