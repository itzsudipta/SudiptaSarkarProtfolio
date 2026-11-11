import { TechIcon } from "./TechIcon";
import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Art } from "./Artwork";

export function ProjectCard({ p, inspect }) {
  return (
    <button className={"card " + (p.art || "graph")} onClick={() => inspect(p)}>
      <div className="cover">
        {p.image ? (
          <img
            className="project-cover-image"
            src={p.image}
            alt={p.name + " project preview"}
          />
        ) : (
          <Art type={p.art || "graph"} />
        )}
        <ArrowUpRight className="corner" size={15} />
      </div>
      <div className="cardbody">
        <small>{p.kind}</small>
        <h3>{p.name}</h3>
        <p>{p.description}</p>
        <div className="project-tech">
          {p.tags.map((t) => (
            <TechIcon key={t} name={t} />
          ))}
        </div>
      </div>
    </button>
  );
}
