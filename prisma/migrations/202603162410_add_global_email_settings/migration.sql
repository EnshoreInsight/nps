CREATE TABLE "EmailSettings" (
    "key" TEXT NOT NULL DEFAULT 'global',
    "subjectTemplate" TEXT,
    "bannerUrl" TEXT,
    "trackerBannerUrl" TEXT,
    "templateHtml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("key")
);
