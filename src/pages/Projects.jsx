import React from "react";
import { ArrowUpRight } from "lucide-react";
import { CatalogStatus } from "../components/CatalogStatus";
import { TechIcon } from "../components/TechIcon";
import { DetailsTable } from "../components/DetailsTable";
import { ImageGallery } from "../components/ImageGallery";
export function Projects({ inspect, catalog }) {
  return (
    <div className="projects-page">
      <div className="comment">// projects/projects.ts</div>
      <h1 className="pagetitle">
        Projects<b>.</b>
      </h1>
      <CatalogStatus catalog={catalog} empty="No projects listed." />
      {catalog.items.length > 0 && (
        <DetailsTable
          className="projects-table"
          label="Projects"
          headingLabel="Project name"
          rows={catalog.items.map((p) => ({
            id: p.id,
            heading: (
              <button
                type="button"
                className="projects-table-name"
                onClick={() => inspect(p)}
              >
                {p.name}
              </button>
            ),
            content: (
              <>
                <p>{p.description}</p>
                {p.detail && <p>{p.detail}</p>}
                {p.highlights?.length > 0 && (
                  <ul className="projects-table-highlights">
                    {p.highlights.map(({ label, text }) => (
                      <li key={label}>
                        <strong>{label}</strong>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {p.live && (
                  <a
                    className="textaction projects-table-live"
                    href={p.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${p.name} live site (opens in a new tab)`}
                  >
                    <span>Live site</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                )}

                {p.tags.length > 0 && (
                  <ul className="projects-table-stack" aria-label="Tech stack">
                    {p.tags.map((tech) => (
                      <li key={tech}>
                        <TechIcon name={tech} caption />
                      </li>
                    ))}
                  </ul>
                )}

                <ImageGallery
                  id={`project-gallery-${p.id}`}
                  name={p.name}
                  images={
                    p.tableImages?.length
                      ? p.tableImages
                      : p.tableImage
                        ? [{ src: p.tableImage, alt: p.tableImageAlt }]
                        : []
                  }
                />
              </>
            ),
          }))}
        />
      )}
    </div>
  );
}
