import React from "react";
import { RecordPage } from "../components/RecordPage";
import { portfolio } from "../data/data";

export function Experience() {
  const entries = portfolio.experience.map(([period, title, description, images]) => ({
    title,
    period,
    description,
    images,
  }));

  return (
    <RecordPage
      filename={portfolio.files.experience}
      title="Experience"
      entries={entries}
    />
  );
}
