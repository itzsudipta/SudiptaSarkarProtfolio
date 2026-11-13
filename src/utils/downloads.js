import { portfolio as d } from "../data/data";
export function download(name, body) {
  const url = URL.createObjectURL(
    new Blob([body], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function cv(projects) {
  if (d.cvUrl) {
    const link = document.createElement("a");
    link.href = d.cvUrl;
    link.download = d.name.replace(/\s+/g, "-") + "-CV.pdf";
    document.body.append(link);
    link.click();
    link.remove();
    return;
  }
  download(
    d.name + "-CV.txt",
    [
      d.name,
      d.role,
      d.location,
      d.website,
      "",
      d.bio,
      "",
      d.education,
      "",
      d.techGroups
        .map(([group, items]) => group + " — " + items.join(", "))
        .join("\n"),
      "",
      ...projects.map((p) => p.name + " — " + p.description),
      "",
      ...d.experience.map((e) => e.slice(0, 3).join(" · ")),
    ].join("\n"),
  );
}
