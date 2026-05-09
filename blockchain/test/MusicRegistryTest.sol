// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/MusicRegistry.sol";

contract MusicRegistryTest {
    function testUploadAndGetTrack() public {
        MusicRegistry reg = new MusicRegistry();
        uint256 id = reg.uploadTrack("Title", "Artist", "Genre", "QmAudio", "QmCover");
        require(reg.totalTracks() == 1, "totalTracks wrong");
        MusicRegistry.Track memory t = reg.getTrack(0);
        require(keccak256(bytes(t.title)) == keccak256(bytes("Title")), "title wrong");
    }

    function testEmptyFieldReverts() public {
        MusicRegistry reg = new MusicRegistry();
        (bool ok, ) = address(reg).call(abi.encodeWithSignature("uploadTrack(string,string,string,string,string)", "", "Artist", "G", "QmA", "QmB"));
        require(!ok, "should revert on empty title");
    }

    function testIncrementPlayCount() public {
        MusicRegistry reg = new MusicRegistry();
        reg.uploadTrack("Title", "Artist", "Genre", "QmAudio", "QmCover");
        reg.incrementPlayCount(0);
        MusicRegistry.Track memory t = reg.getTrack(0);
        require(t.playCount == 1, "playCount not incremented");
    }
}
