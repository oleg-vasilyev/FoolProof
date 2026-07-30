import { sqliteRepository } from "#shared/repository/sqlite-repository.ts";
import type { Repository } from "#shared/repository/repository-contract.ts";


export const repository: Repository = sqliteRepository;
