import React from "react";
import { ArrowUpRight } from "lucide-react";
import { portfolio } from "../data/data";
import { DetailsTable } from "../components/DetailsTable";

export function Research() {
  return (
    <div className="research-index">
      <header className="research-head">
        <div className="comment">// research/research.md</div>
        <h1 id="research-title" className="pagetitle">
          Research &amp; Publication<b>.</b>
        </h1>
      </header>
      <DetailsTable
        className="research-details-table"
        label="Research and publications"
        headingLabel="Research type"
        rows={portfolio.research.map((record) => ({
          id: record.id,
          heading: record.type,
          content: (
            <>
              <h2>{record.title}</h2>
              <p>{record.details}</p>
              <a
                className="textaction"
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {record.linkLabel}
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              {record.demo && (
                <small className="demo-link-note">Demo · title search</small>
              )}
            </>
          ),
        }))}
      />
    </div>
  );
}
