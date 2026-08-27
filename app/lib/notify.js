import "server-only";

export async function notifyReport({ report, claim }) {
  const webhookUrl = process.env.LOUDLIST_REPORT_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  const name = claim?.name || "a listing";
  const message = `LoudList report on ${name}: ${report.reason}`;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: message,
        content: message,
        report: {
          id: report.id,
          claimId: report.claimId,
          reason: report.reason,
          app: name,
        },
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    console.error("Unable to notify about LoudList report", error);
  }
}
