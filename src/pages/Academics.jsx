import React from "react";
import { RecordPage } from "../components/RecordPage";
import { portfolio } from "../data/data";

export function Academics() {
  const entries = portfolio.academicJourney.map(
    ([period, qualification, institution, description]) => ({
      title: institution,
      subtitle: qualification,
      period,
      description,
    }),
  );

  return (
    <RecordPage
      filename={portfolio.files.academics}
      title="Academics"
      entries={entries}
    />
  );
}
