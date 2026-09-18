import { splitWarrantyContent } from "./format-about-content";

export type WarrantyEditorContent = {
  intro: string;
  highlights: string[];
  coveredNote: string;
  coveredItems: string[];
  excludedNote: string;
  excludedItems: string[];
};

function parseBlock(content: string) {
  const note: string[] = [];
  const items: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
    if (match) items.push(match[1]);
    else if (trimmed) note.push(trimmed);
  }
  return { note: note.join("\n"), items };
}

export function parseWarrantyEditorContent(content: string): WarrantyEditorContent {
  const { overview, groups } = splitWarrantyContent(content);
  const summary = parseBlock(overview);
  const covered = parseBlock(groups.find((group) => group.kind === "covered")?.content ?? "");
  const excluded = parseBlock(groups.find((group) => group.kind === "excluded")?.content ?? "");
  // Old policy text used a standalone “Sản phẩm” heading and one exchange bullet.
  // Map that exact shape to the two cards shown in the current design.
  const oldHeading = /^\*{0,2}sản phẩm\*{0,2}:?$/i.test(summary.note.trim());
  const oldExchange = summary.items.length === 1 && /^hình thức bảo hành\s*:/i.test(summary.items[0]);
  const highlights = oldHeading && oldExchange
    ? ["Bảo hành theo tem trên hộp", summary.items[0].replace(/^hình thức bảo hành\s*:\s*/i, "")]
    : summary.items;
  return {
    intro: oldHeading && oldExchange ? "" : summary.note,
    highlights,
    coveredNote: covered.note,
    coveredItems: covered.items,
    excludedNote: excluded.note,
    excludedItems: excluded.items,
  };
}

export function serializeWarrantyEditorContent(content: WarrantyEditorContent): string {
  const sections: string[] = [];
  const intro = content.intro.trim();
  if (intro) sections.push(intro);
  if (content.highlights.length) sections.push(content.highlights.map((item) => `- ${item.trim()}`).join("\n"));

  for (const group of [
    { title: "Các trường hợp được bảo hành", note: content.coveredNote, items: content.coveredItems },
    { title: "Các trường hợp không được bảo hành", note: content.excludedNote, items: content.excludedItems },
  ]) {
    if (!group.note.trim() && !group.items.length) continue;
    sections.push([
      `### ${group.title}`,
      group.note.trim(),
      group.items.map((item, index) => `${index + 1}. ${item.trim()}`).join("\n"),
    ].filter(Boolean).join("\n\n"));
  }

  return sections.join("\n\n");
}
