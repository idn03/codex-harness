import { z } from "zod";

export const checkpointSchema = z.object({
  stage: z.enum([
    "triage",
    "implementation",
    "review",
    "test",
    "validation",
    "archive",
  ]),
  step: z.string().min(1),
  files_touched: z.array(z.string()),
  result: z.enum(["ok", "fail"]),
  next: z.string(),
  cycle: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});
