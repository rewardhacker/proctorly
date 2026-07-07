# Graph Report - .  (2026-07-06)

## Corpus Check
- 41 files · ~18,320 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 383 nodes · 512 edges · 47 communities (22 shown, 25 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Student Exam Session|Student Exam Session]]
- [[_COMMUNITY_File Serving & Storage|File Serving & Storage]]
- [[_COMMUNITY_Exam Answer Editor|Exam Answer Editor]]
- [[_COMMUNITY_Upload Actions|Upload Actions]]
- [[_COMMUNITY_PDF Annotation (Tutor)|PDF Annotation (Tutor)]]
- [[_COMMUNITY_Package Config|Package Config]]
- [[_COMMUNITY_Project Docs & Assets|Project Docs & Assets]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Tutee & Invite CRUD|Tutee & Invite CRUD]]
- [[_COMMUNITY_Local Storage & Crons|Local Storage & Crons]]
- [[_COMMUNITY_npm Dependencies|npm Dependencies]]
- [[_COMMUNITY_Student Dashboard|Student Dashboard]]
- [[_COMMUNITY_TutorNav & Logout|TutorNav & Logout]]
- [[_COMMUNITY_Paper Upload Form|Paper Upload Form]]
- [[_COMMUNITY_Grading Page|Grading Page]]
- [[_COMMUNITY_Landing Page|Landing Page]]
- [[_COMMUNITY_Build Config & exFAT Patch|Build Config & exFAT Patch]]
- [[_COMMUNITY_App Layout & Fonts|App Layout & Fonts]]
- [[_COMMUNITY_Database Seed|Database Seed]]
- [[_COMMUNITY_Loading States|Loading States]]
- [[_COMMUNITY_Password Reset Email|Password Reset Email]]
- [[_COMMUNITY_NextAuth Type Extensions|NextAuth Type Extensions]]
- [[_COMMUNITY_PDF Annotator Client|PDF Annotator Client]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Auth Proxy|Auth Proxy]]
- [[_COMMUNITY_Vercel Cron Config|Vercel Cron Config]]
- [[_COMMUNITY_Complete Password Reset|Complete Password Reset]]
- [[_COMMUNITY_Finalise Paper Creation|Finalise Paper Creation]]
- [[_COMMUNITY_Give Consent|Give Consent]]
- [[_COMMUNITY_Log Focus Event|Log Focus Event]]
- [[_COMMUNITY_Report Issue|Report Issue]]
- [[_COMMUNITY_Save Annotation|Save Annotation]]
- [[_COMMUNITY_Save Answer|Save Answer]]
- [[_COMMUNITY_Save Tutor Annotation|Save Tutor Annotation]]
- [[_COMMUNITY_Start Attempt|Start Attempt]]
- [[_COMMUNITY_Student Login Action|Student Login Action]]
- [[_COMMUNITY_Submit Attempt|Submit Attempt]]
- [[_COMMUNITY_Claude Launch Config|Claude Launch Config]]
- [[_COMMUNITY_NextAuth Route|NextAuth Route]]
- [[_COMMUNITY_Package JSON|Package JSON]]
- [[_COMMUNITY_Proxy Config|Proxy Config]]
- [[_COMMUNITY_File SVG|File SVG]]
- [[_COMMUNITY_Globe SVG|Globe SVG]]
- [[_COMMUNITY_Window SVG|Window SVG]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `requireTutorId()` - 15 edges
3. `getTuteeSession()` - 9 edges
4. `Local Development Setup` - 9 edges
5. `resolveAttemptState()` - 8 edges
6. `GradeAttemptPage()` - 7 edges
7. `TuteesPage()` - 7 edges
8. `getOwnAttempt()` - 7 edges
9. `scripts` - 7 edges
10. `loadInvite()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Vercel Logo SVG (Triangle)` --semantically_similar_to--> `Netlify Deployment`  [INFERRED] [semantically similar]
  public/vercel.svg → README.md
- `Next.js Logo SVG` --conceptually_related_to--> `Next.js App`  [INFERRED]
  public/next.svg → README.md
- `cron-sweep GitHub Actions Workflow` --conceptually_related_to--> `Data Retention & Purge Policy`  [INFERRED]
  .github/workflows/cron-sweep.yml → lib/actions.ts
- `GradeAttemptPage()` --conceptually_related_to--> `Anti-Cheat Client-Reported Signal`  [INFERRED]
  app/tutor/attempts/[id]/page.tsx → lib/antiCheat.ts
- `GET()` --calls--> `resolveAttemptState()`  [EXTRACTED]
  app/api/cron/sweep-attempts/route.ts → lib/timer/resolveAttemptState.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Exam In-Progress UI Assembly** — attemptid_page, attemptid_countdown, attemptid_pdfannotator, attemptid_answereditor, attemptid_scanupload [EXTRACTED 0.95]
- **PDF Annotation Ecosystem (student write / tutor mark / server embed)** — attemptid_pdfannotator, annotatedpdfviewer, marked_pdf_route, attemptid_studentpaperreview [INFERRED 0.85]
- **Dual-Auth Access Guard (tutor NextAuth + tuteeSession)** — files_key_route, authed_layout, marked_pdf_route [INFERRED 0.85]
- **Tutor Grading Flow: Page + GradingForm + gradeAttempt** — id_page_gradeattemptpage, id_gradingform_gradingform, actions_gradeattempt [EXTRACTED 1.00]
- **Presigned Upload Pattern: begin + PUT + finalize** — concept_presigned_url_upload, actions_begintutorscanupload, actions_finalizetutorscanupload [INFERRED 0.95]
- **Cascade Delete Transactions across Tutor Resources** — concept_cascade_delete, actions_deleteinvite, actions_deletetutee, actions_deletepaper [INFERRED 0.90]

## Communities (47 total, 25 thin omitted)

### Community 0 - "Student Exam Session"
Cohesion: 0.09
Nodes (25): beginScanUpload(), beginTutorScanUpload(), createInvite(), createTutee(), deleteAttempt(), deleteInvite(), deleteTutee(), finalizeCreatePaper() (+17 more)

### Community 1 - "File Serving & Storage"
Cohesion: 0.12
Nodes (19): Notice(), contentTypeFor(), GET(), serve(), completePasswordReset(), sendEmail(), notifyIssueReport(), notifySubmission() (+11 more)

### Community 2 - "Exam Answer Editor"
Cohesion: 0.11
Nodes (20): AnswerEditor(), Status, trySync (AnswerEditor), AnswerView, Countdown(), Status, WARNINGS, PreExamStart() (+12 more)

### Community 3 - "Upload Actions"
Cohesion: 0.10
Nodes (22): beginPaperUpload Server Action, beginScanUpload Server Action, beginTutorScanUpload Server Action, finalizeScanUpload Server Action, finalizeTutorScanUpload Server Action, gradeAttempt Server Action, computeFlagStatus, AnswerView() (+14 more)

### Community 4 - "PDF Annotation (Tutor)"
Cohesion: 0.09
Nodes (21): AnnotatedPdfViewer (tutor), AnnotatablePdfPane, drawAnnotations, drawStudentStrokes, ReadOnlyPdfPane, Pages, ReactPdfModule, scheduleSave (PdfAnnotator) (+13 more)

### Community 5 - "Package Config"
Cohesion: 0.08
Nodes (23): devDependencies, eslint, eslint-config-next, @netlify/plugin-nextjs, tailwindcss, @tailwindcss/postcss, @types/bcryptjs, @types/node (+15 more)

### Community 6 - "Project Docs & Assets"
Cohesion: 0.10
Nodes (22): Next.js Docs in node_modules, Next.js Version Constraint, CLAUDE.md includes AGENTS.md, Next.js Logo SVG, Vercel Logo SVG (Triangle), Auth Secret Configuration, Cron Route: purge-expired, Cron Secret Configuration (+14 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Tutee & Invite CRUD"
Cohesion: 0.17
Nodes (14): createInvite Server Action, createTutee Server Action, deleteAttempt Server Action, deleteInvite Server Action, deletePaper Server Action, deleteTutee Server Action, resetAttempt Server Action, resetTuteePassword Server Action (+6 more)

### Community 9 - "Local Storage & Crons"
Cohesion: 0.22
Nodes (8): PUT(), localStorage, ROOT, sign(), verifyLocalUploadToken(), client, s3Storage, StorageAdapter

### Community 10 - "npm Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, idb, next, next-auth, pdf-lib (+8 more)

### Community 11 - "Student Dashboard"
Cohesion: 0.13
Nodes (10): Dual Authentication (tutor NextAuth + student tuteeSession), Mark Scheme Tutor-Only Access Control, contentTypeFor, Files Proxy API Route (GET), serve (files route helper), ForgotPasswordPage, studentLogout(), Tutor LoginPage (+2 more)

### Community 12 - "TutorNav & Logout"
Cohesion: 0.17
Nodes (5): logoutAction Server Action, LINKS, TutorNav(), logoutAction(), { handlers, auth, signIn, signOut }

### Community 13 - "Paper Upload Form"
Cohesion: 0.22
Nodes (3): FileInputButton(), beginPaperUpload(), ALLOWED_MIME

### Community 14 - "Grading Page"
Cohesion: 0.20
Nodes (4): Pages, ReactPdfModule, Stroke, saveTutorAnnotation()

### Community 15 - "Landing Page"
Cohesion: 0.29
Nodes (5): improvementData, questionTimings, stats, steps, testimonials

### Community 16 - "Build Config & exFAT Patch"
Cohesion: 0.33
Nodes (5): exFAT EISDIR readlink Patch, nextConfig, _readlink, _readlinkPromise, _readlinkSync

### Community 17 - "App Layout & Fonts"
Cohesion: 0.40
Nodes (3): arimaMadurai, metadata, mulish

### Community 18 - "Database Seed"
Cohesion: 0.40
Nodes (3): bcrypt, prisma, { PrismaClient }

### Community 20 - "Password Reset Email"
Cohesion: 0.67
Nodes (3): requestPasswordReset Server Action, Email Dev Fallback (console log stub), sendEmail

## Knowledge Gaps
- **145 isolated node(s):** `PdfAnnotator`, `mulish`, `arimaMadurai`, `metadata`, `eslintConfig` (+140 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getTuteeSession()` connect `File Serving & Storage` to `Student Exam Session`, `Exam Answer Editor`, `Student Dashboard`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `resolveAttemptState()` connect `File Serving & Storage` to `Student Exam Session`, `Exam Answer Editor`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `PdfAnnotator`, `mulish`, `arimaMadurai` to the rest of the system?**
  _149 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Student Exam Session` be split into smaller, more focused modules?**
  _Cohesion score 0.08943089430894309 - nodes in this community are weakly interconnected._
- **Should `File Serving & Storage` be split into smaller, more focused modules?**
  _Cohesion score 0.12096774193548387 - nodes in this community are weakly interconnected._
- **Should `Exam Answer Editor` be split into smaller, more focused modules?**
  _Cohesion score 0.11083743842364532 - nodes in this community are weakly interconnected._
- **Should `Upload Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.10052910052910052 - nodes in this community are weakly interconnected._