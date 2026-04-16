import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MusicRegistry", function () {
  async function deployFixture() {
    const [owner, artist1, artist2, fan] = await ethers.getSigners();
    const MusicRegistry = await ethers.getContractFactory("MusicRegistry");
    const registry = await MusicRegistry.deploy();
    await registry.waitForDeployment();
    return { registry, owner, artist1, artist2, fan };
  }

  // -------------------------------------------------------------------------
  // uploadTrack
  // -------------------------------------------------------------------------
  describe("uploadTrack", function () {
    it("should upload a track and emit TrackUploaded event", async function () {
      const { registry, artist1 } = await deployFixture();

      const tx = registry.connect(artist1).uploadTrack(
        "My First Song",
        "DJ Artist",
        "Electronic",
        "QmAudioCID123",
        "QmCoverCID456"
      );

      await expect(tx).to.emit(registry, "TrackUploaded");
    });

    it("should assign sequential IDs starting from 0", async function () {
      const { registry, artist1 } = await deployFixture();

      await (await registry.connect(artist1).uploadTrack("Song A", "Artist", "Pop", "Qm1", "Qm2")).wait();
      await (await registry.connect(artist1).uploadTrack("Song B", "Artist", "Pop", "Qm3", "Qm4")).wait();

      const track0 = await registry.getTrack(0);
      const track1 = await registry.getTrack(1);

      expect(track0.id).to.equal(0);
      expect(track1.id).to.equal(1);
    });

    it("should revert with EmptyField if title is empty", async function () {
      const { registry, artist1 } = await deployFixture();
      await expect(
        registry.connect(artist1).uploadTrack("", "Artist", "Genre", "Qm1", "Qm2")
      ).to.be.revertedWithCustomError(registry, "EmptyField");
    });

    it("should revert with EmptyField if ipfsCID is empty", async function () {
      const { registry, artist1 } = await deployFixture();
      await expect(
        registry.connect(artist1).uploadTrack("Title", "Artist", "Genre", "", "Qm2")
      ).to.be.revertedWithCustomError(registry, "EmptyField");
    });

    it("should revert with EmptyField if coverArtCID is empty", async function () {
      const { registry, artist1 } = await deployFixture();
      await expect(
        registry.connect(artist1).uploadTrack("Title", "Artist", "Genre", "Qm1", "")
      ).to.be.revertedWithCustomError(registry, "EmptyField");
    });

    it("should store the correct artist address", async function () {
      const { registry, artist1 } = await deployFixture();
      await (await registry.connect(artist1).uploadTrack("Track", "Artist", "Jazz", "QmA", "QmB")).wait();
      const track = await registry.getTrack(0);
      expect(track.artist).to.equal(artist1.address);
    });

    it("should store all track fields correctly", async function () {
      const { registry, artist1 } = await deployFixture();
      await (await registry.connect(artist1).uploadTrack("My Song", "The Artist", "Hip-Hop", "QmAudio", "QmCover")).wait();
      const track = await registry.getTrack(0);
      expect(track.title).to.equal("My Song");
      expect(track.artistName).to.equal("The Artist");
      expect(track.genre).to.equal("Hip-Hop");
      expect(track.ipfsCID).to.equal("QmAudio");
      expect(track.coverArtCID).to.equal("QmCover");
      expect(track.playCount).to.equal(0);
    });
  });

  // -------------------------------------------------------------------------
  // getTrack
  // -------------------------------------------------------------------------
  describe("getTrack", function () {
    it("should revert with TrackNotFound for non-existent trackId", async function () {
      const { registry } = await deployFixture();
      await expect(registry.getTrack(999)).to.be.revertedWithCustomError(registry, "TrackNotFound");
    });
  });

  // -------------------------------------------------------------------------
  // getTracksByArtist
  // -------------------------------------------------------------------------
  describe("getTracksByArtist", function () {
    it("should return an empty array for an artist with no tracks", async function () {
      const { registry, artist1 } = await deployFixture();
      const tracks = await registry.getTracksByArtist(artist1.address);
      expect(tracks.length).to.equal(0);
    });

    it("should return all tracks for a specific artist", async function () {
      const { registry, artist1, artist2 } = await deployFixture();

      await (await registry.connect(artist1).uploadTrack("A1 Track 1", "Artist1", "Pop", "Qm1", "Qm2")).wait();
      await (await registry.connect(artist1).uploadTrack("A1 Track 2", "Artist1", "Pop", "Qm3", "Qm4")).wait();
      await (await registry.connect(artist2).uploadTrack("A2 Track 1", "Artist2", "Rock", "Qm5", "Qm6")).wait();

      const artist1Tracks = await registry.getTracksByArtist(artist1.address);
      const artist2Tracks = await registry.getTracksByArtist(artist2.address);

      expect(artist1Tracks.length).to.equal(2);
      expect(artist2Tracks.length).to.equal(1);
      expect(artist2Tracks[0].title).to.equal("A2 Track 1");
    });
  });

  // -------------------------------------------------------------------------
  // incrementPlayCount
  // -------------------------------------------------------------------------
  describe("incrementPlayCount", function () {
    it("should increment play count and emit PlayCountIncremented event", async function () {
      const { registry, artist1, fan } = await deployFixture();
      await (await registry.connect(artist1).uploadTrack("Song", "Artist", "Genre", "Qm1", "Qm2")).wait();

      await expect(registry.connect(fan).incrementPlayCount(0))
        .to.emit(registry, "PlayCountIncremented")
        .withArgs(0, 1);

      const track = await registry.getTrack(0);
      expect(track.playCount).to.equal(1);
    });

    it("should allow multiple play count increments", async function () {
      const { registry, artist1, fan } = await deployFixture();
      await (await registry.connect(artist1).uploadTrack("Song", "Artist", "Genre", "Qm1", "Qm2")).wait();

      await (await registry.connect(fan).incrementPlayCount(0)).wait();
      await (await registry.connect(fan).incrementPlayCount(0)).wait();
      await (await registry.connect(fan).incrementPlayCount(0)).wait();

      const track = await registry.getTrack(0);
      expect(track.playCount).to.equal(3);
    });

    it("should revert with TrackNotFound for non-existent trackId", async function () {
      const { registry, fan } = await deployFixture();
      await expect(
        registry.connect(fan).incrementPlayCount(999)
      ).to.be.revertedWithCustomError(registry, "TrackNotFound");
    });
  });

  // -------------------------------------------------------------------------
  // totalTracks
  // -------------------------------------------------------------------------
  describe("totalTracks", function () {
    it("should return 0 before any uploads", async function () {
      const { registry } = await deployFixture();
      expect(await registry.totalTracks()).to.equal(0);
    });

    it("should return the correct count after uploads", async function () {
      const { registry, artist1 } = await deployFixture();
      await (await registry.connect(artist1).uploadTrack("T1", "A", "G", "Qm1", "Qm2")).wait();
      await (await registry.connect(artist1).uploadTrack("T2", "A", "G", "Qm3", "Qm4")).wait();
      expect(await registry.totalTracks()).to.equal(2);
    });
  });
});
