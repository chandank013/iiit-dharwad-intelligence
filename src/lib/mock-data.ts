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

export const MOCK_USERS: User[] = [];
export const MOCK_COURSES: Course[] = [];
export const MOCK_ASSIGNMENTS: Assignment[] = [];
export const MOCK_SUBMISSIONS: Submission[] = [];
