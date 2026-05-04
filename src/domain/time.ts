import { z } from "zod";

export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export const NullableIsoDateTimeSchema = IsoDateTimeSchema.nullable();
export const TimezoneSchema = z.string().min(1).max(100);

export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;
export type Timezone = z.infer<typeof TimezoneSchema>;

export function nowIsoDateTime(): IsoDateTime {
  return new Date().toISOString();
}
