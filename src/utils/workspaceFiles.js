import { portfolio as d } from "../data/data";
export const ids = Object.keys(d.files);
export const filename = (id) => d.files[id]?.split("/").pop();
