// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MusicNFT
/// @notice ERC-721 collectibles linked to tracks on the MusicRegistry.
///         Any artist can mint a collectible for one of their tracks.
///         Token metadata (name, image, audio snippet, etc.) is stored on IPFS.
contract MusicNFT is ERC721URIStorage, Ownable {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    uint256 private _nextTokenId;

    struct Collectible {
        uint256 tokenId;
        uint256 trackId;       // links back to MusicRegistry trackId
        address creator;       // the artist who minted it
        string metadataURI;    // IPFS URI of the JSON metadata
        uint256 mintedAt;
    }

    /// tokenId => Collectible info
    mapping(uint256 => Collectible) private _collectibles;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event CollectibleMinted(
        uint256 indexed tokenId,
        uint256 indexed trackId,
        address indexed creator,
        string metadataURI
    );

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error EmptyMetadataURI();
    error TokenNotFound(uint256 tokenId);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() ERC721("MusicNFT", "MUSIC") Ownable(msg.sender) {}

    // -------------------------------------------------------------------------
    // Mutating functions
    // -------------------------------------------------------------------------

    /// @notice Mint a new collectible NFT tied to a specific track.
    /// @param to           The address that will receive the NFT.
    /// @param trackId      The MusicRegistry track this collectible belongs to.
    /// @param metadataURI  IPFS URI pointing to the JSON metadata file.
    /// @return tokenId     The newly minted token's ID.
    function mintCollectible(
        address to,
        uint256 trackId,
        string calldata metadataURI
    ) external returns (uint256 tokenId) {
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        _collectibles[tokenId] = Collectible({
            tokenId: tokenId,
            trackId: trackId,
            creator: msg.sender,
            metadataURI: metadataURI,
            mintedAt: block.timestamp
        });

        emit CollectibleMinted(tokenId, trackId, msg.sender, metadataURI);
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    /// @notice Get the full Collectible metadata for a token.
    function getCollectible(uint256 tokenId) external view returns (Collectible memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenNotFound(tokenId);
        return _collectibles[tokenId];
    }

    /// @notice Total number of NFTs ever minted.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }
}
