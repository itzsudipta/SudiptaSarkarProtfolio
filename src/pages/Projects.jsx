import React, { useState } from "react";
import { CatalogStatus } from "../components/CatalogStatus";
import { ProjectCard } from "../components/ProjectCard";

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
      <div className="cards">
        {catalog.items
          .filter((p) => tag === "All" || p.tags.includes(tag))
          .map((p) => (
            <ProjectCard key={p.id} p={p} inspect={inspect} />
          ))}
      </div>
    </>
  );
}
