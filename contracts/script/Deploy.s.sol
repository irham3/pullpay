// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PullPayEscrow.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address oo = vm.envAddress("UMA_OOV3_ADDRESS");
        address eas = vm.envAddress("EAS_ADDRESS");
        bytes32 easSchema = vm.envBytes32("EAS_SCHEMA_UID");
        address bondCurrency = vm.envAddress("BOND_CURRENCY_ADDRESS");
        
        // For hackathon MVP, we can set relayer to deployer or a separate wallet
        address relayer = vm.envOr("RELAYER_ADDRESS", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        PullPayEscrow escrow = new PullPayEscrow(
            oo,
            eas,
            easSchema,
            bondCurrency,
            relayer
        );
        // Short challenge window for a hackathon demo (§16/§18).
        escrow.setLiveness(uint64(vm.envOr("LIVENESS_SECONDS", uint256(120))));

        vm.stopBroadcast();

        console2.log("PullPayEscrow deployed:", address(escrow));
        console2.log("Set NEXT_PUBLIC_ESCROW_ADDRESS to the address above.");
    }
}
