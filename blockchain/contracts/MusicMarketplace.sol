// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MusicNFT.sol";

contract MusicMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;   // in wei
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    uint256[] private _activeListingIds;
    MusicNFT public musicNFT;
    uint256 public platformFeeBps = 250; // 2.5%
    address public feeRecipient;  // deployer/platform wallet

    event NFTListed(uint256 indexed tokenId, address seller, uint256 price);
    event NFTDelisted(uint256 indexed tokenId);
    event NFTSold(uint256 indexed tokenId, address buyer, uint256 price);
    event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);

    constructor(address _musicNFTAddress) Ownable(msg.sender) {
        musicNFT = MusicNFT(_musicNFTAddress);
        feeRecipient = msg.sender;
    }

    function listNFT(uint256 tokenId, uint256 price) external {
        require(musicNFT.ownerOf(tokenId) == msg.sender, "Not owner");
        require(musicNFT.isApprovedForAll(msg.sender, address(this)) || musicNFT.getApproved(tokenId) == address(this), "Not approved");
        require(price > 0, "Price must be > 0");

        if (!listings[tokenId].active) {
            _activeListingIds.push(tokenId);
        }

        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true
        });

        emit NFTListed(tokenId, msg.sender, price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not active");
        require(listing.seller == msg.sender, "Not seller");

        listing.active = false;
        emit NFTDelisted(tokenId);
    }

    function buyNFT(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not active");
        require(msg.value == listing.price, "Price mismatch");

        listing.active = false;

        uint256 platformFee = (msg.value * platformFeeBps) / 10000;
        uint256 remaining = msg.value - platformFee;

        // Platform fee
        (bool feeSuccess, ) = payable(feeRecipient).call{value: platformFee}("");
        require(feeSuccess, "Fee transfer failed");

        // Transfer remaining to seller
        (bool sellerSuccess, ) = payable(listing.seller).call{value: remaining}("");
        require(sellerSuccess, "Seller transfer failed");

        musicNFT.safeTransferFrom(listing.seller, msg.sender, tokenId);

        emit NFTSold(tokenId, msg.sender, msg.value);
    }

    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not active");
        require(listing.seller == msg.sender, "Not seller");
        require(newPrice > 0, "Price must be > 0");

        listing.price = newPrice;
        emit PriceUpdated(tokenId, newPrice);
    }

    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    function getActiveListings() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _activeListingIds.length; i++) {
            if (listings[_activeListingIds[i]].active) {
                count++;
            }
        }
        
        uint256[] memory activeIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _activeListingIds.length; i++) {
            if (listings[_activeListingIds[i]].active) {
                activeIds[index] = _activeListingIds[i];
                index++;
            }
        }
        return activeIds;
    }
}
