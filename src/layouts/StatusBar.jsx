import React from "react";
import { GitBranch } from "lucide-react";
import { portfolio as d } from "../data/data";

export function StatusBar({ active, notice, line, light }) {
  return (
    <footer>
      <span>
        <GitBranch size={13} />
        main
      </span>
      <i aria-hidden="true" />
      <span className="footpath">
        {active ? "portfolio/src/" + d.files[active] : "portfolio"}
      </span>
      <div className="flex-1" />
      <span className="developer-credit">{d.developerCredit}</span>
      <span role="status">{notice}</span>
      <span>Ln {line}, Col 1</span>
      <span>UTF-8</span>
      <span className="footTheme">
        <span className="lightdot" />
        {light ? "IntelliJ Light" : "Darcula"}
      </span>
    </footer>
  );
}
