import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CatalogStatus } from "../components/CatalogStatus";
import { TechIcon } from "../components/TechIcon";
import { DetailsTable } from "../components/DetailsTable";

function ProjectGallery({ project }) {
  const [expanded, setExpanded] = useState(false);
  const previewLimit = 3;

  const images = project.tableImages?.length
    ? project.tableImages
    : project.tableImage
      ? [{ src: project.tableImage, alt: project.tableImageAlt }]
      : [];

  if (images.length === 0) return null;

  const hiddenCount = Math.max(0, images.length - previewLimit);
  const visibleImages = expanded ? images : images.slice(0, previewLimit);
  const galleryId = `project-gallery-${project.id}`;

  return (
    <div className="projects-table-photos">
      <div id={galleryId} className="projects-table-gallery">
        {visibleImages.map((image, index) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt || `${project.name} screenshot ${index + 1}`}
            loading="lazy"
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          className="projects-table-gallery-toggle"
          aria-controls={galleryId}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `Show fewer pictures for ${project.name}`
              : `Show ${hiddenCount} more pictures for ${project.name}`
          }
          onClick={() => setExpanded((previous) => !previous)}
        >
          {expanded ? "Show less" : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}
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

                  <ProjectGallery project={p} />
                </>
              ),
            }))}
        />
      )}
    </>
  );
}
