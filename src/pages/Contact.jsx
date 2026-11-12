import React, { useState, useRef } from "react";
import { portfolio as d } from "../data/data";
import { ProfileContacts } from "../components/ProfileContacts";
import { sendMessage } from "../services/contact";

export function Contact() {
  const [note, set] = useState("");
  const [sending, setSending] = useState(false);
  const pending = useRef(false);
  return (
    <>
      <div className="comment">// connect.md</div>
      <h1 className="pagetitle">
        Get in touch<b>.</b>
      </h1>
      <p>
        Send me a message about a project, research collaboration, or
        opportunity.
      </p>
      <form
        className="contact"
        aria-busy={sending}
        onSubmit={async (e) => {
          e.preventDefault();
          if (pending.current) return;
          const form = e.currentTarget;
          const data = new FormData(form);
          const fields = Object.fromEntries(
            ["name", "email", "message"].map((key) => [
              key,
              String(data.get(key) || "").trim(),
            ]),
          );
          if (!fields.name || !fields.message) {
            set("Please enter a name and message.");
            return;
          }
          pending.current = true;
          setSending(true);
          set("");
          try {
            const confirmation = await sendMessage(d.email, fields);
            set(confirmation);
            form.reset();
          } catch (error) {
            console.warn("[Portfolio] Contact submission failed.", error.name);
            set(
              error.name === "TimeoutError"
                ? "The request timed out. Your message is still here."
                : error.message === "Failed to fetch"
                  ? "Could not reach the message service. Please try again."
                  : error.message,
            );
          } finally {
            pending.current = false;
            setSending(false);
          }
        }}
      >
        {["Name", "Email", "Message"].map((s) => (
          <label key={s}>
            {s}
            {s === "Message" ? (
              <textarea disabled={sending} name="message" rows="4" required />
            ) : (
              <input
                disabled={sending}
                required
                type={s === "Email" ? "email" : "text"}
                name={s.toLowerCase()}
              />
            )}
          </label>
        ))}
        <button type="submit" className="primary" disabled={sending}>
          {sending ? "Sending…" : "Send message"}
        </button>
        <output aria-live="polite">{note}</output>
      </form>
      <ProfileContacts />
      {/* <a
        className="textaction"
        href={d.website}
        target="_blank"
        rel="noreferrer"
      >
        Personal website
      </a> */}
    </>
  );
}
