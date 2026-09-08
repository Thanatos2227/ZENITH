pragma solidity ^0.8.24;

import "./interfaces/IERC20.sol";

contract ZenithFeeManager {
    address public immutable governance;
    address public treasury;

    uint256 public constant MAX_FEE_BPS = 30;
    uint256 public defaultFeeBps = 5;

    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);
    event DefaultFeeBpsUpdated(uint256 previousBps, uint256 newBps);
    event FeeCollected(address indexed token, address indexed from, uint256 amount, address indexed treasury);

    modifier onlyGovernance() {
        require(msg.sender == governance, "ZenithFee: Only governance");
        _;
    }

    constructor(address _governance, address _treasury) {
        require(_governance != address(0), "ZenithFee: Zero governance");
        require(_treasury != address(0), "ZenithFee: Zero treasury");
        governance = _governance;
        treasury = _treasury;
    }

    function setTreasury(address _newTreasury) external onlyGovernance {
        require(_newTreasury != address(0), "ZenithFee: Zero treasury");
        emit TreasuryUpdated(treasury, _newTreasury);
        treasury = _newTreasury;
    }

    function setDefaultFeeBps(uint256 _newBps) external onlyGovernance {
        require(_newBps <= MAX_FEE_BPS, "ZenithFee: Exceeds MAX_FEE_BPS");
        emit DefaultFeeBpsUpdated(defaultFeeBps, _newBps);
        defaultFeeBps = _newBps;
    }

    function calculateFee(uint256 amount) public view returns (uint256 feeAmount) {
        return (amount * defaultFeeBps) / 10000;
    }

    function collectFee(address token, address from, uint256 amount) external returns (uint256 feeAmount) {
        feeAmount = calculateFee(amount);
        if (feeAmount > 0) {
            if (token == address(0)) {
                require(address(this).balance >= feeAmount, "ZenithFee: Insufficient ETH");
                (bool success, ) = treasury.call{value: feeAmount}("");
                require(success, "ZenithFee: ETH transfer failed");
            } else {
                bool ok = IERC20(token).transferFrom(from, treasury, feeAmount);
                require(ok, "ZenithFee: Token transfer failed");
            }
            emit FeeCollected(token, from, feeAmount, treasury);
        }
    }
}
