export const uploadFileToIPFS = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({ name: file.name });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({ cidVersion: 0 });
  formData.append('pinataOptions', options);

  try {
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: formData,
    });
    const resData = await res.json();
    return resData.IpfsHash;
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    throw error;
  }
};

/**
 * Returns a robust IPFS URL for a given CID.
 * Uses the primary gateway if set, otherwise falls back to reliable public gateways.
 */
export const getIPFSUrl = (cid: string): string => {
  if (!cid) return "";

  // If the CID is already a full URL, return it
  if (cid.startsWith("http")) return cid;

  // Normalize common ipfs prefixes
  let normalized = cid;
  if (normalized.startsWith("ipfs://")) normalized = normalized.replace(/^ipfs:\/\//, "");
  if (normalized.startsWith("/ipfs/")) normalized = normalized.replace(/^\/ipfs\//, "");

  const customGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY;
  if (customGateway) {
    const cleanGateway = customGateway.replace(/^https?:\/\//, "").replace(/\/ipfs\//, "");
    return `https://${cleanGateway}/ipfs/${normalized}`;
  }

  // Default to Pinata gateway
  return `https://gateway.pinata.cloud/ipfs/${normalized}`;
};
