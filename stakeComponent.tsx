import React, { useEffect, useState } from 'react';
import { useWriteContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { fetchBalance } from '@wagmi/core';
import { toastNotification } from '../utils/toastNotification';
import { contractABI, contractAddress, ecashABI, ecashAddress } from '../utils/abis';
import { getBalance } from '@wagmi/core'
import { config } from '../utils/config';

const StakeComponent: React.FC = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract()
  const [approved, setApproved] = useState(false);
  const [eCashBalance, setECashBalance] = useState<number>(0);

  useEffect(() => {
    const fetchECashBalance = async () => {
      if (!address) return;

      const balanceResult =await getBalance(config,{
        address: address as `0x${string}`,
        token: ecashAddress as `0x${string}`,
        chainId: 56,
      });
      console.log(balanceResult)

      if (balanceResult) {
          let balanceString = balanceResult.value.toString();
          if (balanceString.endsWith('n')) {
            balanceString = balanceString.slice(0, -1); // Remove 'n' suffix
          }
          setECashBalance(parseFloat(balanceString) || 0); 
      };
    }

    fetchECashBalance();
    const intervalId = setInterval(fetchECashBalance, 10000);
    return () => clearInterval(intervalId);
  }, [address]);

  const eCashBalanceInWei = eCashBalance ? BigInt(eCashBalance) : BigInt('0');

  // const { config: approveConfig } = usePrepareContractWrite({
  //   address: ecashAddress as `0x${string}`,
  //   abi: ecashABI,
  //   functionName: 'increaseAllowance',
  //   args: [contractAddress, eCashBalanceInWei]
  // });

  // const { write: approveWrite } = useContractWrite(approveConfig);

  // const { config: stakeContractConfig,status:stakeStatus } = usePrepareContractWrite({
  //   address: contractAddress as `0x${string}`,
  //   abi: contractABI,
  //   functionName: 'stake',
  //   args: [eCashBalanceInWei],
  // });


  const approveFunction = async () => {
    if (eCashBalance <= 0) {
      toastNotification('Insufficient ECash balance', false);
      return;
    }

    // await write?.();

    const data = await writeContractAsync({
      address: ecashAddress as `0x${string}`,
      abi: ecashABI,
      functionName: 'increaseAllowance',
      chainId:56,
      args: [contractAddress, eCashBalanceInWei]
    });
    setApproved(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toastNotification('Approval Successful', true);
    // if(status == "success") {
      // await swapFunction()
    // }
  };


  const stakeFunction = async () => {

    const data = await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: contractABI,
      functionName: 'stake',
      args: [eCashBalanceInWei],
      chainId:56
    });
    toastNotification(`${data} please wait`, true);
    await new Promise(resolve => setTimeout(resolve, 10000));
    toastNotification('Stake Successful', true);
    }

  return (
    <div className="col-xl-12">
      <div className="card">
        <div className="card-body pb-2">
          <h1 className="text-center no-border font-w600 fs-60 mt-2">
            <span>Final Step: </span> Stake 100% of your <span className="text-danger">ECash</span> <br />
            {/* <!-- <span className="text-success">USDT(bep20)</span> daily --> */}
          </h1>
          <h4 className="text-center">You&apos;ll receive 2% daily in USDT.</h4>
          <h4 className="text-center">ECash Address: <span className="text-success">{ecashAddress}</span></h4>
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
                          value={eCashBalance/1e18}
                          readOnly={true}
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
                      </div>
                    </div>
                  </div>
                </div>
              <div className="text-center mt-4 mb-4">
                <a onClick={approved?stakeFunction:approveFunction} className="btn btn-primary btn-lg  mx-auto">{approved?"STAKE":"APPROVE"}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeComponent;
