// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ZenithCircuitBreaker} from "../src/ZenithCircuitBreaker.sol";
import {ZenithFeeManager} from "../src/ZenithFeeManager.sol";
import {ZenithRouter} from "../src/ZenithRouter.sol";

/**
 * @title DeployZenith
 * @notice Automated deployment script for ZENITH Core EVM Smart Contracts
 * @dev Deploys in strict dependency order:
 *      1. ZenithCircuitBreaker (Governance, Emergency Guardian)
 *      2. ZenithFeeManager (Governance, Treasury)
 *      3. ZenithRouter (FeeManager, CircuitBreaker)
 */
contract DeployZenith is Script {
    function run() external returns (
        address circuitBreakerAddr,
        address feeManagerAddr,
        address routerAddr
    ) {
        // Read deployment parameters from environment variables
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address governanceMultisig = vm.envOr("GOVERNANCE_MULTISIG", vm.addr(deployerPrivateKey));
        address emergencyGuardian = vm.envOr("EMERGENCY_GUARDIAN", vm.addr(deployerPrivateKey));
        address treasuryAddress = vm.envOr("TREASURY_ADDRESS", vm.addr(deployerPrivateKey));
        uint256 defaultFeeBps = vm.envOr("DEFAULT_FEE_BPS", uint256(5)); // 5 BPS = 0.05%

        console.log("=== Deploying ZENITH Protocol Contracts ===");
        console.log("Deployer Address:    ", vm.addr(deployerPrivateKey));
        console.log("Governance Multisig: ", governanceMultisig);
        console.log("Emergency Guardian:  ", emergencyGuardian);
        console.log("Treasury Address:    ", treasuryAddress);
        console.log("Default Fee Bps:     ", defaultFeeBps);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ZenithCircuitBreaker
        ZenithCircuitBreaker circuitBreaker = new ZenithCircuitBreaker(
            governanceMultisig,
            emergencyGuardian
        );
        circuitBreakerAddr = address(circuitBreaker);
        console.log("1. ZenithCircuitBreaker deployed at:", circuitBreakerAddr);

        // 2. Deploy ZenithFeeManager
        ZenithFeeManager feeManager = new ZenithFeeManager(
            governanceMultisig,
            treasuryAddress
        );
        feeManagerAddr = address(feeManager);
        console.log("2. ZenithFeeManager deployed at:     ", feeManagerAddr);

        // If deployer is governance, optionally set custom fee bps
        if (governanceMultisig == vm.addr(deployerPrivateKey) && defaultFeeBps != 5) {
            feeManager.setDefaultFeeBps(defaultFeeBps);
            console.log("   Updated Default Fee Bps to:", defaultFeeBps);
        }

        // 3. Deploy ZenithRouter
        ZenithRouter router = new ZenithRouter(
            feeManagerAddr,
            circuitBreakerAddr
        );
        routerAddr = address(router);
        console.log("3. ZenithRouter deployed at:         ", routerAddr);

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("ZENITH_ROUTER_ADDRESS=", routerAddr);
        console.log("ZENITH_FEE_MANAGER_ADDRESS=", feeManagerAddr);
        console.log("ZENITH_CIRCUIT_BREAKER_ADDRESS=", circuitBreakerAddr);
    }
}
