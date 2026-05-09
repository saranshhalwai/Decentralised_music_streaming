// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/MusicRegistry.sol";
import "../contracts/MusicNFT.sol";

contract ArtistProxy {
    function doUploadTrack(address registryAddr) public returns (uint256) {
        MusicRegistry reg = MusicRegistry(registryAddr);
        return reg.uploadTrack("Sample Track", "Artist Name", "Genre", "QmAudio", "QmCover");
    }

    function doMint(address nftAddr, address to, uint256 trackId, string memory uri, address royaltyReceiver) public returns (uint256) {
        MusicNFT nft = MusicNFT(nftAddr);
        return nft.mintCollectible(to, trackId, uri, royaltyReceiver, 500);
    }
}

contract MusicNFTTest {
    function testMintCollectible() public {
        MusicRegistry reg = new MusicRegistry();
        MusicNFT nft = new MusicNFT(address(reg));

        ArtistProxy artist = new ArtistProxy();
        uint256 trackId = artist.doUploadTrack(address(reg));

        uint256 tokenId = artist.doMint(address(nft), address(0x1234), trackId, "ipfs://meta.json", address(artist));
        require(nft.ownerOf(tokenId) == address(0x1234), "owner wrong");
        require(keccak256(bytes(nft.tokenURI(tokenId))) == keccak256(bytes("ipfs://meta.json")), "tokenURI wrong");
    }

    function testTotalMinted() public {
        MusicRegistry reg = new MusicRegistry();
        MusicNFT nft = new MusicNFT(address(reg));
        ArtistProxy artist = new ArtistProxy();

        uint256 trackId = artist.doUploadTrack(address(reg));
        artist.doMint(address(nft), address(0x1), trackId, "ipfs://meta1", address(artist));
        artist.doMint(address(nft), address(0x2), trackId, "ipfs://meta2", address(artist));
        require(nft.totalMinted() == 2, "totalMinted wrong");
    }
}
