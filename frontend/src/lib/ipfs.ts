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

export const getIPFSUrl = (cid: string): string | null => {
  if (!cid || cid.length < 10) return null;
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "gateway.pinata.cloud";
  return `https://${gateway}/ipfs/${cid}`;
};
