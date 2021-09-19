// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

import "../../lib/access/OwnableUpgradeable.sol";
import "../../lib/opensea/OpenseaERC721Upgradeable.sol";
import "./IBaseNftUpgradeable.sol";
import "../../PriceOracle/IPriceOracleUpgradeable.sol";
import "../../NYM/INymLib.sol";

/**
 * @title BaseNftUpgradeable
 * @dev Extends ERC721 Non-Fungible Token Standard basic implementation
 */
contract BaseNftUpgradeable is IBaseNftUpgradeable, OwnableUpgradeable, OpenseaERC721Upgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    INymLib public nymLib;
    IPriceOracleUpgradeable public priceOracle;

    uint256 private _currentTokenId = 0;

    // URI of this token
    string[] public metafileUris;

    // Capacity of token
    uint256 public capacity;

    // Minting price in ETH
    uint256 private _mintPrice;

    /// @notice The address of the GridZone token
    IERC20Upgradeable public zoneToken;

    // Mapping from token ID to name
    mapping (uint256 => string) private _tokenName;
    // Mapping if certain name string has already been reserved
    mapping (string => bool) private _nameReserved;
    // Option to changeable name
    bool public nameChangeable;

    // Option to changeable color
    bool public colorChangeable;
    // Default color
    bytes4[] private _defaultColor;
    // Mapping if certain name string has already been reserved
    mapping (uint256 => bytes4[]) private _colors;

    // Admin address to do airdrop
    address private _admin;
    // The token IDs which is airdropped to the users. only one time airdrop is allowed per user.
    mapping (address => uint256) public tokenIdsAirdropped;

    // Events
    event NewAdmin (address indexed newAdmin);
    event NewOpenseaProxyRegistry (address indexed proxyRegistryAddress);
    event NewUris (string[] newUris);
    event NewMintPrice (uint256 indexed newMintPrice);
    event Mint (address indexed account, uint256 mintFee, uint256 indexed tokenId, string newName, bytes4[] newColor);
    event Airdrop (address indexed account, uint256 indexed tokenId);
    event NameChange (uint256 indexed tokenId, string newName);
    event ColorChange (uint256 indexed tokenId, bytes4[] newColor);

    modifier onlyAdmin() {
        require(_admin == _msgSender(), "Restricted access to admin");
        _;
    }

    /**
     * @notice Initializes the contract.
     * @param _nymLib Library contract for the token name
     * @param _priceOracle Library contract for the mint price
     * @param _ownerAddress Address of owner
     * @param _name Name of NFT
     * @param _symbol Symbol of NFT
     * @param _metafileUris URIs of information files for the NFT
     * @param _capacity Capacity of token, If this value is 0, no limited.
     * @param _price Minting price in ETH
     * @param _nameChangeable Option to changeable name
     * @param _colorChangeable Option to changeable color
     * @param _color Default color
     */
    function initialize(
        address _nymLib,
        address _priceOracle,
        address _ownerAddress,
        string memory _name,
        string memory _symbol,
        string[] memory _metafileUris,
        uint256 _capacity,
        uint256 _price,
        bool _nameChangeable,
        bool _colorChangeable,
        bytes4[] memory _color
    ) public override initializer {
        require(_nymLib != address(0), "NYM library address is zero");
        require(_priceOracle != address(0), "Price oracle address is zero");
        require(_ownerAddress != address(0), "Owner address is invalid");
        require(0 < _metafileUris.length, "Metafiles must be specified at least one");

        __Ownable_init(_ownerAddress);
		__OpenseaERC721_init_unchained(_name, _symbol, address(0));
        nymLib = INymLib(_nymLib);
        priceOracle = IPriceOracleUpgradeable(_priceOracle);
        metafileUris = _metafileUris;
        capacity = (0 < _capacity) ? _capacity : type(uint256).max;
        _mintPrice = _price;
        nameChangeable = _nameChangeable;
        colorChangeable = _colorChangeable;
        _defaultColor = _color;

        _admin = _ownerAddress;

        zoneToken = IERC20Upgradeable(priceOracle.zoneToken());
        require(address(zoneToken) != address(0), "ZONE token address is invalid");
    }

    function _msgSender() internal override view returns (address payable) {
        return EIP712MetaTxUpgradeable.msgSender();
    }

    /**
     * @dev Return admin address for the airdrop
     */
    function admin() external view returns(address) {
        return _admin;
    }

    /**
     * @dev Update admin address
     */
    function setAdmin(address _adminAddress) external onlyOwner() {
        _admin = _adminAddress;
        emit NewAdmin(_admin);
    }

    /**
     * @dev Set the whitelists of OpenSea proxies.
     */
    function setOpenseaProxyRegistry(address _openseaProxyRegistryAddress) external onlyOwner() {
        proxyRegistryAddress = _openseaProxyRegistryAddress;
        emit NewOpenseaProxyRegistry(proxyRegistryAddress);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return metafileUris[tokenId.mod(metafileUris.length)];
    }

    function setUris(string[] memory _metafileUris) external onlyOwner() {
        require(0 < _metafileUris.length, "Metafiles must be specified at least one");
        metafileUris = _metafileUris;
        emit NewUris(metafileUris);
    }

    /**
     * @dev Returns the price for minting a token.
     */
    function mintPrice() external view returns (uint256) {
        return _mintPrice;
    }

    /**
     * @dev Set the minting price.
     */
    function setMintPrice(uint256 _price) onlyOwner external {
        _mintPrice = _price;
        emit NewMintPrice(_mintPrice);
    }

    /**
     * @dev Returns the price in ZONE for minting a token.
     */
    function mintPriceInZone() public returns (uint256) {
        return priceOracle.mintPriceInZone(_mintPrice);
    }

    /**
     * @dev Mints a token
     */
    function mint() external {
        bytes4[] memory emptyColor;
        _mintToken("", emptyColor);
    }

    function mintWithParams(string memory newName, bytes4[] memory newColor) external {
        _mintToken(newName, newColor);
    }

    function _mintToken(string memory newName, bytes4[] memory newColor) internal {
        require(totalSupply() < capacity, "Exceeds capacity");

        address sender = _msgSender();
        uint256 mintFee = mintPriceInZone();
        if (0 < mintFee) {
            zoneToken.safeTransferFrom(sender, address(this), mintFee);
        }

        uint tokenId = ++ _currentTokenId;
        if (0 < bytes(newName).length) {
            _changeName(tokenId, newName);
        }
        if (0 < newColor.length) {
            _changeColor(tokenId, newColor);
        }

        _safeMint(sender, tokenId);
        emit Mint(sender, mintFee, tokenId, newName, newColor);
    }

    /**
     * @dev Airdrop tokens to the specifeid addresses (Callable by owner).
     *      The count is limited as 30 to avoid spending much gas and to avoid exceed block gas limit.
     */
    function doAirdrop(address[] memory _accounts) external onlyAdmin() {
        require(0 < _accounts.length, "Nft: No account address");
        require(_accounts.length <= 30, "Exceeds limit");
        require((totalSupply() + _accounts.length) <= capacity, "Exceeds capacity");

        for (uint i = 0; i < _accounts.length; i ++) {
            address account = _accounts[i];
            require(tokenIdsAirdropped[account] == 0, "Only one time airdrop is allowed per user");

            uint tokenId = ++ _currentTokenId;
            _safeMint(account, tokenId);
            tokenIdsAirdropped[account] = tokenId;
            emit Airdrop(account, tokenId);
        }
    }

    function doAirdropBySignature(address _account, bytes memory _signature) external {
        require(tokenIdsAirdropped[_account] == 0, "Only one time airdrop is allowed per user");
        require(totalSupply() < capacity, "Exceeds capacity");
        require(_isValidSignature(_account, _signature), "The specified account is not allowed for airdrop");

        uint tokenId = ++ _currentTokenId;
        _safeMint(_account, tokenId);
        tokenIdsAirdropped[_account] = tokenId;
        emit Airdrop(_account, tokenId);
    }

    function _isValidSignature(address _account, bytes memory _signature) internal view returns (bool) {
        bytes32 message = keccak256(abi.encodePacked(address(this), _account));
        bytes32 messageHash = ECDSAUpgradeable.toEthSignedMessageHash(message);

        // check that the signature is from admin signer.
        address recoveredAddress = ECDSAUpgradeable.recover(messageHash, _signature);
        return (recoveredAddress == _admin) ? true : false;
    }

    /**
     * @dev Withdraw tokens from this contract (Callable by owner)
     */
    function withdraw() external onlyOwner() {
        require(owner() != address(0), "Nft: withdraw to the zero address");

        uint256 balance = zoneToken.balanceOf(address(this));
        if (0 < balance) {
            zoneToken.safeTransfer(owner(), balance);
        }
    }

    /**
     * @dev Returns name of the NFT at tokenId.
     */
    function tokenNameById(uint256 tokenId) public view returns (string memory) {
        return _tokenName[tokenId];
    }

    /**
     * @dev Returns if the name has been reserved.
     */
    function isNameReserved(string memory nameString) public view returns (bool) {
        return _nameReserved[nymLib.toLower(nameString)];
    }

    /**
     * @dev Changes the name for tokenId
     */
    function changeName(uint256 tokenId, string memory newName) external {
        require(_msgSender() == ownerOf(tokenId), "Nft: caller is not the token owner");
        require(sha256(bytes(newName)) != sha256(bytes(_tokenName[tokenId])), "Nft: new name is same as the current one");
        _changeName(tokenId, newName);
    }

    function _changeName(uint256 tokenId, string memory newName) internal {
        require(nameChangeable == true, "Nft: disabled to change name");
        require(nymLib.validateName(newName) == true, "Nft: invalid name");
        require(isNameReserved(newName) == false, "Nft: name already reserved");

        if (bytes(_tokenName[tokenId]).length > 0) {
            toggleReserveName(_tokenName[tokenId], false);
        }
        toggleReserveName(newName, true);
        _tokenName[tokenId] = newName;
        emit NameChange(tokenId, _tokenName[tokenId]);
    }

    /**
     * @dev Reserves the name if isReserve is set to true, de-reserves if set to false
     */
    function toggleReserveName(string memory str, bool isReserve) internal {
        _nameReserved[nymLib.toLower(str)] = isReserve;
    }

    /**
     * @dev Returns default color
     */
    function defaultColor() external view returns (bytes4[] memory) {
        return _defaultColor;
    }

    /**
     * @dev Returns colors array of the NFT at tokenId
     */
    function tokenColorById(uint256 tokenId) external view returns (bytes4[] memory) {
        return (0 < _colors[tokenId].length) ? _colors[tokenId] : _defaultColor;
    }

    /**
     * @dev Changes the color for tokenId
     */
    function changeColor(uint256 tokenId, bytes4[] memory color) external {
        require(_msgSender() == ownerOf(tokenId), "Nft: caller is not the token owner");
        _changeColor(tokenId, color);
    }

    function _changeColor(uint256 tokenId, bytes4[] memory color) internal {
        require(colorChangeable == true, "Nft: disabled to change color");
        require(0 == color.length || _defaultColor.length == color.length, "Nft: color length mismatch");

        _colors[tokenId] = color;
        emit ColorChange(tokenId, _colors[tokenId]);
    }

    uint256[35] private __gap;
}
