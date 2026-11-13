import React, { useState, useEffect, useRef } from "react";
import { Menu, Search, Sun, Moon } from "lucide-react";
// import { Minus, Square, X, Copy } from "lucide-react";
import { IconButton } from "../components/IconButton";
import { portfolio } from "../data/data";

export function TitleBar({ menus, setWindow, windowState, maximize, search, theme, light }) {
  const bar = useRef(null);
  const [menu, setMenu] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  useEffect(() => {
    const away = (e) => {
      if (!bar.current?.contains(e.target)) {
        setMenu("");
        setMobileMenu(false);
      }
    };

    const escape = (e) => {
      if (e.key === "Escape") {
        setMenu("");
        setMobileMenu(false);
      }
    };
    window.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", away);
    return () => {
      window.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", away);
    };
  }, []);
  return (
    <header className="titlebar" ref={bar}>
      <div className="brand">
        <img
          className="brand-logo"
          src="/images/logo/SudiptaSarkarLogo.webp"
          alt=""
          width="32"
          height="32"
        />
        <b className="brand-name">{portfolio.name}</b>
      </div>
      <button
        className="mobilemenu"
        aria-label="Application menus"
        aria-expanded={mobileMenu}
        onClick={() => setMobileMenu(!mobileMenu)}
      >
        <Menu size={18} />
      </button>
      <nav className={mobileMenu ? "show" : ""}>
        {/* Blog navigation disabled until launch: <a href="/blog">Blog</a> */}
        {Object.entries(menus).map(([name, items]) => (
          <div className="menu" key={name}>
            <button
              aria-expanded={menu === name}
              onClick={() => setMenu(menu === name ? "" : name)}
            >
              {name}
            </button>
            {menu === name && (
              <div
                className="dropdown"
                onKeyDown={(e) => {
                  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key))
                    return;
                  e.preventDefault();
                  const choices = [
                    ...e.currentTarget.querySelectorAll(
                      "button:not(:disabled)",
                    ),
                  ];
                  const i = choices.indexOf(document.activeElement);
                  choices[
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? choices.length - 1
                        : (i +
                            (e.key === "ArrowDown" ? 1 : -1) +
                            choices.length) %
                          choices.length
                  ]?.focus();
                }}
              >
                {items.map(([label, fn, disabled]) => (
                  <button
                    disabled={disabled}
                    key={label}
                    onClick={() => {
                      setMenu("");
                      setMobileMenu(false);
                      fn();
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="title-actions">
      <button
        className="searchbtn"
        onClick={() => {setMenu(""); setMobileMenu(false); search();}}
        aria-label="Search Everywhere"
      >
        <Search size={15} />
        <span>Search everywhere</span>
      </button>
      <IconButton label="Switch theme" onClick={() => {setMenu(""); setMobileMenu(false); theme();}}>
        {light ? <Moon /> : <Sun />}
      </IconButton>
      </div>
      {/* Workspace window controls are disabled. Restore the imports above to re-enable.
      <div className="windowcontrols">
        <IconButton
          label="Minimize workspace"
          onClick={() => setWindow("minimized")}
        >
          <Minus />
        </IconButton>
        <IconButton label="Maximize or restore workspace" onClick={maximize}>
          {windowState === "maximized" ? <Copy /> : <Square />}
        </IconButton>
        <IconButton label="Close workspace" onClick={() => setWindow("closed")}>
          <X />
        </IconButton>
      </div>
      */}
    </header>
  );
}
