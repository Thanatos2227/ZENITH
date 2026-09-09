pragma solidity ^0.8.24;

import "../src/ZenithCircuitBreaker.sol";
import "../src/ZenithFeeManager.sol";
import "../src/ZenithRouter.sol";

contract ZenithRouterTest {
    ZenithCircuitBreaker public circuitBreaker;
    ZenithFeeManager public feeManager;
    ZenithRouter public router;

    address public governance = address(0x1000);
    address public guardian = address(0x2000);
    address public treasury = address(0x3000);

    function setUp() public {
        circuitBreaker = new ZenithCircuitBreaker(governance, guardian);
        feeManager = new ZenithFeeManager(governance, treasury);
        router = new ZenithRouter(address(feeManager), address(circuitBreaker));
    }

    function testFeeCalculation() public view {
        uint256 amount = 10000;
        uint256 fee = feeManager.calculateFee(amount);
        require(fee == 5, "Fee calculation mismatch");
    }

    function testCircuitBreakerPause() public {
        require(!circuitBreaker.isPaused(), "Should not be paused initially");
    }
}
