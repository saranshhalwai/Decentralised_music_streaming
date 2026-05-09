// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/TicketNFT.sol";

contract TicketNFTTest {
    function testSetMinterAndMint() public {
        TicketNFT ticket = new TicketNFT("Concert Ticket", "CT");
        // this contract is owner
        ticket.setMinter(address(this));
        uint256 tokenId = ticket.mintTicket(address(0x1234), 1, "ipfs://ticket/1");
        require(ticket.ownerOf(tokenId) == address(0x1234), "wrong owner");
        require(ticket.ticketToConcert(tokenId) == 1, "wrong mapping");
    }
}
