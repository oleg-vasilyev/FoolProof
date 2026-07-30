import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";


type RepositoryInstanceModule = typeof import("#shared/repository/repository-instance.ts");

export class RepositoryInstanceStub {
  public readonly stub = new RepositoryStub();

  public readonly module: RepositoryInstanceModule;

  public constructor() {
    this.module = { repository: this.stub };
  }
}
