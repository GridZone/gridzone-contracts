// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "../../lib/access/OwnableUpgradeable.sol";
import "../../lib/opensea/OpenseaERC721Upgradeable.sol";
import "../../PriceOracle/IPriceOracleUpgradeable.sol";
import "../../NYM/INymLib.sol";

contract MultiModelNftUpgradeableBase is OwnableUpgradeable, OpenseaERC721Upgradeable, AccessControlUpgradeable {

    struct Model {
        // Bonus percent of the model
        uint8 bonus;
        // Class of the model
        uint8 class;
        // Name of the model
        string name;
        // URI of the model
        string metafileUri;
        // Capacity mintable by user
        uint256 capacity;
        // Count of token of the model
        uint256 supply;
        // Minting price in ETH
        uint256 mintPrice;
        // Default color of the model
        bytes4[] defaultColor;
        // Capacity of airdrop
        uint256 airdropCapacity;
        // Count of token airdropped
        uint256 airdropSupply;
    }

    INymLib public nymLib;
    IPriceOracleUpgradeable public priceOracle;

    uint256 internal _currentTokenId = 0;

    /// @notice The address of the GridZone token
    IERC20Upgradeable public zoneToken;

    // Mapping from token ID to name
    mapping (uint256 => string) internal _tokenName;
    // Mapping if certain name string has already been reserved
    mapping (string => bool) internal _nameReserved;
    // Option to changeable name
    bool public nameChangeable;

    // Option to changeable color
    bool public colorChangeable;
    // Mapping if certain name string has already been reserved
    mapping (uint256 => bytes4[]) internal _colors;

    // Array of models
    Model[] public models;
    // Mapping from token ID to model ID
    mapping (uint256 => uint256) public modelIds;

    // The nonce for airdrop.
    mapping(address => uint256) public airdropNonces;

    // Address of sub-implementation contract
    address public subImpl;

    bytes32 public constant ALLOWED_MINTERS = keccak256("ALLOWED_MINTERS");

    // Events
    event Mint (uint256 indexed modelId, address indexed account, uint256 mintFee, uint256 indexed tokenId);
    event Airdrop (uint256 indexed modelId, address indexed account, uint256 airdropNonce, uint256 indexed tokenId);
    event NameChange (uint256 indexed tokenId, string newName);
    event ColorChange (uint256 indexed tokenId, bytes4[] newColor);
    event NewSubImpl (address indexed newSubImpl);
    event AddModel (uint8 class, string name, string metafileUri, uint256 capacity, uint256 mintPrice, bytes4[] defaultColor, uint8 bonus);
    event ModelNewUri (uint256 indexed modelId, string newUri);
    event ModelNewMintPrice (uint256 indexed modelId, uint256 newMintPrice);
    event ModelNewCapacity (uint256 indexed modelId, uint256 newCapacity);
    event ModelNewAirdropCapacity (uint256 indexed modelId, uint256 newCapacity);

    function _msgSender() internal override view returns (address payable) {
        return EIP712MetaTxUpgradeable.msgSender();
    }

    function modelCount() public view returns (uint256) {
        return models.length;
    }

    uint256[38] private __gap;
}
