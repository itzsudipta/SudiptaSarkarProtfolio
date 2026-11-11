import React from "react";
export function CatalogStatus({ catalog, empty = "" }) {
  if (catalog.loading) return <p role="status">Loading…</p>;
  if (catalog.error)
    return (
      <div role="alert">
        <p>{catalog.error}</p>
        <button className="secondary" onClick={catalog.retry}>
          Retry
        </button>
      </div>
    );
  return !catalog.items.length && empty ? <p>{empty}</p> : null;
}
