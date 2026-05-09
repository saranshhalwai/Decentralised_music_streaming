// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/MusicRegistry.sol";
import "../contracts/BeatToken.sol";
import "../contracts/SharedOwnership.sol";
import "../contracts/DisputeResolution.sol";

contract ClaimantProxy {
    receive() external payable {}
    function openDispute(address drAddr, uint256 trackId, string memory evidence) public payable returns (uint256) {
        DisputeResolution dr = DisputeResolution(drAddr);
        return dr.openDispute{value: msg.value}(trackId, evidence);
    }
}

contract DisputeResolutionTest {
    function testOpenDisputeAndSubmitEvidence() public {
        MusicRegistry reg = new MusicRegistry();
        BeatToken beat = new BeatToken();
        SharedOwnership so = new SharedOwnership(address(reg), address(this));
        DisputeResolution dr = new DisputeResolution(address(reg), address(beat), address(so));

        // configure
        reg.setDisputeResolver(address(dr));
        so.setDisputeResolution(address(dr));

        // upload a track from this contract
        uint256 trackId = reg.uploadTrack("Title", "Artist", "Genre", "ipfs", "cover");

        // open dispute by an external claimant (not the artist)
        ClaimantProxy claimant = new ClaimantProxy();
        uint256 disputeId = claimant.openDispute{value: 0.01 ether}(address(dr), trackId, "ipfs://evidence");

        // submit respondent evidence from artist (this contract)
        dr.submitRespondentEvidence(disputeId, "ipfs://evidence-resp");
    }
}
