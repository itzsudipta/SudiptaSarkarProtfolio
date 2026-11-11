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
    window.open(d.cvUrl, "_blank", "noopener");
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
      ...d.experience.map((e) => e.join(" · ")),
    ].join("\n"),
  );
}
