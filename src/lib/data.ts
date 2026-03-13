
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
  'College of Accountancy: BS in Accountancy, BS in Accounting Information System',
  'College of Agriculture: BS in Agriculture',
  'College of Arts and Sciences: BA in Economics, BA in Political Science, BS in Biology, BS in Psychology, Bachelor of Public Administration',
  'College of Business Administration: BSBA in Financial Management, Human Resource Development Management, Legal Management, Marketing Management, Entrepreneurship, and Real Estate Management',
  'College of Communication: BA in Communication, BA in Broadcasting, BA in Journalism',
  'College of Education: Bachelor of Elementary Education (with specializations in Early Childhood, Special Education), Bachelor of Secondary Education (majors in English, Filipino, Math, Social Studies, Science, MAPEH)',
  'College of Engineering and Architecture: BS in Civil, Electrical, Electronics, Industrial, and Mechanical Engineering; BS in Architecture',
  'College of Informatics and Computing Studies: BS in Computer Science, BS in Information Technology, BS in Information Systems, BS in Entertainment and Multimedia Computing',
  'College of Medical Technology: BS in Medical Technology',
  'College of Medicine: Doctor of Medicine',
  'College of Midwifery: Diploma in Midwifery',
  'College of Music: Bachelor of Music (majors in Music Education, Voice, etc.)',
  'College of Nursing: BS in Nursing',
  'College of Physical Therapy: BS in Physical Therapy',
  'College of Respiratory Therapy: BS in Respiratory Therapy',
  'School of International Relations: BS in Foreign Service',
  'College of Law: Juris Doctor',
  'College of Criminology: BS in Criminology',
  'Administrative Staff / Faculty',
  'External Guest / Visitor'
];

export const GENDERS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say'
];

export const MOCK_PATRONS: Patron[] = [];
export const MOCK_VISITS: Visit[] = [];
