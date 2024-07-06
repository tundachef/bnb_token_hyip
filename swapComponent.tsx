import React, { useEffect, useState } from 'react';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { fetchBalance } from '@wagmi/core';
import { toastNotification } from '../utils/toastNotification';
import { contractABI, contractAddress, usdtABI, usdtAddress } from '../utils/abis';

const SwapComponent: React.FC = () => {
  const { address } = useAccount();
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [userAmount, setUserAmount] = useState<string>("");
  const [eCashAmount, setECashAmount] = useState<string>("");

  useEffect(() => {
    const fetchUsdtBalance = async () => {
      if (!address) return;

      const balanceResult = await fetchBalance({
        address: address as `0x${string}`,
        token: usdtAddress as `0x${string}`,
        chainId: 56,
      });

      if (balanceResult) {
        setUsdtBalance(parseInt(balanceResult.value.toString()) || 0);
      }
    };

    fetchUsdtBalance();
  }, [address]);

  useEffect(() => {
    const rate = 0.016; // 1 ECash = 0.016 USDT
    const amount = parseFloat(userAmount);
    if (!isNaN(amount)) {
      setECashAmount((amount / rate).toFixed(2));
    } else {
      setECashAmount("0.00");
    }
  }, [userAmount]);

  const userAmountInWei = userAmount ? parseUnits(userAmount, 6) : 0;


  const { config } = usePrepareContractWrite({
    address: usdtAddress as `0x${string}`,
    abi: usdtABI ?? [],
    functionName: 'increaseAllowance',
    account: address,
    args: [contractAddress, userAmountInWei]
  });

  const { data, status, write } = useContractWrite(config);

  const { config: swapContractConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'swap',
    account: address,
    args: [userAmountInWei],
  });

  const { status:swapStatus, write: swapContractWrite } = useContractWrite(swapContractConfig);

  const swapFunction = async () => {
    const userAmountNum = parseFloat(userAmount) * 1e6; // Multiply by 1e6 to match 6 decimals
    if (userAmountNum > usdtBalance) {
      toastNotification('Insufficient balance', false);
      return;
    }

    await write?.();
    await new Promise(resolve => setTimeout(resolve, 200));
    await swapContractWrite?.();
    toastNotification(`${swapStatus} please wait`, true);
    await new Promise(resolve => setTimeout(resolve, 10000));
    toastNotification('Swap Successful', true);
  };

  return (
    <div className="col-xl-12">
      <div className="card">
        <div className="card-body pb-2">
          <h1 className="text-center no-border font-w600 fs-60 mt-2">
            <span>Step 1: </span> Buy <span className="text-danger">ECash</span> to<br /> earn <span className="text-success">USDT(bep20)</span> daily
          </h1>
          <h4 className="text-center">1 ECash = 0.016 USDT</h4>
          <div className="row">
            <div className="col-xl-12">
              <div className="text-center mt-3 row justify-content-center">
                <div className="col-xl-5">
                  <div className="row">
                    <div className="col-xl-6 col-sm-6">
                      <input
                        type="number"
                        className="form-control mb-3"
                        id="usdt-input"
                        name="value"
                        placeholder="0.00"
                        value={userAmount}
                        onChange={(e) => setUserAmount(e.target.value)}
                      />
                    </div>
                    <div className="col-xl-6 col-sm-6">
                    <input
                        type="text"
                        className="form-control mb-3"
                        readOnly={true}
                        name="value"
                        placeholder="USDT (BEP20)"
                        value={'USDT (BEP20)'}
                      />
                      {/* <select className="default-select excUSDT (BEP20)ange-select form-control" name="state">
                        <option value="USDT">USDT (BEP20)</option>
                      </select> */}
                    </div>
                  </div>
                </div>
                <div className="col-xl-1">
                  <div className="equalto">=</div>
                </div>
                <div className="col-xl-5">
                  <div className="row">
                    <div className="col-xl-6 col-sm-6">
                      <input
                        type="number"
                        className="form-control mb-3"
                        readOnly={true}
                        name="value"
                        placeholder="0.00"
                        value={eCashAmount}
                      />
                    </div>
                    <div className="col-xl-6 col-sm-6">
                    <input
                        type="text"
                        className="form-control mb-3"
                        readOnly={true}
                        name="value"
                        placeholder="ECash"
                        value={'ECash'}
                      />
                      {/* <select className="default-select exchange-select form-control" name="state">
                        <option value="ECash">ECash</option>
                      </select> */}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-4 mb-4">
                <a onClick={swapFunction} className="btn btn-success btn-lg mx-auto">SWAP</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapComponent;
