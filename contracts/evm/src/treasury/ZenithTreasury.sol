// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "../interfaces/IERC20.sol";

/**
 * @title ZenithTreasury
 * @notice Sovereign Protocol Treasury Vault for ZENITH SWAP.
 * @dev Non-custodial for users: receives strictly protocol-owned fee revenue.
 *      Protected by 2-step governance access control and explicit withdrawal limits.
 */
contract ZenithTreasury {
    address public governance;
    address public pendingGovernance;
    bool public isEmergencyPaused;

    // Accounting
    mapping(address => uint256) public cumulativeFeesCollected;

    // Events
    event FeeReceived(address indexed token, address indexed from, uint256 amount);
    event TreasuryWithdrawal(address indexed token, address indexed recipient, uint256 amount);
    event EmergencyPaused(address indexed actor);
    event EmergencyUnpaused(address indexed actor);
    event EmergencyTokenRescue(address indexed token, address indexed recipient, uint256 amount);
    event OwnershipTransferInitiated(address indexed currentOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    modifier onlyGovernance() {
        require(msg.sender == governance, "ZenithTreasury: Only governance");
        _;
    }

    modifier whenNotPaused() {
        require(!isEmergencyPaused, "ZenithTreasury: Protocol paused");
        _;
    }

    constructor(address _governance) {
        require(_governance != address(0), "ZenithTreasury: Zero governance address");
        governance = _governance;
    }

    /// @notice Allows protocol contracts to deposit native fees
    receive() external payable {
        if (msg.value > 0) {
            cumulativeFeesCollected[address(0)] += msg.value;
            emit FeeReceived(address(0), msg.sender, msg.value);
        }
    }

    /// @notice Explicit entrypoint for smart contracts depositing ERC20 protocol fees
    function depositFee(address token, uint256 amount) external whenNotPaused {
        require(token != address(0), "ZenithTreasury: Use native transfer for native asset");
        require(amount > 0, "ZenithTreasury: Zero amount");

        cumulativeFeesCollected[token] += amount;
        emit FeeReceived(token, msg.sender, amount);

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, msg.sender, address(this), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "ZenithTreasury: TransferFrom failed");
    }

    /// @notice Withdraws protocol revenue to a governance-approved destination
    function withdraw(
        address token,
        address payable recipient,
        uint256 amount
    ) external onlyGovernance whenNotPaused {
        require(recipient != address(0), "ZenithTreasury: Zero recipient");
        require(amount > 0, "ZenithTreasury: Zero amount");

        if (token == address(0)) {
            require(address(this).balance >= amount, "ZenithTreasury: Insufficient native balance");
            emit TreasuryWithdrawal(address(0), recipient, amount);
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ZenithTreasury: Native transfer failed");
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance >= amount, "ZenithTreasury: Insufficient ERC20 balance");
            emit TreasuryWithdrawal(token, recipient, amount);

            (bool success, bytes memory data) = token.call(
                abi.encodeWithSelector(IERC20.transfer.selector, recipient, amount)
            );
            require(success && (data.length == 0 || abi.decode(data, (bool))), "ZenithTreasury: ERC20 transfer failed");
        }
    }

    /// @notice Returns active on-chain balance for a specified token (address(0) for native)
    function getTreasuryBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice Returns lifetime cumulative fees received by the treasury for a token
    function getCollectedFees(address token) external view returns (uint256) {
        return cumulativeFeesCollected[token];
    }

    /// @notice Emergency control
    function setEmergencyPause(bool _paused) external onlyGovernance {
        isEmergencyPaused = _paused;
        if (_paused) {
            emit EmergencyPaused(msg.sender);
        } else {
            emit EmergencyUnpaused(msg.sender);
        }
    }

    /// @notice Emergency token rescue for non-protocol tokens mistakenly transferred to the contract
    function rescueToken(
        address token,
        address payable recipient,
        uint256 amount
    ) external onlyGovernance {
        require(recipient != address(0), "ZenithTreasury: Zero recipient");
        require(amount > 0, "ZenithTreasury: Zero amount");

        emit EmergencyTokenRescue(token, recipient, amount);

        if (token == address(0)) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ZenithTreasury: Native rescue failed");
        } else {
            (bool success, bytes memory data) = token.call(
                abi.encodeWithSelector(IERC20.transfer.selector, recipient, amount)
            );
            require(success && (data.length == 0 || abi.decode(data, (bool))), "ZenithTreasury: Token rescue failed");
        }
    }

    // Two-Step Safe Governance Handover
    function transferGovernance(address _newGovernance) external onlyGovernance {
        require(_newGovernance != address(0), "ZenithTreasury: Zero new governance");
        pendingGovernance = _newGovernance;
        emit OwnershipTransferInitiated(governance, _newGovernance);
    }

    function acceptGovernance() external {
        require(msg.sender == pendingGovernance, "ZenithTreasury: Caller is not pending governance");
        emit OwnershipTransferred(governance, pendingGovernance);
        governance = pendingGovernance;
        pendingGovernance = address(0);
    }
}
