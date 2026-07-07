// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PullPayEscrow.sol";
import "../src/mocks/MockUSDC.sol";
import "../src/mocks/MockOptimisticOracleV3.sol";
import "../src/mocks/MockEAS.sol";

/// @dev Self-contained local deploy (anvil): MockUSDC + MockUMA + MockEAS + escrow.
/// Mints test USDC to the deployer so the full flow is demoable without a faucet.
///
/// Usage:
///   anvil
///   forge script script/DeployLocal.s.sol:DeployLocal \
///     --rpc-url http://127.0.0.1:8545 --broadcast \
///     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
contract DeployLocal is Script {
    // anvil default account[0] (deployer) and account[1] (relayer).
    uint256 constant DEPLOYER_PK =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    address constant RELAYER = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    function run() external {
        // Always use anvil account[0] — this script is local-only.
        uint256 pk = DEPLOYER_PK;
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        MockUSDC usdc = new MockUSDC();
        MockOptimisticOracleV3 oo = new MockOptimisticOracleV3();
        MockEAS eas = new MockEAS();

        bytes32 schema = keccak256("string repo,uint256 issue,uint256 amount,bytes32 criteria,uint256 ts");

        PullPayEscrow escrow = new PullPayEscrow(
            address(oo), address(eas), schema, address(usdc), RELAYER
        );
        escrow.setLiveness(30); // short window for demos

        // Fund the deployer and relayer with test USDC.
        usdc.mint(deployer, 100_000e6);
        usdc.mint(RELAYER, 10_000e6);

        vm.stopBroadcast();

        console2.log("== PullPay local deploy ==");
        console2.log("MockUSDC     :", address(usdc));
        console2.log("MockUMA OO   :", address(oo));
        console2.log("MockEAS      :", address(eas));
        console2.log("PullPayEscrow:", address(escrow));
        console2.log("Relayer      :", RELAYER);
        console2.log("Deployer     :", deployer);
        console2.log("");
        console2.log("Frontend .env:");
        console2.log("  NEXT_PUBLIC_CHAIN_ID=31337");
        console2.log("  NEXT_PUBLIC_ESCROW_ADDRESS=", address(escrow));
        console2.log("  NEXT_PUBLIC_USDC_ADDRESS=", address(usdc));
    }
}
