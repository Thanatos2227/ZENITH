import { Contract, Provider } from 'ethers';
import {
  ZENITH_TREASURY_ABI,
  ZENITH_FEE_CONTROLLER_ABI,
  getZenithTreasuryAddress,
  getZenithFeeController,
  CANONICAL_NATIVE_ADDRESS
} from '@zenith/contracts';
import { ZenithTreasuryInfo } from './types';

export async function getTreasuryInfo(
  provider: Provider,
  chainId: number
): Promise<ZenithTreasuryInfo> {
  const treasuryAddress = getZenithTreasuryAddress(chainId);
  const feeControllerAddress = getZenithFeeController(chainId);

  if (!treasuryAddress || !feeControllerAddress) {
    throw new Error(`Zenith Treasury / Fee Controller not configured for chain ${chainId}`);
  }

  const treasuryContract = new Contract(treasuryAddress, ZENITH_TREASURY_ABI, provider);
  const feeControllerContract = new Contract(feeControllerAddress, ZENITH_FEE_CONTROLLER_ABI, provider);

  const [owner, protocolFeeBps] = await Promise.all([
    treasuryContract.governance().catch(() => CANONICAL_NATIVE_ADDRESS),
    feeControllerContract.protocolFeeBps().catch(() => 5n)
  ]);

  return {
    chainId,
    treasuryAddress,
    feeControllerAddress,
    defaultFeeBps: Number(protocolFeeBps),
    owner
  };
}
