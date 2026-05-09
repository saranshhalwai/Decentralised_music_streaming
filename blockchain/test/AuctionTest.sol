// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/TicketNFT.sol";
import "../contracts/Auction.sol";

// Minimal proxy helper to act as different senders in Solidity tests
contract ProxyAccount {
    receive() external payable {}
    fallback() external payable {}

    // Accept ERC721 safe transfers
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function approve(address token, address to, uint256 tokenId) public {
        TicketNFT(token).approve(to, tokenId);
    }

    function createAuction(address auctionAddr, address tokenAddr, uint256 tokenId, uint256 minBid, uint256 duration) public returns (uint256) {
        // Since this call should be made by the token owner (this contract),
        // the token must already be owned by this contract.
        return Auction(auctionAddr).createAuction(tokenAddr, tokenId, minBid, duration);
    }

    function placeBid(address auctionAddr, uint256 auctionId) public payable {
        Auction(auctionAddr).bid{value: msg.value}(auctionId);
    }
}

contract AuctionTest {
    // test core auction flows we can exercise from Solidity (createAuction transfer, bidding, pendingReturns)
    function testAuctionBids() public {
        // deploy contracts
        TicketNFT ticket = new TicketNFT("Concert Ticket", "CT");
        Auction auction = new Auction();

        // make this contract the minter for convenience
        ticket.setMinter(address(this));

        // create seller proxy and mint a ticket to it
        ProxyAccount seller = new ProxyAccount();
        ticket.mintTicket(address(seller), 1, "ipfs://ticket/1");

        // seller approves auction
        seller.approve(address(ticket), address(auction), 1);

        // seller creates auction with a small minBid
        uint256 auctionId = seller.createAuction(address(auction), address(ticket), 1, 1, 1000);

        // token should now be owned by the auction contract
        require(ticket.ownerOf(1) == address(auction), "token not transferred to auction");

        // create bidder proxies
        ProxyAccount bidder1 = new ProxyAccount();
        ProxyAccount bidder2 = new ProxyAccount();

        // bidder1 places a bid (1 wei)
        bidder1.placeBid{value: 1}(address(auction), auctionId);

        ( , , , , address highestBidder1, uint256 highestBid1, , ) = auction.auctions(auctionId);
        require(highestBidder1 == address(bidder1), "highest bidder should be bidder1");
        require(highestBid1 == 1, "highest bid should be 1");

        // bidder2 places a higher bid (2 wei)
        bidder2.placeBid{value: 2}(address(auction), auctionId);

        // previous highest should have pending returns updated
        require(auction.pendingReturns(address(bidder1)) == 1, "pendingReturns for bidder1 should be 1");

        ( , , , , address highestBidder2, uint256 highestBid2, , ) = auction.auctions(auctionId);
        require(highestBidder2 == address(bidder2), "highest bidder should be bidder2");
        require(highestBid2 == 2, "highest bid should be 2");
    }
}
