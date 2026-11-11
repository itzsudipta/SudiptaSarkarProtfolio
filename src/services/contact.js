export async function sendMessage(recipient, fields) {
  const response = await fetch(
    "https://formsubmit.co/ajax/" + encodeURIComponent(recipient),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...fields,
        _subject: "Portfolio enquiry",
        _replyto: fields.email,
      }),
      signal: AbortSignal.timeout(20000),
    },
  );
  let result;
  try {
    result = await response.json();
  } catch {
    console.warn(
      "[Portfolio] Contact service returned invalid JSON.",
      response.status,
    );
    throw new Error("The message service is unavailable. Please try again.");
  }
  if (!response.ok || ![true, "true"].includes(result?.success)) {
    throw new Error(
      result?.message || "The message service could not accept your message.",
    );
  }
  return result.message || "Message accepted. Thank you for getting in touch.";
}
