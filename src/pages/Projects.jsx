import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CatalogStatus } from "../components/CatalogStatus";
import { TechIcon } from "../components/TechIcon";
import { DetailsTable } from "../components/DetailsTable";
import { ImageGallery } from "../components/ImageGallery";
export function Projects({ inspect, catalog }) {
  const [tag, set] = useState("All");
  return (
    <>
      <div className="comment">// projects/projects.ts</div>
      <h1 className="pagetitle">
        Projects<b>.</b>
      </h1>
      <CatalogStatus catalog={catalog} empty="No projects listed." />
      <div className="filters">
        {["All", ...new Set(catalog.items.flatMap((p) => p.tags))].map((t) => (
          <button
            className={t === tag ? "selected" : ""}
            aria-pressed={t === tag}
            onClick={() => set(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      {catalog.items.length > 0 && (
        <DetailsTable
          className="projects-table"
          label="Projects"
          headingLabel="Project name"
          rows={catalog.items
            .filter((p) => tag === "All" || p.tags.includes(tag))
            .map((p) => ({
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
    </>
  );
}
