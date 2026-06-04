import type { z } from "zod";
import { checkpointSchema } from "./checkpoint-schema.js";

export type Checkpoint = z.infer<typeof checkpointSchema>;
