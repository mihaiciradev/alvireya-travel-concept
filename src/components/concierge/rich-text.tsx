import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*\n]{1,80}\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={index} className="font-medium text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={index}>{part.replace(/\*\*/g, "")}</Fragment>
    ),
  );
}

export function RichText({ text, caret }: { text: string; caret?: boolean }) {
  const blocks = text.split(/\n{2,}/).filter((block) => block.trim());
  const tail = caret ? <span aria-hidden="true" className="concierge-caret" /> : null;

  if (!blocks.length) return tail;

  return (
    <>
      {blocks.map((block, index) => {
        const last = index === blocks.length - 1;
        const lines = block.split("\n").filter((line) => line.trim());
        if (lines.every((line) => /^\s*[-•]\s+/.test(line))) {
          return (
            <ul key={index} className="mt-3 space-y-1.5 first:mt-0">
              {lines.map((line, item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.6em] h-1 w-3 shrink-0 border-t border-dashed border-sky-deep" />
                  <span>
                    {inline(line.replace(/^\s*[-•]\s+/, ""))}
                    {last && item === lines.length - 1 ? tail : null}
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="mt-3 first:mt-0">
            {lines.map((line, item) => (
              <Fragment key={item}>
                {item > 0 ? <br /> : null}
                {inline(line)}
              </Fragment>
            ))}
            {last ? tail : null}
          </p>
        );
      })}
    </>
  );
}
