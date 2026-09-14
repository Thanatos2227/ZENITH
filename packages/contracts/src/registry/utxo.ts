import { ConfigurationError } from '../errors';

/**
 * UTXO / Bitcoin Network Configuration
 * Native UTXO networks do not use EVM/Solana smart contract addresses.
 */
export class UTXORegistry {
  public static getDepositAddress(): string {
    throw new ConfigurationError(
      'Native UTXO cross-chain settlement requires direct HTLC / SPV verification or configured federated bridge vault.',
      'UTXO_BRIDGE_UNCONFIGURED'
    );
  }
}
