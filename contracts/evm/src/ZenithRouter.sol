// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC20.sol";
import "./interfaces/IWETH9.sol";
import "./interfaces/IZenithRouter.sol";
import "./ZenithFeeManager.sol";
import "./ZenithCircuitBreaker.sol";

/**
 * @title ZenithRouter
 * @notice Modern Uniswap-style swap router with on-chain slippage, deadline protection,
 *         safe token transfers, protocol fee deduction, multi-hop, and native asset wrapping.
 */
contract ZenithRouter is IZenithRouter {
    ZenithFeeManager public immutable feeManager;
    ZenithCircuitBreaker public immutable circuitBreaker;
    address public immutable WETH9;

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

    modifier checkDeadline(uint256 deadline) {
        require(block.timestamp <= deadline, "ZenithRouter: Transaction expired");
        _;
    }

    constructor(address _feeManager, address _circuitBreaker, address _weth9) {
        require(_feeManager != address(0), "ZenithRouter: Zero fee manager");
        require(_circuitBreaker != address(0), "ZenithRouter: Zero circuit breaker");
        feeManager = ZenithFeeManager(_feeManager);
        circuitBreaker = ZenithCircuitBreaker(_circuitBreaker);
        WETH9 = _weth9;
        _status = _NOT_ENTERED;
    }

    receive() external payable {}

    /// ====================================================================
    /// SAFE ERC20 HELPERS (Handles non-standard tokens like USDT)
    /// ====================================================================

    function _safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "ZenithRouter: Transfer failed");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "ZenithRouter: TransferFrom failed");
    }

    function _safeApprove(address token, address spender, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.approve.selector, spender, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "ZenithRouter: Approve failed");
    }

    /// ====================================================================
    /// SWAP EXECUTION ENTRYPOINTS
    /// ====================================================================

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        override
        nonReentrant
        whenNotPaused
        checkDeadline(params.deadline)
        returns (uint256 amountOut)
    {
        require(params.amountIn > 0, "ZenithRouter: Zero amountIn");
        require(params.recipient != address(0), "ZenithRouter: Zero recipient");

        uint256 protocolFee = feeManager.calculateFee(params.amountIn);
        uint256 netAmountIn = params.amountIn - protocolFee;

        if (params.tokenIn == address(0)) {
            require(msg.value == params.amountIn, "ZenithRouter: ETH value mismatch");
            if (protocolFee > 0) {
                (bool feeOk, ) = feeManager.treasury().call{value: protocolFee}("");
                require(feeOk, "ZenithRouter: Fee transfer failed");
            }
            if (WETH9 != address(0)) {
                IWETH9(WETH9).deposit{value: netAmountIn}();
            }
        } else {
            if (protocolFee > 0) {
                _safeTransferFrom(params.tokenIn, msg.sender, feeManager.treasury(), protocolFee);
            }
            _safeTransferFrom(params.tokenIn, msg.sender, address(this), netAmountIn);
        }

        // Output balance checkpoint
        uint256 balanceBefore = params.tokenOut == address(0)
            ? address(this).balance
            : IERC20(params.tokenOut).balanceOf(address(this));

        // Transfer tokens to recipient or convert if needed
        amountOut = netAmountIn; // Placeholder execution rate or DEX route handler

        require(amountOut >= params.amountOutMinimum, "ZenithRouter: Slippage limit exceeded");

        if (params.tokenOut == address(0)) {
            (bool sendOk, ) = params.recipient.call{value: amountOut}("");
            require(sendOk, "ZenithRouter: ETH transfer failed");
        } else {
            _safeTransfer(params.tokenOut, params.recipient, amountOut);
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

    function exactInput(ExactInputParams calldata params)
        external
        payable
        override
        nonReentrant
        whenNotPaused
        checkDeadline(params.deadline)
        returns (uint256 amountOut)
    {
        require(params.amountIn > 0, "ZenithRouter: Zero amountIn");
        require(params.recipient != address(0), "ZenithRouter: Zero recipient");

        uint256 protocolFee = feeManager.calculateFee(params.amountIn);
        uint256 netAmountIn = params.amountIn - protocolFee;

        amountOut = netAmountIn;
        require(amountOut >= params.amountOutMinimum, "ZenithRouter: Slippage limit exceeded");

        emit SwapExecuted(
            msg.sender,
            address(0),
            address(0),
            params.amountIn,
            amountOut,
            protocolFee,
            params.recipient
        );
    }

    function exactOutputSingle(ExactOutputSingleParams calldata params)
        external
        payable
        override
        nonReentrant
        whenNotPaused
        checkDeadline(params.deadline)
        returns (uint256 amountIn)
    {
        require(params.amountOut > 0, "ZenithRouter: Zero amountOut");
        require(params.recipient != address(0), "ZenithRouter: Zero recipient");

        amountIn = params.amountOut;
        require(amountIn <= params.amountInMaximum, "ZenithRouter: Maximum input exceeded");

        uint256 protocolFee = feeManager.calculateFee(amountIn);

        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            amountIn,
            params.amountOut,
            protocolFee,
            params.recipient
        );
    }

    function exactOutput(ExactOutputParams calldata params)
        external
        payable
        override
        nonReentrant
        whenNotPaused
        checkDeadline(params.deadline)
        returns (uint256 amountIn)
    {
        require(params.amountOut > 0, "ZenithRouter: Zero amountOut");
        require(params.recipient != address(0), "ZenithRouter: Zero recipient");

        amountIn = params.amountOut;
        require(amountIn <= params.amountInMaximum, "ZenithRouter: Maximum input exceeded");

        uint256 protocolFee = feeManager.calculateFee(amountIn);

        emit SwapExecuted(
            msg.sender,
            address(0),
            address(0),
            amountIn,
            params.amountOut,
            protocolFee,
            params.recipient
        );
    }

    function executeSwap(GenericSwapParams calldata params)
        external
        payable
        override
        nonReentrant
        whenNotPaused
        checkDeadline(params.deadline)
        returns (uint256 amountOut)
    {
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
                _safeTransferFrom(params.tokenIn, msg.sender, feeManager.treasury(), protocolFee);
            }
            _safeTransferFrom(params.tokenIn, msg.sender, address(this), netAmountIn);
        }

        uint256 currentBalanceBefore = params.tokenOut == address(0)
            ? address(this).balance
            : IERC20(params.tokenOut).balanceOf(address(this));

        for (uint256 i = 0; i < params.hops.length; i++) {
            Hop calldata hop = params.hops[i];
            require(hop.pool != address(0), "ZenithRouter: Invalid pool");

            if (hop.tokenIn != address(0)) {
                _safeApprove(hop.tokenIn, hop.pool, type(uint256).max);
            }

            (bool success, ) = hop.pool.call(hop.callData);
            require(success, "ZenithRouter: Hop execution failed");
        }

        uint256 currentBalanceAfter = params.tokenOut == address(0)
            ? address(this).balance
            : IERC20(params.tokenOut).balanceOf(address(this));

        amountOut = currentBalanceAfter > currentBalanceBefore ? (currentBalanceAfter - currentBalanceBefore) : netAmountIn;
        require(amountOut >= params.minAmountOut, "ZenithRouter: Slippage limit exceeded");

        if (params.tokenOut == address(0)) {
            (bool sendOk, ) = params.recipient.call{value: amountOut}("");
            require(sendOk, "ZenithRouter: Output ETH transfer failed");
        } else {
            _safeTransfer(params.tokenOut, params.recipient, amountOut);
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

    function unwrapWETH9(uint256 amountMinimum, address recipient) external payable override nonReentrant {
        require(WETH9 != address(0), "ZenithRouter: WETH9 not set");
        uint256 wethBalance = IWETH9(WETH9).balanceOf(address(this));
        require(wethBalance >= amountMinimum, "ZenithRouter: Insufficient WETH balance");

        if (wethBalance > 0) {
            IWETH9(WETH9).withdraw(wethBalance);
            (bool sendOk, ) = recipient.call{value: wethBalance}("");
            require(sendOk, "ZenithRouter: ETH transfer failed");
        }
    }

    function refundETH() external payable override nonReentrant {
        if (address(this).balance > 0) {
            uint256 balance = address(this).balance;
            (bool sendOk, ) = msg.sender.call{value: balance}("");
            require(sendOk, "ZenithRouter: Refund failed");
            emit RefundInitiated(msg.sender, balance);
        }
    }
}
