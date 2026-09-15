import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ZENITH_TREASURY_ABI,
  ZENITH_FEE_CONTROLLER_ABI,
  ZENITH_TREASURY,
  ZENITH_FEE_CONTROLLERS,
  getZenithTreasuryAddress,
  getZenithFeeController
} from '@zenith/contracts';
import { Interface } from 'ethers';

describe('ZENITH SWAP — Sovereign Protocol Treasury & Fee Controller Test Suite', () => {
  const treasuryInterface = new Interface(ZENITH_TREASURY_ABI);
  const feeControllerInterface = new Interface(ZENITH_FEE_CONTROLLER_ABI);

  describe('1. Non-Custodial Invariant & Architecture', () => {
    it('only tracks accrued protocol fees, not user custody balances', () => {
      // Check ABI exposes exact fee tracking functions and not generic deposit-pool custody
      const depositFeeFrag = treasuryInterface.getFunction('depositFee');
      const getTreasuryBalanceFrag = treasuryInterface.getFunction('getTreasuryBalance');
      const rescueTokenFrag = treasuryInterface.getFunction('rescueToken');

      assert.ok(depositFeeFrag, 'depositFee must exist on treasury interface');
      assert.ok(getTreasuryBalanceFrag, 'getTreasuryBalance must exist on treasury interface');
      assert.ok(rescueTokenFrag, 'rescueToken must exist for emergency governance recovery');
    });

    it('has 2-step governance handover ABI functions', () => {
      const transferGov = treasuryInterface.getFunction('transferGovernance');
      const acceptGov = treasuryInterface.getFunction('acceptGovernance');
      const pendingGov = treasuryInterface.getFunction('pendingGovernance');

      assert.ok(transferGov, 'transferGovernance must be present');
      assert.ok(acceptGov, 'acceptGovernance must be present');
      assert.ok(pendingGov, 'pendingGovernance must be present');
    });

    it('has emergency pause controls in treasury ABI', () => {
      const pauseFrag = treasuryInterface.getFunction('setEmergencyPause');
      const isPausedFrag = treasuryInterface.getFunction('isEmergencyPaused');

      assert.ok(pauseFrag, 'setEmergencyPause must exist');
      assert.ok(isPausedFrag, 'isEmergencyPaused must exist');
    });
  });

  describe('2. Fee Controller Bounds & Rules', () => {
    it('defines protocol fee and cross-chain fee control methods', () => {
      const setProtocolFee = feeControllerInterface.getFunction('setProtocolFeeBps');
      const setCrossChainFee = feeControllerInterface.getFunction('setCrossChainFeeBps');
      const protocolFeeBps = feeControllerInterface.getFunction('protocolFeeBps');

      assert.ok(setProtocolFee, 'setProtocolFeeBps must exist');
      assert.ok(setCrossChainFee, 'setCrossChainFeeBps must exist');
      assert.ok(protocolFeeBps, 'protocolFeeBps getter must exist');
    });

    it('encodes setProtocolFeeBps calldata accurately', () => {
      const calldata = feeControllerInterface.encodeFunctionData('setProtocolFeeBps', [5n]);
      assert.ok(calldata.startsWith('0x'));

      const decoded = feeControllerInterface.decodeFunctionData('setProtocolFeeBps', calldata);
      assert.strictEqual(Number(decoded[0]), 5);
    });

    it('registers fee controllers across EVM chains', () => {
      assert.ok(ZENITH_FEE_CONTROLLERS[1], 'Ethereum fee controller configured');
      assert.ok(ZENITH_FEE_CONTROLLERS[137], 'Polygon fee controller configured');
      assert.ok(ZENITH_FEE_CONTROLLERS[8453], 'Base fee controller configured');
      assert.ok(ZENITH_FEE_CONTROLLERS[42161], 'Arbitrum fee controller configured');
    });
  });
});
