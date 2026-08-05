const CLAIMED = Symbol.for("foolproof.e2e.world");

interface Claims {
  [CLAIMED]?: Set<number>;
}

// `isolate: false` in the e2e config is load-bearing: it is what lets one world
// outlive the scenario file that built it. Turn isolation on and this module is
// evaluated again for the next file, in the same worker process — so a claim kept
// on the realm's global outlives the module registry and catches exactly that.
const realm = globalThis as unknown as Claims;

export const claimWorld = (port: number, host: Claims = realm): void => {
  const claimed = (host[CLAIMED] ??= new Set<number>());

  if (claimed.has(port)) {
    throw new Error(
      `a second world wanted port ${String(port)} in one worker — ` +
        `\`isolate\` must stay false in the e2e config, or every scenario file ` +
        `starts a fresh chat and races the last one for its port`
    );
  }

  claimed.add(port);
};

export const forgetClaims = (host: Claims = realm): void => {
  host[CLAIMED]?.clear();
};
