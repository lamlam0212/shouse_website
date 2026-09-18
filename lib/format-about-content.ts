/** Make the old, single-line dash-separated policy readable without changing stored data. */
export function formatAboutContent(content: string): string {
  const text = content.trim();
  if (text.includes("\n") || !text.startsWith("- ")) return text;

  const sections = text.slice(2).split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  if (sections.length < 2) return text;

  return sections.map((section) => {
    const colon = section.indexOf(":");
    const numbered = section.match(/(?:^|\s)\d+\.\s*/g);
    const heading = section.slice(0, colon + 1).trim();
    if (colon === -1 || !numbered || numbered.length < 1 || !/bảo hành/i.test(heading)) return `- ${section}`;
    const details = section.slice(colon + 1).trim()
      .replace(/(?:^|\s)(\d+)\.\s*/g, "\n$1. ").trim();
    return `### ${heading}\n${details}`;
  }).join("\n\n");
}

export type WarrantyPolicyGroup = {
  kind: "covered" | "excluded";
  title: string;
  content: string;
};

/** Split only clearly labelled warranty sections; leave all other copy untouched. */
export function splitWarrantyContent(content: string): {
  overview: string;
  groups: WarrantyPolicyGroup[];
} {
  const formatted = formatAboutContent(content);
  const overview: string[] = [];
  const groups: Array<WarrantyPolicyGroup & { lines: string[] }> = [];

  for (const line of formatted.split(/\r?\n/)) {
    const title = line.trim()
      .replace(/^#{2,3}\s+/, "")
      .replace(/^\*\*(.*?)\*\*$/, "$1")
      .trim()
      .replace(/:\s*$/, "");
    const isWarrantyHeading = /^(?:(?:các\s+)?(?:trường hợp|tình trạng)\s+)?(?:không\s+được|không|được)\s+bảo\s+hành$/i.test(title);

    if (isWarrantyHeading) {
      groups.push({
        kind: /không\s+(?:được\s+)?bảo\s+hành/i.test(title) ? "excluded" : "covered",
        title,
        content: "",
        lines: [],
      });
    } else if (groups.length) {
      groups[groups.length - 1].lines.push(line);
    } else {
      overview.push(line);
    }
  }

  if (!groups.length) return { overview: formatted, groups: [] };
  return {
    overview: overview.join("\n").trim(),
    groups: groups.map(({ kind, title, lines }) => ({ kind, title, content: lines.join("\n").trim() })),
  };
}
