// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import "../lib/access/OwnableUpgradeable.sol";

contract GZRewardsUpgradeable is OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    uint256 private constant DENOMINATOR = 10000;

    IERC20Upgradeable public zoneToken;

    // Admin address to check if the claiming is eligable
    address public admin;
    // Limit for the claiming count
    uint256 public limit;
    // Count claimed
    uint256 public claimedCount;
    // The flag to indicate that the account already claimed
    mapping (address => bool) public claimed;
    // The amount that the account claimed
    mapping (address => uint256) private claimedReward;
    mapping (address => uint256) private claimedZoneReward;
    mapping (address => uint256) private claimedZoneExtraReward;
    
    // Amount of rewards
    uint256 public reward;
    uint256 public zoneReward;
    uint256 public zoneExtraReward;

    // Events
    event NewAdmin (address indexed newAdmin);
    event NewLimit (uint256 indexed newLimit);
    event NewReward (uint256 indexed newReward);
    event NewZoneReward (uint256 indexed newZoneReward, uint256 indexed newZoneExtraReward);
    event Claimed (address indexed account, uint256 indexed reward, uint256 indexed zoneReward);

    /**
     * @notice Initializes the contract.
     * @param _ownerAddress Address of owner
     * @param _zoneToken ZONE token address
     */
    function initialize(
        address _ownerAddress,
        address _zoneToken
    ) public initializer {
        require(_ownerAddress != address(0), "Owner address is invalid");

        __Ownable_init(_ownerAddress);
        
        zoneToken = IERC20Upgradeable(_zoneToken);
        admin = _ownerAddress;
        limit = 300;
        reward = 2e17; // 0.2 MATIC
        _setZoneReward(20e18, 2500); // 20 ZONE, 25%
    }

    /**
     * @dev Update admin address
     */
    function setAdmin(address _adminAddress) external onlyOwner() {
        admin = _adminAddress;
        emit NewAdmin(admin);
    }

    function setLimit(uint256 _limit) external onlyOwner() {
        limit = _limit;
        emit NewLimit(limit);
    }

    function setReward(uint256 _reward) external onlyOwner() {
        reward = _reward;
        emit NewReward(reward);
    }

    function setZoneReward(uint256 _reward, uint256 _percent) external onlyOwner() {
        _setZoneReward(_reward, _percent);
        emit NewZoneReward(zoneReward, zoneExtraReward);
    }

    function _setZoneReward(uint256 _reward, uint256 _percent) internal {
        require(_percent < DENOMINATOR, "Percent is too large");
        zoneReward = _reward;
        zoneExtraReward = _reward.mul(_percent).div(DENOMINATOR);
    }

    function doAirdropBySignature(address _account, bool _extra, bytes memory _signature) external {
        require(claimedCount < limit, "Reached to limit");
        require(claimed[_account] == false, "Already claimed");
        require(_isValidSignature(_account, _extra, _signature), "Not allowed");

        claimed[_account] = true;
        claimedCount ++;

        if (0 < reward) {
            claimedReward[_account] = reward;
            TransferHelper.safeTransferETH(_account, reward);
        }
        uint256 zoneAmount = zoneReward + (_extra ? zoneExtraReward : 0);
        if (0 < zoneAmount) {
            claimedZoneReward[_account] = zoneReward;
            if (_extra) {
                claimedZoneExtraReward[_account] = zoneExtraReward;
            }
            zoneToken.safeTransfer(_account, zoneAmount);
        }

        emit Claimed(_account, reward, zoneAmount);
    }

    function _isValidSignature(address _account, bool _extra, bytes memory _signature) internal view returns (bool) {
        bytes32 message = keccak256(abi.encodePacked(address(this), _account, _extra));
        bytes32 messageHash = ECDSAUpgradeable.toEthSignedMessageHash(message);

        // check that the signature is from admin signer.
        address recoveredAddress = ECDSAUpgradeable.recover(messageHash, _signature);
        return (recoveredAddress == admin) ? true : false;
    }

    function getClaimedInfo(address _account) public view returns(bool, uint256, uint256, uint256) {
        return (claimed[_account], claimedReward[_account], claimedZoneReward[_account], claimedZoneExtraReward[_account]);
    }

    /**
     * @dev Withdraw tokens from this contract (Callable by owner)
     */
    function withdraw() external onlyOwner() {
        require(owner() != address(0), "withdraw to the zero address");

        uint256 zoneBalance = zoneToken.balanceOf(address(this));
        if (0 < zoneBalance) {
            zoneToken.safeTransfer(owner(), zoneBalance);
        }
        uint256 balance = address(this).balance;
        if (0 < balance) {
            TransferHelper.safeTransferETH(owner(), balance);
        }
    }

    receive() external payable {}
}

contract GZRewardsUpgradeableProxy is TransparentUpgradeableProxy {
    constructor(address logic, address admin, bytes memory data) TransparentUpgradeableProxy(logic, admin, data) public {
    }
}