import { z } from "zod";

export const SourceSchema = z.object({
  site: z.string().min(1),
  url: z.string().url(),
  version: z.string().min(1),
  date: z.string().min(1),
});

export const PreconditionSchema = z.object({
  kind: z.enum(["time", "stat", "choice", "item"]),
  text: z.string().min(1),
});

const ConsequenceSchema = z.object({
  summary: z.string().optional(),
  statChanges: z.array(z.object({ stat: z.string(), delta: z.number().optional(), text: z.string().optional() })).default([]),
  unlocks: z.array(z.string()).default([]),
  misses: z.array(z.string()).default([]),
  leadsTo: z.enum(["be", "ending"]).optional(),
  endingId: z.string().optional(),
  nextEventIds: z.array(z.string()).default([]),
  saveHint: z.enum(["irreversible", "sl"]).optional(),
  alternatives: z.array(z.object({ summary: z.string(), source: SourceSchema })).default([]),
});

export const OptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  preconditions: z.array(PreconditionSchema).default([]),
  consequence: ConsequenceSchema,
});

export const EventSchema = z.object({
  id: z.string().min(1),
  year: z.number().int().min(1),
  month: z.number().int().min(1).max(12),
  title: z.string().min(1),
  trigger: z.enum(["timed", "chained"]),
  routeIds: z.array(z.string()).default([]),
  preconditions: z.array(PreconditionSchema).default([]),
  options: z.array(OptionSchema),
  sources: z.array(SourceSchema).min(1),
});

export const RouteSchema = z.object({ id: z.string().min(1), name: z.string().min(1) });

export const EndingSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["good", "be", "neutral"]),
  conditions: z.array(z.string()).default([]),
  keyEventIds: z.array(z.string()).default([]),
});

export const GuideFileSchema = z.object({
  routes: z.array(RouteSchema).default([]),
  endings: z.array(EndingSchema).default([]),
  events: z.array(EventSchema).default([]),
});

export type Source = z.infer<typeof SourceSchema>;
export type GuideEvent = z.infer<typeof EventSchema>;
export type GuideOption = z.infer<typeof OptionSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Ending = z.infer<typeof EndingSchema>;
