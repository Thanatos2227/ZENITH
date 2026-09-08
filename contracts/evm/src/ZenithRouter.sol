pragma solidity ^0.8.24;

import "./interfaces/IERC20.sol";
import "./interfaces/IZenithRouter.sol";
import "./ZenithFeeManager.sol";
import "./ZenithCircuitBreaker.sol";

contract ZenithRouter is IZenithRouter {
    ZenithFeeManager public immutable feeManager;
    ZenithCircuitBreaker public immutable circuitBreaker;

    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ZenithRouter: Reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier whenNotPaused() {
        require(!circuitBreaker.isPaused(), "ZenithRouter: Circuit breaker active");
        _;
    }

    constructor(address _feeManager, address _circuitBreaker) {
        require(_feeManager != address(0), "ZenithRouter: Zero fee manager");
        require(_circuitBreaker != address(0), "ZenithRouter: Zero circuit breaker");
        feeManager = ZenithFeeManager(_feeManager);
        circuitBreaker = ZenithCircuitBreaker(_circuitBreaker);
        _status = _NOT_ENTERED;
    }

    receive() external payable {}

    function executeSwap(SwapParams calldata params)
        external
        payable
        override
        nonReentrant
        whenNotPaused
        returns (uint256 amountOut)
    {
        require(block.timestamp <= params.deadline, "ZenithRouter: Expired deadline");
        require(params.amountIn > 0, "ZenithRouter: Zero input amount");
        require(params.recipient != address(0), "ZenithRouter: Zero recipient address");

        uint256 protocolFee = feeManager.calculateFee(params.amountIn);
        uint256 netAmountIn = params.amountIn - protocolFee;

        if (params.tokenIn == address(0)) {
            require(msg.value == params.amountIn, "ZenithRouter: Mismatched msg.value");
            if (protocolFee > 0) {
                (bool feeSuccess, ) = feeManager.treasury().call{value: protocolFee}("");
                require(feeSuccess, "ZenithRouter: Fee transfer failed");
            }
        } else {
            if (protocolFee > 0) {
                bool feeOk = IERC20(params.tokenIn).transferFrom(msg.sender, feeManager.treasury(), protocolFee);
                require(feeOk, "ZenithRouter: Token fee transfer failed");
            }
            bool pullOk = IERC20(params.tokenIn).transferFrom(msg.sender, address(this), netAmountIn);
            require(pullOk, "ZenithRouter: Token in pull failed");
        }

        uint256 currentBalanceBefore = params.tokenOut == address(0)
            ? address(this).balance
            : IERC20(params.tokenOut).balanceOf(address(this));

        for (uint256 i = 0; i < params.hops.length; i++) {
            Hop calldata hop = params.hops[i];
            require(hop.pool != address(0), "ZenithRouter: Invalid pool");

            if (hop.tokenIn != address(0)) {
                IERC20(hop.tokenIn).approve(hop.pool, type(uint256).max);
            }

            (bool success, ) = hop.pool.call(hop.callData);
            require(success, "ZenithRouter: Hop execution failed");
        }

        uint256 currentBalanceAfter = params.tokenOut == address(0)
            ? address(this).balance
            : IERC20(params.tokenOut).balanceOf(address(this));

        amountOut = currentBalanceAfter - currentBalanceBefore;
        require(amountOut >= params.minAmountOut, "ZenithRouter: Slippage limit exceeded");

        if (params.tokenOut == address(0)) {
            (bool sendOk, ) = params.recipient.call{value: amountOut}("");
            require(sendOk, "ZenithRouter: Output ETH transfer failed");
        } else {
            bool sendOk = IERC20(params.tokenOut).transfer(params.recipient, amountOut);
            require(sendOk, "ZenithRouter: Output token transfer failed");
        }

        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            protocolFee,
            params.recipient
        );
    }
}
