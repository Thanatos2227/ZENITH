import { DEXProtocol, Token } from '@zenith/types';
import { Interface } from 'ethers';
import {
  QUICKSWAP_V3_ROUTER_ABI,
  QUICKSWAP_V2_ROUTER_ABI,
  QUICKSWAP_V2_ROUTER,
  CANONICAL_NATIVE_ADDRESS,
  getQuickSwapRouter
} from '@zenith/contracts';
import { DEXProvider, DEXQuote, DEXExecution, DEXQuoteParams } from './types';
import { calculateDEXLiquidityOutput, isNativeToken, resolvePoolTokenAddress } from './dexMath';

export class QuickSwapProvider implements DEXProvider {
  public readonly id: DEXProtocol = 'QUICKSWAP';
  public readonly protocol: DEXProtocol = 'QUICKSWAP';
  public readonly name = 'QuickSwap V3';
  public readonly supportedChainIds: number[] = [137];

  public isAvailable(chainId: number | string, _tokenIn: Token, _tokenOut: Token): boolean {
    const id = typeof chainId === 'number' ? chainId : (chainId === 'polygon' ? 137 : Number(chainId));
    return this.supportedChainIds.includes(id);
  }

  public async getQuote(params: DEXQuoteParams): Promise<DEXQuote | null> {
    if (!this.supportedChainIds.includes(params.chainId)) {
      return null;
    }

    try {
      const routerAddress = getQuickSwapRouter(params.chainId);

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
        gasEstimate: 175000n,
        gasEstimateUnits: 175000n,
        gasCostUSD: 0.04,
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
    const routerAddress = getQuickSwapRouter(chainIdNum);
    const recipient = recipientAddress || userAddress;
    const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1200;

    const tokenInAddr = resolvePoolTokenAddress(quote.tokenIn, chainIdNum);
    const tokenOutAddr = resolvePoolTokenAddress(quote.tokenOut, chainIdNum);

    const isNativeIn = isNativeToken(quote.tokenIn.address) || Boolean(quote.tokenIn.isNative);
    const isNativeOut = isNativeToken(quote.tokenOut.address) || Boolean(quote.tokenOut.isNative);

    if (isNativeIn) {
      const v2Iface = new Interface(QUICKSWAP_V2_ROUTER_ABI);
      const calldata = v2Iface.encodeFunctionData('swapExactETHForTokens', [
        quote.minimumAmountOut,
        [tokenInAddr, tokenOutAddr],
        recipient,
        swapDeadline
      ]);
      return {
        to: QUICKSWAP_V2_ROUTER,
        data: calldata,
        value: quote.amountIn.toString(),
        chainId: chainIdNum,
        gasLimit: quote.gasEstimate.toString(),
        gasEstimateUnits: quote.gasEstimate,
        approvalTarget: CANONICAL_NATIVE_ADDRESS,
        approvalAmount: '0',
        requiredAllowanceRaw: '0'
      };
    } else if (isNativeOut) {
      const v2Iface = new Interface(QUICKSWAP_V2_ROUTER_ABI);
      const calldata = v2Iface.encodeFunctionData('swapExactTokensForETH', [
        quote.amountIn,
        quote.minimumAmountOut,
        [tokenInAddr, tokenOutAddr],
        recipient,
        swapDeadline
      ]);
      return {
        to: QUICKSWAP_V2_ROUTER,
        data: calldata,
        value: '0',
        chainId: chainIdNum,
        gasLimit: quote.gasEstimate.toString(),
        gasEstimateUnits: quote.gasEstimate,
        approvalTarget: QUICKSWAP_V2_ROUTER,
        approvalAmount: quote.amountIn.toString(),
        requiredAllowanceRaw: quote.amountIn.toString()
      };
    }

    const iface = new Interface(QUICKSWAP_V3_ROUTER_ABI);
    const calldata = iface.encodeFunctionData('exactInputSingle', [
      [
        tokenInAddr,
        tokenOutAddr,
        recipient,
        swapDeadline,
        quote.amountIn,
        quote.minimumAmountOut,
        0
      ]
    ]);

    return {
      to: routerAddress,
      data: calldata,
      value: '0',
      chainId: chainIdNum,
      gasLimit: quote.gasEstimate.toString(),
      gasEstimateUnits: quote.gasEstimate,
      approvalTarget: routerAddress,
      approvalAmount: quote.amountIn.toString(),
      requiredAllowanceRaw: quote.amountIn.toString()
    };
  }
}
