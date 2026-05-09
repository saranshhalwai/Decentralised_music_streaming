// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/TicketNFT.sol";
import "../contracts/ConcertManager.sol";

contract ArtistProxy {
    function createConcert(address mgrAddr) public returns (uint256) {
        ConcertManager mgr = ConcertManager(mgrAddr);
        return mgr.createConcert("Live Show", block.timestamp + 3600, "Venue", 1 ether, 2, "ipfs://concert/1");
    }
}

contract BuyerProxy {
    receive() external payable {}
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
    function buy(address mgrAddr, uint256 concertId) public payable returns (uint256) {
        ConcertManager mgr = ConcertManager(mgrAddr);
        return mgr.buyTicket{value: msg.value}(concertId);
    }
}

contract ConcertManagerTest {
    function testCreateAndBuyTicket() public {
        TicketNFT ticket = new TicketNFT("Concert Ticket", "CT");
        ConcertManager mgr = new ConcertManager(address(ticket));
        // set manager as minter
        ticket.setMinter(address(mgr));

        ArtistProxy artist = new ArtistProxy();
        uint256 concertId = artist.createConcert(address(mgr));

        BuyerProxy buyer = new BuyerProxy();
        // buy ticket: forward 1 ether from this test call
        uint256 tokenId = buyer.buy{value: 1 ether}(address(mgr), concertId);

        // token should be owned by buyer contract
        TicketNFT t = ticket;
        require(t.ownerOf(tokenId) == address(buyer), "token not owned by buyer");
    }
}
