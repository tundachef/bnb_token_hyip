import React, { useEffect, useState } from 'react';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { fetchBalance } from '@wagmi/core';
import { toastNotification } from '../utils/toastNotification';
import { contractABI, contractAddress, ecashABI, ecashAddress } from '../utils/abis';

const CopyRefComponent: React.FC = () => {
  const { isConnected, address } = useAccount();
  let baseUrl = "https://estake.org"


  // useEffect(() {
  //   if(isConnected) {
  //     usepreparecontract to signup
  //   } 
  // })

  const copyRefLink = async () => {
    const refLink = address == null 
      ? baseUrl
      : `${baseUrl}?ref=${address}`;

    try {
      await navigator.clipboard.writeText(refLink);
    //   console.log("Link copied to clipboard");
      toastNotification('Link copied to clipboard', true);
    } catch (err) {
      toastNotification('Failed to copy the link', false);
    }
  };

  return (
    <div className="col-xl-12">
      <div className="card">
        <div className="card-body pb-2">
          <h1 className="text-center no-border font-w600 fs-60 mt-2">
            Earn 10% - 5% - 3% - 2% - 1%  <br/>Referral Commission
            {/* <!-- <span className="text-success">USDT(bep20)</span> daily --> */}
          </h1>
          <h4 className="text-center">Copy Referral Link</h4>
          <input
            type="text"
            className="form-control mb-3"
            name="value"
            placeholder={baseUrl}
            value={`${baseUrl}?ref=${address}`}
                      />
          <div className="row">
            <div className="col-xl-12">
              <div className="text-center mt-4 mb-4">
                <a onClick={copyRefLink} className="btn btn-primary btn-lg  mx-auto">Copy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopyRefComponent;
