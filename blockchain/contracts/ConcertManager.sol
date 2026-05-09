// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface ITicketNFT {
    function mintTicket(address to, uint256 concertId, string calldata tokenURI) external returns (uint256);
}

contract ConcertManager is Ownable {
    using Strings for uint256;

    ITicketNFT public ticketContract;
    uint256 private _nextConcertId;

    struct Concert {
        uint256 id;
        address artist;
        string title;
        uint256 date;
        string location;
        uint256 price; // in wei
        uint256 totalTickets;
        uint256 ticketsSold;
        string baseURI;
        bool exists;
    }

    struct Notification {
        uint256 id;
        uint256 concertId;
        address buyer;
        uint256 timestamp;
        bool read;
    }

    mapping(uint256 => Concert) public concerts;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(address => Notification[]) public artistNotifications;

    event ConcertCreated(uint256 indexed concertId, address indexed artist, string title, uint256 date, string location, uint256 price, uint256 totalTickets, string baseURI);
    event TicketPurchased(uint256 indexed concertId, uint256 indexed tokenId, address indexed buyer, uint256 price);
    event TicketPriceUpdated(uint256 indexed concertId, uint256 oldPrice, uint256 newPrice);
    event Withdraw(address indexed to, uint256 amount);
    event NotificationCreated(address indexed artist, uint256 indexed concertId, address indexed buyer);

    constructor(address ticketAddress) Ownable(msg.sender) {
        ticketContract = ITicketNFT(ticketAddress);
        _nextConcertId = 1;
    }

    function setTicketContract(address ticketAddress) external onlyOwner {
        ticketContract = ITicketNFT(ticketAddress);
    }

    function createConcert(
        string calldata title,
        uint256 date,
        string calldata location,
        uint256 price,
        uint256 totalTickets,
        string calldata baseURI
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Concert: title required");
        require(totalTickets > 0, "Concert: totalTickets>0");

        uint256 concertId = _nextConcertId;
        _nextConcertId++;

        concerts[concertId] = Concert({
            id: concertId,
            artist: msg.sender,
            title: title,
            date: date,
            location: location,
            price: price,
            totalTickets: totalTickets,
            ticketsSold: 0,
            baseURI: baseURI,
            exists: true
        });

        emit ConcertCreated(concertId, msg.sender, title, date, location, price, totalTickets, baseURI);
        return concertId;
    }

    function setTicketPrice(uint256 concertId, uint256 newPrice) external {
        Concert storage c = concerts[concertId];
        require(c.exists, "Concert: not found");
        require(c.artist == msg.sender, "Concert: only artist");
        uint256 old = c.price;
        c.price = newPrice;
        emit TicketPriceUpdated(concertId, old, newPrice);
    }

    function buyTicket(uint256 concertId) external payable returns (uint256) {
        Concert storage c = concerts[concertId];
        require(c.exists, "Concert: not found");
        require(c.ticketsSold < c.totalTickets, "Concert: sold out");
        require(msg.value >= c.price, "Concert: insufficient payment");

        uint256 tokenNumber = c.ticketsSold + 1;
        string memory tokenURI = bytes(c.baseURI).length > 0 ? string(abi.encodePacked(c.baseURI, "/", tokenNumber.toString())) : "";

        uint256 tokenId = ticketContract.mintTicket(msg.sender, concertId, tokenURI);
        c.ticketsSold += 1;
        pendingWithdrawals[c.artist] += msg.value;

        // Add notification for artist
        artistNotifications[c.artist].push(Notification({
            id: artistNotifications[c.artist].length + 1,
            concertId: concertId,
            buyer: msg.sender,
            timestamp: block.timestamp,
            read: false
        }));

        emit TicketPurchased(concertId, tokenId, msg.sender, msg.value);
        emit NotificationCreated(c.artist, concertId, msg.sender);
        return tokenId;
    }

    function withdraw() external {
        uint256 amt = pendingWithdrawals[msg.sender];
        require(amt > 0, "Concert: no funds");
        pendingWithdrawals[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: amt}("");
        require(ok, "Concert: withdraw failed");
        emit Withdraw(msg.sender, amt);
    }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------
    function getConcert(uint256 concertId) external view returns (Concert memory) {
        require(concerts[concertId].exists, "Concert: not found");
        return concerts[concertId];
    }

    function totalConcerts() external view returns (uint256) {
        if (_nextConcertId == 1) return 0;
        return _nextConcertId - 1;
    }

    function getNotificationsByArtist(address artist) external view returns (Notification[] memory) {
        return artistNotifications[artist];
    }

    function markNotificationAsRead(address artist, uint256 notificationIndex) external {
        require(msg.sender == artist, "Concert: only artist");
        require(notificationIndex < artistNotifications[artist].length, "Concert: invalid index");
        artistNotifications[artist][notificationIndex].read = true;
    }
}
