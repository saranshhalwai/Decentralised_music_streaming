import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Payment", function () {
  async function deployFixture() {
    const [owner, artist, fan, other] = await ethers.getSigners();
    const Payment = await ethers.getContractFactory("Payment");
    const payment = await Payment.deploy();
    await payment.waitForDeployment();
    const ONE_ETH = ethers.parseEther("1.0");
    const HALF_ETH = ethers.parseEther("0.5");
    return { payment, owner, artist, fan, other, ONE_ETH, HALF_ETH };
  }

  // -------------------------------------------------------------------------
  // tipArtist
  // -------------------------------------------------------------------------
  describe("tipArtist", function () {
    it("should credit artist earnings and emit TipReceived", async function () {
      const { payment, artist, fan, ONE_ETH } = await deployFixture();

      await expect(
        payment.connect(fan).tipArtist(artist.address, { value: ONE_ETH })
      )
        .to.emit(payment, "TipReceived")
        .withArgs(fan.address, artist.address, ONE_ETH);

      expect(await payment.earningsOf(artist.address)).to.equal(ONE_ETH);
    });

    it("should accumulate tips from multiple fans", async function () {
      const { payment, artist, fan, other, ONE_ETH, HALF_ETH } = await deployFixture();

      await payment.connect(fan).tipArtist(artist.address, { value: ONE_ETH });
      await payment.connect(other).tipArtist(artist.address, { value: HALF_ETH });

      const total = ONE_ETH + HALF_ETH;
      expect(await payment.earningsOf(artist.address)).to.equal(total);
    });

    it("should revert with ZeroValue when msg.value is 0", async function () {
      const { payment, artist, fan } = await deployFixture();
      await expect(
        payment.connect(fan).tipArtist(artist.address, { value: 0 })
      ).to.be.revertedWithCustomError(payment, "ZeroValue");
    });

    it("should revert with ZeroAddress when artist is zero address", async function () {
      const { payment, fan, ONE_ETH } = await deployFixture();
      await expect(
        payment.connect(fan).tipArtist(ethers.ZeroAddress, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(payment, "ZeroAddress");
    });
  });

  // -------------------------------------------------------------------------
  // streamPayment
  // -------------------------------------------------------------------------
  describe("streamPayment", function () {
    it("should credit artist and emit StreamPayment", async function () {
      const { payment, artist, fan } = await deployFixture();
      const streamFee = ethers.parseEther("0.001");

      await expect(
        payment.connect(fan).streamPayment(42, artist.address, { value: streamFee })
      )
        .to.emit(payment, "StreamPayment")
        .withArgs(fan.address, 42, artist.address, streamFee);

      expect(await payment.earningsOf(artist.address)).to.equal(streamFee);
    });

    it("should revert with ZeroValue when msg.value is 0", async function () {
      const { payment, artist, fan } = await deployFixture();
      await expect(
        payment.connect(fan).streamPayment(0, artist.address, { value: 0 })
      ).to.be.revertedWithCustomError(payment, "ZeroValue");
    });

    it("should revert with ZeroAddress when artist is zero address", async function () {
      const { payment, fan, ONE_ETH } = await deployFixture();
      await expect(
        payment.connect(fan).streamPayment(0, ethers.ZeroAddress, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(payment, "ZeroAddress");
    });
  });

  // -------------------------------------------------------------------------
  // withdrawEarnings
  // -------------------------------------------------------------------------
  describe("withdrawEarnings", function () {
    it("should transfer accumulated earnings to artist and emit event", async function () {
      const { payment, artist, fan, ONE_ETH } = await deployFixture();

      await payment.connect(fan).tipArtist(artist.address, { value: ONE_ETH });

      const balanceBefore = await ethers.provider.getBalance(artist.address);

      const tx = await payment.connect(artist).withdrawEarnings();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(artist.address);

      // Artist receives exactly ONE_ETH minus gas costs
      expect(balanceAfter).to.equal(balanceBefore + ONE_ETH - gasUsed);
    });

    it("should zero out earnings after withdrawal", async function () {
      const { payment, artist, fan, ONE_ETH } = await deployFixture();

      await payment.connect(fan).tipArtist(artist.address, { value: ONE_ETH });
      await payment.connect(artist).withdrawEarnings();

      expect(await payment.earningsOf(artist.address)).to.equal(0);
    });

    it("should emit EarningsWithdrawn event", async function () {
      const { payment, artist, fan, ONE_ETH } = await deployFixture();
      await payment.connect(fan).tipArtist(artist.address, { value: ONE_ETH });

      await expect(payment.connect(artist).withdrawEarnings())
        .to.emit(payment, "EarningsWithdrawn")
        .withArgs(artist.address, ONE_ETH);
    });

    it("should revert with NoEarnings if balance is zero", async function () {
      const { payment, artist } = await deployFixture();
      await expect(
        payment.connect(artist).withdrawEarnings()
      ).to.be.revertedWithCustomError(payment, "NoEarnings");
    });

    it("should not allow double withdrawal", async function () {
      const { payment, artist, fan, ONE_ETH } = await deployFixture();
      await payment.connect(fan).tipArtist(artist.address, { value: ONE_ETH });
      await payment.connect(artist).withdrawEarnings();

      await expect(
        payment.connect(artist).withdrawEarnings()
      ).to.be.revertedWithCustomError(payment, "NoEarnings");
    });
  });

  // -------------------------------------------------------------------------
  // earningsOf
  // -------------------------------------------------------------------------
  describe("earningsOf", function () {
    it("should return 0 for an artist with no tips", async function () {
      const { payment, artist } = await deployFixture();
      expect(await payment.earningsOf(artist.address)).to.equal(0);
    });
  });
});
