
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ZenithCircuitBreaker} from "../src/ZenithCircuitBreaker.sol";
import {ZenithFeeManager} from "../src/ZenithFeeManager.sol";
import {ZenithRouter} from "../src/ZenithRouter.sol";

contract DeployZenith is Script {
    function run() external returns (
        address circuitBreakerAddr,
        address feeManagerAddr,
        address routerAddr
    ) {

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address governanceMultisig = vm.envOr("GOVERNANCE_MULTISIG", vm.addr(deployerPrivateKey));
        address emergencyGuardian = vm.envOr("EMERGENCY_GUARDIAN", vm.addr(deployerPrivateKey));
        address treasuryAddress = vm.envOr("TREASURY_ADDRESS", vm.addr(deployerPrivateKey));
        uint256 defaultFeeBps = vm.envOr("DEFAULT_FEE_BPS", uint256(5));

        console.log("=== Deploying ZENITH Protocol Contracts ===");
        console.log("Deployer Address:    ", vm.addr(deployerPrivateKey));
        console.log("Governance Multisig: ", governanceMultisig);
        console.log("Emergency Guardian:  ", emergencyGuardian);
        console.log("Treasury Address:    ", treasuryAddress);
        console.log("Default Fee Bps:     ", defaultFeeBps);

        vm.startBroadcast(deployerPrivateKey);

        ZenithCircuitBreaker circuitBreaker = new ZenithCircuitBreaker(
            governanceMultisig,
            emergencyGuardian
        );
        circuitBreakerAddr = address(circuitBreaker);
        console.log("1. ZenithCircuitBreaker deployed at:", circuitBreakerAddr);

        ZenithFeeManager feeManager = new ZenithFeeManager(
            governanceMultisig,
            treasuryAddress
        );
        feeManagerAddr = address(feeManager);
        console.log("2. ZenithFeeManager deployed at:     ", feeManagerAddr);

        if (governanceMultisig == vm.addr(deployerPrivateKey) && defaultFeeBps != 5) {
            feeManager.setDefaultFeeBps(defaultFeeBps);
            console.log("   Updated Default Fee Bps to:", defaultFeeBps);
        }

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
