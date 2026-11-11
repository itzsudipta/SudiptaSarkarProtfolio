import { useState, useEffect } from "react";

function validate(name, records) {
  if (!Array.isArray(records)) throw new Error("Expected a JSON array.");
  const ids = new Set();
  for (const record of records) {
    if (
      !record ||
      typeof record.id !== "string" ||
      !record.id.trim() ||
      ids.has(record.id)
    )
      throw new Error("Each record needs a unique id.");
    ids.add(record.id);
    const title = name === "projects" ? record.name : record.title;
    if (typeof title !== "string" || !title.trim())
      throw new Error("A record is missing its title.");
    if (
      name === "projects" &&
      (!Array.isArray(record.tags) ||
        record.tags.some((t) => typeof t !== "string"))
    )
      throw new Error("Project tags must be an array of strings.");
    if (name === "certificates" && !record.image && !record.demoImage)
      throw new Error("A certificate needs an image or PDF.");
  }
  return records;
}

export function useCatalog(name) {
  const [state, setState] = useState({ items: [], loading: true, error: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ items: [], loading: true, error: "" });
    const timeout = setTimeout(() => controller.abort("timeout"), 15000);
    async function load() {
      try {
        const response = await fetch(
          import.meta.env.BASE_URL + "data/" + name + ".json",
          { signal: controller.signal, cache: "no-cache" },
        );
        if (!response.ok) throw new Error("HTTP " + response.status);
        const items = validate(name, await response.json());
        if (!controller.signal.aborted)
          setState({ items, loading: false, error: "" });
      } catch (error) {
        if (controller.signal.aborted && controller.signal.reason !== "timeout")
          return;
        console.error("[Portfolio] Could not load catalog:", name, error);
        setState({
          items: [],
          loading: false,
          error:
            controller.signal.reason === "timeout"
              ? "Loading " + name + " timed out."
              : "Could not load " + name + ". Please retry.",
        });
      } finally {
        clearTimeout(timeout);
      }
    }
    load();
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [name, attempt]);
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
