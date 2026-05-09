// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract TicketNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    address public minter;
    mapping(uint256 => uint256) public ticketToConcert;

    event MinterChanged(address indexed oldMinter, address indexed newMinter);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed concertId, address indexed to);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {
        _nextTokenId = 1; // start at 1 for readability
    }

    function setMinter(address _minter) external onlyOwner {
        address old = minter;
        minter = _minter;
        emit MinterChanged(old, _minter);
    }

    function mintTicket(address to, uint256 concertId, string memory tokenURI) external returns (uint256) {
        require(msg.sender == minter, "TicketNFT: not minter");
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        ticketToConcert[tokenId] = concertId;
        emit TicketMinted(tokenId, concertId, to);
        return tokenId;
    }
}
