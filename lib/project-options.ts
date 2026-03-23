export function parseOptionText(value: FormDataEntryValue | string | null | undefined) {
  const raw = typeof value === "string" ? value : value?.toString() ?? "";
  const options = raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return options.length ? options : undefined;
}

export function getProjectOptions(value: unknown, fallback: string[]) {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }

  return fallback;
}

export function stringifyOptions(value: unknown) {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.join("\n");
  }

  return "";
}
