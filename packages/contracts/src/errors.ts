export class ConfigurationError extends Error {
  public readonly code: string;
  constructor(message: string, code = 'CONFIGURATION_ERROR') {
    super(message);
    this.name = 'ConfigurationError';
    this.code = code;
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export class UnsupportedProtocolError extends ConfigurationError {
  constructor(protocol: string, chainId: string | number) {
    super(
      `Protocol ${protocol} is not supported or has no verified deployment on chain ${chainId}`,
      'UNSUPPORTED_PROTOCOL'
    );
    this.name = 'UnsupportedProtocolError';
  }
}

export class RecipientMismatchError extends Error {
  public readonly code = 'RECIPIENT_MISMATCH';
  constructor(expected: string, actual: string) {
    super(
      `[Recipient Security] Recipient mismatch detected. Destination recipient (${actual}) does not match connected wallet (${expected}). Normal trades must settle to connected wallet.`
    );
    this.name = 'RecipientMismatchError';
    Object.setPrototypeOf(this, RecipientMismatchError.prototype);
  }
}

export class SimulationRevertError extends Error {
  public readonly code = 'SIMULATION_REVERT';
  public readonly revertReason?: string;
  constructor(message: string, revertReason?: string) {
    super(message);
    this.name = 'SimulationRevertError';
    this.revertReason = revertReason;
    Object.setPrototypeOf(this, SimulationRevertError.prototype);
  }
}

export class SecurityPolicyViolationError extends Error {
  public readonly code = 'SECURITY_POLICY_VIOLATION';
  public readonly reasons: string[];
  constructor(message: string, reasons: string[] = []) {
    super(message);
    this.name = 'SecurityPolicyViolationError';
    this.reasons = reasons;
    Object.setPrototypeOf(this, SecurityPolicyViolationError.prototype);
  }
}

export class SignerRequiredError extends Error {
  public readonly code = 'SIGNER_REQUIRED';
  constructor(message = 'Wallet connection and active signer required to execute transaction.') {
    super(message);
    this.name = 'SignerRequiredError';
    Object.setPrototypeOf(this, SignerRequiredError.prototype);
  }
}
