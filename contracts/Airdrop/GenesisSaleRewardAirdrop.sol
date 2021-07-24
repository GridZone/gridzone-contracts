// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol"; 

import "../lib/access/Ownable.sol";

contract GenesisSaleRewardAirdrop is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /// @notice The address of the GridZone token
    IERC20 public zoneToken;

    uint256 private constant REWARD_SUPPLY = 140000e18; // 140K ZONE
    uint256 public immutable totalPurchasedAmount;
    uint256 public totalRewardedAmount;

    uint256 private constant DENOMINATOR = 10000;
    uint256 public immutable rewardRate;

    uint32 public immutable rewardsCount;
    uint32 public rewardedCount;
    bool public airdropActivated = false;

    mapping(address => uint256) public purchasedAmounts;

    address public admin;
    address public pendingAdmin;

    event NewPendingAdmin(address indexed newPendingAdmin);
    event NewAdmin(address indexed newAdmin);
    event AirdropActivated(bool activate);
    event RewardClaimed(address indexed account, uint256 purchasedAmount, uint256 rewardAmount);

    modifier onlyAdmin() {
        require(admin == _msgSender(), "Restricted access to admin!");
        _;
    }

    constructor(address _zoneToken, address _ownerAddress, address _adminAddress) Ownable(_ownerAddress) public {
        require(_ownerAddress != address(0), "Owner address is invalid");
        zoneToken = IERC20(_zoneToken);
        admin = _adminAddress;

        (uint256 _totalPurchasedAmount, uint32 _rewardsCount) = _initRewards();
        totalPurchasedAmount = _totalPurchasedAmount;
        rewardsCount = _rewardsCount;
        rewardRate = REWARD_SUPPLY.mul(DENOMINATOR).div(_totalPurchasedAmount);
    }

    receive() external payable {
        require(false, "We will not accept ETH");
    }

    /* Update admin address */
    function setPendingAdmin(address _pendingAdmin) external onlyOwner() {
        pendingAdmin = _pendingAdmin;
        emit NewPendingAdmin(pendingAdmin);
    }

    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "acceptAdmin: Call must come from pendingAdmin.");
        admin = msg.sender;
        pendingAdmin = address(0);
        emit NewAdmin(admin);
    }

    function _initRewards() private returns (uint256 _totalPurchasedAmount, uint32 _rewardsCount) {
        uint256 _amount;
        _amount = 4876597000000000000000; purchasedAmounts[0xAE2a5Bca8E91b1e628453F46636632D7865a5B76] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 1642643200000000000000; purchasedAmounts[0x61befbBA6b5DB03D4564c9D6AD82B0Ff7a174DfC] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 50819274000000000000000; purchasedAmounts[0x3fD778F102e556D9d1b7054Bee1F996354137d60] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 279996000000000000000000; purchasedAmounts[0x504C11bDBE6E29b46E23e9A15d9c8d2e2e795709] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 12833150000000000000000; purchasedAmounts[0x93f5af632Ce523286e033f0510E9b3C9710F4489] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 12833150000000000000000; purchasedAmounts[0xecc8f56792CDb7983Aed06AE5d8eBf2eF1A55651] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 1343980800000000000000000; purchasedAmounts[0x83b4271b054818a93325c7299f006AEc2E90ef96] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 53899230000000000000000; purchasedAmounts[0xF2cDCA7e16407400d966c5DecD58E993C6bb1448] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 7699890000000000000000; purchasedAmounts[0x6e83e5fEa3f5D399BF8004a820A4fed518F26078] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 5133260000000000000000; purchasedAmounts[0x1de70e8fBBFB0Ca0c75234c499b5Db74BAE0D66B] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 128331500000000000000000; purchasedAmounts[0x50e954cCcf4376E3A1e43Ac37070215167baD93A] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 128331500000000000000000; purchasedAmounts[0x86A41524CB61edd8B115A72Ad9735F8068996688] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 128331500000000000000000; purchasedAmounts[0xF47588a5a54A0A2a1De1863A88A120bbc0b4b777] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 25666300000000000000000; purchasedAmounts[0x37b3fAe959F171767E34e33eAF7eE6e7Be2842C3] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 128331500000000000000000; purchasedAmounts[0x5b049c3Bef543a181A720DcC6fEbc9afdab5D377] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 51332600000000000000000; purchasedAmounts[0xEc7B7a7D8e5427e38C1cf57488c1d652924FF65A] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 25666300000000000000000; purchasedAmounts[0x4e6Eeea64b668502C43F5eD3B52c8591A7BB34Fd] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 25666300000000000000000; purchasedAmounts[0xF24A0018befb3D7503b46c110f83D927d64E727d] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 12833150000000000000000; purchasedAmounts[0x47115466E589aDD0E1409ad75e10F965719f69c5] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 14116465000000000000000; purchasedAmounts[0x8Cd05c3F9A1aE00e827312cB190B1d897CC5cC67] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 25666300000000000000000; purchasedAmounts[0x007800BFFc1c88eDbcd21835A71D17A7a87BA42D] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 35010823650000000000000; purchasedAmounts[0x07647C47d6823ad7785155C856b8bD22A4C3C1C4] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 1026652000000000000000; purchasedAmounts[0x526026039434039Ea966075F7bd0f4EBb3EBc6aF] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 23099670000000000000000; purchasedAmounts[0x7D7d7C915053a74DCD4d565619b2Eb36eef6220A] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 1283315000000000000000; purchasedAmounts[0x140CEe91461cCd2E0c8EAAe1580f9C0c5438511C] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 13346476000000000000000; purchasedAmounts[0xB9a0c9D0200A08aF16b4A149b3b9d45758ad29Df] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 1100000000000000000000; purchasedAmounts[0xfb7F46F5ac1189f768d1E3D470346135CeEc699E] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 256663000000000000000; purchasedAmounts[0xaa26cB9e66eDBAf69FeFC3F0847493fcec923734] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 13449141200000000000000; purchasedAmounts[0x76ccA216cEf6869926f20303e8B27A2344285DC7] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 13603139000000000000000; purchasedAmounts[0x50d06F7a017Fb5f5556f5FB4C11fAb0cC0A68b70] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 2566630000000000000000; purchasedAmounts[0x53Eebf648BdA109B9EdF1910Ef24A6ba14ab0806] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 16951406790000000000000; purchasedAmounts[0xBB6f34EC1f57Cd9FBf23A93Eb460B4BdD9CE0E35] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 7369934000000000000000; purchasedAmounts[0xF18Ca3753c5bba51B97Fd410542ca739b4De5E71] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 3079956000000000000000; purchasedAmounts[0x4102968b5eAE824D21f4aeaAB30974D1C257f90b] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 51332600000000000000000; purchasedAmounts[0xfcc34cB29FF87186ec256a1550Eb8c06dF6d8199] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 12833150000000000000000; purchasedAmounts[0x5dc52Bf79Ea83eFf9195540fB0D6265C77Fd5e62] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 8213216000000000000000; purchasedAmounts[0x7D9dCC23989Dddd636850cEd0e68b12478890e0f] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 15099484290000000000000; purchasedAmounts[0x34285C30FcEC41bcdF7C25dd7Cd908bcA7920C7a] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 1159658622000000000000; purchasedAmounts[0xb150B53A0a444eB153d1823C67d22795A3735DDa] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 1925000000000000000000; purchasedAmounts[0xbE3ab975D35c1493a92119658EDFeaEB575F660F] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
        _amount = 11267075250000000000000; purchasedAmounts[0x2781B553CaE0f0502Ee4a6c38cB6459bADef17E8] = _amount; _totalPurchasedAmount = _totalPurchasedAmount.add(_amount); _rewardsCount ++;
    }

    /**
     * @dev Activate/Deactivate the airdrop
     * @param _activate The flag to activate the airdrop
     */
    function activateAirdrop(bool _activate) external onlyOwner() {
        airdropActivated = _activate;
        emit AirdropActivated(airdropActivated);
    }

    function getRewardAmount(address _account) external view returns (uint256 _purchasedAmount, uint256 _rewardAmount) {
        _purchasedAmount = purchasedAmounts[_account];
        _rewardAmount = (0 < _purchasedAmount) ? _purchasedAmount.mul(rewardRate).div(DENOMINATOR) : 0;
    }

    function claimReward(address _account) external onlyAdmin() {
        require(airdropActivated, "The airdrop not activated yet");
        uint256 _purchasedAmount = purchasedAmounts[_account];
        require(0 < _purchasedAmount, "No purchased ZONE token");
        uint256 _rewardAmount = _purchasedAmount.mul(rewardRate).div(DENOMINATOR);

        purchasedAmounts[_account] = 0;
        totalRewardedAmount = totalRewardedAmount.add(_rewardAmount);
        rewardedCount ++;
        zoneToken.safeTransfer(_account, _rewardAmount);

        emit RewardClaimed(_account, _purchasedAmount, _rewardAmount);
    }

    function withdrawLeftToken() external onlyOwner() {
        uint256 _balance = zoneToken.balanceOf(address(this));
        require(0 < _balance, "No balance");
        zoneToken.safeTransfer(owner(), _balance);
    }
}
