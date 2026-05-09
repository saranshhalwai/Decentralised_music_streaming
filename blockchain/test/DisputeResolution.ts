import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DisputeResolution", function () {
  let registry: any;
  let beatToken: any;
  let sharedOwnership: any;
  let disputeResolution: any;
  let owner: any;
  let artist: any;
  let claimant: any;
  let voter1: any;
  let voter2: any;
  
  const trackId = 0n;
  const stake = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, artist, claimant, voter1, voter2] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("MusicRegistry");
    registry = await RegistryFactory.deploy();

    const BeatTokenFactory = await ethers.getContractFactory("BeatToken");
    beatToken = await BeatTokenFactory.deploy();

    const SharedOwnershipFactory = await ethers.getContractFactory("SharedOwnership");
    sharedOwnership = await SharedOwnershipFactory.deploy(await registry.getAddress(), owner.address);

    const DisputeResolutionFactory = await ethers.getContractFactory("DisputeResolution");
    disputeResolution = await DisputeResolutionFactory.deploy(
      await registry.getAddress(),
      await beatToken.getAddress(),
      await sharedOwnership.getAddress()
    );

    // Setup privileges
    await registry.setDisputeResolver(await disputeResolution.getAddress());
    await sharedOwnership.setDisputeResolution(await disputeResolution.getAddress());

    // Upload a track
    await registry.connect(artist).uploadTrack("Title", "Artist", "Genre", "ipfs", "cover");

    // Distribute some BeatTokens for voting
    await beatToken.transfer(voter1.address, ethers.parseEther("100"));
    await beatToken.transfer(voter2.address, ethers.parseEther("200"));
    await beatToken.connect(voter1).delegate(voter1.address);
    await beatToken.connect(voter2).delegate(voter2.address);
  });

  describe("Opening Disputes", function () {
    it("Should allow a user to open a dispute with sufficient stake", async function () {
      await expect(disputeResolution.connect(claimant).openDispute(trackId, "ipfs://evidence", { value: stake }))
        .to.emit(disputeResolution, "DisputeOpened")
        .withArgs(0, trackId, claimant.address);

      const dispute = await disputeResolution.getDispute(0);
      expect(dispute.claimant).to.equal(claimant.address);
      expect(dispute.respondent).to.equal(artist.address);
      expect(dispute.status).to.equal(0n); // Open
    });

    it("Should fail if stake is insufficient", async function () {
      await expect(disputeResolution.connect(claimant).openDispute(trackId, "ipfs://evidence", { value: ethers.parseEther("0.005") }))
        .to.be.revertedWith("Insufficient stake");
    });

    it("Should fail if artist disputes their own track", async function () {
      await expect(disputeResolution.connect(artist).openDispute(trackId, "ipfs://evidence", { value: stake }))
        .to.be.revertedWith("Cannot dispute own track");
    });
  });

  describe("Submitting Evidence", function () {
    beforeEach(async function () {
      await disputeResolution.connect(claimant).openDispute(trackId, "ipfs://evidence", { value: stake });
    });

    it("Should allow respondent to submit evidence", async function () {
      await expect(disputeResolution.connect(artist).submitRespondentEvidence(0, "ipfs://evidence-resp"))
        .to.emit(disputeResolution, "EvidenceSubmitted")
        .withArgs(0, artist.address, "ipfs://evidence-resp");

      const dispute = await disputeResolution.getDispute(0);
      expect(dispute.evidenceCIDRespondent).to.equal("ipfs://evidence-resp");
    });

    it("Should fail if not respondent", async function () {
      await expect(disputeResolution.connect(claimant).submitRespondentEvidence(0, "ipfs://evidence-resp"))
        .to.be.revertedWith("Only respondent can submit");
    });
  });

  describe("Voting and Resolution", function () {
    beforeEach(async function () {
      await disputeResolution.connect(claimant).openDispute(trackId, "ipfs://evidence", { value: stake });
    });

    it("Should allow voters to cast votes", async function () {
      await expect(disputeResolution.connect(voter1).castVote(0, true)) // vote for claimant
        .to.emit(disputeResolution, "VoteCast")
        .withArgs(0, voter1.address, true, ethers.parseEther("100"));

      await expect(disputeResolution.connect(voter2).castVote(0, false)) // vote for respondent
        .to.emit(disputeResolution, "VoteCast")
        .withArgs(0, voter2.address, false, ethers.parseEther("200"));
    });

    it("Should resolve in favor of claimant when they have more votes", async function () {
      await disputeResolution.connect(voter2).castVote(0, true); // 200 votes for claimant

      // Fast forward time 3 days
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const initialClaimantBalance = await ethers.provider.getBalance(claimant.address);

      await expect(disputeResolution.resolveDispute(0))
        .to.emit(disputeResolution, "DisputeResolved")
        .withArgs(0, claimant.address, 1n); // 1 = Resolved (Claimant won)

      // Track ownership should be transferred
      const track = await registry.getTrack(trackId);
      expect(track.artist).to.equal(claimant.address);

      // Claimant should get stake back (minus gas, but we check balance approx or event)
      // We will just check if they got refunded
      const finalClaimantBalance = await ethers.provider.getBalance(claimant.address);
      expect(finalClaimantBalance > initialClaimantBalance).to.be.true;
    });

    it("Should resolve in favor of respondent on tie or when they have more votes", async function () {
      await disputeResolution.connect(voter1).castVote(0, true); // 100 for claimant
      await disputeResolution.connect(voter2).castVote(0, false); // 200 for respondent

      // Fast forward time 3 days
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const initialArtistBalance = await ethers.provider.getBalance(artist.address);

      await expect(disputeResolution.resolveDispute(0))
        .to.emit(disputeResolution, "DisputeResolved")
        .withArgs(0, artist.address, 2n); // 2 = Rejected (Respondent won)

      // Track ownership remains the same
      const track = await registry.getTrack(trackId);
      expect(track.artist).to.equal(artist.address);

      // Respondent gets the stake
      const finalArtistBalance = await ethers.provider.getBalance(artist.address);
      expect(finalArtistBalance > initialArtistBalance).to.be.true;
    });

    it("Should fail to resolve before deadline", async function () {
      await expect(disputeResolution.resolveDispute(0))
        .to.be.revertedWith("Voting active");
    });
  });
});
