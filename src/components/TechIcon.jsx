import React from "react";
import { SiSpringboot, SiSpringsecurity } from "react-icons/si";
import { Search, BrainCircuit, BookOpen, Scaling, Code2 } from "lucide-react";

const assets = import.meta.glob("../assets/icons/*.svg", {
  query: "?url",
  import: "default",
  eager: true,
});
const aliases = {
  YOLOv8: "yolo",
  "Spring MVC": "spring",
  "Spring Data JPA": "spring",
  "Scikit-learn": "scikitlearn",
  AWS: "amazonwebservices",
  "Tailwind CSS": "tailwindcss",
};
const symbols = {
  "Spring Boot": [SiSpringboot, "#6DB33F"],
  "Spring Security": [SiSpringsecurity, "#6DB33F"],
  FAISS: [Search, "#4085cc"],
  Gemma: [BrainCircuit, "#779ef5"],
  RAG: [BookOpen, "#ba94e5"],
  Swin2SR: [Scaling, "#e99869"],
};
export function TechIcon({ name, caption = false }) {
  const slug = aliases[name] || name.toLowerCase();
  const src = assets["../assets/icons/" + slug + ".svg"];
  const [Mark, color] = symbols[name] || [Code2, "currentColor"];
  const size = caption ? 26 : 18;
  return (
    <span className={"tech-mark" + (caption ? " labeled" : "")} title={name}>
      {src ? (
        <img data-brand={slug} src={src} alt="" width={size} height={size} />
      ) : (
        <Mark aria-hidden="true" color={color} size={size} />
      )}
      <span className={caption ? "tech-label" : "sr-only"}>{name}</span>
    </span>
  );
}
