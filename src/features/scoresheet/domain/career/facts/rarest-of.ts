export interface Rare<Fact> {
  readonly fact: Fact;
  readonly tail: number;
}

const outranks = <Fact,>(challenger: Rare<Fact>, holder: Rare<Fact>): boolean =>
  challenger.tail < holder.tail;

export const rarestOf = <Fact,>(field: readonly Rare<Fact>[]): Rare<Fact> | null =>
  field.reduce<Rare<Fact> | null>(
    (holder, challenger) =>
      holder === null || outranks(challenger, holder) ? challenger : holder,
    null
  );
