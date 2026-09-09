pragma solidity ^0.8.24;

interface IZenithRouter {
    struct Hop {
        address pool;
        address tokenIn;
        address tokenOut;
        bytes callData;
        uint256 shareBps;
    }

    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        address recipient;
        uint256 deadline;
        Hop[] hops;
    }

    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 protocolFee,
        address recipient
    );

    function executeSwap(SwapParams calldata params) external payable returns (uint256 amountOut);
}
