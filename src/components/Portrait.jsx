import React, { useState, useRef } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { portfolio } from "../data/data";

const key = "portfolio-portrait";
// Keep visitor-selected previews on this browser. The configured URL is public.
function stored() {
  try {
    return localStorage.getItem(key) || "";
  } catch (error) {
    console.warn("[Portfolio] Local portrait preview unavailable.", error.name);
    return "";
  }
}
export function Portrait() {
  const [photo, setPhoto] = useState(stored),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState("");
  const picker = useRef(null);
  async function attach(file) {
    if (!file) return;
    setError("");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 12 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP under 12 MB.");
      return;
    }
    setBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, 720 / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const preview = canvas.toDataURL("image/jpeg", 0.87);
      setPhoto(preview);
      try {
        localStorage.setItem(key, preview);
      } catch (error) {
        console.warn(
          "[Portfolio] Could not save portrait preview.",
          error.name,
        );
        setError("Preview available for this session only.");
      }
    } catch (error) {
      console.warn("[Portfolio] Could not decode portrait.", error.name);
      setError("This image could not be opened.");
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
    }
  }
  const src = portfolio.photoUrl;
  return (
    <figure className="portrait">
      <div className="portrait-frame">
        {src && src !== failed ? (
          <img src={src} alt={portfolio.name} onError={() => setFailed(src)} />
        ) : (
          <span aria-label="Portrait placeholder">
            {portfolio.name
              .split(" ")
              .map((w) => w[0])
              .join("")}
          </span>
        )}
      </div>
    </figure>
  );
}
