import { sqliteRepository } from "./sqlite.ts";
import type { Repository } from "./types.ts";


export const repository: Repository = sqliteRepository;
