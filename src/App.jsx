import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  Network,
  Bookmark,
  TerminalSquare,
  X,
} from "lucide-react";
import { portfolio as d } from "./data/data";
import { Panel, Terminal, FileIcon } from "./components/Panels";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { EmptyEditor } from "./components/EmptyEditor";
import { IconButton } from "./components/IconButton";
import { WorkspaceDialog } from "./components/WorkspaceDialog";
import { ids, filename } from "./utils/workspaceFiles";
import { download, cv } from "./utils/downloads";
import { TitleBar } from "./layouts/TitleBar";
import { Toolbar } from "./layouts/Toolbar";
import { StatusBar } from "./layouts/StatusBar";
// import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Academics } from "./pages/Academics";
import { Experience } from "./pages/Experience";
import { Projects } from "./pages/Projects";
import { Research } from "./pages/Research";
import { Certificates } from "./pages/Certificates";
import { Contact } from "./pages/Contact";

import { useCatalog } from "./services/catalogs";

export default function App() {
  const projects = useCatalog("projects");
  const downloadCV = () => cv(projects.items);
  const [tabs, setTabs] = useState(["profile"]),
    [closed, setClosed] = useState([]),
    [active, setActive] = useState("profile"),
    [panel, setPanel] = useState(() =>
      matchMedia("(max-width:800px)").matches ? "" : "Project",
    ),
    [term, setTerm] = useState(false),
    [modal, setModal] = useState(""),
    [project, setProject] = useState(null),
    [query, setQuery] = useState(""),
    [light, setLight] = useState(
      document.documentElement.dataset.theme === "light",
    ),
    [marks, setMarks] = useState([]),
    [windowState, setWindow] = useState("normal"),
    [line, setLine] = useState(1),
    [notice, setNotice] = useState("");
  const shiftAt = useRef(0),
    dragged = useRef(null),
    scroll = useRef();
  const theme = () => {
    const v = !light;
    setLight(v);
    document.documentElement.dataset.theme = v ? "light" : "dark";
    try {
      localStorage.setItem("ide-theme", v ? "light" : "dark");
    } catch (error) {
      console.warn(
        "[Portfolio] Theme changed for this session; could not save preference.",
        error,
      );
    }
  };
  const open = (id) => {
    if (id === "home" || !ids.includes(id)) return;
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setActive(id);
    setClosed((previous) => previous.filter((file) => file !== id));
    if (matchMedia("(max-width:800px)").matches) setPanel("");
  };
  const close = (id) => {
    if (!tabs.includes(id)) return;
    setClosed((previous) => [...previous.filter((file) => file !== id), id]);
    const next = tabs.filter((t) => t !== id);
    setTabs(next);
    if (active === id)
      setActive(next[Math.min(tabs.indexOf(id), next.length - 1)] || "");
  };
  const cycle = (step = 1) => {
    if (tabs.length)
      open(tabs[(tabs.indexOf(active) + step + tabs.length) % tabs.length]);
  };
  const search = () => {
    setQuery("");
    setModal("search");
  };
  const togglePanel = (p) => setPanel(panel === p ? "" : p);
  const bookmark = () => {
    if (active)
      setMarks((m) =>
        m.includes(active) ? m.filter((x) => x !== active) : [...m, active],
      );
  };
  const maximize = () =>
    setWindow(windowState === "maximized" ? "normal" : "maximized");
  const inspect = (project) => {
    const url = project.github || project.live;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  const currentContent = () =>
    scroll.current?.querySelector(".fileview:not([hidden])");
  const selectContent = () => {
    const content = currentContent();
    if (!content) return;
    const range = document.createRange();
    range.selectNodeContents(content);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };
  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copied");
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      try {
        document.body.append(field);
        field.select();
        setNotice(
          document.execCommand("copy") ? "Copied" : "Clipboard unavailable",
        );
      } catch (error) {
        console.warn("[Portfolio] Clipboard fallback unavailable.", error.name);
        setNotice("Clipboard unavailable");
      } finally {
        field.remove();
      }
    }
    setTimeout(() => setNotice(""), 2000);
  };
  const menus = {
    File: [
      ["Open file…", search],
      [
        "Download current page",
        () => download(active + ".txt", currentContent().innerText),
        !active,
      ],
      ["Close tab", () => close(active), !active],
      ["Reopen closed tab", () => open(closed.at(-1)), !closed.length],
      ["Download CV", downloadCV, projects.loading],
    ],
    Edit: [
      ["Select page text", selectContent, !active],
      ["Copy page text", () => copy(currentContent().innerText), !active],
      [
        "Copy file path",
        () => copy("portfolio/src/" + d.files[active]),
        !active,
      ],
    ],
    View: [
      ["Toggle Sidebar", () => togglePanel("Project")],
      ["Switch Theme", theme],
      ["Toggle Terminal", () => setTerm(!term)],
    ],
    Navigate: ids.map((id) => [filename(id), () => open(id)]),
    Code: [
      ["Project files", () => open("projects")],
      ["Research notes", () => open("research")],
    ],
    Tools: [
      ["Search Everywhere", search],
      ["Toggle bookmark", bookmark, !active],
      ["Terminal", () => setTerm(!term)],
    ],
    Window: [
      ["Previous tab", () => cycle(-1), tabs.length < 2],
      ["Next tab", () => cycle(), tabs.length < 2],
      // Workspace controls are disabled in the title bar and this menu.
      // ["Maximize / restore", maximize],
      // ["Minimize workspace", () => setWindow("minimized")],
    ],
    Help: [["About", () => setModal("about")]],
  };
  useEffect(() => {
    document
      .getElementById("tab-" + active)
      ?.parentElement?.scrollIntoView({ inline: "nearest", block: "nearest" });
    scroll.current?.scrollTo(0, 0);
    setLine(1);
  }, [active]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") {
        if (matchMedia("(max-width:800px)").matches) setPanel("");
        return;
      }
      if (modal || ["closed", "minimized"].includes(windowState)) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        search();
      }
      if (ctrl && e.key === "Tab") {
        e.preventDefault();
        cycle(e.shiftKey ? -1 : 1);
      }
      if (ctrl && e.key.toLowerCase() === "w") {
        e.preventDefault();
        close(active);
      }
      if (e.key === "Shift" && !e.repeat) {
        if (Date.now() - shiftAt.current < 350) {
          search();
          shiftAt.current = 0;
        } else shiftAt.current = Date.now();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
    };
  });
  const tools = [
    ["Project", Folder],
    ["Structure", Network],
    ["Bookmarks", Bookmark],
  ];
  const page = {
    // home: <Home catalog={projects} open={open} inspect={inspect} />,
    profile: <Profile open={open} />,
    academics: <Academics />,
    experience: <Experience />,
    projects: <Projects catalog={projects} inspect={inspect} />,
    research: <Research />,
    certificates: <Certificates />,
    contact: <Contact />,
  };
  const tabKeys = (e, id) => {
    const idx = tabs.indexOf(id);
    let target;
    if (e.key === "ArrowRight") target = tabs[(idx + 1) % tabs.length];
    if (e.key === "ArrowLeft")
      target = tabs[(idx - 1 + tabs.length) % tabs.length];
    if (e.key === "Home") target = tabs[0];
    if (e.key === "End") target = tabs.at(-1);
    if (e.key === "Delete") return close(id);
    if (target) {
      e.preventDefault();
      open(target);
      document.getElementById("tab-" + target)?.focus();
    }
  };
  if (windowState === "closed" || windowState === "minimized")
    return (
      <div className="restore">
        <TerminalSquare />
        <h1>
          {windowState === "closed"
            ? "Workspace closed"
            : "Workspace minimized"}
        </h1>
        <button className="primary" onClick={() => setWindow("normal")}>
          Reopen portfolio
        </button>
      </div>
    );
  return (
    <div className={"ide " + windowState}>
      <TitleBar
        light={light}
        search={search}
        theme={theme}
        menus={menus}
        setWindow={setWindow}
        windowState={windowState}
        maximize={maximize}
      />
      <Toolbar
        downloadCV={downloadCV}
        loadingCV={projects.loading}
        togglePanel={togglePanel}
      />
      <div className="work">
        <aside className="rail">
          {tools.map(([p, I]) => (
            <IconButton
              key={p}
              label={p}
              active={panel === p}
              onClick={() => togglePanel(p)}
            >
              <I />
            </IconButton>
          ))}
          <div className="flex-1" />
          <IconButton
            label="Terminal"
            active={term}
            onClick={() => setTerm(!term)}
          >
            <TerminalSquare />
          </IconButton>
        </aside>
        {panel && (
          <>
            <button
              className="scrim"
              aria-label="Dismiss drawer"
              onClick={() => setPanel("")}
            />
            <Panel
              panel={panel}
              active={active}
              open={open}
              marks={marks}
              bookmark={bookmark}
              hide={() => setPanel("")}
            />
          </>
        )}
        <main>
          <div className="tabs" role="tablist" aria-label="Editor tabs">
            {tabs.map((id) => (
              <div
                key={id}
                className={"tab " + (active === id ? "current" : "")}
                draggable
                onDragStart={() => (dragged.current = id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!dragged.current) return;
                  const next = tabs.filter((t) => t !== dragged.current);
                  next.splice(tabs.indexOf(id), 0, dragged.current);
                  setTabs(next);
                  dragged.current = null;
                }}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    close(id);
                  }
                }}
              >
                <button
                  role="tab"
                  id={"tab-" + id}
                  aria-controls="editor"
                  tabIndex={active === id ? 0 : -1}
                  aria-selected={active === id}
                  onKeyDown={(e) => tabKeys(e, id)}
                  onClick={() => open(id)}
                >
                  <FileIcon id={id} />
                  {filename(id)}
                </button>
                <button
                  className="tabclose"
                  aria-label={"Close " + id}
                  onClick={() => close(id)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div
            className="editor"
            ref={scroll}
            onScroll={(e) =>
              setLine(1 + Math.floor(e.currentTarget.scrollTop / 25))
            }
            role={active ? "tabpanel" : "region"}
            aria-label={active ? undefined : "File chooser"}
            id="editor"
            aria-labelledby={active ? "tab-" + active : undefined}
          >
            <div className="sheet">
              {active && (
                <div aria-hidden="true" className="gutter">
                  {Array.from({ length: 90 }, (_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
              )}
              <div className={active ? "content innerpage" : "empty-editor"}>
                {tabs.map((id) => (
                  <div className="fileview" key={id} hidden={active !== id}>
                    <ErrorBoundary scope={filename(id)}>
                      {page[id]}
                    </ErrorBoundary>
                  </div>
                ))}
                {!active && <EmptyEditor open={open} />}
              </div>
            </div>
          </div>
          {term && (
            <Terminal open={open} hide={() => setTerm(false)} theme={theme} />
          )}
        </main>
      </div>
      <StatusBar active={active} notice={notice} line={line} light={light} />
      {modal && (
        <WorkspaceDialog
          kind={modal}
          close={() => setModal("")}
          open={open}
          query={query}
          setQuery={setQuery}
          project={project}
        />
      )}
    </div>
  );
}
