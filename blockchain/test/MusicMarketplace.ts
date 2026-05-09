import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MusicMarketplace", function () {
  let musicNFT: any;
  let marketplace: any;
  let owner: any;
  let seller: any;
  let buyer: any;
  const tokenId = 0n;
  const price = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("MusicRegistry");
    const registry = await RegistryFactory.deploy();

    // Upload track as seller
    await registry.connect(seller).uploadTrack("Title", "Artist", "Genre", "ipfs", "cover");

    const MusicNFTFactory = await ethers.getContractFactory("MusicNFT");
    musicNFT = await MusicNFTFactory.deploy(await registry.getAddress());

    const MarketplaceFactory = await ethers.getContractFactory("MusicMarketplace");
    marketplace = await MarketplaceFactory.deploy(await musicNFT.getAddress());

    // Mint an NFT to the seller
    await musicNFT.connect(seller).mintCollectible(seller.address, 0n, "ipfs://test-uri", seller.address, 1000n);
  });

  describe("Deployment", function () {
    it("Should set the correct musicNFT address and fee recipient", async function () {
      expect(await marketplace.musicNFT()).to.equal(await musicNFT.getAddress());
      expect(await marketplace.feeRecipient()).to.equal(owner.address);
      expect(await marketplace.platformFeeBps()).to.equal(250n); // 2.5%
    });
  });

  describe("Listing NFTs", function () {
    it("Should allow the owner to list an NFT", async function () {
      await musicNFT.connect(seller).approve(await marketplace.getAddress(), tokenId);

      await expect(marketplace.connect(seller).listNFT(tokenId, price))
        .to.emit(marketplace, "NFTListed")
        .withArgs(tokenId, seller.address, price);

      const listing = await marketplace.getListing(tokenId);
      expect(listing.tokenId).to.equal(tokenId);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(price);
      expect(listing.active).to.be.true;

      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(1);
      expect(activeListings[0]).to.equal(tokenId);
    });

    it("Should fail to list if not approved", async function () {
      await expect(marketplace.connect(seller).listNFT(tokenId, price))
        .to.be.revertedWith("Not approved");
    });

    it("Should fail to list if not owner", async function () {
      await expect(marketplace.connect(buyer).listNFT(tokenId, price))
        .to.be.revertedWith("Not owner");
    });
  });

  describe("Buying NFTs", function () {
    beforeEach(async function () {
      await musicNFT.connect(seller).approve(await marketplace.getAddress(), tokenId);
      await marketplace.connect(seller).listNFT(tokenId, price);
    });

    it("Should allow a user to buy an active listing", async function () {
      const initialSellerBalance = await ethers.provider.getBalance(seller.address);
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

      await expect(marketplace.connect(buyer).buyNFT(tokenId, { value: price }))
        .to.emit(marketplace, "NFTSold")
        .withArgs(tokenId, buyer.address, price);

      // Check new NFT owner
      expect(await musicNFT.ownerOf(tokenId)).to.equal(buyer.address);

      // Check listing is inactive
      const listing = await marketplace.getListing(tokenId);
      expect(listing.active).to.be.false;

      // Check balances
      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

      const fee = (price * 250n) / 10000n;
      const sellerEarning = price - fee;

      expect(finalOwnerBalance - initialOwnerBalance).to.equal(fee);
      expect(finalSellerBalance - initialSellerBalance).to.equal(sellerEarning);
    });

    it("Should fail to buy if price mismatch", async function () {
      await expect(marketplace.connect(buyer).buyNFT(tokenId, { value: ethers.parseEther("0.5") }))
        .to.be.revertedWith("Price mismatch");
    });

    it("Should fail to buy if not active", async function () {
      await marketplace.connect(seller).cancelListing(tokenId);
      await expect(marketplace.connect(buyer).buyNFT(tokenId, { value: price }))
        .to.be.revertedWith("Not active");
    });
  });

  describe("Managing Listings", function () {
    beforeEach(async function () {
      await musicNFT.connect(seller).approve(await marketplace.getAddress(), tokenId);
      await marketplace.connect(seller).listNFT(tokenId, price);
    });

    it("Should allow seller to cancel listing", async function () {
      await expect(marketplace.connect(seller).cancelListing(tokenId))
        .to.emit(marketplace, "NFTDelisted")
        .withArgs(tokenId);

      const listing = await marketplace.getListing(tokenId);
      expect(listing.active).to.be.false;
    });

    it("Should allow seller to update price", async function () {
      const newPrice = ethers.parseEther("2");
      await expect(marketplace.connect(seller).updatePrice(tokenId, newPrice))
        .to.emit(marketplace, "PriceUpdated")
        .withArgs(tokenId, newPrice);

      const listing = await marketplace.getListing(tokenId);
      expect(listing.price).to.equal(newPrice);
    });

    it("Should fail to cancel if not seller", async function () {
      await expect(marketplace.connect(buyer).cancelListing(tokenId))
        .to.be.revertedWith("Not seller");
    });
  });
});
