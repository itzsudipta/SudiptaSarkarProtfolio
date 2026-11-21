import React from "react";

export function DetailsTable({ label, headingLabel, rows, className = "" }) {
  return (
    <table className={`details-table ${className}`} aria-label={label} role="table">
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader">{headingLabel}</th>
          <th scope="col" role="columnheader">Description</th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.map(({ id, heading, content }) => (
          <tr key={id} id={id} tabIndex={-1} role="row">
            <th scope="row" role="rowheader">{heading}</th>
            <td role="cell">{content}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
