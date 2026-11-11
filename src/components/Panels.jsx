import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Atom,
  FileText,
  Bookmark,
  Minus,
  Award,
  TerminalSquare,
  X,
} from "lucide-react";
import { portfolio as d } from "../data/data";
import { ids, filename } from "../utils/workspaceFiles";
export function FileIcon({ id }) {
  return id === "home" ? (
    <Atom size={15} className="cyan" />
  ) : id === "certificates" ? (
    <Award size={15} className="violet" />
  ) : id === "research" || id === "contact" ? (
    <FileText size={14} className="violet" />
  ) : (
    <strong className="ts">TS</strong>
  );
}
function FolderRow({ name, children, start = true }) {
  const [exp, set] = useState(start);
  return (
    <>
      <button className="treebtn" aria-expanded={exp} onClick={() => set(!exp)}>
        {exp ? <ChevronDown /> : <ChevronRight />}
        {exp ? <FolderOpen /> : <Folder />}
        {name}
      </button>
      {exp && <div className="nested">{children}</div>}
    </>
  );
}
export function Panel({ panel, active, open, marks, bookmark, hide }) {
  const file = (id) => (
    <button
      className={"treebtn file " + (active === id ? "chosen" : "")}
      key={id}
      onClick={() => open(id)}
    >
      <FileIcon id={id} />
      {filename(id)}
    </button>
  );
  return (
    <aside className="sidebar">
      <header>
        {panel}
        <button title="Hide panel" onClick={hide}>
          <Minus size={15} />
        </button>
      </header>
      {panel === "Project" ? (
        <FolderRow name="portfolio">
          <FolderRow name="src">
            {/* {file("home")} */}
            {file("profile")}
            {file("academics")}
            {file("experience")}
            <FolderRow start={false} name="projects">
              {file("projects")}
            </FolderRow>
            <FolderRow start={false} name="research">
              {file("research")}
            </FolderRow>
            {file("certificates")}
            {file("contact")}
          </FolderRow>
        </FolderRow>
      ) : panel === "Structure" ? (
        ids.map(file)
      ) : (
        <>
          <button className="treebtn" disabled={!active} onClick={bookmark}>
            <Bookmark size={14} />
            {marks.includes(active)
              ? "Remove bookmark"
              : "Bookmark current file"}
          </button>
          {marks.map(file)}
        </>
      )}
    </aside>
  );
}
export function Terminal({ open, hide, theme }) {
  const [lines, set] = useState(["Portfolio shell · type help for commands."]);
  const [input, setInput] = useState("");
  const history = useRef();
  useEffect(() => {
    if (history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [lines]);
  return (
    <section className="terminal">
      <header>
        <span>
          <TerminalSquare size={14} /> Terminal
        </span>
        <button title="Close terminal" onClick={hide}>
          <X size={14} />
        </button>
      </header>
      <div className="history" ref={history} role="log" aria-label="Terminal output">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const cmd = input.trim().toLowerCase();
          setInput("");
          if (!cmd) return;
          if (cmd === "clear") {
            set([]);
            return;
          }
          let msg = "Unknown command. Type help.";
          if (cmd === "help")
            msg = "help · about · ls · open <file> · theme · clear";
          if (cmd === "about") msg = d.name + " — " + d.role;
          if (cmd === "ls") msg = ids.join("  ");
          if (cmd === "theme") {
            theme();
            msg = "Theme switched.";
          }
          if (cmd.startsWith("open ")) {
            const id = ids.find((x) =>
              [x, filename(x), d.files[x]].includes(cmd.slice(5)),
            );
            if (id) {
              open(id);
              msg = "Opened " + d.files[id];
            }
          }
          set((l) => [...l, "❯ " + cmd, msg]);
        }}
      >
        <span aria-hidden="true">❯</span>
        <input
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder="Enter a command…"
          aria-label="Terminal command"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
    </section>
  );
}
