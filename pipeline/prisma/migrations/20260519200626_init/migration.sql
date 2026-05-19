-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('confirmed', 'probable', 'suspected', 'contact_monitoring', 'death');

-- CreateEnum
CREATE TYPE "CurrentStatus" AS ENUM ('confirmed', 'suspected_unresolved', 'excluded', 'deceased');

-- CreateEnum
CREATE TYPE "DeathClassification" AS ENUM ('confirmed', 'probable');

-- CreateEnum
CREATE TYPE "LocationSpecificity" AS ENUM ('city', 'admin1', 'country', 'unknown', 'at_sea');

-- CreateEnum
CREATE TYPE "CaseArticleRole" AS ENUM ('primary', 'corroborating', 'update', 'rejected');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "TransmissionRoute" AS ENUM ('index_passenger', 'h2h_secondary', 'unclear');

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "caseSignature" TEXT NOT NULL,
    "clusterId" TEXT,
    "country" TEXT NOT NULL,
    "admin1" TEXT,
    "caseType" "CaseType" NOT NULL,
    "currentStatus" "CurrentStatus" NOT NULL,
    "deathClassification" "DeathClassification",
    "caseCount" INTEGER NOT NULL DEFAULT 1,
    "dateReported" DATE NOT NULL,
    "notes" TEXT,
    "locationSpecificity" "LocationSpecificity" NOT NULL DEFAULT 'unknown',
    "locationCountry" TEXT,
    "locationAdmin1" TEXT,
    "locationCity" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "needsAdminAttention" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceTier" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractionJson" JSONB,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseArticle" (
    "caseId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "role" "CaseArticleRole" NOT NULL DEFAULT 'corroborating',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseArticle_pkey" PRIMARY KEY ("caseId","articleId")
);

-- CreateTable
CREATE TABLE "ReviewQueue" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "proposedCase" JSONB NOT NULL,
    "proposedSignature" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "matches" JSONB,
    "reviewer" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "geonameid" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "admin1Code" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "population" INTEGER NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("geonameid")
);

-- CreateTable
CREATE TABLE "CityAlias" (
    "cityGeonameid" INTEGER NOT NULL,
    "aliasSlug" TEXT NOT NULL,

    CONSTRAINT "CityAlias_pkey" PRIMARY KEY ("cityGeonameid","aliasSlug")
);

-- CreateTable
CREATE TABLE "CruisePosition" (
    "clusterId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "positionName" TEXT,
    "sourceUrl" TEXT,

    CONSTRAINT "CruisePosition_pkey" PRIMARY KEY ("clusterId","date")
);

-- CreateTable
CREATE TABLE "TransmissionEdge" (
    "id" TEXT NOT NULL,
    "sourceCaseId" TEXT NOT NULL,
    "targetCaseId" TEXT NOT NULL,
    "route" "TransmissionRoute" NOT NULL,
    "confidence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransmissionEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseSignature_key" ON "Case"("caseSignature");

-- CreateIndex
CREATE INDEX "Case_country_idx" ON "Case"("country");

-- CreateIndex
CREATE INDEX "Case_dateReported_idx" ON "Case"("dateReported");

-- CreateIndex
CREATE INDEX "Case_clusterId_idx" ON "Case"("clusterId");

-- CreateIndex
CREATE INDEX "Case_locationCountry_locationAdmin1_locationCity_idx" ON "Case"("locationCountry", "locationAdmin1", "locationCity");

-- CreateIndex
CREATE INDEX "Case_currentStatus_idx" ON "Case"("currentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Article_canonicalUrl_key" ON "Article"("canonicalUrl");

-- CreateIndex
CREATE INDEX "Article_sourceName_idx" ON "Article"("sourceName");

-- CreateIndex
CREATE INDEX "Article_sourceTier_idx" ON "Article"("sourceTier");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "CaseArticle_articleId_idx" ON "CaseArticle"("articleId");

-- CreateIndex
CREATE INDEX "ReviewQueue_status_idx" ON "ReviewQueue"("status");

-- CreateIndex
CREATE INDEX "ReviewQueue_createdAt_idx" ON "ReviewQueue"("createdAt");

-- CreateIndex
CREATE INDEX "City_countryCode_slug_idx" ON "City"("countryCode", "slug");

-- CreateIndex
CREATE INDEX "City_slug_idx" ON "City"("slug");

-- CreateIndex
CREATE INDEX "CityAlias_aliasSlug_idx" ON "CityAlias"("aliasSlug");

-- CreateIndex
CREATE INDEX "TransmissionEdge_sourceCaseId_idx" ON "TransmissionEdge"("sourceCaseId");

-- CreateIndex
CREATE INDEX "TransmissionEdge_targetCaseId_idx" ON "TransmissionEdge"("targetCaseId");

-- AddForeignKey
ALTER TABLE "CaseArticle" ADD CONSTRAINT "CaseArticle_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseArticle" ADD CONSTRAINT "CaseArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityAlias" ADD CONSTRAINT "CityAlias_cityGeonameid_fkey" FOREIGN KEY ("cityGeonameid") REFERENCES "City"("geonameid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransmissionEdge" ADD CONSTRAINT "TransmissionEdge_sourceCaseId_fkey" FOREIGN KEY ("sourceCaseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransmissionEdge" ADD CONSTRAINT "TransmissionEdge_targetCaseId_fkey" FOREIGN KEY ("targetCaseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
