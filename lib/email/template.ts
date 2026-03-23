import { format } from "date-fns";
import { DEFAULT_EMAIL_SUBJECT_TEMPLATE, DEFAULT_EMAIL_TEMPLATE_HTML } from "@/lib/email/defaults";

export type UrgencyLevelValue = "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4";

export type FeedbackEmailTemplateContext = {
  responseId: string;
  projectName: string;
  submittedAt: Date;
  client: string;
  packageName: string;
  email: string;
  score: number;
  comment: string;
  category: string;
  contactRequested: string;
  urgencyLevel: UrgencyLevelValue;
  slaDue?: Date | null;
  trackerLink: string;
  bannerUrl?: string | null;
  trackerBannerUrl?: string | null;
};

type UrgencyScenario = {
  levelNumber: string;
  urgencySubject: string;
  urgencySummary: string;
  urgencyAction: string;
};

function getUrgencyScenario(level: UrgencyLevelValue): UrgencyScenario {
  switch (level) {
    case "LEVEL_1":
      return {
        levelNumber: "1",
        urgencySubject: "Urgency Level 1 response required within 24 hours",
        urgencySummary: "The Project Manager or designated owner should make initial contact within 24 hours of receipt.",
        urgencyAction: "This is a direct-contact case, so please engage the customer promptly and update the feedback tracker once contact has been made.",
      };
    case "LEVEL_2":
      return {
        levelNumber: "2",
        urgencySubject: "Urgency Level 2 feedback received",
        urgencySummary: "No direct contact has been requested, so there is no direct-contact SLA attached to this feedback.",
        urgencyAction: "Please review the feedback, act on it where appropriate, and include it in the next client review discussion.",
      };
    case "LEVEL_3":
      return {
        levelNumber: "3",
        urgencySubject: "Urgency Level 3 response required within 72 hours",
        urgencySummary: "The customer has requested contact, so the Project Manager or designated owner should make initial contact within 72 hours of receipt.",
        urgencyAction: "Please follow up with the customer, then update the feedback tracker so the action log stays current.",
      };
    case "LEVEL_4":
    default:
      return {
        levelNumber: "4",
        urgencySubject: "Urgency Level 4 feedback received",
        urgencySummary: "No direct contact has been requested and no direct-contact SLA applies to this response.",
        urgencyAction: "Please include this feedback in portfolio reporting and use it to inform future client discussions.",
      };
  }
}

function renderUrgencyTable(trackerLink: string) {
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr>
          <th style="padding:8px 6px;background:#f0f4f9;text-align:left;">Urgency Level</th>
          <th style="padding:8px 6px;background:#f0f4f9;text-align:left;">Definition</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:8px 6px;vertical-align:top;"><strong>1</strong></td>
          <td style="padding:8px 6px;">A score of 6 or under with contact requested. Initial contact should be made within 24 hours. Update the tracker <a href="${trackerLink}" style="color:#0a5ea8;text-decoration:underline;">here</a> after responding.</td>
        </tr>
        <tr>
          <td style="padding:8px 6px;vertical-align:top;"><strong>2</strong></td>
          <td style="padding:8px 6px;">A score of 6 or under with no contact requested. No direct-contact SLA applies, but the feedback should still be reviewed and discussed with the client.</td>
        </tr>
        <tr>
          <td style="padding:8px 6px;vertical-align:top;"><strong>3</strong></td>
          <td style="padding:8px 6px;">A score of 7 or above with contact requested. Initial contact should be made within 72 hours. Update the tracker <a href="${trackerLink}" style="color:#0a5ea8;text-decoration:underline;">here</a> after responding.</td>
        </tr>
        <tr>
          <td style="padding:8px 6px;vertical-align:top;"><strong>4</strong></td>
          <td style="padding:8px 6px;">A score of 7 or above with no contact requested. No direct-contact SLA applies; include the feedback in ongoing reporting and account reviews.</td>
        </tr>
      </tbody>
    </table>
  `;
}

function replacePlaceholder(template: string, key: string, value: string) {
  return template.replaceAll(`{{${key}}}`, value);
}

export function renderFeedbackEmailSubject(
  subjectTemplate: string | null | undefined,
  context: FeedbackEmailTemplateContext,
) {
  const scenario = getUrgencyScenario(context.urgencyLevel);
  let subject = subjectTemplate?.trim() ? subjectTemplate : DEFAULT_EMAIL_SUBJECT_TEMPLATE;

  subject = replacePlaceholder(subject, "project name", context.projectName);
  subject = replacePlaceholder(subject, "urgency subject", scenario.urgencySubject);
  subject = replacePlaceholder(subject, "urgency level", `Level ${scenario.levelNumber}`);

  return subject;
}

export function renderFeedbackEmail(
  templateHtml: string | null | undefined,
  context: FeedbackEmailTemplateContext,
) {
  const template = templateHtml?.trim() ? templateHtml : DEFAULT_EMAIL_TEMPLATE_HTML;
  const scenario = getUrgencyScenario(context.urgencyLevel);
  const banner = context.bannerUrl
    ? `<img src="${context.bannerUrl}" alt="Enshore Insight" style="display:block;width:100%;max-width:1400px;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />`
    : "";
  const trackerBanner = context.trackerBannerUrl
    ? `<a href="${context.trackerLink}" style="text-decoration:none;border:0;outline:none;"><img src="${context.trackerBannerUrl}" alt="After responding to the customer, please update the feedback tracker here" style="display:block;width:100%;max-width:1400px;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" /></a>`
    : `<p style="margin:0;"><a href="${context.trackerLink}" style="display:inline-block;background:#0a5ea8;color:#ffffff;padding:12px 18px;border-radius:999px;text-decoration:none;">Open feedback tracker</a></p>`;

  let rendered = template;

  rendered = replacePlaceholder(rendered, "banner", banner);
  rendered = replacePlaceholder(rendered, "tracker banner", trackerBanner);
  rendered = replacePlaceholder(rendered, "project name", context.projectName);
  rendered = replacePlaceholder(rendered, "response id", context.responseId);
  rendered = replacePlaceholder(rendered, "submitted at", format(context.submittedAt, "dd/MM/yyyy HH:mm"));
  rendered = replacePlaceholder(rendered, "client", context.client);
  rendered = replacePlaceholder(rendered, "package", context.packageName);
  rendered = replacePlaceholder(rendered, "email", context.email);
  rendered = replacePlaceholder(rendered, "score", String(context.score));
  rendered = replacePlaceholder(rendered, "comment", context.comment || "No comment supplied.");
  rendered = replacePlaceholder(rendered, "category", context.category);
  rendered = replacePlaceholder(rendered, "contact requested", context.contactRequested);
  rendered = replacePlaceholder(rendered, "urgency level", `Level ${scenario.levelNumber}`);
  rendered = replacePlaceholder(rendered, "urgency subject", scenario.urgencySubject);
  rendered = replacePlaceholder(rendered, "urgency summary", scenario.urgencySummary);
  rendered = replacePlaceholder(rendered, "urgency action", scenario.urgencyAction);
  rendered = replacePlaceholder(
    rendered,
    "sla due",
    context.slaDue ? format(context.slaDue, "dd/MM/yyyy HH:mm") : "No direct-contact SLA",
  );
  rendered = replacePlaceholder(rendered, "tracker link", context.trackerLink);
  rendered = replacePlaceholder(rendered, "urgency table", renderUrgencyTable(context.trackerLink));

  return rendered;
}

export function getFeedbackEmailPreviewContexts() {
  const base = {
    responseId: "FB-000127",
    projectName: "Alpha Grid Modernisation",
    submittedAt: new Date("2026-03-16T10:15:00Z"),
    client: "North Sea Power",
    packageName: "PLGR",
    email: "client@example.com",
    score: 4,
    comment: "Communication around late design changes was not clear and we need a direct call.",
    category: "Delivery",
    contactRequested: "Yes",
    trackerLink: "https://example.com/pm/tracker",
  };

  return [
    { ...base, urgencyLevel: "LEVEL_1", slaDue: new Date("2026-03-17T10:15:00Z") },
    { ...base, urgencyLevel: "LEVEL_2", slaDue: null, contactRequested: "No" },
    { ...base, urgencyLevel: "LEVEL_3", slaDue: new Date("2026-03-19T10:15:00Z"), score: 8 },
    { ...base, urgencyLevel: "LEVEL_4", slaDue: null, score: 9, contactRequested: "No" },
  ] satisfies FeedbackEmailTemplateContext[];
}
