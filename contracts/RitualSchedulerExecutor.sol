// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { RitualAuthorizationManager } from "./RitualAuthorizationManager.sol";

interface IBatchSender {
    function batchSendNative(address[] calldata r, uint256[] calldata a, bytes32 id) external payable;
}

/// @title RitualSchedulerExecutor
/// @notice Off-chain scheduler signs a queue snapshot, calls executeCampaign() at scheduled time.
///         Single tx hash, single confirmation flow per campaign.
contract RitualSchedulerExecutor {
    RitualAuthorizationManager public immutable authMgr;
    IBatchSender public immutable batchSender;

    mapping(bytes32 => bool) public executed; // campaignId => done
    mapping(bytes32 => bool) public paused;

    event CampaignExecuted(bytes32 indexed campaignId, address indexed owner, uint256 count, uint256 total);
    event CampaignPaused(bytes32 indexed campaignId);
    event CampaignResumed(bytes32 indexed campaignId);
    event EmergencyStop(bytes32 indexed campaignId, address indexed by);

    constructor(address _auth, address _sender) {
        authMgr = RitualAuthorizationManager(_auth);
        batchSender = IBatchSender(_sender);
    }

    function executeCampaign(
        RitualAuthorizationManager.Authorization calldata auth,
        bytes calldata sig,
        bytes32 campaignId,
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256 totalValue
    ) external payable {
        require(!executed[campaignId], "already executed");
        require(!paused[campaignId], "paused");
        require(authMgr.verify(auth, sig), "bad auth");
        require(recipients.length <= auth.maxRecipients, "too many");
        require(totalValue <= auth.maxTotal, "amount cap");
        require(msg.value == totalValue, "value mismatch");
        executed[campaignId] = true;
        batchSender.batchSendNative{ value: totalValue }(recipients, amounts, campaignId);
        emit CampaignExecuted(campaignId, auth.owner, recipients.length, totalValue);
    }

    function pause(bytes32 id) external { paused[id] = true;  emit CampaignPaused(id); }
    function resume(bytes32 id) external { paused[id] = false; emit CampaignResumed(id); }
    function emergencyStop(bytes32 id) external {
        executed[id] = true; // permanently locked
        emit EmergencyStop(id, msg.sender);
    }
}