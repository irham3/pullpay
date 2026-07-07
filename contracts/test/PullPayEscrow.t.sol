// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PullPayEscrow.sol";
import "../src/mocks/MockUSDC.sol";
import "../src/mocks/MockOptimisticOracleV3.sol";
import "../src/mocks/MockEAS.sol";

contract PullPayEscrowTest is Test {
    PullPayEscrow escrow;
    MockUSDC usdc;
    MockOptimisticOracleV3 oo;
    MockEAS eas;

    address maintainer = makeAddr("maintainer");
    address contributor = makeAddr("contributor");
    address relayer = makeAddr("relayer");
    bytes32 constant SCHEMA = keccak256("schema");

    uint256 constant AMOUNT = 100e6; // 100 USDC (6 decimals)
    uint256 constant BOND = 10e6; // 10 USDC

    function setUp() public {
        usdc = new MockUSDC();
        oo = new MockOptimisticOracleV3();
        eas = new MockEAS();
        escrow = new PullPayEscrow(address(oo), address(eas), SCHEMA, address(usdc), relayer);

        usdc.mint(maintainer, 1_000e6);
        vm.prank(maintainer);
        usdc.approve(address(escrow), type(uint256).max);
    }

    // ---- helpers ----
    function _create(bytes32 id, PullPayEscrow.Mode mode, uint256 bond, uint256 deadline) internal {
        vm.prank(maintainer);
        escrow.createReward(
            id, address(usdc), AMOUNT, bond, "wevm/viem", 3421, keccak256("criteria"), mode, deadline
        );
    }

    function _assertionId(bytes32 id) internal view returns (bytes32 aId) {
        (,,,,,,,,, aId,,) = escrow.rewards(id);
    }

    function _status(bytes32 id) internal view returns (PullPayEscrow.Status s) {
        (,,,,, s,) = escrow.getReward(id);
    }

    // ---- createReward ----
    function test_CreateReward_locksFunds() public {
        bytes32 id = keccak256("r1");
        _create(id, PullPayEscrow.Mode.Safeguarded, BOND, block.timestamp + 1 days);

        assertEq(uint8(_status(id)), uint8(PullPayEscrow.Status.Funded));
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT + BOND);
        assertTrue(escrow.isFunded(id));
        assertTrue(escrow.isSolvent(id));
    }

    function test_CreateReward_revertsOnDuplicate() public {
        bytes32 id = keccak256("dup");
        _create(id, PullPayEscrow.Mode.Instant, 0, block.timestamp + 1 days);
        vm.prank(maintainer);
        vm.expectRevert(bytes("exists"));
        escrow.createReward(
            id, address(usdc), AMOUNT, 0, "wevm/viem", 3421, keccak256("criteria"), PullPayEscrow.Mode.Instant, block.timestamp + 1 days
        );
    }

    function test_CreateReward_revertsOnZeroAmount() public {
        vm.prank(maintainer);
        vm.expectRevert(bytes("zero amount"));
        escrow.createReward(
            keccak256("z"), address(usdc), 0, 0, "wevm/viem", 1, keccak256("c"), PullPayEscrow.Mode.Instant, block.timestamp + 1 days
        );
    }

    // ---- Instant: approveAndRelease (maintainer) ----
    function test_ApproveAndRelease_paysContributor() public {
        bytes32 id = keccak256("instantA");
        _create(id, PullPayEscrow.Mode.Instant, 0, block.timestamp + 1 days);

        vm.prank(maintainer);
        escrow.approveAndRelease(id, contributor);

        assertEq(usdc.balanceOf(contributor), AMOUNT);
        assertEq(uint8(_status(id)), uint8(PullPayEscrow.Status.Settled));
    }

    function test_ApproveAndRelease_revertsIfNotMaintainer() public {
        bytes32 id = keccak256("instantA2");
        _create(id, PullPayEscrow.Mode.Instant, 0, block.timestamp + 1 days);
        vm.prank(contributor);
        vm.expectRevert(bytes("not maintainer"));
        escrow.approveAndRelease(id, contributor);
    }

    function test_ApproveAndRelease_revertsOnSafeguarded() public {
        bytes32 id = keccak256("sg");
        _create(id, PullPayEscrow.Mode.Safeguarded, BOND, block.timestamp + 1 days);
        vm.prank(maintainer);
        vm.expectRevert(bytes("not instant"));
        escrow.approveAndRelease(id, contributor);
    }

    // ---- Instant: settleInstant (relayer) ----
    function test_SettleInstant_byRelayer() public {
        bytes32 id = keccak256("instantB");
        _create(id, PullPayEscrow.Mode.Instant, 0, block.timestamp + 1 days);

        vm.prank(relayer);
        escrow.settleInstant(id, contributor);

        assertEq(usdc.balanceOf(contributor), AMOUNT);
        assertEq(uint8(_status(id)), uint8(PullPayEscrow.Status.Settled));
    }

    function test_SettleInstant_revertsIfNotRelayer() public {
        bytes32 id = keccak256("instantB2");
        _create(id, PullPayEscrow.Mode.Instant, 0, block.timestamp + 1 days);
        vm.prank(maintainer);
        vm.expectRevert(bytes("not relayer"));
        escrow.settleInstant(id, contributor);
    }

    // ---- Safeguarded: assert → resolve TRUE ----
    function test_Safeguarded_assertAndSettleTrue() public {
        bytes32 id = keccak256("sgTrue");
        _create(id, PullPayEscrow.Mode.Safeguarded, BOND, block.timestamp + 1 days);

        uint256 maintainerBefore = usdc.balanceOf(maintainer);

        vm.prank(relayer);
        escrow.assertMerge(id, contributor, bytes("PR #1 merged"));
        assertEq(uint8(_status(id)), uint8(PullPayEscrow.Status.Asserted));

        bytes32 aId = _assertionId(id);
        oo.settleAssertion(aId);

        // Contributor paid the reward; maintainer got the bond back.
        assertEq(usdc.balanceOf(contributor), AMOUNT);
        assertEq(usdc.balanceOf(maintainer), maintainerBefore + BOND);
        assertEq(uint8(_status(id)), uint8(PullPayEscrow.Status.Settled));
    }

    function test_AssertMerge_revertsIfNotRelayer() public {
        bytes32 id = keccak256("sgAuth");
        _create(id, PullPayEscrow.Mode.Safeguarded, BOND, block.timestamp + 1 days);
        vm.prank(contributor);
        vm.expectRevert(bytes("not relayer"));
        escrow.assertMerge(id, contributor, bytes("x"));
    }

    function test_AssertMerge_revertsOnInstant() public {
        bytes32 id = keccak256("sgMode");
        _create(id, PullPayEscrow.Mode.Instant, 0, block.timestamp + 1 days);
        vm.prank(relayer);
        vm.expectRevert(bytes("not safeguarded"));
        escrow.assertMerge(id, contributor, bytes("x"));
    }

    // ---- Safeguarded: assert → resolve FALSE (dispute wins) ----
    function test_Safeguarded_resolveFalse_returnsToMaintainer() public {
        bytes32 id = keccak256("sgFalse");
        _create(id, PullPayEscrow.Mode.Safeguarded, BOND, block.timestamp + 1 days);

        uint256 maintainerBefore = usdc.balanceOf(maintainer);

        vm.prank(relayer);
        escrow.assertMerge(id, contributor, bytes("PR #1 merged"));
        bytes32 aId = _assertionId(id);

        oo.disputeAndResolveFalse(aId);

        // Nothing to contributor; reward + bond back to maintainer.
        assertEq(usdc.balanceOf(contributor), 0);
        assertEq(usdc.balanceOf(maintainer), maintainerBefore + AMOUNT + BOND);
        assertEq(uint8(_status(id)), uint8(PullPayEscrow.Status.Rejected));
    }

    // ---- refund ----
    function test_Refund_afterDeadline() public {
        bytes32 id = keccak256("refund");
        _create(id, PullPayEscrow.Mode.Safeguarded, BOND, block.timestamp + 1 days);
        uint256 maintainerBefore = usdc.balanceOf(maintainer);

        vm.warp(block.timestamp + 2 days);
        vm.prank(maintainer);
        escrow.refund(id);

        assertEq(usdc.balanceOf(maintainer), maintainerBefore + AMOUNT + BOND);
        assertEq(uint8(_status(id)), uint8(PullPayEscrow.Status.Refunded));
    }

    function test_Refund_revertsBeforeDeadline() public {
        bytes32 id = keccak256("refundEarly");
        _create(id, PullPayEscrow.Mode.Instant, 0, block.timestamp + 1 days);
        vm.prank(maintainer);
        vm.expectRevert(bytes("not refundable"));
        escrow.refund(id);
    }

    function test_Refund_revertsIfNotMaintainer() public {
        bytes32 id = keccak256("refundAuth");
        _create(id, PullPayEscrow.Mode.Instant, 0, block.timestamp + 1 days);
        vm.warp(block.timestamp + 2 days);
        vm.prank(contributor);
        vm.expectRevert(bytes("not maintainer"));
        escrow.refund(id);
    }
}
