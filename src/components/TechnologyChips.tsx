import { TECHNOLOGY_BRANDS } from "@/lib/technologyIcons";

const symbols = {
  code: "m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18",
  accessibility: "M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM4 8l8 2 8-2m-8 2v5m0 0-5 7m5-7 5 7",
  layers: "m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5",
  testing: "m7 12 3 3 7-7M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9",
  workflow: "M3 3h6v6H3Zm12 12h6v6h-6ZM9 6h6a3 3 0 0 1 3 3v6M6 9v9h9",
  cycle: "M20 7a9 9 0 0 0-15-2L2 8m0-5v5h5m-3 9a9 9 0 0 0 15 2l3-3m0 5v-5h-5",
  review: "M21 11v9H3V4h12m-8 5h5m-5 5h4m3-5 3 3 5-7",
  mentoring: "M10 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 21v-4a5 5 0 0 1 10 0v4m8-13a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-6 6a5 5 0 0 1 8 4v3",
  database: "M21 5c0 2-4 3-9 3S3 7 3 5s4-3 9-3 9 1 9 3Zm0 0v14c0 2-4 3-9 3s-9-1-9-3V5m0 7c0 2 4 3 9 3s9-1 9-3",
  terminal: "M3 4h18v16H3Zm4 4 4 4-4 4m6 0h4",
  idea: "M9 18h6m-6 3h6m-7-7a7 7 0 1 1 8 0l-1 4H9Z",
};

const concepts: Record<string, keyof typeof symbols> = {
  Accessibility: "accessibility",
  "State management": "layers",
  Playwright: "testing",
  "Integration testing": "testing",
  "CI/CD": "workflow",
  Agile: "cycle",
  "Code reviews": "review",
  Mentoring: "mentoring",
  Struts: "layers",
  "REST APIs": "workflow",
  Oracle: "database",
  "SQL Server": "database",
  Powerlevel10k: "terminal",
  Idea: "idea",
};

function TechnologyIcon({ name }: { name: string }) {
  const brand = TECHNOLOGY_BRANDS[name.replace(/\s+\d+(?:\.\d+)*$/, "")];
  return (
    <svg
      className="technology-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill={brand ? "currentColor" : "none"}
      stroke={brand ? undefined : "currentColor"}
      strokeWidth={brand ? undefined : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {brand ? (
        <use href={`/technology-icons.svg#${brand.slug}`} />
      ) : (
        <path d={symbols[concepts[name] ?? "code"]} />
      )}
    </svg>
  );
}

export function TechnologyChips({
  items,
  highlighted,
}: {
  items: readonly string[];
  highlighted?: ReadonlySet<string>;
}) {
  return (
    <ul className="chips" role="list">
      {items.map((name) => (
        <li key={name}>
          <span className={highlighted?.has(name) ? "chip hit" : "chip"} translate="no">
            <TechnologyIcon name={name} />
            <span>{name}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
