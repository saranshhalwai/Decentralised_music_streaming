// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MusicRegistry.sol";

contract SharedOwnership is ReentrancyGuard, Ownable {
    struct ShareConfig {
        address[] shareholders;
        uint256[] basisPoints; // must sum to 10000 (= 100%)
    }

    mapping(uint256 => ShareConfig) private _shares; // trackId => config
    MusicRegistry public registry;
    address public paymentContract;
    address public disputeResolutionAddress;

    event SharesConfigured(uint256 indexed trackId, address[] shareholders, uint256[] basisPoints);
    event RevenueDistributed(uint256 indexed trackId, uint256 totalAmount);
    event SharesCleared(uint256 indexed trackId);

    error NotTrackOwner();
    error ArrayLengthMismatch();
    error InvalidBasisPointsSum();
    error ZeroAddressShareholder();
    error Unauthorized();

    constructor(address _registryAddress, address _paymentAddress) Ownable(msg.sender) {
        registry = MusicRegistry(_registryAddress);
        paymentContract = _paymentAddress;
    }

    function setDisputeResolution(address _disputeResolution) external onlyOwner {
        disputeResolutionAddress = _disputeResolution;
    }

    function setShares(
        uint256 trackId,
        address[] calldata shareholders,
        uint256[] calldata basisPoints
    ) external {
        if (registry.getTrack(trackId).artist != msg.sender) revert NotTrackOwner();
        if (shareholders.length != basisPoints.length) revert ArrayLengthMismatch();
        
        uint256 total = 0;
        for (uint256 i = 0; i < shareholders.length; i++) {
            if (shareholders[i] == address(0)) revert ZeroAddressShareholder();
            total += basisPoints[i];
        }
        if (total != 10000) revert InvalidBasisPointsSum();

        _shares[trackId] = ShareConfig(shareholders, basisPoints);
        emit SharesConfigured(trackId, shareholders, basisPoints);
    }

    function distributeRevenue(uint256 trackId) external payable nonReentrant {
        ShareConfig memory config = _shares[trackId];
        require(config.shareholders.length > 0, "No shares configured");

        uint256 totalAmount = msg.value;
        for (uint256 i = 0; i < config.shareholders.length; i++) {
            uint256 amount = (totalAmount * config.basisPoints[i]) / 10000;
            if (amount > 0) {
                (bool success, ) = config.shareholders[i].call{value: amount}("");
                require(success, "Transfer failed");
            }
        }
        emit RevenueDistributed(trackId, totalAmount);
    }

    function clearShares(uint256 trackId) external {
        if (msg.sender != disputeResolutionAddress) revert Unauthorized();
        delete _shares[trackId];
        emit SharesCleared(trackId);
    }

    function getShares(uint256 trackId)
        external view returns (address[] memory, uint256[] memory)
    {
        ShareConfig memory config = _shares[trackId];
        return (config.shareholders, config.basisPoints);
    }

    function hasShares(uint256 trackId) external view returns (bool) {
        return _shares[trackId].shareholders.length > 0;
    }
}
