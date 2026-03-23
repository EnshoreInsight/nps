export const DEFAULT_EMAIL_SUBJECT_TEMPLATE = "{{project name}} - {{urgency subject}}";

export const DEFAULT_EMAIL_BANNER_URL =
  "https://enshoresubsea365-my.sharepoint.com/:i:/g/personal/insight_enshoresubsea_com/ESXmC8PRCTRHqIoWNhMWBDgBkY5YXj2VOloM8I_Lb3AhQw?download=1";

export const DEFAULT_TRACKER_BANNER_URL =
  "https://enshoresubsea365-my.sharepoint.com/:i:/g/personal/insight_enshoresubsea_com/EUJV8BVINAFKhIfjfEC96aMBmN_QkQxeJhqsIFJj8ZL8UQ?download=1";

export const DEFAULT_EMAIL_TEMPLATE_HTML = `
<meta />
<title>Feedback Alert</title>
<table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;background:#eef5f7;font-family:Arial,sans-serif;color:#0f2430;">
  <tbody>
    <tr>
      <td align="center" style="padding:24px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:980px;border-collapse:collapse;background:#ffffff;">
          <tbody>
            <tr>
              <td>{{banner}}</td>
            </tr>
            <tr>
              <td style="padding:24px 24px 8px 24px;">
                <p style="margin:0 0 14px 0;line-height:1.6;">
                  Customer feedback has been received for the <strong style="color:#0a5ea8;">{{project name}}</strong> project.
                  This response is classified as <strong>{{urgency level}}</strong>.
                  {{urgency summary}}
                </p>
                <p style="margin:0 0 16px 0;line-height:1.6;">
                  {{urgency action}}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 8px 24px;">
                <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;">
                  <tbody>
                    <tr><td style="padding:6px 0;width:240px;color:#52616f;"><em>Response ID:</em></td><td style="padding:6px 0;"><strong>{{response id}}</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#52616f;"><em>Time of Response (UTC):</em></td><td style="padding:6px 0;"><strong>{{submitted at}}</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#52616f;"><em>Client:</em></td><td style="padding:6px 0;"><strong>{{client}}</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#52616f;"><em>Package:</em></td><td style="padding:6px 0;"><strong>{{package}}</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#52616f;"><em>Email:</em></td><td style="padding:6px 0;"><strong><a href="mailto:{{email}}" style="color:#0a5ea8;text-decoration:none;">{{email}}</a></strong></td></tr>
                    <tr><td style="padding:6px 0;color:#52616f;"><em>Score:</em></td><td style="padding:6px 0;"><strong>{{score}}</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#52616f;"><em>Comment:</em></td><td style="padding:6px 0;"><strong>{{comment}}</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#52616f;"><em>Category:</em></td><td style="padding:6px 0;"><strong>{{category}}</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#52616f;"><em>Contact Required:</em></td><td style="padding:6px 0;"><strong>{{contact requested}}</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#52616f;"><em>Urgency Level:</em></td><td style="padding:6px 0;"><strong>{{urgency level}}</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#52616f;"><em>SLA Due:</em></td><td style="padding:6px 0;"><strong>{{sla due}}</strong></td></tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 8px 24px;">{{tracker banner}}</td>
            </tr>
            <tr>
              <td style="padding:0 24px 8px 24px;">
                <h3 style="margin:12px 0 8px 0;font-size:15px;color:#0a3049;">Urgency Levels</h3>
                {{urgency table}}
                <p style="margin:14px 0 0 0;font-size:12px;color:#6b7b88;">
                  This message was generated automatically by Enshore Insight.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
`;
