// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

struct AssertionPolicy {
    bool blockAssertion;
    bool arbitrateViaEscalationManager;
    bool discardOracle;
    bool validateDisputers;
}

contract PullPayWhitelistEM is Ownable {
    mapping(address => bool) public allowedDisputer; // funders + the contributor

    event DisputerSet(address indexed who, bool allowed);

    constructor() Ownable(msg.sender) {}

    function setDisputer(address who, bool allowed) external onlyOwner {
        allowedDisputer[who] = allowed;
        emit DisputerSet(who, allowed);
    }

    // Enable disputer validation, keep the DVM as the arbiter.
    function getAssertionPolicy(bytes32) external pure returns (AssertionPolicy memory) {
        return AssertionPolicy({
            blockAssertion: false,
            arbitrateViaEscalationManager: false, // DVM still decides who is right
            discardOracle: false,
            validateDisputers: true               // <-- enables isDisputeAllowed
        });
    }

    function isDisputeAllowed(bytes32, address disputeCaller) external view returns (bool) {
        return allowedDisputer[disputeCaller];
    }

    // No-op callbacks (required by the interface).
    function assertionResolvedCallback(bytes32, bool) external {}
    function assertionDisputedCallback(bytes32) external {}
}
