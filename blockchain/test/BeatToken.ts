import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("BeatToken", function () {
  let beatToken: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const BeatTokenFactory = await ethers.getContractFactory("BeatToken");
    beatToken = await BeatTokenFactory.deploy();
  });

  describe("Deployment", function () {
    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await beatToken.balanceOf(owner.address);
      const decimals = await beatToken.decimals();
      const expectedSupply = ethers.parseUnits("1000000", decimals);
      expect(await beatToken.totalSupply()).to.equal(expectedSupply);
      expect(ownerBalance).to.equal(expectedSupply);
    });

    it("Should set the correct token name and symbol", async function () {
      expect(await beatToken.name()).to.equal("BeatToken");
      expect(await beatToken.symbol()).to.equal("BEAT");
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint more tokens", async function () {
      const decimals = await beatToken.decimals();
      const mintAmount = ethers.parseUnits("100", decimals);
      await expect(beatToken.connect(owner).mint(addr1.address, mintAmount))
        .to.emit(beatToken, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, mintAmount);
      
      const addr1Balance = await beatToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(mintAmount);
    });

    it("Should not allow non-owners to mint tokens", async function () {
      const decimals = await beatToken.decimals();
      const mintAmount = ethers.parseUnits("100", decimals);
      await expect(beatToken.connect(addr1).mint(addr2.address, mintAmount))
        .to.be.revertedWithCustomError(beatToken, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });
  });

  describe("Voting", function () {
    it("Should allow users to delegate and have voting power", async function () {
      const decimals = await beatToken.decimals();
      const transferAmount = ethers.parseUnits("100", decimals);

      // Transfer some tokens to addr1
      await beatToken.transfer(addr1.address, transferAmount);

      // Addr1 should have 0 votes initially before delegating
      expect(await beatToken.getVotes(addr1.address)).to.equal(0n);

      // Addr1 delegates to themselves
      await beatToken.connect(addr1).delegate(addr1.address);

      // Now addr1 should have voting power equal to their balance
      expect(await beatToken.getVotes(addr1.address)).to.equal(transferAmount);
    });
  });
});
