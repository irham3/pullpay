// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICallbackRecipient {
    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) external;
    function assertionDisputedCallback(bytes32 assertionId) external;
}

/// @dev Minimal, controllable stand-in for UMA's Optimistic Oracle V3, matching
/// the interface PullPayEscrow depends on. Lets a demo/test drive the full
/// verification lifecycle deterministically:
///   assertTruth  → pulls the bond from the asserter (escrow)
///   settle       → returns the bond to the callback recipient, then resolves TRUE
///   dispute      → resolves FALSE
/// Real UMA settles optimistically after `liveness`; this mock is manual so a
/// demo doesn't have to wait (PRD §16/§18: "short liveness or a mock oracle").
contract MockOptimisticOracleV3 {
    struct Assertion {
        address asserter;
        address callbackRecipient;
        IERC20 currency;
        uint256 bond;
        bool settled;
        bool resolvedTruthfully;
        bool disputed;
    }

    mapping(bytes32 => Assertion) public assertions;
    uint256 private nonce;

    event AssertionMade(bytes32 indexed assertionId, address asserter, uint256 bond);
    event AssertionSettled(bytes32 indexed assertionId, bool truthfully);
    event AssertionDisputed(bytes32 indexed assertionId);

    function defaultIdentifier() external pure returns (bytes32) {
        return bytes32("ASSERT_TRUTH");
    }

    function assertTruth(
        bytes memory, /* claim */
        address asserter,
        address callbackRecipient,
        address, /* escalationManager */
        uint64, /* liveness */
        IERC20 currency,
        uint256 bond,
        bytes32, /* identifier */
        bytes32 /* domainId */
    ) external returns (bytes32 assertionId) {
        assertionId = keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce++));
        if (bond > 0) {
            // Pull the bond from the caller (the escrow), mirroring real UMA.
            require(currency.transferFrom(msg.sender, address(this), bond), "bond transfer failed");
        }
        assertions[assertionId] = Assertion({
            asserter: asserter,
            callbackRecipient: callbackRecipient,
            currency: currency,
            bond: bond,
            settled: false,
            resolvedTruthfully: false,
            disputed: false
        });
        emit AssertionMade(assertionId, asserter, bond);
    }

    /// @notice Resolve an undisputed assertion as TRUE (the optimistic default).
    function settleAssertion(bytes32 assertionId) external {
        _resolve(assertionId, true);
    }

    /// @notice Resolve an assertion as FALSE (simulates a winning dispute).
    function disputeAndResolveFalse(bytes32 assertionId) external {
        Assertion storage a = assertions[assertionId];
        a.disputed = true;
        emit AssertionDisputed(assertionId);
        ICallbackRecipient(a.callbackRecipient).assertionDisputedCallback(assertionId);
        _resolve(assertionId, false);
    }

    function settleAndGetAssertionResult(bytes32 assertionId) external returns (bool) {
        if (!assertions[assertionId].settled) _resolve(assertionId, true);
        return assertions[assertionId].resolvedTruthfully;
    }

    function getAssertionResult(bytes32 assertionId) external view returns (bool) {
        return assertions[assertionId].resolvedTruthfully;
    }

    function _resolve(bytes32 assertionId, bool truthfully) internal {
        Assertion storage a = assertions[assertionId];
        require(!a.settled, "already settled");
        a.settled = true;
        a.resolvedTruthfully = truthfully;
        // Return the bond to the callback recipient (escrow) so it can forward it
        // per its own accounting (bond → maintainer on either outcome here).
        if (a.bond > 0) {
            require(a.currency.transfer(a.callbackRecipient, a.bond), "bond return failed");
        }
        emit AssertionSettled(assertionId, truthfully);
        ICallbackRecipient(a.callbackRecipient).assertionResolvedCallback(assertionId, truthfully);
    }
}
