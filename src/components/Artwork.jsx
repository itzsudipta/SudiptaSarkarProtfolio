import React from "react";

// Project a sampled surface into an isometric viewport; each path follows one mesh line.
export function Terrain() {
  function point(i, j) {
    const x = (i / 34) * 2 - 1,
      y = (j / 28) * 2 - 1;
    const ridge =
      0.75 * Math.exp(-((x + 0.17) ** 2 / 0.18 + (y - 0.12) ** 2 / 0.25)) +
      0.52 * Math.exp(-((x - 0.41) ** 2 / 0.11 + (y + 0.28) ** 2 / 0.16)) +
      0.22 * Math.exp(-((x + 0.62) ** 2 / 0.08 + (y + 0.34) ** 2 / 0.19));
    const z = ridge * (1 + 0.11 * Math.sin(8 * x - 4 * y));
    return [
      (166 + (x - y) * 75).toFixed(2),
      (124 + (x + y) * 31 - z * 105).toFixed(2),
    ].join(",");
  }
  return (
    <svg
      className="terrain"
      viewBox="0 0 332 203"
      role="img"
      aria-label="Mint wireframe terrain plotted on an isometric grid"
    >
      <defs>
        <pattern id="dots" width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".7" fill="var(--plotdot)" />
        </pattern>
      </defs>
      <rect width="332" height="203" fill="url(#dots)" />
      <g fill="none" stroke="var(--green)" strokeWidth=".8">
        {Array.from({ length: 35 }, (_, i) => (
          <polyline
            key={i}
            points={Array.from({ length: 29 }, (_, j) => point(i, j)).join(" ")}
          />
        ))}
        {Array.from({ length: 29 }, (_, j) => (
          <polyline
            opacity=".73"
            key={j}
            points={Array.from({ length: 35 }, (_, i) => point(i, j)).join(" ")}
          />
        ))}
      </g>
      <g stroke="var(--plotdot)" fill="none">
        {[
          [8, 8],
          [324, 8],
          [8, 195],
          [324, 195],
        ].map(([x, y]) => (
          <path key={x + "-" + y} d={`M${x - 3} ${y}h6m-3 -3v6`} />
        ))}
      </g>
    </svg>
  );
}
export function Art({ type }) {
  const nodes = [
    [25, 55],
    [54, 26],
    [58, 77],
    [94, 49],
    [128, 21],
    [130, 78],
    [162, 44],
    [192, 66],
    [209, 26],
  ];
  return (
    <svg className={"art " + type} viewBox="0 0 240 106" aria-hidden="true">
      <defs>
        <pattern
          id={"grid" + type}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M14 0H0V14"
            fill="none"
            stroke="currentColor"
            opacity=".13"
          />
        </pattern>
      </defs>
      <rect width="240" height="106" fill={"url(#grid" + type + ")"} />
      {type === "graph" ? (
        <g>
          {nodes.map(([x, y], i) => (
            <g key={i}>
              {nodes
                .slice(i + 1)
                .filter(([a, b]) => Math.hypot(a - x, b - y) < 73)
                .map(([a, b]) => (
                  <path
                    key={a}
                    d={`M${x} ${y}L${a} ${b}`}
                    stroke="currentColor"
                    opacity=".65"
                  />
                ))}
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="var(--artbg)"
                stroke="currentColor"
              />
              <circle cx={x} cy={y} r="2.4" fill="currentColor" />
            </g>
          ))}
        </g>
      ) : type === "fabric" ? (
        Array.from({ length: 35 }, (_, i) => (
          <path
            key={i}
            d={`M${-75 + i * 6} 100 C${-10 + i * 5} 45 ${5 + i * 5} -12 ${52 + i * 4} 33 S${104 + i * 4} 96 ${165 + i * 5} 26`}
            stroke="currentColor"
            fill="none"
            opacity=".8"
          />
        ))
      ) : (
        <g fill="var(--artbg)" stroke="currentColor">
          {[
            [68, 43],
            [153, 43],
            [110, 57],
          ].map(([x, y]) => (
            <g key={x}>
              {[16, 8, 0].map((d) => (
                <g key={d}>
                  <path d={`M${x - 24} ${y + d}v8a24 8 0 0 0 48 0v-8`} />
                  <ellipse cx={x} cy={y + d} rx="24" ry="8" />
                </g>
              ))}
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
