import React from "react";
import { ArrowUpRight } from "lucide-react";
import { portfolio } from "../data/data";

export function Research() {
  return (
    <div className="research-index">
      <header className="research-head">
        <div className="comment">// research/notes.md</div>
        <h1 id="research-title" className="pagetitle">
          Research &amp; Publication<b>.</b>
        </h1>
      </header>
      <div
        className="research-scroll"
        role="region"
        tabIndex={0}
        aria-labelledby="research-title"
      >
        <table className="research-table" aria-labelledby="research-title">
          <thead>
            <tr>
              {["No.", "Type", "Title", "Details", "Link"].map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {portfolio.research.map((record, index) => (
              <tr key={record.id} id={record.id} tabIndex={-1}>
                <td>{index + 1}</td>
                <td>{record.type}</td>
                <td>
                  <h2>{record.title}</h2>
                </td>
                <td>{record.details}</td>
                <td>
                  <a
                    className="textaction"
                    href={record.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {record.linkLabel}
                    <ArrowUpRight size={14} />
                  </a>
                  {record.demo && (
                    <small className="demo-link-note">
                      Demo · title search
                    </small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
