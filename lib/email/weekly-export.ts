import nodemailer from "nodemailer";
import { buildFeedbackExportFilename } from "@/lib/exports/feedback-export";

type WeeklyExportRecipient = {
  email: string;
  name: string;
};

export async function sendWeeklyFeedbackExportEmail({
  projectName,
  projectSlug,
  recipients,
  csv,
  periodLabel,
}: {
  projectName: string;
  projectSlug: string;
  recipients: WeeklyExportRecipient[];
  csv: string;
  periodLabel: string;
}) {
  if (!recipients.length) {
    return { sent: false, reason: "No recipients configured for project export emails." };
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

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: recipients.map((recipient) => recipient.email).join(", "),
    subject: `${projectName} feedback export (${periodLabel})`,
    html: `<p>Please find attached the customer feedback export for <strong>${projectName}</strong> covering ${periodLabel}.</p>`,
    attachments: [
      {
        filename: buildFeedbackExportFilename(projectSlug, "weekly"),
        content: csv,
        contentType: "text/csv; charset=utf-8",
      },
    ],
  });

  return { sent: true, recipients: recipients.length };
}
