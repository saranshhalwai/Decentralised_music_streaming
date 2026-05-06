// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MusicRegistry.sol";
import "./BeatToken.sol";
import "./SharedOwnership.sol";

contract DisputeResolution is ReentrancyGuard {
    enum DisputeStatus { Open, Resolved, Rejected }

    struct Dispute {
        uint256 id;
        uint256 trackId;
        address claimant;
        address respondent;
        string evidenceCIDClaimant;
        string evidenceCIDRespondent;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        DisputeStatus status;
    }

    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public disputeCount;
    
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_DISPUTE_STAKE = 0.01 ether;

    MusicRegistry public registry;
    BeatToken public beatToken;
    SharedOwnership public sharedOwnership;

    event DisputeOpened(uint256 indexed disputeId, uint256 indexed trackId, address claimant);
    event EvidenceSubmitted(uint256 indexed disputeId, address submitter, string cid);
    event VoteCast(uint256 indexed disputeId, address voter, bool support, uint256 weight);
    event DisputeResolved(uint256 indexed disputeId, address winner, DisputeStatus status);

    constructor(address _registryAddress, address _beatTokenAddress, address _sharedOwnershipAddress) {
        registry = MusicRegistry(_registryAddress);
        beatToken = BeatToken(_beatTokenAddress);
        if (_sharedOwnershipAddress != address(0)) {
            sharedOwnership = SharedOwnership(_sharedOwnershipAddress);
        }
    }

    function openDispute(uint256 trackId, string calldata evidenceCID)
        external payable returns (uint256 disputeId)
    {
        require(msg.value >= MIN_DISPUTE_STAKE, "Insufficient stake");
        address respondent = registry.getTrack(trackId).artist;
        require(msg.sender != respondent, "Cannot dispute own track");

        disputeId = disputeCount++;
        disputes[disputeId] = Dispute({
            id: disputeId,
            trackId: trackId,
            claimant: msg.sender,
            respondent: respondent,
            evidenceCIDClaimant: evidenceCID,
            evidenceCIDRespondent: "",
            votesFor: 0,
            votesAgainst: 0,
            deadline: block.timestamp + VOTING_PERIOD,
            status: DisputeStatus.Open
        });

        emit DisputeOpened(disputeId, trackId, msg.sender);
    }

    function submitRespondentEvidence(uint256 disputeId, string calldata evidenceCID) external {
        Dispute storage d = disputes[disputeId];
        require(d.status == DisputeStatus.Open, "Dispute not open");
        require(block.timestamp < d.deadline, "Voting ended");
        require(msg.sender == d.respondent, "Only respondent can submit");
        
        d.evidenceCIDRespondent = evidenceCID;
        emit EvidenceSubmitted(disputeId, msg.sender, evidenceCID);
    }

    function castVote(uint256 disputeId, bool supportClaimant) external {
        Dispute storage d = disputes[disputeId];
        require(d.status == DisputeStatus.Open, "Dispute not open");
        require(block.timestamp < d.deadline, "Voting ended");
        require(!hasVoted[disputeId][msg.sender], "Already voted");

        uint256 weight = beatToken.getVotes(msg.sender);
        require(weight > 0, "No voting weight");

        hasVoted[disputeId][msg.sender] = true;
        if (supportClaimant) {
            d.votesFor += weight;
        } else {
            d.votesAgainst += weight;
        }

        emit VoteCast(disputeId, msg.sender, supportClaimant, weight);
    }

    function resolveDispute(uint256 disputeId) external nonReentrant {
        Dispute storage d = disputes[disputeId];
        require(d.status == DisputeStatus.Open, "Already resolved");
        require(block.timestamp >= d.deadline, "Voting active");

        if (d.votesFor > d.votesAgainst) {
            // Claimant won
            registry.transferTrackOwnership(d.trackId, d.claimant);
            if (address(sharedOwnership) != address(0)) {
                try sharedOwnership.clearShares(d.trackId) {} catch {}
            }
            d.status = DisputeStatus.Resolved;
            (bool success, ) = payable(d.claimant).call{value: MIN_DISPUTE_STAKE}("");
            require(success, "Refund failed");
            emit DisputeResolved(disputeId, d.claimant, d.status);
        } else {
            // Respondent won or tie
            d.status = DisputeStatus.Rejected;
            (bool success, ) = payable(d.respondent).call{value: MIN_DISPUTE_STAKE}("");
            require(success, "Transfer to respondent failed");
            emit DisputeResolved(disputeId, d.respondent, d.status);
        }
    }

    function getDispute(uint256 id) external view returns (Dispute memory) {
        return disputes[id];
    }
}
