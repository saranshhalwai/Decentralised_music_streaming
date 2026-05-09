import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("ConcertManager", function () {
  async function deployFixture() {
    const [owner, artist, fan] = await ethers.getSigners();
    const Ticket = await ethers.getContractFactory("TicketNFT");
    const ticket = await Ticket.deploy("Concert Ticket", "CT");
    await ticket.waitForDeployment();

    const Manager = await ethers.getContractFactory("ConcertManager");
    const manager = await Manager.deploy(ticket.target);
    await manager.waitForDeployment();

    // set manager as minter
    await (await ticket.connect(owner).setMinter(manager.target)).wait();

    return { ticket, manager, owner, artist, fan };
  }

  it("should create a concert and allow buying a ticket", async function () {
    const { ticket, manager, artist, fan } = await deployFixture();

    const price = ethers.parseEther("0.01");
    const tx = await manager.connect(artist).createConcert("Live Show", Math.floor(Date.now() / 1000) + 3600, "Venue", price, 2, "ipfs://concert/1");
    await tx.wait();

    // buy ticket
    const buyTx = await manager.connect(fan).buyTicket(1, { value: price });
    await buyTx.wait();

    // token id 1 should exist and be owned by fan
    expect(await ticket.ownerOf(1)).to.equal(fan.address);

    // artist should have pending withdraw
    const pending = await manager.pendingWithdrawals(artist.address);
    expect(pending).to.equal(price);
  });

  it("should let artist update ticket price and withdraw funds", async function () {
    const { ticket, manager, artist, fan } = await deployFixture();
    const price = ethers.parseEther("0.01");
    await (await manager.connect(artist).createConcert("Show 2", Math.floor(Date.now() / 1000) + 3600, "Venue", price, 1, "")).wait();

    // update price
    const newPrice = ethers.parseEther("0.02");
    await (await manager.connect(artist).setTicketPrice(1, newPrice)).wait();

    // buy at new price
    await (await manager.connect(fan).buyTicket(1, { value: newPrice })).wait();

    // withdraw funds
    const before = await ethers.provider.getBalance(artist.address);
    const withdrawTx = await manager.connect(artist).withdraw();
    const receipt = await withdrawTx.wait();
    expect(await manager.pendingWithdrawals(artist.address)).to.equal(0);
  });
});
