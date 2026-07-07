// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEAS, AttestationRequest} from "../PullPayEscrow.sol";

/// @dev Minimal EAS stand-in: records the attestation and returns a UID so the
/// escrow's settle path (which calls eas.attest) works locally without the real
/// Ethereum Attestation Service.
contract MockEAS is IEAS {
    uint256 private nonce;

    event Attested(bytes32 indexed uid, address indexed recipient, bytes32 schema, bytes32 refUID);

    function attest(AttestationRequest calldata request) external payable returns (bytes32) {
        bytes32 uid = keccak256(
            abi.encodePacked(request.schema, request.data.recipient, request.data.refUID, nonce++)
        );
        emit Attested(uid, request.data.recipient, request.schema, request.data.refUID);
        return uid;
    }
}
