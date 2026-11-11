import React, { useId, useRef, useState } from "react";
import { ArrowUpRight, Expand, X } from "lucide-react";

export function CertificateCard({ certificate: c }) {
  const [failed, setFailed] = useState("");
  const dialog = useRef(null);
  const trigger = useRef(null);
  const heading = useId();
  const description = useId();
  const demo = !c.image || failed === c.image;
  const src = demo ? c.demoImage : c.image;
  const alt = (demo ? "Demo certificate for " : "Certificate for ") + c.title;
  const pdf = /\.pdf(?:[?#]|$)/i.test(src || "");
  const attribution = [c.issuer, c.institution].filter(Boolean).join(" · ");
  const image = pdf ? (
    <strong className="pdf-preview">PDF certificate</strong>
  ) : !src ? (
    <strong>Preview unavailable</strong>
  ) : (
    <img src={src} alt={alt} onError={() => setFailed(src)} />
  );
  return (
    <article className="certificate-card">
      <button
        className="cert-photo"
        ref={trigger}
        aria-label={"Enlarge " + c.title + " certificate"}
        disabled={!src}
        aria-haspopup="dialog"
        onClick={() => dialog.current.showModal()}
      >
        {image}
        <span aria-hidden="true">
          <Expand size={15} />
        </span>
      </button>
      <div className="cert-info">
        {attribution && <small>{attribution}</small>}
        <h2>{c.title}</h2>
        {c.description && <p>{c.description}</p>}
        {c.url && (
          <a
            className="textaction"
            href={c.url}
            target="_blank"
            rel="noreferrer"
          >
            View credential <ArrowUpRight size={14} />
          </a>
        )}
      </div>
      <dialog
        className="cert-viewer"
        ref={dialog}
        aria-labelledby={heading}
        aria-describedby={c.description ? description : undefined}
        onClose={() => trigger.current?.focus()}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="cert-view-body">
          <header>
            <div>
              {attribution && <small>{attribution}</small>}
              <h2 id={heading}>{c.title}</h2>
            </div>
            <button
              aria-label="Close certificate"
              autoFocus
              onClick={() => dialog.current.close()}
            >
              <X size={19} />
            </button>
          </header>
          <div className="cert-full">
            {pdf ? (
              <object
                data={src}
                type="application/pdf"
                aria-label={c.title}
                width="100%"
                height="100%"
              >
                <a href={src} target="_blank" rel="noreferrer">
                  Open PDF certificate
                </a>
              </object>
            ) : (
              image
            )}
          </div>
          {c.description && <p id={description}>{c.description}</p>}
          <a className="textaction" href={src} target="_blank" rel="noreferrer">
            {pdf ? "Open full PDF" : "Open full-size image"}{" "}
            <ArrowUpRight size={14} />
          </a>
        </div>
      </dialog>
    </article>
  );
}
