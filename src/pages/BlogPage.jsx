import React, { useState } from "react";
import { Search } from "lucide-react";
import { findPublishedPosts } from "../data/blogPosts";
import "./BlogPage.css";

const formatDate = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export default function BlogPage() {
  const [query, setQuery] = useState("");
  const posts = findPublishedPosts(query);
  return (
    <section className="blog-page" aria-labelledby="blog-title">
      <h1 className="pagetitle" id="blog-title">
        Blog<b>.</b>
      </h1>
      <label className="searchfield blog-search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          aria-label="Filter posts by title"
          placeholder="Filter posts by title…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {posts.length ? (
        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.id} id={post.slug}>
              <small>
                <time dateTime={post.date}>
                  {formatDate.format(new Date(post.date))}
                </time>{" "}
                · {post.author}
              </small>
              <h2>{post.title}</h2>
              <p>{post.summary}</p>
              <div className="tags">
                {post.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <details>
                <summary>Read post</summary>
                {post.content.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </details>
            </article>
          ))}
        </div>
      ) : (
        <p role="status">No published posts match this title.</p>
      )}
    </section>
  );
}
