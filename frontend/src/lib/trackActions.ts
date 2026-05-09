/**
 * Small helper utilities for track actions (plays / likes)
 * - incrementPlayCountOnChain: attempts to call the MusicRegistry.incrementPlayCount on-chain
 *   (returns true on success, false on failure)
 *
 * These helpers use dynamic imports to avoid bundling heavy web3 code into every page.
 */

export const incrementPlayCountOnChain = async (trackId: string | number): Promise<number | null> => {
  try {
    if (typeof window === "undefined") return null;

    // dynamic import to keep bundles small
    const { getWeb3Provider } = await import("@/lib/web3");
    const { getMusicRegistryContract } = await import("@/lib/contracts");

    const { signer } = await getWeb3Provider();
    const registry = getMusicRegistryContract(signer);

    // Ensure numeric id for BigInt conversion
    let idToUse: bigint;
    try {
      idToUse = BigInt(trackId as any);
    } catch (e) {
      console.warn("incrementPlayCountOnChain: trackId not numeric, skipping on-chain increment", trackId);
      return null;
    }

    const tx = await registry.incrementPlayCount(idToUse);
    await tx.wait();

    // fetch updated playCount
    try {
      const updated = await registry.getTrack(idToUse);
      const raw = (updated as any).playCount ?? 0;
      const playCountNum = raw && typeof raw.toString === 'function' ? Number(raw.toString()) : Number(raw || 0);
      return playCountNum;
    } catch (e) {
      console.warn("Could not fetch updated playCount", e);
      return null;
    }
  } catch (err) {
    console.error("incrementPlayCountOnChain error:", err);
    return null;
  }
};
