import React from "react";

export function DetailsTable({ label, headingLabel, rows, className = "" }) {
  return (
    <table className={`details-table ${className}`} aria-label={label}>
      <thead>
        <tr>
          <th scope="col">{headingLabel}</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ id, heading, content }) => (
          <tr key={id} id={id} tabIndex={-1}>
            <th scope="row">{heading}</th>
            <td>{content}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
