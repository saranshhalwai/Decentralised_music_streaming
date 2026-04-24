// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MusicNFTMarketplace is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public royaltyFee;
    address public artist; 
    uint256 private _nextTokenId;

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        uint256 price;
        bool currentlyListed;
    }
    
    mapping(uint256 => MarketItem) public marketItems;
    uint256 public totalItems;

    event MarketItemBought(
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price
    );
    event MarketItemRelisted(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    event TokenCreated(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 price
    );

    constructor(
        uint256 _royaltyFee,
        address _artist,
        uint256[] memory _prices
    ) payable ERC721("BeatChain Collection", "BEAT") Ownable(msg.sender) {
        require(
            _prices.length * _royaltyFee <= msg.value,
            "Insufficient ETH for initial royalties"
        );
        royaltyFee = _royaltyFee;
        artist = _artist;
        
        for (uint256 i = 0; i < _prices.length; i++) {
            _createInitialToken(_prices[i]);
        }
    }

    function _createInitialToken(uint256 _price) internal {
        uint256 tokenId = _nextTokenId++;
        _mint(address(this), tokenId);
        marketItems[tokenId] = MarketItem(tokenId, payable(msg.sender), _price, true);
        totalItems++;
    }

    function createToken(string memory _tokenURI, uint256 _price) public payable nonReentrant returns (uint256) {
        require(msg.value >= royaltyFee, "Must pay royalty fee (0.0001 ETH)");
        require(_price > 0, "Price must be at least 1 wei");

        uint256 tokenId = _nextTokenId++;
        _mint(address(this), tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        marketItems[tokenId] = MarketItem(tokenId, payable(msg.sender), _price, true);
        totalItems++;

        emit TokenCreated(tokenId, msg.sender, _price);
        return tokenId;
    }

    function buyToken(uint256 _tokenId) external payable nonReentrant {
        uint256 price = marketItems[_tokenId].price;
        address seller = marketItems[_tokenId].seller;
        
        require(marketItems[_tokenId].currentlyListed, "Item not for sale");
        require(msg.value == price, "Send exact asking price");
        require(seller != msg.sender, "Seller cannot buy own item");

        marketItems[_tokenId].currentlyListed = false;
        marketItems[_tokenId].seller = payable(address(0));
        
        _transfer(address(this), msg.sender, _tokenId);
        
        payable(artist).transfer(royaltyFee);
        payable(seller).transfer(msg.value - royaltyFee);
        
        emit MarketItemBought(_tokenId, seller, msg.sender, price);
    }

    function resellToken(uint256 _tokenId, uint256 _price) external payable nonReentrant {
        require(msg.value == royaltyFee, "Must pay royalty fee");
        require(_price > 0, "Price must be > 0");
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");

        marketItems[_tokenId].price = _price;
        marketItems[_tokenId].seller = payable(msg.sender);
        marketItems[_tokenId].currentlyListed = true;

        _transfer(msg.sender, address(this), _tokenId);
        emit MarketItemRelisted(_tokenId, msg.sender, _price);
    }

    function getAllUnsoldTokens() external view returns (MarketItem[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (marketItems[i].currentlyListed) count++;
        }

        MarketItem[] memory items = new MarketItem[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (marketItems[i].currentlyListed) {
                items[index] = marketItems[i];
                index++;
            }
        }
        return items;
    }

    function getMyTokens() external view returns (MarketItem[] memory) {
        uint256 count = balanceOf(msg.sender);
        MarketItem[] memory items = new MarketItem[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (ownerOf(i) == msg.sender) {
                items[index] = marketItems[i];
                index++;
            }
        }
        return items;
    }
}
