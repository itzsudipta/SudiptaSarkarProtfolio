import React from "react";

export function IconButton({ label, onClick, children, active }) {
  return (
    <button
      title={label}
      aria-label={label}
      className={"icon " + (active ? "on" : "")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
