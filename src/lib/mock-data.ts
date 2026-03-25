export type Role = 'professor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  joinCode: string;
  professorId: string;
  description: string;
  enrolledStudents: string[];
  archived?: boolean;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  deadline: string;
  submissionType: 'text' | 'file' | 'zip' | 'github' | 'drive';
  latePolicy: string;
  allowResubmission: boolean;
  enableLeaderboard: boolean;
  isGroupProject: boolean;
  rubric: {
    criterion: string;
    description: string;
    maxPoints: number;
  }[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  submittedAt: string;
  type: string;
  status: 'draft' | 'submitted' | 'graded';
  evaluation?: {
    totalScore: number;
    rubricScores: { item: string; score: number; feedback: string }[];
    writtenFeedback: string;
    weakAreas: string[];
    plagiarismDetected: boolean;
    plagiarismDetails: string;
    confidence: number;
  };
  professorOverride?: {
    score: number;
    feedback: string;
    timestamp: string;
  };
}

export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  date: string;
}

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Dr. Ramesh Kumar', email: 'ramesh.k@iiitdwd.ac.in', role: 'professor', avatar: 'https://picsum.photos/seed/prof1/100/100' },
  { id: 'u2', name: 'Aryan Sharma', email: '24bds001@iiitdwd.ac.in', role: 'student', avatar: 'https://picsum.photos/seed/stud1/100/100' },
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    name: 'Advanced Software Engineering',
    code: 'CS302',
    joinCode: 'ASE2024',
    professorId: 'u1',
    description: 'A deep dive into modern software architecture and design patterns.',
    enrolledStudents: ['u2'],
  },
  {
    id: 'c2',
    name: 'Natural Language Processing',
    code: 'CS412',
    joinCode: 'NLP-X91',
    professorId: 'u1',
    description: 'Foundations of computational linguistics and neural language models.',
    enrolledStudents: ['u2'],
  }
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'a1',
    courseId: 'c1',
    title: 'Microservices Architecture Design',
    description: 'Design a scalable microservices architecture for an e-commerce platform using Docker and Kubernetes principles.',
    deadline: '2024-12-20T23:59:00Z',
    submissionType: 'github',
    latePolicy: '10% deduction per day',
    allowResubmission: true,
    enableLeaderboard: true,
    isGroupProject: false,
    rubric: [
      { criterion: 'Architectural Soundness', description: 'Correct usage of patterns', maxPoints: 40 },
      { criterion: 'Implementation Detail', description: 'Completeness of service logic', maxPoints: 30 },
      { criterion: 'Documentation', description: 'Clarity of API docs', maxPoints: 30 }
    ]
  }
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 's1',
    assignmentId: 'a1',
    studentId: 'u2',
    content: 'https://github.com/aryansharma/ecommerce-microservices',
    submittedAt: '2024-12-18T14:30:00Z',
    type: 'github',
    status: 'graded',
    evaluation: {
      totalScore: 85,
      rubricScores: [
        { item: 'Architectural Soundness', score: 35, feedback: 'Strong use of API Gateway but needs better service discovery.' },
        { item: 'Implementation Detail', score: 25, feedback: 'User service is robust, Order service lacks edge case handling.' },
        { item: 'Documentation', score: 25, feedback: 'Swagger docs are mostly complete.' }
      ],
      writtenFeedback: 'Overall a very professional submission. Focus on enhancing inter-service communication reliability.',
      weakAreas: ['Service Discovery', 'Resilience Patterns'],
      plagiarismDetected: false,
      plagiarismDetails: '',
      confidence: 0.92
    }
  }
];
