import { z } from "zod";

export const triageSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]),
  signals: z.array(
    z.enum([
      "needs_new_files",
      "touches_auth",
      "touches_schema",
      "irreversible",
      "ambiguous_intent",
      "deny_path_risk",
    ]),
  ),
  route: z.enum(["single_agent", "planner_worker", "full_team"]),
  est_checkpoints: z.number().int().positive(),
  spec_required: z.boolean(),
  notes: z.string(),
});
