import React, { useEffect, useState } from 'react';
import { useAccount,useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { fetchBalance } from '@wagmi/core';
import { toastNotification } from '../utils/toastNotification';
import { contractABI, contractAddress, usdtABI, usdtAddress } from '../utils/abis';
import { getBalance } from '@wagmi/core'
import { config } from '../utils/config';

const SwapComponent: React.FC = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract()
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [userAmount, setUserAmount] = useState<string>("");
  const [eCashAmount, setECashAmount] = useState<string>("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const fetchUsdtBalance = async () => {
      if (!address) return;

      const balanceResult = await getBalance(config,{
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
    const rate = 0.16; // 1 ECash = 0.016 USDT
    const amount = parseFloat(userAmount);
    if (!isNaN(amount)) {
      setECashAmount((amount / rate).toFixed(2));
    } else {
      setECashAmount("0.00");
    }
  }, [userAmount]);

  const userAmountInWei = userAmount ? parseUnits(userAmount, 18) : BigInt('0');
  const userAmountInWei2 = userAmount ? parseUnits((parseFloat(userAmount)*2).toString(), 18) :  BigInt('0');


  // const { config } = usePrepareContractWrite({
  //   address: usdtAddress as `0x${string}`,
  //   abi: usdtABI ?? [],
  //   functionName: 'increaseAllowance',
  //   account: address,
  //   args: [contractAddress, userAmountInWei]
  // });

  // const { data, status, write } = useContractWrite(config);

  // const { write: swapContractWrite } = useContractWrite(swapContractConfig);

  const approveFunction = async () => {
    const userAmountNum = parseFloat(userAmount) * 1e18; // Multiply by 1e6 to match 6 decimals
    if (userAmountNum > usdtBalance) {
      toastNotification('Insufficient balance', false);
      return;
    }

    // await write?.();

    const data = await writeContractAsync({
      address: usdtAddress as `0x${string}`,
        abi: usdtABI ?? [],
        functionName: 'increaseAllowance',
        account: address,
        chainId:56,
        args: [contractAddress, userAmountInWei]
      });
    setApproved(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toastNotification('Approval Successful', true);
    // if(status == "success") {
      // await swapFunction()
    // }
  };


  const swapFunction = async () => {
    // if (!approved) {
    //   toastNotification('Approve First', false);
    //   return;
    // }
    console.log(userAmountInWei.toString())
    // swapRefetch();
    
    const data = await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: contractABI,
      functionName: 'swap',
      account: address,
      chainId:56,
      args: [userAmountInWei],
    });

    toastNotification(`${data} please wait`, true);
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
          <h4 className="text-center">1 ECash = 0.16 USDT</h4>
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
                <a onClick={approved?swapFunction:approveFunction} className="btn btn-success btn-lg mx-auto">{approved?"SWAP":"APPROVE"}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapComponent;