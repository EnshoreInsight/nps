CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROJECT_REPRESENTATIVE', 'VIEWER');
CREATE TYPE "AssignmentRole" AS ENUM ('PM', 'CEO_VIEW', 'PROJECT_REP');
CREATE TYPE "ContactPreference" AS ENUM ('YES', 'NO');
CREATE TYPE "UrgencyLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4');
CREATE TYPE "FeedbackActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "client" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "description" TEXT,
  "feedbackIntro" TEXT,
  "thankYouMessage" TEXT,
  "emailTemplateHtml" TEXT,
  "emailBannerUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "assignment" "AssignmentRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectEmailRecipient" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "receivesL1" BOOLEAN NOT NULL DEFAULT true,
  "receivesL2" BOOLEAN NOT NULL DEFAULT true,
  "receivesL3" BOOLEAN NOT NULL DEFAULT true,
  "receivesL4" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectEmailRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedbackSubmission" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "client" TEXT NOT NULL,
  "packageName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "contactRequested" "ContactPreference" NOT NULL,
  "urgencyLevel" "UrgencyLevel" NOT NULL,
  "slaDueAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedbackSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedbackAction" (
  "id" TEXT NOT NULL,
  "feedbackSubmissionId" TEXT NOT NULL,
  "status" "FeedbackActionStatus" NOT NULL DEFAULT 'OPEN',
  "contacted" BOOLEAN NOT NULL DEFAULT false,
  "contactedAt" TIMESTAMP(3),
  "ownerNotes" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedbackAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "feedbackActionId" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "fromValue" TEXT,
  "toValue" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
CREATE UNIQUE INDEX "ProjectAssignment_userId_projectId_assignment_key" ON "ProjectAssignment"("userId", "projectId", "assignment");
CREATE UNIQUE INDEX "FeedbackAction_feedbackSubmissionId_key" ON "FeedbackAction"("feedbackSubmissionId");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectEmailRecipient" ADD CONSTRAINT "ProjectEmailRecipient_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedbackSubmission" ADD CONSTRAINT "FeedbackSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedbackAction" ADD CONSTRAINT "FeedbackAction_feedbackSubmissionId_fkey" FOREIGN KEY ("feedbackSubmissionId") REFERENCES "FeedbackSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedbackAction" ADD CONSTRAINT "FeedbackAction_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_feedbackActionId_fkey" FOREIGN KEY ("feedbackActionId") REFERENCES "FeedbackAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
