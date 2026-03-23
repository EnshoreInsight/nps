import nodemailer from "nodemailer";
import { UrgencyLevel } from "@prisma/client";
import { renderFeedbackEmail, renderFeedbackEmailSubject } from "@/lib/email/template";

type Recipient = {
  email: string;
  name: string;
};

type RecipientRule = Recipient & {
  receivesL1: boolean;
  receivesL2: boolean;
  receivesL3: boolean;
  receivesL4: boolean;
};

type SendFeedbackEmailInput = {
  responseId: string;
  urgencyLevel: UrgencyLevel;
  projectName: string;
  submittedAt: Date;
  client: string;
  packageName: string;
  email: string;
  score: number;
  comment: string;
  category: string;
  contactRequested: string;
  subjectTemplate?: string | null;
  templateHtml?: string | null;
  bannerUrl?: string | null;
  trackerBannerUrl?: string | null;
  slaDue?: Date | null;
  trackerLink: string;
};

function shouldReceive(level: UrgencyLevel, recipient: RecipientRule) {
  switch (level) {
    case UrgencyLevel.LEVEL_1:
      return recipient.receivesL1;
    case UrgencyLevel.LEVEL_2:
      return recipient.receivesL2;
    case UrgencyLevel.LEVEL_3:
      return recipient.receivesL3;
    case UrgencyLevel.LEVEL_4:
      return recipient.receivesL4;
  }
}

export async function sendFeedbackNotification(
  input: SendFeedbackEmailInput & {
    recipientRules: RecipientRule[];
  },
) {
  const eligibleRecipients = input.recipientRules.filter((recipient) =>
    shouldReceive(input.urgencyLevel, recipient),
  );

  if (!eligibleRecipients.length) {
    return { sent: false, reason: "No eligible recipients configured." };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    return { sent: false, reason: "SMTP environment variables are not configured." };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const html = renderFeedbackEmail(input.templateHtml, {
    responseId: input.responseId,
    projectName: input.projectName,
    submittedAt: input.submittedAt,
    client: input.client,
    packageName: input.packageName,
    email: input.email,
    score: input.score,
    comment: input.comment,
    category: input.category,
    contactRequested: input.contactRequested,
    urgencyLevel: input.urgencyLevel,
    slaDue: input.slaDue,
    trackerLink: input.trackerLink,
    bannerUrl: input.bannerUrl,
    trackerBannerUrl: input.trackerBannerUrl,
  });
  const subject = renderFeedbackEmailSubject(input.subjectTemplate, {
    responseId: input.responseId,
    projectName: input.projectName,
    submittedAt: input.submittedAt,
    client: input.client,
    packageName: input.packageName,
    email: input.email,
    score: input.score,
    comment: input.comment,
    category: input.category,
    contactRequested: input.contactRequested,
    urgencyLevel: input.urgencyLevel,
    slaDue: input.slaDue,
    trackerLink: input.trackerLink,
    bannerUrl: input.bannerUrl,
    trackerBannerUrl: input.trackerBannerUrl,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: eligibleRecipients.map((recipient) => recipient.email).join(", "),
    subject,
    html,
  });

  return { sent: true, recipients: eligibleRecipients.length };
}
