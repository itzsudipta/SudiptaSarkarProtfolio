import React from "react";
import { ArrowRight } from "lucide-react";
import { portfolio as d } from "../data/data";
import { Portrait } from "../components/Portrait";

import { TechIcon } from "../components/TechIcon";
import { ProfileContacts } from "../components/ProfileContacts";

export function Profile({ open }) {
  return (
    <div className="dossier">
      <section className="identity">
        <div>
          <div className="comment">// profile.ts</div>
          <h1 className="pagetitle">
            {d.name}
            <b>.</b>
          </h1>
          <div className="profile-role">{d.role}</div>
          <h2>Who I am</h2>
          {d.bio.split("\n\n").map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
        <Portrait />
      </section>
      <section className="profile-section">
        <h2>Tech stack</h2>
        <dl className="stacklist">
          {d.techGroups.map(([group, items]) => (
            <div key={group}>
              <dt>{group}</dt>
              <dd className="stack-icons">
                {items.map((item) => (
                  <TechIcon key={item} name={item} caption />
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="profile-section">
        <h2>Research &amp; patent work</h2>
        {d.research.map((r) => (
          <div className="summaryrow" key={r.id}>
            <small>{r.type}</small>
            <h3>{r.title}</h3>
          </div>
        ))}
        <button className="textaction" onClick={() => open("research")}>
          Open research record <ArrowRight size={15} />
        </button>
      </section>
      <section className="profile-section">
        <h2>What I’m building now</h2>
        <p>{d.building}</p>
      </section>
      <ProfileContacts />
    </div>
  );
}
