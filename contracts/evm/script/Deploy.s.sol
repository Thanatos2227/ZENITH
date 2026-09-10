
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ZenithCircuitBreaker} from "../src/ZenithCircuitBreaker.sol";
import {ZenithFeeManager} from "../src/ZenithFeeManager.sol";
import {ZenithPoolManager} from "../src/ZenithPoolManager.sol";
import {ZenithPositionNFT} from "../src/ZenithPositionNFT.sol";
import {ZenithReactor} from "../src/ZenithReactor.sol";
import {ZenithRouter} from "../src/ZenithRouter.sol";
import {DynamicFeeHook} from "../src/hooks/DynamicFeeHook.sol";

contract DeployZenith is Script {
    function run() external returns (
        address circuitBreakerAddr,
        address feeManagerAddr,
        address poolManagerAddr,
        address positionNFTAddr,
        address reactorAddr,
        address routerAddr,
        address dynamicHookAddr
    ) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address governanceMultisig = vm.envOr("GOVERNANCE_MULTISIG", vm.addr(deployerPrivateKey));
        address emergencyGuardian = vm.envOr("EMERGENCY_GUARDIAN", vm.addr(deployerPrivateKey));
        address treasuryAddress = vm.envOr("TREASURY_ADDRESS", vm.addr(deployerPrivateKey));
        address permit2Address = vm.envOr("PERMIT2_ADDRESS", address(0x000000000022D473030F116dDEE9F6B43aC78BA3));
        address wethAddress = vm.envOr("WETH_ADDRESS", address(0));
        uint256 defaultFeeBps = vm.envOr("DEFAULT_FEE_BPS", uint256(5));

        console.log("=== Deploying ZENITH v4 Protocol Suite (Uniswap Parity & Superiority) ===");
        console.log("Deployer Address:    ", vm.addr(deployerPrivateKey));
        console.log("Governance Multisig: ", governanceMultisig);
        console.log("Emergency Guardian:  ", emergencyGuardian);
        console.log("Treasury Address:    ", treasuryAddress);
        console.log("Permit2 Address:     ", permit2Address);

        vm.startBroadcast(deployerPrivateKey);

        ZenithCircuitBreaker circuitBreaker = new ZenithCircuitBreaker(
            governanceMultisig,
            emergencyGuardian
        );
        circuitBreakerAddr = address(circuitBreaker);
        console.log("1. ZenithCircuitBreaker deployed at: ", circuitBreakerAddr);

        ZenithFeeManager feeManager = new ZenithFeeManager(
            governanceMultisig,
            treasuryAddress
        );
        feeManagerAddr = address(feeManager);
        console.log("2. ZenithFeeManager deployed at:     ", feeManagerAddr);

        if (governanceMultisig == vm.addr(deployerPrivateKey) && defaultFeeBps != 5) {
            feeManager.setDefaultFeeBps(defaultFeeBps);
        }

        ZenithPoolManager poolManager = new ZenithPoolManager(
            circuitBreakerAddr
        );
        poolManagerAddr = address(poolManager);
        console.log("3. ZenithPoolManager deployed at:    ", poolManagerAddr);

        ZenithPositionNFT positionNFT = new ZenithPositionNFT(
            poolManagerAddr
        );
        positionNFTAddr = address(positionNFT);
        console.log("4. ZenithPositionNFT deployed at:    ", positionNFTAddr);

        ZenithReactor reactor = new ZenithReactor(
            permit2Address,
            circuitBreakerAddr
        );
        reactorAddr = address(reactor);
        console.log("5. ZenithReactor deployed at:        ", reactorAddr);

        DynamicFeeHook dynamicHook = new DynamicFeeHook(30, 100);
        dynamicHookAddr = address(dynamicHook);
        console.log("6. DynamicFeeHook deployed at:       ", dynamicHookAddr);

        ZenithRouter router = new ZenithRouter(
            feeManagerAddr,
            circuitBreakerAddr,
            wethAddress,
            permit2Address,
            poolManagerAddr
        );
        routerAddr = address(router);
        console.log("7. ZenithRouter deployed at:         ", routerAddr);

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("ZENITH_POOL_MANAGER_ADDRESS=", poolManagerAddr);
        console.log("ZENITH_POSITION_NFT_ADDRESS=", positionNFTAddr);
        console.log("ZENITH_REACTOR_ADDRESS=", reactorAddr);
        console.log("ZENITH_ROUTER_ADDRESS=", routerAddr);
    }
}
