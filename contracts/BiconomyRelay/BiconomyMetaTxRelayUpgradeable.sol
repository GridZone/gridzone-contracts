// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

import "../lib/access/OwnableUpgradeable.sol";
import "../lib/biconomy/BaseRelayRecipient.sol";
import "../lib/eip712/EIP712MetaTxUpgradeable.sol";
import "../lib/eip712/IEIP712MetaTx.sol";
import "./IBiconomyMetaTxRelay.sol";

contract BiconomyMetaTxRelayUpgradeable is IBiconomyMetaTxRelay, OwnableUpgradeable, AccessControlUpgradeable, EIP712MetaTxUpgradeable, BaseRelayRecipient {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    /// @notice The address of the GridZone token
    IERC20Upgradeable public zoneToken;

    bytes32 public constant FACTORIES = keccak256("FACTORIES");
    bytes32 public constant ALLOWED_CONTRACTS = keccak256("ALLOWED_CONTRACTS");
    uint256 public constant MIN_GAS = 42000;
    uint256 public gasPriceInZone;

    mapping(address => uint256) internal _balances;

    event MetaTransactionRelayed(address indexed userAddress, address indexed relayerAddress, address indexed contractAddress, bytes functionSignature);
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event GasPriceInZoneUpdated(uint256 newGasPriceInZone);
    event SetBiconomyForwarder(address indexed _biconomyForwarder);

    function initialize(address _ownerAddress, address _zoneToken, uint256 _gasPriceInZone, address _biconomyForwarder) public initializer {
        require(_ownerAddress != address(0), "Owner address is invalid");

        __Ownable_init(_ownerAddress);
        __AccessControl_init();
        __EIP712MetaTx_init_unchained("BiconomyMetaTxRelayUpgradeable", "1");

        zoneToken = IERC20Upgradeable(_zoneToken);
        trustedForwarder = _biconomyForwarder;

        _setGasPriceInZone(_gasPriceInZone);

        _setupRole(DEFAULT_ADMIN_ROLE, _ownerAddress);
        _setupRole(ALLOWED_CONTRACTS, address(this)); // withdraw will be called via relayMetaTransaction
    }

    /// @notice Function that required for inherict BaseRelayRecipient
    function _msgSender() internal override(ContextUpgradeable, BaseRelayRecipient) view returns (address payable) {
        if(msg.sender == address(this)) {
            return EIP712MetaTxUpgradeable.msgSender();
        } else {
            return BaseRelayRecipient._msgSender();
        }
    }

    /// @notice Function that required for inherict BaseRelayRecipient
    function versionRecipient() external pure override returns (string memory) {
        return "1";
    }

    /*
     * @notice Function to set new trusted forwarder address (Biconomy)
     * @param _biconomyForwarder Address of new trusted forwarder
     */
    function setBiconomyForwarder(address _biconomyForwarder) external onlyOwner {
        trustedForwarder = _biconomyForwarder;
        emit SetBiconomyForwarder(_biconomyForwarder);
    }

    /**
     * @notice Get the number of tokens deposited by the `account`
     * @param account The address of the account to get the balance of
     * @return The number of tokens deposited
     */
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function setGasPriceInZone(uint256 _gasPriceInZone) onlyOwner() external {
        _setGasPriceInZone(_gasPriceInZone);
    }

    function _setGasPriceInZone(uint256 _gasPriceInZone) internal {
        gasPriceInZone = _gasPriceInZone;
        emit GasPriceInZoneUpdated(_gasPriceInZone);
    }

    function allowRelay(address _contractAddress) external override {
        require(hasRole(FACTORIES, _msgSender()), "Relay: The sender is not the allowed factory contract");
        _setupRole(ALLOWED_CONTRACTS, _contractAddress);
    }

    function relayMetaTransaction(
        address _userAddress,
        address _contractAddress,
        bytes memory _functionSignature,
        bytes32 _sigR, bytes32 _sigS, uint8 _sigV
    ) trustedForwarderOnly() external payable returns(bytes memory) {
        uint256 gasLeft = gasleft();

        require(_userAddress != address(0), "Relay: Invalid user address");
        require(hasRole(ALLOWED_CONTRACTS, _contractAddress), "Relay: The contract is not allowed");
        require(convertBytesToBytes4(_functionSignature) != msg.sig, "functionSignature can not be of relayMetaTransaction method");

        bytes memory returnData = IEIP712MetaTx(_contractAddress).executeMetaTransaction{value: msg.value}(_userAddress, _functionSignature, _sigR, _sigS, _sigV);

        emit MetaTransactionRelayed(_userAddress, msg.sender, _contractAddress, _functionSignature);

        address ownerAddress = owner();
        if (ownerAddress != address(0) && 0 < gasPriceInZone) {
            uint256 spentGas = MIN_GAS.add(gasLeft).sub(gasleft());
            uint256 feeInZone = spentGas.mul(gasPriceInZone);

            require(feeInZone <= _balances[_userAddress], "Relay: Insufficient ZONE amount to pay the fee");
            _balances[_userAddress] = _balances[_userAddress].sub(feeInZone);
            _balances[ownerAddress] = _balances[ownerAddress].add(feeInZone);
        }

        return returnData;
    }

    /**
     * @dev Deposit the ZONE token to be used as meta transaction fee.
     *      This function shouldn't be called from relayMetaTransaction because we won't take ZONE for the deposit.
     * @param _amount amount of ZONE token to be deposited
     */
    function deposit(uint256 _amount) external {
        require(0 < _amount, "Relay: Invalid deposit amount");
        address account = _msgSender();
        zoneToken.safeTransferFrom(account, address(this), _amount);
        _balances[account] = _balances[account].add(_amount);
        emit Deposited(account, _amount);
    }

    /**
     * @dev Withdraw the ZONE token deposited for meta transaction fee.
     * @param _amount amount of ZONE token to be withdrawn
     */
    function withdraw(uint256 _amount) external {
        address account = _msgSender();
        require(0 < _amount && _amount <= _balances[account], "Relay: Invalid withdrawal amount");
        _balances[account] = _balances[account].sub(_amount);
        zoneToken.safeTransfer(account, _amount);
        emit Withdrawn(account, _amount);
    }

    uint256[47] private __gap;
}
