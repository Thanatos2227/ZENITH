// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title ZenithFeeController
 * @notice Centralized, auditable protocol fee configuration for ZENITH SWAP (V1, V2, V3, and Cross-Chain).
 * @dev Enforces strict protocol fee ceilings (max 30 BPS / 0.30%) to prevent governance fee manipulation.
 */
contract ZenithFeeController {
    address public governance;
    address public pendingGovernance;
    address public treasury;

    // Protocol Fee Configuration (in Basis Points, 1 BPS = 0.01%)
    uint256 public constant MAX_PROTOCOL_FEE_BPS = 30; // Max 0.30%
    uint256 public protocolFeeBps = 5;                  // Default 0.05%
    uint256 public crossChainFeeBps = 5;                // Default 0.05%

    // V1 Default Swap Fee
    uint256 public v1TotalFeeBps = 30;                  // 0.30%

    // V2 Allowed Fee Tiers (in BPS)
    mapping(uint24 => bool) public isV2FeeTierAllowed;

    // V3 Allowed Fee Tiers (in hundredths of a pip: 100 = 0.01%, 500 = 0.05%, 3000 = 0.30%, 10000 = 1.00%)
    mapping(uint24 => bool) public isV3FeeTierAllowed;
    mapping(uint24 => int24) public v3TickSpacings;

    // Events
    event ProtocolFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event CrossChainFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event GovernanceTransferInitiated(address indexed currentGovernance, address indexed newGovernance);
    event GovernanceTransferred(address indexed oldGovernance, address indexed newGovernance);
    event V2FeeTierConfigured(uint24 indexed feeTierBps, bool allowed);
    event V3FeeTierConfigured(uint24 indexed feeTier, int24 tickSpacing, bool allowed);

    modifier onlyGovernance() {
        require(msg.sender == governance, "ZenithFeeController: Only governance");
        _;
    }

    constructor(address _governance, address _treasury) {
        require(_governance != address(0), "ZenithFeeController: Zero governance address");
        require(_treasury != address(0), "ZenithFeeController: Zero treasury address");
        governance = _governance;
        treasury = _treasury;

        // Initialize standard V2 fee tiers
        isV2FeeTierAllowed[5] = true;   // 0.05%
        isV2FeeTierAllowed[30] = true;  // 0.30%
        isV2FeeTierAllowed[100] = true; // 1.00%

        // Initialize standard V3 fee tiers and corresponding tick spacings
        _enableV3FeeTier(100, 1);    // 0.01% - Tick spacing 1 (stable pairs)
        _enableV3FeeTier(500, 10);   // 0.05% - Tick spacing 10 (correlated pairs)
        _enableV3FeeTier(3000, 60);  // 0.30% - Tick spacing 60 (standard pairs)
        _enableV3FeeTier(10000, 200);// 1.00% - Tick spacing 200 (volatile/exotic pairs)
    }

    function _enableV3FeeTier(uint24 feeTier, int24 tickSpacing) internal {
        isV3FeeTierAllowed[feeTier] = true;
        v3TickSpacings[feeTier] = tickSpacing;
        emit V3FeeTierConfigured(feeTier, tickSpacing, true);
    }

    function setProtocolFeeBps(uint256 _newFeeBps) external onlyGovernance {
        require(_newFeeBps <= MAX_PROTOCOL_FEE_BPS, "ZenithFeeController: Protocol fee exceeds maximum ceiling");
        emit ProtocolFeeUpdated(protocolFeeBps, _newFeeBps);
        protocolFeeBps = _newFeeBps;
    }

    function setCrossChainFeeBps(uint256 _newFeeBps) external onlyGovernance {
        require(_newFeeBps <= MAX_PROTOCOL_FEE_BPS, "ZenithFeeController: Cross-chain fee exceeds ceiling");
        emit CrossChainFeeUpdated(crossChainFeeBps, _newFeeBps);
        crossChainFeeBps = _newFeeBps;
    }

    function setTreasury(address _newTreasury) external onlyGovernance {
        require(_newTreasury != address(0), "ZenithFeeController: Zero treasury address");
        emit TreasuryUpdated(treasury, _newTreasury);
        treasury = _newTreasury;
    }

    function configureV2FeeTier(uint24 feeTierBps, bool allowed) external onlyGovernance {
        require(feeTierBps <= 500, "ZenithFeeController: V2 fee tier too high");
        isV2FeeTierAllowed[feeTierBps] = allowed;
        emit V2FeeTierConfigured(feeTierBps, allowed);
    }

    function configureV3FeeTier(uint24 feeTier, int24 tickSpacing, bool allowed) external onlyGovernance {
        require(feeTier <= 20000, "ZenithFeeController: V3 fee tier exceeds 2%");
        require(tickSpacing > 0 && tickSpacing <= 16384, "ZenithFeeController: Invalid tick spacing");
        isV3FeeTierAllowed[feeTier] = allowed;
        if (allowed) {
            v3TickSpacings[feeTier] = tickSpacing;
        }
        emit V3FeeTierConfigured(feeTier, tickSpacing, allowed);
    }

    // Two-Step Safe Governance Handover
    function transferGovernance(address _newGovernance) external onlyGovernance {
        require(_newGovernance != address(0), "ZenithFeeController: Zero new governance");
        pendingGovernance = _newGovernance;
        emit GovernanceTransferInitiated(governance, _newGovernance);
    }

    function acceptGovernance() external {
        require(msg.sender == pendingGovernance, "ZenithFeeController: Caller is not pending governance");
        emit GovernanceTransferred(governance, pendingGovernance);
        governance = pendingGovernance;
        pendingGovernance = address(0);
    }
}
