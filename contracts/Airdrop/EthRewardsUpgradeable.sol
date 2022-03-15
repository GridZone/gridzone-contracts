// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import "../lib/access/OwnableUpgradeable.sol";

contract EthRewardsUpgradeable is OwnableUpgradeable {
    using SafeMathUpgradeable for uint256;

    // Admin address to check if the claiming is eligable
    address public admin;
    // The total amount claimed
    uint256 public totalClaimedReward;
    // The amount that the account claimed
    mapping (address => uint256) public claimedReward;

    event Claimed (address indexed account, uint256 indexed reward);

    /**
     * @notice Initializes the contract.
     * @param _ownerAddress Address of owner
     * @param _adminAddress Address to verify the reward signature
     */
    function initialize(
        address _ownerAddress,
        address _adminAddress
    ) public initializer {
        require(_ownerAddress != address(0), "Owner address is invalid");

        __Ownable_init(_ownerAddress);
        admin = _adminAddress;
    }

    /**
     * @dev Update admin address
     */
    function setAdmin(address _adminAddress) external onlyOwner() {
        admin = _adminAddress;
    }

    function doAirdropBySignature(address _account, uint256 _claimedAmount, uint256 _amount, bytes memory _signature) external {
        require(claimedReward[_account] == _claimedAmount, "Invalid claimed amount");
        require(_isValidSignature(_account, _claimedAmount, _amount, _signature), "Not allowed");

        totalClaimedReward = totalClaimedReward.add(_amount);
        claimedReward[_account] = claimedReward[_account].add(_amount);
        TransferHelper.safeTransferETH(_account, _amount);
        emit Claimed(_account, _amount);
    }

    function _isValidSignature(address _account, uint256 _claimedAmount, uint256 _amount, bytes memory _signature) internal view returns (bool) {
        bytes32 message = keccak256(abi.encodePacked(address(this), _account, _claimedAmount, _amount));
        bytes32 messageHash = ECDSAUpgradeable.toEthSignedMessageHash(message);

        // check that the signature is from admin signer.
        address recoveredAddress = ECDSAUpgradeable.recover(messageHash, _signature);
        return (recoveredAddress == admin) ? true : false;
    }

    /**
     * @dev Withdraw tokens from this contract (Callable by owner)
     */
    function withdraw() external onlyOwner() {
        require(owner() != address(0), "withdraw to the zero address");

        uint256 balance = address(this).balance;
        if (0 < balance) {
            TransferHelper.safeTransferETH(owner(), balance);
        }
    }

    receive() external payable {}
}

contract EthRewardsUpgradeableProxy is TransparentUpgradeableProxy {
    constructor(address logic, address admin, bytes memory data) TransparentUpgradeableProxy(logic, admin, data) public {
    }
}