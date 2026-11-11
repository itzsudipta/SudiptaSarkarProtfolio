import { TechIcon } from "./TechIcon";
import React, { useState, useEffect, useRef } from "react";
import { Search, X, ArrowUpRight } from "lucide-react";
import { portfolio as d } from "../data/data";
import { IconButton } from "./IconButton";
import { FileIcon } from "./Panels";
import { ids } from "../utils/workspaceFiles";

export function WorkspaceDialog({
  kind,
  close,
  open,
  query,
  setQuery,
  project,
}) {
  const dialog = useRef();
  const term = query.trim().toLowerCase();
  const matches = ids
    .filter((id) => (id + " " + d.files[id]).toLowerCase().includes(term))
    .map((id) => ({ id, label: d.files[id] }));
  if (term)
    for (const record of d.research) {
      if (
        [record.title, record.type, record.details]
          .join(" ")
          .toLowerCase()
          .includes(term)
      )
        matches.push({
          id: "research",
          label: record.title,
          recordId: record.id,
        });
    }
  function choose(result) {
    open(result.id);
    close();
    if (result.recordId)
      requestAnimationFrame(() =>
        document.getElementById(result.recordId)?.focus(),
      );
  }
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const el = dialog.current;
    const previous = document.activeElement;
    el.showModal();
    if (kind === "search") el.querySelector("input")?.focus();
    return () => {
      el.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      aria-label={
        kind === "search"
          ? "Search Everywhere"
          : kind === "detail"
            ? project.name
            : "About this workspace"
      }
      ref={dialog}
      onCancel={close}
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
    >
      <div className="modalinner">
        <header>
          <strong>
            {kind === "search"
              ? "Search Everywhere"
              : kind === "about"
                ? "About this workspace"
                : project.name}
          </strong>
          <IconButton label="Close dialog" onClick={close}>
            <X />
          </IconButton>
        </header>
        {kind === "search" ? (
          <>
            <label className="searchfield">
              <Search size={17} />
              <input
                aria-label="Search files"
                placeholder="Search files and publications…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelected(
                      (i) =>
                        (i +
                          (e.key === "ArrowDown" ? 1 : -1) +
                          matches.length) %
                        Math.max(1, matches.length),
                    );
                  }
                  if (e.key === "Enter" && matches[selected]) {
                    e.preventDefault();
                    choose(matches[selected]);
                  }
                }}
              />
            </label>
            <div className="results">
              {matches.map((result, i) => (
                <button
                  key={result.recordId || result.id}
                  className={selected === i ? "chosen" : ""}
                  onClick={() => choose(result)}
                >
                  <FileIcon id={result.id} />
                  <span>{result.label}</span>
                </button>
              ))}
              {!matches.length && <p>No matches.</p>}
            </div>
          </>
        ) : kind === "about" ? (
          <>
            <h2>{d.name}</h2>
            <p>
              {d.role} · {d.location}
            </p>
            <p>
              Double Shift opens file search. Use the Project panel or tabs to
              explore the workspace.
            </p>
          </>
        ) : (
          <>
            <div className="comment">{project.kind}</div>
            <p>{project.detail}</p>
            <div className="project-tech">
              {project.tags.map((t) => (
                <TechIcon key={t} name={t} />
              ))}
            </div>
            <div className="actions">
              {Object.entries({
                GitHub: project.github,
                "Live demo": project.live,
              })
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <a href={v} key={k} target="_blank" rel="noreferrer">
                    {k}
                    <ArrowUpRight size={13} />
                  </a>
                ))}
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
