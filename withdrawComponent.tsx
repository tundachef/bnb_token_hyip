import React from 'react';
import { useWriteContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { toastNotification } from '../utils/toastNotification';
import { contractABI, contractAddress } from '../utils/abis';

interface WithdrawComponentProps {
  usdtBalance: number;
}

const WithdrawComponent: React.FC<WithdrawComponentProps> = ({ usdtBalance }) => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract()
  const usdtBalanceInWei = parseUnits(usdtBalance.toString(), 6); // Assuming USDT has 6 decimals

  // const { write: withdrawContractWrite } = useContractWrite(withdrawContractConfig);

  const withdrawFunction = async () => {
    if (usdtBalanceInWei <= 0) {
      toastNotification('Insufficient USDT balance', false);
      return;
    }

    try {
      const data = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'withdrawUSDT',
        args: [usdtBalanceInWei],
        chainId:56,
      });
    
      toastNotification(`${data} please wait`, true);
      await new Promise(resolve => setTimeout(resolve, 10000));
      toastNotification('Withdraw Successful', true);
    } catch (error) {
      toastNotification('An error occurred', false);
    }
  };

  return (
    <a
      href="javascript:void(0)"
      className="btn btn-primary btn-sm light text-uppercase btn-block"
      onClick={withdrawFunction}
      style={{marginBottom:"0.25rem"}}
    >
      Withdraw
    </a>
  );
};

export default WithdrawComponent;
