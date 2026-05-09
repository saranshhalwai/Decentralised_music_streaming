// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PlaylistRegistry
/// @notice On-chain registry for music playlists.
contract PlaylistRegistry is Ownable {
    struct Playlist {
        uint256 id;
        address creator;
        string name;
        string description;
        uint256[] trackIds;
        uint256 timestamp;
        bool exists;
    }

    uint256 private _nextPlaylistId;
    mapping(uint256 => Playlist) private _playlists;
    mapping(address => uint256[]) private _userPlaylists;

    event PlaylistCreated(
        uint256 indexed playlistId,
        address indexed creator,
        string name,
        uint256 trackCount,
        uint256 timestamp
    );

    error PlaylistNotFound(uint256 playlistId);
    error EmptyField(string fieldName);
    error EmptyPlaylist();

    constructor() Ownable(msg.sender) {}

    function createPlaylist(
        string calldata name,
        string calldata description,
        uint256[] calldata trackIds
    ) external returns (uint256 playlistId) {
        if (bytes(name).length == 0) revert EmptyField("name");
        if (trackIds.length == 0) revert EmptyPlaylist();

        playlistId = _nextPlaylistId;
        _nextPlaylistId++;

        _playlists[playlistId] = Playlist({
            id: playlistId,
            creator: msg.sender,
            name: name,
            description: description,
            trackIds: trackIds,
            timestamp: block.timestamp,
            exists: true
        });

        _userPlaylists[msg.sender].push(playlistId);

        emit PlaylistCreated(
            playlistId,
            msg.sender,
            name,
            trackIds.length,
            block.timestamp
        );
    }

    function getPlaylist(uint256 playlistId) external view returns (Playlist memory) {
        if (!_playlists[playlistId].exists) revert PlaylistNotFound(playlistId);
        return _playlists[playlistId];
    }

    function getUserPlaylistIds(address user) external view returns (uint256[] memory) {
        return _userPlaylists[user];
    }

    function totalPlaylists() external view returns (uint256) {
        return _nextPlaylistId;
    }

    function getRecentPlaylists(uint256 limit) external view returns (Playlist[] memory) {
        uint256 count = _nextPlaylistId > limit ? limit : _nextPlaylistId;
        Playlist[] memory result = new Playlist[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = _playlists[_nextPlaylistId - 1 - i];
        }
        return result;
    }
}
