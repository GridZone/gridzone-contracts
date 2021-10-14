// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

import "../lib/access/OwnableUpgradeable.sol";

contract GridZoneStakingUpgradeable is OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    struct Stake {
        bool exists;
        uint256 stakedTs;   // timestamp when staked
        uint256 unstakedTs; // timestamp when unstaked
        uint256 stakedAmount;   // token amount user staked
        uint256 rewardAmount;   // reward amount when user unstaked
    }

    mapping(address => Stake) public stakes;

    uint256 public totalStakedAmount = 0;
    uint256 public totalStakedCount = 0;
    uint256 public totalUnstakedCount = 0;

    uint256 public constant REWARD_SUPPLY = 2800000e18; // 2.8 million ZONE, 10%
    uint256 public constant STAKE_LIMIT   = 19600000e18; // 19.6 million ZONE, 70% (30% at owner’s address + 40% Crowdsale)
    uint256 public constant MIN_STAKING_AMOUNT = 1e18; // 1 ZONE

    uint public constant DURATION_30 = 30;
    uint public constant DURATION_60 = 60;
    uint public constant DURATION_90 = 90;

    /* REWARD_SUPPLY / STAKE_LIMIT / DURATION_90 / = 0.001587 */
    uint256 public constant REWARD_RATE_NUMERATOR = 1587;
    uint256 public constant REWARD_RATE_DENOMINATOR = 1e6;

    /* Time of the staking opened (ex: 1614556800 -> 2021-03-01T00:00:00Z) */
    uint256 public LAUNCH_TIME;

    IERC20Upgradeable public token;
    IERC20Upgradeable public zoneToken;
    address public vault;

    event NewLaunchTime(uint256 newLaunchTime);
    event NewVault(address indexed newVault);
    event Staked(address indexed staker, uint256 amount);
    event Unstaked(address indexed staker, uint256 stakedAmount, uint256 reward);

    /**
     * @notice Initializes the contract.
     * @param _ownerAddress Address of owner
     * @param _token token address
     * @param _zoneToken ZONE token address
     * @param _vaultAddr Vault address of ZONE token
     */
    function initialize(
        address _ownerAddress,
        address _token,
        address _zoneToken,
        address _vaultAddr
    ) public initializer {
        require(_ownerAddress != address(0), "Owner address is invalid");

        __Ownable_init(_ownerAddress);
        __ReentrancyGuard_init();
        token = IERC20Upgradeable(_token);
        zoneToken = IERC20Upgradeable(_zoneToken);
        vault = _vaultAddr;

        LAUNCH_TIME = block.timestamp  / 1  days * 1  days;
    }

    /**
     * @dev PUBLIC FACING: External helper for the current day number since launch time
     * @return Current day number (zero-based)
     */
    function currentDay() public view returns (uint) {
        return _day(LAUNCH_TIME);
    }

    function _day(uint256 _startTs) internal view returns (uint) {
        if (block.timestamp < _startTs){
            return 0;
        }else{
            return (block.timestamp - _startTs) / 1 days;
        }
    }

    function isOpen() public view returns (bool) {
        if (STAKE_LIMIT <= totalStakedAmount) return false;
        if (DURATION_30 <= currentDay()) return false;
        return true;
    }

    /* Set launch time as today */
    function launchToday() external onlyOwner() {
        require(totalStakedAmount == 0, "We can't change the launch time because already users started staking.");

        LAUNCH_TIME = block.timestamp  / 1  days * 1  days;
        emit NewLaunchTime(LAUNCH_TIME);
    }

    /* Update vault address */
    function setVault(address _vault) external onlyOwner() {
        vault = _vault;
        emit NewVault(vault);
    }

    /**
     * @dev PUBLIC FACING: Stake the specified amount of token.
     * @param amount Number of ZONE to stake
     */
    function startStake(uint256 amount) external nonReentrant() {
        address staker = _msgSender();
        require(isOpen(), "The staking already closed");
        require(!stakes[staker].exists, "This address already staked");
        require(MIN_STAKING_AMOUNT <= amount, "The staking amount is too small");
        require(totalStakedAmount.add(amount) <= STAKE_LIMIT, "Exceed the staking limit");

        token.safeTransferFrom(staker, address(this), amount);

        stakes[staker] = Stake({
            exists: true,
            stakedTs: block.timestamp,
            unstakedTs: 0,
            stakedAmount: amount,
            rewardAmount: 0
        });
        totalStakedAmount = totalStakedAmount.add(amount);
        totalStakedCount ++;

        emit Staked(staker, amount);
    }

    function endStake() external nonReentrant() {
        address _staker = _msgSender();
        require(stakes[_staker].exists, "User didn't stake");
        require(stakes[_staker].unstakedTs == 0, "User already unstaked");

        Stake storage stake = stakes[_staker];

        uint256 amount = stake.stakedAmount;
        uint256 reward = 0;
        token.safeTransfer(_staker, amount);
        if (isOpen() == false) {
            // reward started
            reward = _calcReward(stake.stakedTs, amount);
            if (0 < reward) {
                zoneToken.safeTransferFrom(vault, _staker, reward);
            }
        }

        stake.unstakedTs = block.timestamp;
        stake.rewardAmount = reward;

        totalUnstakedCount ++;

        emit Unstaked(_staker, amount, reward);
    }

    function _calcReward(uint256 _stakedTs, uint256 _stakedAmount) internal view returns (uint256) {
        uint stakedDay = _day(_stakedTs);
        if (DURATION_90 < stakedDay) {
            stakedDay = DURATION_90;
        } else if (stakedDay < DURATION_30) {
            return 0;
        }
        return _stakedAmount.mul(stakedDay).mul(REWARD_RATE_NUMERATOR).div(REWARD_RATE_DENOMINATOR);
    }

    function getStakeInfo(address staker) external view returns (uint256 stakedAmount, uint stakedPeriod, uint256 rewardAmount, bool isEnded) {
        Stake memory stake = stakes[staker];
        if (stake.exists == false) {
            return (0, 0, 0, false);
        }

        stakedAmount = stake.stakedAmount;

        uint256 endTs;
        if (stakes[staker].unstakedTs != 0) {
            // User already unstaked
            isEnded = true;
            endTs = stakes[staker].unstakedTs;
            rewardAmount = stake.rewardAmount;
        } else {
            isEnded = false;
            endTs = block.timestamp;
            if (isOpen() == false) {
                // reward started
                rewardAmount = _calcReward(stake.stakedTs, stake.stakedAmount);
            } else {
                rewardAmount = 0;
            }
        }

        stakedPeriod = endTs.sub(stake.stakedTs);

        return (stake.stakedAmount, stakedPeriod, rewardAmount, isEnded);
    }
}

contract GridZoneStakingUpgradeableProxy is TransparentUpgradeableProxy {
    constructor(address logic, address admin, bytes memory data) TransparentUpgradeableProxy(logic, admin, data) public {
    }
}