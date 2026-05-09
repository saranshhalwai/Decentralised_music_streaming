import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Auction", function () {
  async function deployFixture() {
    const [owner, seller, bidder1, bidder2] = await ethers.getSigners();
    const Ticket = await ethers.getContractFactory("TicketNFT");
    const ticket = await Ticket.deploy("Concert Ticket", "CT");
    await ticket.waitForDeployment();

    // mint a ticket to seller by making owner the minter temporarily
    await (await ticket.connect(owner).setMinter(owner.address)).wait();
    await (await ticket.connect(owner).mintTicket(seller.address, 1, "ipfs://ticket/1")).wait();

    const Auction = await ethers.getContractFactory("Auction");
    const auction = await Auction.deploy();
    await auction.waitForDeployment();

    return { ticket, auction, owner, seller, bidder1, bidder2 };
  }

  it("should run a simple auction lifecycle", async function () {
    const { ticket, auction, seller, bidder1, bidder2 } = await deployFixture();

    // seller approves auction
    const tokenId = 1;
    await (await ticket.connect(seller).approve(auction.target, tokenId)).wait();

    // create auction with 60s duration
    const tx = await auction.connect(seller).createAuction(ticket.target, tokenId, ethers.parseEther("0.01"), 60);
    await tx.wait();

    // bidders place bids
    await (await auction.connect(bidder1).bid(0, { value: ethers.parseEther("0.02") })).wait();
    await (await auction.connect(bidder2).bid(0, { value: ethers.parseEther("0.03") })).wait();

    // fast-forward time
    await ethers.provider.send("evm_increaseTime", [70]);
    await ethers.provider.send("evm_mine");

    // finalize
    await (await auction.connect(bidder1).finalizeAuction(0)).wait();

    // token should belong to bidder2
    expect(await ticket.ownerOf(tokenId)).to.equal(bidder2.address);
  });
});
