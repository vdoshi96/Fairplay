import type { PersonaKey } from "../domain/enums";

export function formatPersonaKey(personaKey: PersonaKey): string {
  return personaKey === "alex" ? "Alex" : "Max";
}

export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatOptionalDate(value: string | null | undefined): string {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(value));
}
