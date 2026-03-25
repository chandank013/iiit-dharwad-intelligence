# **App Name**: IIIT Dharwad AIS

## Core Features:

- Secure User Authentication & Role-based Access: Unified login for all users (Professor/Student). System routes users based on their assigned role post-login, ensuring proper access control.
- Dynamic Course Management & Enrollment: Professors can create and manage courses, including auto-generating join codes. Students can enroll in courses using join codes or view their enrolled/archived courses.
- Dynamic Assignment Creation (Professor): Professors can create assignments with rich descriptions, set deadlines, define submission types (text, file, ZIP, GitHub, Drive), configure late submission policies, allow resubmissions, and enable/disable leaderboards.
- AI-Powered Rubric Generator (Professor): Professors can input an assignment description, and the AI will act as a tool to suggest a comprehensive rubric, which can then be manually refined.
- Multi-format Assignment Submission (Student): Students can submit assignments in various formats including text, file uploads, ZIP archives, GitHub repository links, or Google Drive links, with an AI tool providing a submission quality warning prior to final submission.
- AI-Driven Submission Evaluation & Plagiarism Detection: The AI tool automatically evaluates submissions across various formats (code, documents, project files), providing rubric-wise scores, total scores, written feedback, and weak area detection, while also flagging plagiarism compared to other submissions using Groq API.
- AI-Assisted Group Project Evaluation: The AI tool evaluates group projects, assesses individual contribution reports, cross-checks with commit history, fairly splits marks, and flags conflicts for professor review.
- Professor Submission Review and Override: Professors can view detailed student submissions, AI evaluation results, confidence scores, and feedback. They can approve AI-generated marks or override them with custom scores, with all overrides logged in an audit trail.
- Personalized Feedback Reports & Learning Resources (Student): Students receive detailed feedback reports including total score, AI confidence, rubric breakdown, written feedback, GitHub/ZIP analysis, resubmission comparison, and AI-suggested learning resources based on identified weak areas.
- Comprehensive Analytics Dashboard: Provides professors with class-level insights (average scores, grade distribution, difficulty heatmap, submission behavior, weak area summaries) and individual student progress timelines.
- Auto-generated Student Portfolio: Students have an automatically generated personal portfolio displaying all completed assignments, scores, progress graphs, and a shareable public link.
- AI Chatbot Assistant: A floating AI chatbot available to both professors and students to answer data-aware queries, provide hints to students, and offer quick information.
- Course Communication System: Enables professors to post announcements, send private messages to individual students, and includes auto-sent deadline reminders.
- Content Sharing (Professor): Professors can share various content types within a course, including text posts/announcements, file uploads (PDF, docs, zip), links/URLs, and embedded videos.
- MongoDB Data Persistence: All application data, including users, courses, assignments, submissions, evaluations, and audit logs, is stored and managed using MongoDB for robust data persistence and retrieval.

## Style Guidelines:

- Light color scheme, reflecting professionalism and clarity suitable for an academic platform.
- Primary accent color: Professional Blue (#3A7CA5), chosen for its association with intelligence, technology, and stability, offering good contrast on light backgrounds.
- Background color: A very light, desaturated blue (#F6FAFC), providing a clean and academic aesthetic while subtly aligning with the primary blue.
- Secondary accent color: A vibrant Cyan (#4AB9D6), analogous to the primary color but with higher saturation and brightness, used for highlights and interactive elements to create visual interest.
- Headlines and prominent text will use 'Space Grotesk', a sans-serif font, for a modern, tech-oriented, and intelligent feel.
- Body text and longer descriptions will use 'Inter', a neutral and highly readable sans-serif, ensuring legibility for extensive academic content.
- Computer code snippets will be displayed using 'Source Code Pro', a monospaced font.
- Use a consistent set of clean, professional line icons. Icons should clearly represent their function without being overly decorative, focusing on academic and digital concepts.
- Structured, dashboard-centric layouts for both professor and student views, prioritizing data hierarchy and quick access to critical information.
- The design will be responsive, adapting well to various screen sizes.
- Subtle, functional animations and transitions, such as smooth fades for content loading or expansions for feedback details, to enhance user experience without causing distraction, and indicating interactive elements.