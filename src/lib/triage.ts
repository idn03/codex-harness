import type { z } from "zod";
import { triageSchema } from "./triage-schema.js";

export type Triage = z.infer<typeof triageSchema>;
