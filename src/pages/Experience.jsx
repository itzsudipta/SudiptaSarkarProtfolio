import React from "react";
import { RecordPage } from "../components/RecordPage";
import { portfolio } from "../data/data";

export function Experience() {
  const entries = portfolio.experience.map(([period, title, description]) => ({
    title,
    period,
    description,
  }));

  return (
    <RecordPage
      filename={portfolio.files.experience}
      title="Experience"
      entries={entries}
    />
  );
}
