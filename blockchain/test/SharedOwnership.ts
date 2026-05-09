import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("SharedOwnership", function () {
  let registry: any;
  let sharedOwnership: any;
  let owner: any;
  let artist: any;
  let collaborator1: any;
  let collaborator2: any;
  let disputeResolver: any;
  const trackId = 0n;

  beforeEach(async function () {
    [owner, artist, collaborator1, collaborator2, disputeResolver] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("MusicRegistry");
    registry = await RegistryFactory.deploy();

    const SharedOwnershipFactory = await ethers.getContractFactory("SharedOwnership");
    // Passing a dummy address for paymentContract for now
    sharedOwnership = await SharedOwnershipFactory.deploy(await registry.getAddress(), owner.address);

    await sharedOwnership.setDisputeResolution(disputeResolver.address);

    // Upload a track
    await registry.connect(artist).uploadTrack("Title", "Artist", "Genre", "ipfs", "cover");
  });

  describe("Setting Shares", function () {
    it("Should allow the track owner to set shares", async function () {
      const shareholders = [artist.address, collaborator1.address];
      const basisPoints = [8000n, 2000n]; // 80% and 20%

      await expect(sharedOwnership.connect(artist).setShares(trackId, shareholders, basisPoints))
        .to.emit(sharedOwnership, "SharesConfigured")
        .withArgs(trackId, shareholders, basisPoints);

      const [retrievedShareholders, retrievedBasisPoints] = await sharedOwnership.getShares(trackId);
      expect(retrievedShareholders).to.deep.equal(shareholders);
      expect(retrievedBasisPoints).to.deep.equal(basisPoints);
      expect(await sharedOwnership.hasShares(trackId)).to.be.true;
    });

    it("Should fail if not track owner", async function () {
      await expect(sharedOwnership.connect(collaborator1).setShares(trackId, [artist.address], [10000n]))
        .to.be.revertedWithCustomError(sharedOwnership, "NotTrackOwner");
    });

    it("Should fail if basis points do not sum to 10000", async function () {
      await expect(sharedOwnership.connect(artist).setShares(trackId, [artist.address], [9000n]))
        .to.be.revertedWithCustomError(sharedOwnership, "InvalidBasisPointsSum");
    });

    it("Should fail if lengths mismatch", async function () {
      await expect(sharedOwnership.connect(artist).setShares(trackId, [artist.address, collaborator1.address], [10000n]))
        .to.be.revertedWithCustomError(sharedOwnership, "ArrayLengthMismatch");
    });
  });

  describe("Distributing Revenue", function () {
    beforeEach(async function () {
      const shareholders = [artist.address, collaborator1.address, collaborator2.address];
      const basisPoints = [5000n, 3000n, 2000n]; // 50%, 30%, 20%
      await sharedOwnership.connect(artist).setShares(trackId, shareholders, basisPoints);
    });

    it("Should correctly distribute revenue based on shares", async function () {
      const amount = ethers.parseEther("1");

      const initialArtistBalance = await ethers.provider.getBalance(artist.address);
      const initialCollab1Balance = await ethers.provider.getBalance(collaborator1.address);
      const initialCollab2Balance = await ethers.provider.getBalance(collaborator2.address);

      await expect(sharedOwnership.distributeRevenue(trackId, { value: amount }))
        .to.emit(sharedOwnership, "RevenueDistributed")
        .withArgs(trackId, amount);

      const finalArtistBalance = await ethers.provider.getBalance(artist.address);
      const finalCollab1Balance = await ethers.provider.getBalance(collaborator1.address);
      const finalCollab2Balance = await ethers.provider.getBalance(collaborator2.address);

      expect(finalArtistBalance - initialArtistBalance).to.equal(ethers.parseEther("0.5"));
      expect(finalCollab1Balance - initialCollab1Balance).to.equal(ethers.parseEther("0.3"));
      expect(finalCollab2Balance - initialCollab2Balance).to.equal(ethers.parseEther("0.2"));
    });
  });

  describe("Clearing Shares", function () {
    beforeEach(async function () {
      const shareholders = [artist.address, collaborator1.address];
      const basisPoints = [8000n, 2000n];
      await sharedOwnership.connect(artist).setShares(trackId, shareholders, basisPoints);
    });

    it("Should allow the dispute resolver to clear shares", async function () {
      await expect(sharedOwnership.connect(disputeResolver).clearShares(trackId))
        .to.emit(sharedOwnership, "SharesCleared")
        .withArgs(trackId);

      const [retrievedShareholders] = await sharedOwnership.getShares(trackId);
      expect(retrievedShareholders.length).to.equal(0);
      expect(await sharedOwnership.hasShares(trackId)).to.be.false;
    });

    it("Should fail to clear if not dispute resolver", async function () {
      await expect(sharedOwnership.connect(owner).clearShares(trackId))
        .to.be.revertedWithCustomError(sharedOwnership, "Unauthorized");
    });
  });
});
