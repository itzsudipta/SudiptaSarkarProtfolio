import React from "react";
import { ArrowRight, MapPin, Layers3, Mail } from "lucide-react";
import { portfolio as d } from "../data/data";
import { ProjectCard } from "../components/ProjectCard";
import { Terrain } from "../components/Artwork";

import { CatalogStatus } from "../components/CatalogStatus";

export function Home({ open, inspect, catalog }) {
  return (
    <>
      <section className="hero">
        <div className="intro">
          <div className="comment">// welcome to my workspace</div>
          <h1>
            {d.name}
            <b>.</b>
          </h1>
          <h2>{d.role}</h2>
          <p>{d.intro}</p>
          <div className="location">
            <MapPin size={13} />
            {d.location}
          </div>
          <div className="actions">
            <button className="primary" onClick={() => open("projects")}>
              View projects <ArrowRight size={15} />
            </button>
            <button className="secondary" onClick={() => open("contact")}>
              <Mail size={15} /> Get in touch
            </button>
          </div>
        </div>
        <div className="visual">
          <Terrain />
          <small>VECTOR TERRAIN</small>
        </div>
      </section>
      <div className="sectiontitle">
        <h2>
          <Layers3 size={19} /> Featured projects
        </h2>
        <button onClick={() => open("projects")}>
          View all <ArrowRight size={13} />
        </button>
      </div>
      <CatalogStatus catalog={catalog} />
      <div className="cards">
        {catalog.items
          .filter((p) => p.featured)
          .map((p) => (
            <ProjectCard key={p.id} p={p} inspect={inspect} />
          ))}
      </div>
    </>
  );
}
