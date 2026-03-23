import { prisma } from "@/lib/prisma";
import {
  DEFAULT_EMAIL_BANNER_URL,
  DEFAULT_EMAIL_SUBJECT_TEMPLATE,
  DEFAULT_EMAIL_TEMPLATE_HTML,
  DEFAULT_TRACKER_BANNER_URL,
} from "@/lib/email/defaults";

export function getEmailSettingsDefaults() {
  return {
    key: "global",
    subjectTemplate: DEFAULT_EMAIL_SUBJECT_TEMPLATE,
    bannerUrl: DEFAULT_EMAIL_BANNER_URL,
    trackerBannerUrl: DEFAULT_TRACKER_BANNER_URL,
    templateHtml: DEFAULT_EMAIL_TEMPLATE_HTML,
  };
}

export async function getEmailSettings() {
  const settings = await prisma.emailSettings.findUnique({
    where: { key: "global" },
  });

  return {
    ...getEmailSettingsDefaults(),
    ...settings,
  };
}
