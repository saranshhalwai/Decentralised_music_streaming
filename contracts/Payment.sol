// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Payment
/// @notice Handles artist tips and per-stream micro-payments.
///         Artists accumulate earnings on-chain and withdraw at will.
contract Payment {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    /// artist address => unclaimed ETH balance (in wei)
    mapping(address => uint256) private _earnings;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event TipReceived(
        address indexed fan,
        address indexed artist,
        uint256 amount
    );

    event StreamPayment(
        address indexed fan,
        uint256 indexed trackId,
        address indexed artist,
        uint256 amount
    );

    event EarningsWithdrawn(address indexed artist, uint256 amount);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error ZeroValue();
    error ZeroAddress();
    error NoEarnings();
    error TransferFailed();

    // -------------------------------------------------------------------------
    // Mutating functions
    // -------------------------------------------------------------------------

    /// @notice Send a tip directly to an artist. The full msg.value is credited.
    /// @param artist  The artist's wallet address.
    function tipArtist(address artist) external payable {
        if (msg.value == 0)             revert ZeroValue();
        if (artist == address(0))       revert ZeroAddress();

        _earnings[artist] += msg.value;
        emit TipReceived(msg.sender, artist, msg.value);
    }

    /// @notice Pay for a stream (micro-payment). The full msg.value goes to the artist.
    /// @param trackId  The ID of the track being streamed.
    /// @param artist   The artist's wallet address.
    function streamPayment(uint256 trackId, address artist) external payable {
        if (msg.value == 0)       revert ZeroValue();
        if (artist == address(0)) revert ZeroAddress();

        _earnings[artist] += msg.value;
        emit StreamPayment(msg.sender, trackId, artist, msg.value);
    }

    /// @notice Withdraw all accumulated earnings. Only the artist themselves can call.
    function withdrawEarnings() external {
        uint256 amount = _earnings[msg.sender];
        if (amount == 0) revert NoEarnings();

        // Effect before interaction (re-entrancy guard pattern)
        _earnings[msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit EarningsWithdrawn(msg.sender, amount);
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    /// @notice Check how much ETH an artist has accumulated.
    function earningsOf(address artist) external view returns (uint256) {
        return _earnings[artist];
    }
}
