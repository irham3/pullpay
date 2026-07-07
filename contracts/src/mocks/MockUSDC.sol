// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev 6-decimal USDC stand-in for local anvil / testnet demos. Anyone can mint.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint test USDC to any address (faucet substitute).
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
