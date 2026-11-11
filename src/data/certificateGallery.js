// Files in this optional inbox get cards without catalog entries.
// Assets elsewhere are managed exclusively by certificates.json.
const inbox = Object.keys(
  import.meta.glob("/public/certificates/**/*", {
    query: "?url",
    import: "default",
  }),
)
  .filter((p) => /\.(png|jpe?g|gif|webp|avif|svg|pdf)$/i.test(p))
  .map((p) => p.slice("/public".length))
  .sort();
const stem = (p) => p.slice(p.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");
const url = (p) => p.split("/").map(encodeURIComponent).join("/");

export function getCertificates(records) {
  const claimed = new Set(
    records.flatMap((c) => [c.image, c.demoImage]).filter(Boolean),
  );
  const candidates = inbox.filter(
    (p) => !claimed.has(p) && !claimed.has(url(p)),
  );
  const configured = records.map((c) => {
    const scan =
      !c.image &&
      c.demoImage &&
      candidates.find((p) => !claimed.has(p) && stem(p) === stem(c.demoImage));
    if (!scan) return c;
    claimed.add(scan);
    return { ...c, image: url(scan) };
  });
  return [
    ...configured,
    ...candidates
      .filter((p) => !claimed.has(p))
      .map((p) => ({
        id: "inbox:" + p,
        title: stem(p)
          .replace(/[-_]+/g, " ")
          .trim()
          .replace(/^./u, (c) => c.toUpperCase()),
        image: url(p),
      })),
  ];
}
