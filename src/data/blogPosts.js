import posts from "./blogs.json";

export function findPublishedPosts(titleQuery = "") {
  const term = titleQuery.trim().toLowerCase();
  return posts
    .filter(
      (post) =>
        post.published === true && post.title.toLowerCase().includes(term),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}
