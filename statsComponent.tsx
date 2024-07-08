import React, { useEffect, useState } from 'react';
import { readContract } from '@wagmi/core'
import { useAccount } from 'wagmi';
import { contractABI, contractAddress } from '../utils/abis';
import { config } from '../utils/config';
import WithdrawComponent from './withdrawComponent';

const StatsComponent: React.FC = () => {
  const { address } = useAccount();
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [tokensStaked, setTokensStaked] = useState<number>(0);
  const [usdtStaked, setUsdtStaked] = useState<number>(0);
  const [planBalanceLeft, setPlanBalanceLeft] = useState<number>(0);

 
  useEffect(() => {
    const fetchStats = async () => {
    //   const result = await refetch();
    const result = await readContract(config,{
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'userStats',
        args: [address],
      });
    
      if (result) {
        console.log('Type of result.data:', typeof result);
        console.log('Is result.data an array?', Array.isArray(result));
        console.log(result);

        let [usdtBalanceStr, tokensStakedStr, usdtStaked, planBalanceLeft] = result  as any;
        usdtBalanceStr = usdtBalanceStr.toString()
        tokensStakedStr = tokensStakedStr.toString()
        usdtStaked = usdtStaked.toString()
        planBalanceLeft = planBalanceLeft.toString()
        console.log(usdtBalanceStr+ " dsfghjgfdgh" + tokensStakedStr + "dfghyjhrgdfsvfg")
        setUsdtBalance(parseFloat(usdtBalanceStr.endsWith('n') ? usdtBalanceStr.slice(0, -1) : usdtBalanceStr) / 1e18);
        setTokensStaked(parseFloat(tokensStakedStr.endsWith('n') ? tokensStakedStr.slice(0, -1) : tokensStakedStr) / 1e18);
        setUsdtStaked(usdtStaked / 1e18);
        setPlanBalanceLeft(planBalanceLeft / 1e18);
      }
    };

    fetchStats();
    const intervalId = setInterval(fetchStats, 10000); // Fetch data every 10 seconds

    return () => clearInterval(intervalId);
  }, [address]);

  return (
    <div className="col-xl-12">
        {/* <!-- row --> */}
        <div className="row">
            {/* <!-- column --> */}
            <div className="col-lg-6 col-xl-3 col-sm-6">
                <div className="card overflow-hidden">
                    <div className="card-body py-0">
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="me-3">
                                <h2 className=" count-num mb-0">{usdtBalance.toFixed(2)}</h2>
                                <p className="mb-0">USDT Balance</p>
                            </div>
                            <div id="ticketSold"></div>
                        </div>
                        <WithdrawComponent usdtBalance={usdtBalance} />

                    </div>
                </div>
            </div>
            <div className="col-lg-6 col-xl-3 col-sm-6">
                <div className="card overflow-hidden">
                    <div className="card-body py-0 pt-4">
                        <div className="d-flex align-items-center justify-content-between">
                            <h4 className="mb-0">USDT Staked</h4>
                            <div className="d-flex align-items-center">
                                <h2 className="count-num"> {usdtStaked.toFixed(2)}</h2>
                                <span className="fs-16 font-w500 text-success ps-2"><i className="bi bi-caret-up-fill pe-2"></i></span>
                            </div>
                        </div>
                        <div id="totalInvoices"></div>
                    </div>
                </div>
            </div>
            <div className="col-lg-6 col-xl-3 col-sm-6">
                <div className="card overflow-hidden">
                    <div className="card-body py-0 pt-4">
                        <div className="d-flex align-items-center justify-content-between">
                            <h4 className="mb-0">ECash Staked</h4>
                            <div className="d-flex align-items-center">
                                <h2 className="count-num">{tokensStaked.toFixed(2)}</h2>
                                <span className="fs-16 font-w500 text-danger ps-2"><i className="bi bi-caret-down-fill pe-2"></i></span>
                            </div>
                        </div>
                        <div id="paidinvoices"></div>
                    </div>
                </div>
            </div>
            <div className="col-lg-6 col-xl-3 col-sm-6">
                <div className="card overflow-hidden">
                    <div className="card-body py-0 pt-4">
                        <div className="d-flex align-items-center justify-content-between">
                            <h4 className="mb-0">Plan Balance</h4>
                            <div className="d-flex align-items-center">
                                <h2 className="count-num">{planBalanceLeft.toFixed(2)}</h2>
                                <span className="fs-16 font-w500 text-success ps-2"><i className="bi bi-caret-up-fill pe-2"></i></span>
                            </div>
                        </div>
                        <div id="barChart"></div>
                    </div>
                </div>
            </div>
            
        </div>
    </div>
  );
};

export default StatsComponent;
