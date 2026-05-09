// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/MusicRegistry.sol";
import "../contracts/MusicNFT.sol";
import "../contracts/MusicMarketplace.sol";

contract SellerProxy {
    receive() external payable {}
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
    function uploadMintAndApprove(address registryAddr, address nftAddr, address marketplaceAddr) public returns (uint256) {
        MusicRegistry reg = MusicRegistry(registryAddr);
        uint256 trackId = reg.uploadTrack("Title", "Artist", "Genre", "ipfs", "cover");
        MusicNFT nft = MusicNFT(nftAddr);
        nft.mintCollectible(address(this), trackId, "ipfs://meta", address(this), 1000);
        nft.setApprovalForAll(marketplaceAddr, true);
        return trackId;
    }

    function list(address marketplaceAddr, uint256 tokenId, uint256 price) public {
        MusicMarketplace(marketplaceAddr).listNFT(tokenId, price);
    }
}

contract BuyerProxy {
    receive() external payable {}
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
    function buy(address marketplaceAddr, uint256 tokenId) public payable {
        MusicMarketplace(marketplaceAddr).buyNFT{value: msg.value}(tokenId);
    }
}

contract MusicMarketplaceTest {
    receive() external payable {}
    function testListAndBuy() public {
        MusicRegistry reg = new MusicRegistry();
        MusicNFT nft = new MusicNFT(address(reg));
        MusicMarketplace market = new MusicMarketplace(address(nft));

        SellerProxy seller = new SellerProxy();
        // seller uploads a track and mints NFT from its own account
        seller.uploadMintAndApprove(address(reg), address(nft), address(market));

        // list tokenId 0 for 1 ether
        seller.list(address(market), 0, 1 ether);

        BuyerProxy buyer = new BuyerProxy();
        buyer.buy{value: 1 ether}(address(market), 0);

        require(nft.ownerOf(0) == address(buyer), "buyer did not receive token");
    }
}
