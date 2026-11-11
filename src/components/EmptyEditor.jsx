import React from "react";
import { portfolio } from "../data/data";
import { FileIcon } from "./Panels";
import { ids } from "../utils/workspaceFiles";

export function EmptyEditor({ open }) {
  return (
    <section className="file-picker" aria-labelledby="file-picker-title">
      <h1 id="file-picker-title">Open a file</h1>
      <ul className="file-picker-list">
        {ids.map((id) => (
          <li key={id}>
            <button onClick={() => open(id)}>
              <span className="file-picker-icon">
                <FileIcon id={id} />
              </span>
              <span className="file-picker-name">{id}</span>
              <span className="file-picker-path">{portfolio.files[id]}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
