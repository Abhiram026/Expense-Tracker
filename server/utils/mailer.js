// Sends email through Brevo's web API (plain HTTPS, so it works on Render's free plan)
export async function sendMail(to, subject, html) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    throw new Error("Email service is not configured");
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Expense Tracker", email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Brevo error:", res.status, text);
    throw new Error("Could not send the email");
  }
}

export function otpEmailHtml(code, heading, line) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
      <h2 style="color:#0d9488;margin-top:0">Expense Tracker</h2>
      <p style="font-size:16px"><strong>${heading}</strong></p>
      <p>${line}</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;background:#f0fdfa;padding:14px;text-align:center;border-radius:8px">${code}</p>
      <p style="color:#64748b;font-size:13px">This code expires in 10 minutes. If you did not ask for it, you can ignore this email.</p>
    </div>`;
}
