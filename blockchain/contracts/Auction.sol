// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Auction {
    struct AuctionItem {
        address seller;
        address token;
        uint256 tokenId;
        uint256 minBid;
        address highestBidder;
        uint256 highestBid;
        uint256 endAt;
        bool settled;
    }

    uint256 public nextAuctionId;
    mapping(uint256 => AuctionItem) public auctions;
    mapping(address => uint256) public pendingReturns;

    event AuctionCreated(uint256 auctionId, address seller, address token, uint256 tokenId, uint256 minBid, uint256 endAt);
    event BidPlaced(uint256 auctionId, address bidder, uint256 amount);
    event AuctionFinalized(uint256 auctionId, address winner, uint256 amount);
    event Withdrawn(address indexed who, uint256 amount);

    function createAuction(address token, uint256 tokenId, uint256 minBid, uint256 duration) external returns (uint256) {
        require(duration > 0, "Auction: duration>0");
        require(IERC721(token).ownerOf(tokenId) == msg.sender, "Auction: not owner");

        // transfer token to this contract
        IERC721(token).transferFrom(msg.sender, address(this), tokenId);

        uint256 auctionId = nextAuctionId;
        nextAuctionId++;

        auctions[auctionId] = AuctionItem({
            seller: msg.sender,
            token: token,
            tokenId: tokenId,
            minBid: minBid,
            highestBidder: address(0),
            highestBid: 0,
            endAt: block.timestamp + duration,
            settled: false
        });

        emit AuctionCreated(auctionId, msg.sender, token, tokenId, minBid, block.timestamp + duration);
        return auctionId;
    }

    function bid(uint256 auctionId) external payable {
        AuctionItem storage a = auctions[auctionId];
        require(block.timestamp < a.endAt, "Auction: ended");
        uint256 value = msg.value;
        require(value >= a.minBid && value > a.highestBid, "Auction: bid too low");

        if (a.highestBidder != address(0)) {
            pendingReturns[a.highestBidder] += a.highestBid;
        }

        a.highestBid = value;
        a.highestBidder = msg.sender;
        emit BidPlaced(auctionId, msg.sender, value);
    }

    function finalizeAuction(uint256 auctionId) external {
        AuctionItem storage a = auctions[auctionId];
        require(block.timestamp >= a.endAt, "Auction: not ended");
        require(!a.settled, "Auction: settled");
        a.settled = true;

        if (a.highestBidder != address(0)) {
            // transfer token to winner
            IERC721(a.token).transferFrom(address(this), a.highestBidder, a.tokenId);
            // transfer funds to seller; if transfer fails, keep in pendingReturns
            (bool ok, ) = payable(a.seller).call{value: a.highestBid}("");
            if (!ok) {
                pendingReturns[a.seller] += a.highestBid;
            }
            emit AuctionFinalized(auctionId, a.highestBidder, a.highestBid);
        } else {
            // no bids: return token to seller
            IERC721(a.token).transferFrom(address(this), a.seller, a.tokenId);
            emit AuctionFinalized(auctionId, address(0), 0);
        }
    }

    function withdraw() external {
        uint256 amt = pendingReturns[msg.sender];
        require(amt > 0, "Auction: no funds");
        pendingReturns[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: amt}("");
        require(ok, "Auction: withdraw failed");
        emit Withdrawn(msg.sender, amt);
    }
}
