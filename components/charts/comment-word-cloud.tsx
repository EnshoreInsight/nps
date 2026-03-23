"use client";

const SIZE_CLASSES = {
  1: "text-sm",
  2: "text-base",
  3: "text-lg",
  4: "text-2xl",
  5: "text-3xl",
} as const;

const TONE_CLASSES = [
  "text-teal-700",
  "text-sky-700",
  "text-slate-700",
  "text-amber-700",
  "text-cyan-700",
];

export function CommentWordCloud({
  words,
}: {
  words: Array<{ text: string; count: number; weight: number }>;
}) {
  if (!words.length) {
    return <p className="text-sm text-muted-foreground">No comment themes available yet.</p>;
  }

  return (
    <div className="rounded-[1.75rem] bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.08),transparent_45%),linear-gradient(180deg,#f8fcfd,#eef7f9)] p-6">
      <div className="flex flex-wrap gap-x-4 gap-y-3">
        {words.map((word, index) => (
          <span
            key={word.text}
            className={`font-semibold leading-none ${SIZE_CLASSES[word.weight as keyof typeof SIZE_CLASSES] ?? "text-base"} ${
              TONE_CLASSES[index % TONE_CLASSES.length]
            }`}
            title={`${word.count} mentions`}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
}
