// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PullPayEscrow.sol";
import "../src/mocks/MockUSDC.sol";
import "../src/mocks/MockOptimisticOracleV3.sol";
import "../src/mocks/MockEAS.sol";

/// @dev Network-agnostic demo deploy (works on OP Sepolia or anvil): deploys a
/// mintable MockUSDC + a controllable MockOptimisticOracle + MockEAS + escrow,
/// then mints test USDC to the deployer and MINT_TO so real, explorer-verifiable
/// rewards can be funded without a faucet. All money flows are real on-chain; the
/// oracle/EAS are mocks so a demo never stalls on UMA whitelist / EAS schema.
///
/// Env:
///   DEPLOYER_PRIVATE_KEY   (required) funds gas + becomes owner
///   RELAYER_ADDRESS        (optional) defaults to the deployer
///   MINT_TO                (optional) extra address to receive test USDC
///   LIVENESS_SECONDS       (optional) challenge window, default 120
contract DeployDemo is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address relayer = vm.envOr("RELAYER_ADDRESS", deployer);
        address mintTo = vm.envOr("MINT_TO", deployer);
        uint64 liveness = uint64(vm.envOr("LIVENESS_SECONDS", uint256(120)));

        vm.startBroadcast(pk);

        MockUSDC usdc = new MockUSDC();
        MockOptimisticOracleV3 oo = new MockOptimisticOracleV3();
        MockEAS eas = new MockEAS();

        bytes32 schema = keccak256("string repo,uint256 issue,uint256 amount,bytes32 criteria,uint256 ts");

        PullPayEscrow escrow = new PullPayEscrow(
            address(oo), address(eas), schema, address(usdc), relayer
        );
        escrow.setLiveness(liveness);

        usdc.mint(deployer, 100_000e6);
        if (mintTo != deployer) usdc.mint(mintTo, 100_000e6);

        vm.stopBroadcast();

        console2.log("== PullPay demo deploy ==");
        console2.log("MockUSDC     :", address(usdc));
        console2.log("MockUMA OO   :", address(oo));
        console2.log("MockEAS      :", address(eas));
        console2.log("PullPayEscrow:", address(escrow));
        console2.log("Relayer      :", relayer);
        console2.log("Deployer     :", deployer);
        console2.log("Minted 100k USDC to:", mintTo);
        console2.log("");
        console2.log("frontend/.env.local:");
        console2.log("  NEXT_PUBLIC_ESCROW_ADDRESS=", address(escrow));
        console2.log("  NEXT_PUBLIC_USDC_ADDRESS=", address(usdc));
        console2.log("  NEXT_PUBLIC_UMA_ADDRESS=", address(oo));
    }
}
