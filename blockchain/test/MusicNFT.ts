import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MusicNFT", function () {
  async function deployFixture() {
    const [owner, artist, fan, other] = await ethers.getSigners();

    const MusicRegistry = await ethers.getContractFactory("MusicRegistry");
    const registry = await MusicRegistry.deploy();
    await registry.waitForDeployment();

    const MusicNFT = await ethers.getContractFactory("MusicNFT");
    const nft = await MusicNFT.deploy(await registry.getAddress());
    await nft.waitForDeployment();

    return { nft, registry, owner, artist, fan, other };
  }

  const SAMPLE_URI = "ipfs://QmMetadataHash/metadata.json";
  const DEFAULT_ROYALTY_FEE = 500; // 5%

  async function uploadTrack(registry: any, artist: any) {
    await (await registry.connect(artist).uploadTrack(
      "Sample Track",
      "Artist Name",
      "Genre",
      "QmAudio",
      "QmCover"
    )).wait();
    return 0; // First track ID
  }

  // -------------------------------------------------------------------------
  // Deployment
  // -------------------------------------------------------------------------
  describe("Deployment", function () {
    it("should deploy with correct name and symbol", async function () {
      const { nft } = await deployFixture();
      expect(await nft.name()).to.equal("MusicNFT");
      expect(await nft.symbol()).to.equal("MUSIC");
    });

    it("should set the deployer as owner", async function () {
      const { nft, owner } = await deployFixture();
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("should start with 0 tokens minted", async function () {
      const { nft } = await deployFixture();
      expect(await nft.totalMinted()).to.equal(0);
    });
  });

  // -------------------------------------------------------------------------
  // mintCollectible
  // -------------------------------------------------------------------------
  describe("mintCollectible", function () {
    it("should mint a token and emit CollectibleMinted", async function () {
      const { nft, registry, artist, fan } = await deployFixture();
      const trackId = await uploadTrack(registry, artist);

      await expect(nft.connect(artist).mintCollectible(fan.address, trackId, SAMPLE_URI, artist.address, DEFAULT_ROYALTY_FEE))
        .to.emit(nft, "CollectibleMinted")
        .withArgs(0, trackId, artist.address, SAMPLE_URI);
    });

    it("should assign ownership to the 'to' address", async function () {
      const { nft, registry, artist, fan } = await deployFixture();
      const trackId = await uploadTrack(registry, artist);
      await (await nft.connect(artist).mintCollectible(fan.address, trackId, SAMPLE_URI, artist.address, DEFAULT_ROYALTY_FEE)).wait();
      expect(await nft.ownerOf(0)).to.equal(fan.address);
    });

    it("should set the correct tokenURI", async function () {
      const { nft, registry, artist, fan } = await deployFixture();
      const trackId = await uploadTrack(registry, artist);
      await (await nft.connect(artist).mintCollectible(fan.address, trackId, SAMPLE_URI, artist.address, DEFAULT_ROYALTY_FEE)).wait();
      expect(await nft.tokenURI(0)).to.equal(SAMPLE_URI);
    });

    it("should record collectible metadata correctly", async function () {
      const { nft, registry, artist, fan } = await deployFixture();
      const trackId = await uploadTrack(registry, artist);
      await (await nft.connect(artist).mintCollectible(fan.address, trackId, SAMPLE_URI, artist.address, DEFAULT_ROYALTY_FEE)).wait();

      const collectible = await nft.getCollectible(0);
      expect(collectible.tokenId).to.equal(0);
      expect(collectible.trackId).to.equal(trackId);
      expect(collectible.creator).to.equal(artist.address);
      expect(collectible.metadataURI).to.equal(SAMPLE_URI);
    });

    it("should assign sequential token IDs", async function () {
      const { nft, registry, artist, fan } = await deployFixture();
      const trackId0 = await uploadTrack(registry, artist);
      const trackId1 = await uploadTrack(registry, artist);
      
      await (await nft.connect(artist).mintCollectible(fan.address, trackId0, SAMPLE_URI, artist.address, DEFAULT_ROYALTY_FEE)).wait();
      await (await nft.connect(artist).mintCollectible(fan.address, trackId1, SAMPLE_URI, artist.address, DEFAULT_ROYALTY_FEE)).wait();

      const c0 = await nft.getCollectible(0);
      const c1 = await nft.getCollectible(1);
      expect(c0.tokenId).to.equal(0);
      expect(c1.tokenId).to.equal(1);
    });

    it("should revert with EmptyMetadataURI if metadataURI is empty", async function () {
      const { nft, registry, artist, fan } = await deployFixture();
      const trackId = await uploadTrack(registry, artist);
      await expect(
        nft.connect(artist).mintCollectible(fan.address, trackId, "", artist.address, DEFAULT_ROYALTY_FEE)
      ).to.be.revertedWithCustomError(nft, "EmptyMetadataURI");
    });

    it("should allow minting to oneself", async function () {
      const { nft, registry, artist } = await deployFixture();
      const trackId = await uploadTrack(registry, artist);
      await (await nft.connect(artist).mintCollectible(artist.address, trackId, SAMPLE_URI, artist.address, DEFAULT_ROYALTY_FEE)).wait();
      expect(await nft.ownerOf(0)).to.equal(artist.address);
    });
  });

  // -------------------------------------------------------------------------
  // getCollectible
  // -------------------------------------------------------------------------
  describe("getCollectible", function () {
    it("should revert with TokenNotFound for a non-existent tokenId", async function () {
      const { nft } = await deployFixture();
      await expect(nft.getCollectible(999)).to.be.revertedWithCustomError(nft, "TokenNotFound");
    });
  });

  // -------------------------------------------------------------------------
  // totalMinted
  // -------------------------------------------------------------------------
  describe("totalMinted", function () {
    it("should increase after each mint", async function () {
      const { nft, registry, artist, fan } = await deployFixture();
      const trackId0 = await uploadTrack(registry, artist);
      const trackId1 = await uploadTrack(registry, artist);

      await (await nft.connect(artist).mintCollectible(fan.address, trackId0, SAMPLE_URI, artist.address, DEFAULT_ROYALTY_FEE)).wait();
      expect(await nft.totalMinted()).to.equal(1);

      await (await nft.connect(artist).mintCollectible(fan.address, trackId1, SAMPLE_URI, artist.address, DEFAULT_ROYALTY_FEE)).wait();
      expect(await nft.totalMinted()).to.equal(2);
    });
  });

  // -------------------------------------------------------------------------
  // ERC-721 transfers
  // -------------------------------------------------------------------------
  describe("ERC-721 transfers", function () {
    it("should allow NFT transfer between accounts", async function () {
      const { nft, registry, artist, fan, other } = await deployFixture();
      const trackId = await uploadTrack(registry, artist);
      await (await nft.connect(artist).mintCollectible(fan.address, trackId, SAMPLE_URI, artist.address, DEFAULT_ROYALTY_FEE)).wait();

      await nft.connect(fan).transferFrom(fan.address, other.address, 0);
      expect(await nft.ownerOf(0)).to.equal(other.address);
    });
  });
});
