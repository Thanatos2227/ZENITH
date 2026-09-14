import { DEXProtocol, Token } from '@zenith/types';
import { Interface } from 'ethers';
import {
  UNISWAP_V3_SWAP_ROUTERS,
  UNISWAP_V3_SWAP_ROUTER_ABI,
  CANONICAL_NATIVE_ADDRESS,
  getUniswapV3Router
} from '@zenith/contracts';
import { DEXProvider, DEXQuote, DEXExecution, DEXQuoteParams } from './types';
import { calculateDEXLiquidityOutput, isNativeToken, resolvePoolTokenAddress } from './dexMath';

export class UniswapV3Provider implements DEXProvider {
  public readonly id: DEXProtocol = 'UNISWAP_V3';
  public readonly protocol: DEXProtocol = 'UNISWAP_V3';
  public readonly name = 'Uniswap V3';
  public readonly supportedChainIds: number[] = Object.keys(UNISWAP_V3_SWAP_ROUTERS).map(Number);

  public isAvailable(chainId: number | string, _tokenIn: Token, _tokenOut: Token): boolean {
    const id = typeof chainId === 'number' ? chainId : Number(chainId);
    return this.supportedChainIds.includes(id);
  }

  public async getQuote(params: DEXQuoteParams): Promise<DEXQuote | null> {
    if (!this.supportedChainIds.includes(params.chainId)) {
      return null;
    }

    try {
      const routerAddress = getUniswapV3Router(params.chainId);

      const calculated = calculateDEXLiquidityOutput({
        chainId: params.chainId,
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippageToleranceBps: params.slippageToleranceBps
      });

      if (!calculated) {
        return null;
      }

      const quoteTimestamp = Date.now();

      return {
        provider: this.protocol,
        providerName: this.name,
        chainId: params.chainId,
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        amountOut: calculated.amountOut,
        minimumAmountOut: calculated.minimumAmountOut,
        amountInRaw: params.amountIn.toString(),
        amountOutRaw: calculated.amountOut.toString(),
        minimumOutRaw: calculated.minimumAmountOut.toString(),
        feeAmount: calculated.feeAmount,
        feeAmountRaw: calculated.feeAmount.toString(),
        feeTierBps: calculated.feeTierBps,
        priceImpactPercent: calculated.priceImpactPercent,
        executionTarget: routerAddress,
        approvalTarget: routerAddress,
        gasEstimate: 185000n,
        gasEstimateUnits: 185000n,
        gasCostUSD: 0.05,
        quoteTimestamp,
        expiration: quoteTimestamp + 15000,
        routePath: [params.tokenIn.address, params.tokenOut.address]
      };
    } catch {
      return null;
    }
  }

  public async buildExecution(
    quote: DEXQuote,
    userAddress: string,
    recipientAddress?: string,
    deadline?: number
  ): Promise<DEXExecution> {
    const chainIdNum = typeof quote.chainId === 'number' ? quote.chainId : Number(quote.chainId);
    const routerAddress = getUniswapV3Router(chainIdNum);
    const iface = new Interface(UNISWAP_V3_SWAP_ROUTER_ABI);
    const recipient = recipientAddress || userAddress;
    const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1200;

    const tokenInAddr = resolvePoolTokenAddress(quote.tokenIn, chainIdNum);
    const tokenOutAddr = resolvePoolTokenAddress(quote.tokenOut, chainIdNum);

    const calldata = iface.encodeFunctionData('exactInputSingle', [
      [
        tokenInAddr,
        tokenOutAddr,
        quote.feeTierBps * 100, // fee in hundredths of a bip (3000 = 0.3%)
        recipient,
        swapDeadline,
        quote.amountIn,
        quote.minimumAmountOut,
        0 // sqrtPriceLimitX96 = 0 for no limit
      ]
    ]);

    const isNative = isNativeToken(quote.tokenIn.address) || Boolean(quote.tokenIn.isNative);

    return {
      to: routerAddress,
      data: calldata,
      value: isNative ? quote.amountIn.toString() : '0',
      chainId: chainIdNum,
      gasLimit: quote.gasEstimate.toString(),
      gasEstimateUnits: quote.gasEstimate,
      approvalTarget: isNative ? CANONICAL_NATIVE_ADDRESS : routerAddress,
      approvalAmount: quote.amountIn.toString(),
      requiredAllowanceRaw: quote.amountIn.toString()
    };
  }
}
