import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("TicketNFT", function () {
  async function deployFixture() {
    const [owner, minter, buyer] = await ethers.getSigners();
    const Ticket = await ethers.getContractFactory("TicketNFT");
    const ticket = await Ticket.deploy("Concert Ticket", "CT");
    await ticket.waitForDeployment();
    return { ticket, owner, minter, buyer };
  }

  it("should allow setting a minter and mint tickets", async function () {
    const { ticket, owner, minter, buyer } = await deployFixture();

    await (await ticket.connect(owner).setMinter(minter.address)).wait();
    const tx = await ticket.connect(minter).mintTicket(buyer.address, 1, "ipfs://ticket/1");
    await tx.wait();

    expect(await ticket.ownerOf(1)).to.equal(buyer.address);
    expect(await ticket.ticketToConcert(1)).to.equal(1);
  });
});
