import React from "react";
import { getCertificates } from "../data/certificateGallery";
import { CertificateCard } from "../components/CertificateCard";

import { useCatalog } from "../services/catalogs";
import { CatalogStatus } from "../components/CatalogStatus";

export function Certificates() {
  const catalog = useCatalog("certificates");
  const records = getCertificates(catalog.items);
  return (
    <section className="certificate-section">
      <div className="comment">// certificates.md</div>
      <h1 className="pagetitle">
        Certificates<b>.</b>
      </h1>
      <CatalogStatus catalog={catalog} />
      {!catalog.loading && !catalog.error && records.length === 0 && (
        <p>No certificates listed.</p>
      )}
      <div className="certificate-gallery">
        {records.map((c) => (
          <CertificateCard key={c.id} certificate={c} />
        ))}
      </div>
    </section>
  );
}
