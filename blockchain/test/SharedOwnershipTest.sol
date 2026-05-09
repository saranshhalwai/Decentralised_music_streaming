// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/MusicRegistry.sol";
import "../contracts/SharedOwnership.sol";

contract ShareOwnerProxy {
    receive() external payable {}
}

contract SharedOwnershipTest {
    function testSetSharesAndDistribute() public {
        MusicRegistry reg = new MusicRegistry();
        SharedOwnership so = new SharedOwnership(address(reg), address(this));

        // upload a track from this contract (this becomes the artist)
        uint256 trackId = reg.uploadTrack("Title", "Artist", "Genre", "ipfs", "cover");

        address[] memory shareholders = new address[](2);
        shareholders[0] = address(0x1111);
        shareholders[1] = address(0x2222);
        uint256[] memory bps = new uint256[](2);
        bps[0] = 5000;
        bps[1] = 5000;

        so.setShares(trackId, shareholders, bps);

        // distribute 1 ether; this will attempt to transfer to the shareholder addresses
        // we'll simply call distributeRevenue and ensure it doesn't revert
        (bool ok, ) = address(so).call{value: 1 ether}(abi.encodeWithSignature("distributeRevenue(uint256)", trackId));
        require(ok, "distributeRevenue reverted");
    }
}
