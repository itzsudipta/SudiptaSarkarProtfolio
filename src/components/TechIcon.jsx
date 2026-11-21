import React from "react";
import {
  SiAmazons3,
  SiGoogle,
  SiGooglecolab,
  SiHuggingface,
  SiLangchain,
  SiNextdotjs,
  SiNgrok,
  SiSpringboot,
  SiSpringsecurity,
  SiSupabase,
  SiVite,
} from "react-icons/si";
import {
  BookOpen,
  BrainCircuit,
  Code2,
  Image,
  Network,
  Scaling,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const assets = import.meta.glob("../assets/icons/*.svg", {
  query: "?url",
  import: "default",
  eager: true,
});
const aliases = {
  YOLOv8: "yolo",
  "Spring MVC": "spring",
  "Spring Data JPA": "spring",
  "Apache Maven": "maven",
  "Scikit-learn": "scikitlearn",
  AWS: "amazonwebservices",
  "Tailwind CSS": "tailwindcss",
  "Microsoft Copilot": "microsoftcopilot",
};
const symbols = {
  "Next.js": [SiNextdotjs, "currentColor"],
  Supabase: [SiSupabase, "#3FCF8E"],
  "Supabase Auth": [SiSupabase, "#3FCF8E"],
  "Spring Boot": [SiSpringboot, "#6DB33F"],
  "Spring Security": [SiSpringsecurity, "#6DB33F"],
  Vite: [SiVite, "#8B5CF6"],
  "Amazon S3": [SiAmazons3, "#78A652"],
  "Google Colab": [SiGooglecolab, "#F9AB00"],
  ngrok: [SiNgrok, "currentColor"],
  "Google OAuth": [SiGoogle, "#4285F4"],
  "Row Level Security": [ShieldCheck, "#3FCF8E"],
  LangChain: [SiLangchain, "currentColor"],
  "Hugging Face": [SiHuggingface, "#E7A900"],
  FAISS: [Search, "#4085cc"],
  Gemma: [BrainCircuit, "#779ef5"],
  "Gemma 2B": [BrainCircuit, "#779ef5"],
  "Custom GAN": [Sparkles, "#ba94e5"],
  Pillow: [Image, "#54a89c"],
  Transformers: [Network, "#779ef5"],
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
