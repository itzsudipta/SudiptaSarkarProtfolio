import React from "react";
import { FaGithub, FaLinkedin, FaHackerrank, FaKaggle } from "react-icons/fa";
import Gmail from "../assets/icons/gmail.svg";
import { SiLeetcode, SiGeeksforgeeks, SiGmail } from "react-icons/si";
import { portfolio } from "../data/data";
const marks = {
  GitHub: [FaGithub, "var(--github-ink)"],
  LinkedIn: [FaLinkedin, "#0A66C2"],
  LeetCode: [SiLeetcode, "#FFA116"],
  HackerRank: [FaHackerrank, "#00C853"],
  Kaggle: [FaKaggle, "#20BEFF"],
  GeeksforGeeks: [SiGeeksforgeeks, "#2F8D46"],
  Email: [SiGmail, "#EA4335"],
};
export function ProfileContacts() {
  return (
    <section className="profile-section">
      <h2>Connect</h2>
      <ul className="profile-contacts">
        {Object.entries({
          Email: "mailto:" + portfolio.email,
          GitHub: portfolio.github,
          ...portfolio.socialProfiles,
        }).map(([name, url]) => {
          const [Mark, color] = marks[name];
          return (
            <li key={name}>
              <a
                href={url}
                target={name === "Email" ? undefined : "_blank"}
                rel="noreferrer"
              >
                {name === "Email" ? (
                  <img src={Gmail} width="22" height="22" alt="" />
                ) : (
                  <Mark size={22} color={color} aria-hidden="true" />
                )}
                <span>{name}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
