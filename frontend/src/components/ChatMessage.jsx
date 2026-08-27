import React from "react";

/**
 * ChatMessage: Formats AI and User chat messages cleanly.
 * Converts markdown-style bold, bullet points, headers, and code blocks into clean React elements.
 */
export default function ChatMessage({ text, isUser }) {
  if (!text) return null;

  if (isUser) {
    return <div className="text-sm leading-relaxed">{text}</div>;
  }

  // Parse lines into structured blocks
  const lines = text.split("\n");
  const elements = [];
  let currentList = [];

  const flushList = (key) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="space-y-1.5 my-2 pl-1">
          {currentList.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <span className="text-route font-bold shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">{formatInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList(index);
      return;
    }

    // Bullet item (- or * or •)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      currentList.push(trimmed.slice(2));
      return;
    }

    // Numbered list item (1. 2. etc.)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      currentList.push(numMatch[2]);
      return;
    }

    // Not a list item -> flush any open list
    flushList(index);

    // Heading (### or ## or #)
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={index} className="font-bold text-sm sm:text-base text-ink dark:text-white mt-2 mb-1">
          {formatInline(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={index} className="font-bold text-base text-ink dark:text-white mt-2 mb-1">
          {formatInline(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={index} className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed my-1">
        {formatInline(trimmed)}
      </p>
    );
  });

  flushList(lines.length);

  return <div className="space-y-1">{elements}</div>;
}

/**
 * Format inline text: **bold**, `code`, *italic*
 */
function formatInline(str) {
  if (!str) return "";

  // Split by bold (**...**) and code (`...`) tokens
  const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] text-slate-900 dark:text-slate-100"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={idx} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
