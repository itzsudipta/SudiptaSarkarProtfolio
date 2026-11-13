import React from "react";
import { ImageGallery } from "./ImageGallery";
import "../assets/records.css";

export function RecordPage({ filename, title, entries }) {
  return (
    <section className="records-page" aria-label={title}>
      <header className="records-page-heading">
        <div className="comment">// {filename}</div>
        <h1 className="pagetitle">
          {title}<b>.</b>
        </h1>
      </header>

      <ul className="records-list">
        {entries.map(({ title, subtitle, period, description, images }) => (
          <li key={`${title}-${period}`}>
            <article className="record-entry">
              <header className="record-entry-heading">
                <div className="record-entry-title">
                  <h2>{title}</h2>
                  {subtitle && <p>{subtitle}</p>}
                </div>

                {period && <span className="record-period">{period}</span>}
              </header>

              {description && (
                <p className="record-description">{description}</p>
              )}
              <ImageGallery images={images} name={title} />
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
