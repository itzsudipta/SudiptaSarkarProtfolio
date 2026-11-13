import React from "react";
import {
  Download,
  Github,
  GitBranch,
  PanelLeft,
} from "lucide-react";
import { portfolio as d } from "../data/data";
import { IconButton } from "../components/IconButton";

export function Toolbar({
  togglePanel,
  downloadCV,
  loadingCV,
}) {
  return (
    <div className="toolbar">
      <IconButton
        label="Toggle project panel"
        onClick={() => togglePanel("Project")}
      >
        <PanelLeft />
      </IconButton>
      <span className="sep" />
      <span className="branch">
        <GitBranch size={13} />
        main
      </span>
      <div className="flex-1" />
      <button
        className="run cv-download"
        aria-label="Download CV"
        onClick={downloadCV}
        disabled={loadingCV && !d.cvUrl}
      >
        <Download size={15} aria-hidden="true" /> <span>Download CV</span>
      </button>
      <a
        className="gh"
        href={d.github}
        target="_blank"
        rel="noreferrer"
        title="Open GitHub"
      >
        <Github size={16} />
        <span>GitHub</span>
      </a>
    </div>
  );
}
