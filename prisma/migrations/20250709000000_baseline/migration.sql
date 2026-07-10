-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'WALKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ListingTier" AS ENUM ('BASIC', 'STANDARD', 'FEATURED');

-- CreateEnum
CREATE TYPE "ListingReviewStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CredentialReviewStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProfileReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ProfileReportReason" AS ENUM ('MISLEADING_PROFILE', 'UNPROFESSIONAL', 'SAFETY_CONCERN', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "BackgroundCheckStatus" AS ENUM ('NONE', 'INVITED', 'PENDING', 'IN_PROGRESS', 'CLEAR', 'CONSIDER', 'SUSPENDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "termsAcceptedAt" TIMESTAMP(3),
    "notificationEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationSmsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notificationPhone" TEXT,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
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

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "owner_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "city" TEXT,
    "neighborhood" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "dogName" TEXT,
    "dogBreed" TEXT,
    "dogNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "walker_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "services" TEXT[],
    "rate30Min" TEXT,
    "rate60Min" TEXT,
    "zipCode" TEXT NOT NULL,
    "city" TEXT,
    "neighborhood" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "serviceRadiusMiles" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "phone" TEXT,
    "email" TEXT,
    "listingTier" "ListingTier" NOT NULL DEFAULT 'BASIC',
    "tierExpiresAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeSubscriptionStatus" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NONE',
    "verificationDocStoragePath" TEXT,
    "verificationDocMimeType" TEXT,
    "verificationDocFileName" TEXT,
    "verificationSubmittedAt" TIMESTAMP(3),
    "verificationReviewedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "listingReviewStatus" "ListingReviewStatus" NOT NULL DEFAULT 'NONE',
    "listingSubmittedAt" TIMESTAMP(3),
    "listingReviewedAt" TIMESTAMP(3),
    "listingReviewNotes" TEXT,
    "headshotUrl" TEXT,
    "headshotStoragePath" TEXT,
    "lastApprovedBio" TEXT,
    "lastApprovedHeadshotUrl" TEXT,
    "pendingChangesSummary" TEXT,
    "clientReferenceName" TEXT,
    "clientReferenceContact" TEXT,
    "clientReferenceNotes" TEXT,
    "credentialStatus" "CredentialReviewStatus" NOT NULL DEFAULT 'NONE',
    "credentialDocStoragePath" TEXT,
    "credentialDocMimeType" TEXT,
    "credentialDocFileName" TEXT,
    "credentialSubmittedAt" TIMESTAMP(3),
    "credentialReviewedAt" TIMESTAMP(3),
    "credentialNotes" TEXT,
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "backgroundCheckStatus" "BackgroundCheckStatus" NOT NULL DEFAULT 'NONE',
    "backgroundCheckInvitedAt" TIMESTAMP(3),
    "backgroundCheckCompletedAt" TIMESTAMP(3),
    "backgroundCheckNotes" TEXT,
    "checkrCandidateId" TEXT,
    "checkrInvitationId" TEXT,
    "checkrReportId" TEXT,
    "isBackgroundChecked" BOOLEAN NOT NULL DEFAULT false,
    "backgroundCheckAddonPurchasedAt" TIMESTAMP(3),
    "backgroundCheckStripeSessionId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "walker_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_reports" (
    "id" TEXT NOT NULL,
    "walkerProfileId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ProfileReportReason" NOT NULL,
    "details" TEXT,
    "status" "ProfileReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "walkerUserId" TEXT NOT NULL,
    "contactRevealed" BOOLEAN NOT NULL DEFAULT false,
    "ownerLastReadAt" TIMESTAMP(3),
    "walkerLastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "walkerProfileId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_inquiries" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_inquiry_messages" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_inquiry_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "owner_profiles_userId_key" ON "owner_profiles"("userId");

-- CreateIndex
CREATE INDEX "owner_profiles_latitude_longitude_idx" ON "owner_profiles"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "owner_profiles_zipCode_idx" ON "owner_profiles"("zipCode");

-- CreateIndex
CREATE UNIQUE INDEX "walker_profiles_userId_key" ON "walker_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "walker_profiles_stripeCustomerId_key" ON "walker_profiles"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "walker_profiles_stripeSubscriptionId_key" ON "walker_profiles"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "walker_profiles_latitude_longitude_idx" ON "walker_profiles"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "walker_profiles_zipCode_idx" ON "walker_profiles"("zipCode");

-- CreateIndex
CREATE INDEX "walker_profiles_listingTier_idx" ON "walker_profiles"("listingTier");

-- CreateIndex
CREATE INDEX "walker_profiles_verificationStatus_idx" ON "walker_profiles"("verificationStatus");

-- CreateIndex
CREATE INDEX "walker_profiles_listingReviewStatus_idx" ON "walker_profiles"("listingReviewStatus");

-- CreateIndex
CREATE INDEX "walker_profiles_credentialStatus_idx" ON "walker_profiles"("credentialStatus");

-- CreateIndex
CREATE INDEX "walker_profiles_backgroundCheckStatus_idx" ON "walker_profiles"("backgroundCheckStatus");

-- CreateIndex
CREATE INDEX "profile_reports_walkerProfileId_status_idx" ON "profile_reports"("walkerProfileId", "status");

-- CreateIndex
CREATE INDEX "profile_reports_status_createdAt_idx" ON "profile_reports"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "profile_reports_reporterId_walkerProfileId_key" ON "profile_reports"("reporterId", "walkerProfileId");

-- CreateIndex
CREATE INDEX "conversations_ownerId_idx" ON "conversations"("ownerId");

-- CreateIndex
CREATE INDEX "conversations_walkerUserId_idx" ON "conversations"("walkerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_ownerId_walkerUserId_key" ON "conversations"("ownerId", "walkerUserId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_walkerProfileId_status_idx" ON "reviews"("walkerProfileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_authorId_walkerProfileId_key" ON "reviews"("authorId", "walkerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "review_inquiries_reviewId_key" ON "review_inquiries"("reviewId");

-- CreateIndex
CREATE INDEX "review_inquiries_authorId_idx" ON "review_inquiries"("authorId");

-- CreateIndex
CREATE INDEX "review_inquiry_messages_inquiryId_createdAt_idx" ON "review_inquiry_messages"("inquiryId", "createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_profiles" ADD CONSTRAINT "owner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "walker_profiles" ADD CONSTRAINT "walker_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_reports" ADD CONSTRAINT "profile_reports_walkerProfileId_fkey" FOREIGN KEY ("walkerProfileId") REFERENCES "walker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_reports" ADD CONSTRAINT "profile_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_reports" ADD CONSTRAINT "profile_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_walkerUserId_fkey" FOREIGN KEY ("walkerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_walkerProfileId_fkey" FOREIGN KEY ("walkerProfileId") REFERENCES "walker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_inquiries" ADD CONSTRAINT "review_inquiries_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_inquiries" ADD CONSTRAINT "review_inquiries_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_inquiries" ADD CONSTRAINT "review_inquiries_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_inquiry_messages" ADD CONSTRAINT "review_inquiry_messages_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "review_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_inquiry_messages" ADD CONSTRAINT "review_inquiry_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

