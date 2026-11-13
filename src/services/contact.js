const API_URL = import.meta.env.VITE_CONTACT_API_URL;

export async function sendMessage(_recipient, fields) {
  const response = await fetch(`${API_URL}/contact`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
    signal: AbortSignal.timeout(20000),
  });

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

  if (!response.ok) {
    throw new Error(
      result?.error || "The message service could not accept your message.",
    );
  }
  return result.message || "Message sent. Thank you for getting in touch.";
}