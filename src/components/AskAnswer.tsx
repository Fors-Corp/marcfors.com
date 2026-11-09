import type { ReactNode } from "react";
import Link from "next/link";

import { isAskSourcePath, sourceHref } from "@/lib/rag/sourceHref";
import type { Locale } from "@/lib/locale";

/**
 * Minimal safe Markdown for Ask replies: paragraphs, lists, bold, italic,
 * inline code, https links, and corpus citations (.md + CV PDF). No raw HTML.
 */
const INLINE =
  /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\(https:\/\/[^)\s]+\)|https:\/\/[^\s)]+|cv\/[\w./-]+\.pdf|marc-fors-cv\.pdf|[\w./-]+\.md)/g;

function renderInline(
  text: string,
  keyPrefix: string,
  locale: Locale,
  onSourceNavigate?: () => void,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = new RegExp(INLINE.source, "g");
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0]!;
    const key = `${keyPrefix}-${index++}`;
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("https://")) {
      const href = token.replace(/[.,;:]+$/, "");
      nodes.push(
        <a key={key} href={href} rel="noopener noreferrer" target="_blank">
          {href}
        </a>,
      );
      if (href.length < token.length) nodes.push(token.slice(href.length));
    } else if (isAskSourcePath(token)) {
      nodes.push(
        <Link
          key={key}
          href={sourceHref(token, locale)}
          className="ask-source"
          onClick={onSourceNavigate}
        >
          {token}
        </Link>,
      );
    } else {
      const link = /^\[([^\]]+)\]\((https:\/\/[^)\s]+)\)$/.exec(token);
      if (link) {
        nodes.push(
          <a key={key} href={link[2]} rel="noopener noreferrer" target="_blank">
            {link[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes;
}

function isListItem(line: string): boolean {
  return /^[-*]\s+/.test(line);
}

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] };

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  const blocks: Block[] = [];
  let index = 0;
  while (index < lines.length) {
    const raw = lines[index] ?? "";
    if (raw.trim() === "") {
      index += 1;
      continue;
    }
    if (isListItem(raw.trim())) {
      const items: string[] = [];
      while (index < lines.length) {
        const line = (lines[index] ?? "").trim();
        if (line === "") {
          index += 1;
          continue;
        }
        if (!isListItem(line)) break;
        items.push(line.replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length) {
      const line = lines[index] ?? "";
      if (line.trim() === "") break;
      if (isListItem(line.trim())) break;
      paragraph.push(line);
      index += 1;
    }
    blocks.push({ type: "p", lines: paragraph });
  }
  return blocks;
}

export function AskAnswer({
  text,
  locale = "en",
  onSourceNavigate,
}: {
  text: string;
  locale?: Locale;
  onSourceNavigate?: () => void;
}) {
  const blocks = parseBlocks(text);
  return (
    <div className="ask-answer">
      {blocks.map((block, blockIndex) => {
        if (block.type === "ul") {
          return (
            <ul key={`b-${blockIndex}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`b-${blockIndex}-i-${itemIndex}`}>
                  {renderInline(item, `b${blockIndex}i${itemIndex}`, locale, onSourceNavigate)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`b-${blockIndex}`}>
            {block.lines.map((line, lineIndex) => (
              <span key={`b-${blockIndex}-l-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInline(line, `b${blockIndex}l${lineIndex}`, locale, onSourceNavigate)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
