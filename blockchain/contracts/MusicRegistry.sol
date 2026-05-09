// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MusicRegistry
/// @notice On-chain catalog of music tracks. Artists register tracks (stored on IPFS)
///         and fans can increment play counts.
contract MusicRegistry is Ownable {
    // -------------------------------------------------------------------------
    // Data structures
    // -------------------------------------------------------------------------

    struct Track {
        uint256 id;
        address artist;
        string title;
        string artistName;
        string genre;
        string ipfsCID;      // CID of the audio file on IPFS
        string coverArtCID;  // CID of the cover image on IPFS
        uint256 timestamp;
        uint256 playCount;
        bool exists;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    uint256 private _nextTrackId;

    /// trackId => Track
    mapping(uint256 => Track) private _tracks;

    /// artist address => list of trackIds they own
    mapping(address => uint256[]) private _artistTracks;

    address public disputeResolver;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event TrackUploaded(
        uint256 indexed trackId,
        address indexed artist,
        string title,
        string artistName,
        string genre,
        string ipfsCID,
        string coverArtCID,
        uint256 timestamp
    );

    event PlayCountIncremented(uint256 indexed trackId, uint256 newPlayCount);
    event TrackOwnershipTransferred(uint256 indexed trackId, address oldOwner, address newOwner);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error TrackNotFound(uint256 trackId);
    error EmptyField(string fieldName);
    error Unauthorized();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() Ownable(msg.sender) {}

    // -------------------------------------------------------------------------
    // Mutating functions
    // -------------------------------------------------------------------------

    /// @notice Register a new track on-chain.
    /// @param title        Human-readable title of the track.
    /// @param artistName   Display name of the artist.
    /// @param genre        Genre string (e.g. "Hip-Hop", "Electronic").
    /// @param ipfsCID      IPFS CID of the audio file.
    /// @param coverArtCID  IPFS CID of the cover art image.
    /// @return trackId     The ID assigned to this track.
    function uploadTrack(
        string calldata title,
        string calldata artistName,
        string calldata genre,
        string calldata ipfsCID,
        string calldata coverArtCID
    ) external returns (uint256 trackId) {
        if (bytes(title).length == 0)       revert EmptyField("title");
        if (bytes(artistName).length == 0)  revert EmptyField("artistName");
        if (bytes(genre).length == 0)       revert EmptyField("genre");
        if (bytes(ipfsCID).length == 0)     revert EmptyField("ipfsCID");
        if (bytes(coverArtCID).length == 0) revert EmptyField("coverArtCID");

        trackId = _nextTrackId;
        _nextTrackId++;

        _tracks[trackId] = Track({
            id: trackId,
            artist: msg.sender,
            title: title,
            artistName: artistName,
            genre: genre,
            ipfsCID: ipfsCID,
            coverArtCID: coverArtCID,
            timestamp: block.timestamp,
            playCount: 0,
            exists: true
        });

        _artistTracks[msg.sender].push(trackId);

        emit TrackUploaded(
            trackId,
            msg.sender,
            title,
            artistName,
            genre,
            ipfsCID,
            coverArtCID,
            block.timestamp
        );
    }

    function setDisputeResolver(address resolver) external onlyOwner {
        disputeResolver = resolver;
    }

    function transferTrackOwnership(uint256 trackId, address newOwner) external {
        if (msg.sender != disputeResolver) revert Unauthorized();
        if (!_tracks[trackId].exists) revert TrackNotFound(trackId);
        address oldOwner = _tracks[trackId].artist;
        _tracks[trackId].artist = newOwner;
        _artistTracks[newOwner].push(trackId);
        emit TrackOwnershipTransferred(trackId, oldOwner, newOwner);
    }

    /// @notice Increment the play count of a track by 1. Anyone can call this.
    /// @param trackId  The ID of the track being played.
    function incrementPlayCount(uint256 trackId) external {
        if (!_tracks[trackId].exists) revert TrackNotFound(trackId);
        _tracks[trackId].playCount += 1;
        emit PlayCountIncremented(trackId, _tracks[trackId].playCount);
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    /// @notice Fetch a single track by ID.
    function getTrack(uint256 trackId) external view returns (Track memory) {
        if (!_tracks[trackId].exists) revert TrackNotFound(trackId);
        return _tracks[trackId];
    }

    /// @notice Get all track IDs uploaded by a specific artist.
    function getTrackIdsByArtist(address artist) external view returns (uint256[] memory) {
        return _artistTracks[artist];
    }

    /// @notice Convenience: get full Track structs for all tracks by an artist.
    function getTracksByArtist(address artist) external view returns (Track[] memory) {
        uint256[] memory ids = _artistTracks[artist];
        Track[] memory result = new Track[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = _tracks[ids[i]];
        }
        return result;
    }

    /// @notice Total number of tracks ever registered.
    function totalTracks() external view returns (uint256) {
        return _nextTrackId;
    }
}
