import React from "react";
import { GitBranch } from "lucide-react";
import { portfolio as d } from "../data/data";

export function StatusBar({ active, notice, line, column, light }) {
  return (
    <footer className="statusbar" aria-label="Workspace status">
      <span className="status-branch">
        <GitBranch size={13} />
        main
      </span>
      <i className="status-divider" aria-hidden="true" />
      <span className="footpath">
        {active ? "portfolio/src/" + d.files[active] : "portfolio"}
      </span>
      <div className="status-spacer flex-1" />
      <span className="developer-credit">{d.developerCredit}</span>
      <span className="status-notice" role="status">{notice}</span>
      <span className="status-position">Ln {line}, Col {column}</span>
      <span className="status-encoding">UTF-8</span>
      <span className="footTheme">
        <span className="lightdot" />
        {light ? "IntelliJ Light" : "Darcula"}
      </span>
    </footer>
  );
}
