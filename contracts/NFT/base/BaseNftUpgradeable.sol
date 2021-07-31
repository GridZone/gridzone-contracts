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

interface ISLPToken is IERC20Upgradeable {
    function getReserves() external view returns (uint112, uint112, uint32);
    function token0() external view returns (address);
}

/**
 * @title BaseNftUpgradeable
 * @dev Extends ERC721 Non-Fungible Token Standard basic implementation
 */
contract BaseNftUpgradeable is IBaseNftUpgradeable, OwnableUpgradeable, OpenseaERC721Upgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    uint256 private _currentTokenId = 0;

    // URI of this token
    string private _uri;

    // Capacity of token
    uint256 public capacity;

    // Minting price in ETH
    uint256 private _mintPrice;

    /// @notice The address of the GridZone token
    IERC20Upgradeable public zoneToken;
    ISLPToken public slpZoneEth;

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
    // The block number of airdrop to the user. only one time airdrop is allowed per user.
    mapping (address => uint256) public airdropBlockNumber;

    // Events
    event NewAdmin(address indexed newAdmin);
    event NewOpenseaProxyRegistry (address indexed proxyRegistryAddress);
    event NewUri (string newUri);
    event NewMintPrice (uint256 indexed newMintPrice);
    event NewToken (uint256 indexed tokenId, string newName, bytes4[] newColor);
    event NameChange (uint256 indexed tokenId, string newName);
    event ColorChange (uint256 indexed tokenId, bytes4[] newColor);

    modifier onlyAdmin() {
        require(_admin == _msgSender(), "Restricted access to admin");
        _;
    }

    /**
     * @notice Initializes the contract.
     * @param _ownerAddress Address of owner
     * @param _name Name of NFT
     * @param _symbol Symbol of NFT
     * @param _metafileUri URI of information file for the NFT
     * @param _capacity Capacity of token, If this value is 0, no limited.
     * @param _price Minting price in ETH
     * @param _zoneToken ZONE token address
     * @param _slpZoneEth Sushi swap LP address
     * @param _nameChangeable Option to changeable name
     * @param _colorChangeable Option to changeable color
     * @param _color Default color
     */
    function initialize(
        address _ownerAddress,
        string memory _name,
        string memory _symbol,
        string memory _metafileUri,
        uint256 _capacity,
        uint256 _price,
        address _zoneToken,
        address _slpZoneEth,
        bool _nameChangeable,
        bool _colorChangeable,
        bytes4[] memory _color
    ) public override initializer {
        require(_ownerAddress != address(0), "Owner address is invalid");
        require(_zoneToken != address(0), "ZONE token address is invalid");
        require(_slpZoneEth != address(0), "Sushiswap LP token address is invalid");

        __Ownable_init(_ownerAddress);
		__OpenseaERC721_init_unchained(_name, _symbol, address(0));
        _uri = _metafileUri;
        capacity = (0 < _capacity) ? _capacity : type(uint256).max;
        _mintPrice = _price;
        zoneToken = IERC20Upgradeable(_zoneToken);
        slpZoneEth = ISLPToken(_slpZoneEth);
        nameChangeable = _nameChangeable;
        colorChangeable = _colorChangeable;
        _defaultColor = _color;

        _admin = _ownerAddress;
    }

    function _msgSender() internal override view returns (address payable) {
        return EIP712MetaTxUpgradeable.msgSender();
    }

    /**
     * @dev Return admin address for the airdrop
     */
    function getAdmin() external view returns(address) {
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
        // All tokens use the same URI.
        return _uri;
    }

    function setUri(string memory _metafileUri) external onlyOwner() {
        _uri = _metafileUri;
        emit NewUri(_uri);
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
    function setMintPrice(uint256 price) onlyOwner external {
        _mintPrice = price;
        emit NewMintPrice(_mintPrice);
    }

    /**
     * @dev Returns the price in ZONE for minting a token.
     */
    function mintPriceInZone() public view returns (uint256) {
        if (_mintPrice == 0) return 0;

        (uint112 _reserve0, uint112 _reserve1,) = slpZoneEth.getReserves();
        if (_reserve0 == 0 || _reserve1 == 0) return 0;
        if (slpZoneEth.token0() == address(zoneToken)) {
            return _mintPrice.mul(uint256(_reserve0)).div(uint256(_reserve1));
        } else {
            return _mintPrice.mul(uint256(_reserve1)).div(uint256(_reserve0));
        }
    }

    /**
     * @dev Mints a token
     */
    function mint() external {
        bytes4[] memory emptyColor = new bytes4[](0);
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
        emit NewToken(tokenId, newName, newColor);
    }

    /**
     * @dev Airdrop tokens to the specifeid addresses (Callable by owner).
     *      The count is limited as 30 to avoid spending much gas and to avoid exceed block gas limit.
     */
    function doAirdrop(address[] memory _accounts) external onlyAdmin() {
        require(0 < _accounts.length, "Nft: No account address");
        require(_accounts.length <= 30, "Exceeds limit");
        require((totalSupply() + _accounts.length) <= capacity, "Exceeds capacity");

        bytes4[] memory emptyColor = new bytes4[](0);

        for (uint i = 0; i < _accounts.length; i ++) {
            address account = _accounts[i];
            require(airdropBlockNumber[account] == 0, "Only one time airdrop is allowed per user");
            airdropBlockNumber[account] = block.number;

            uint tokenId = ++ _currentTokenId;
            _safeMint(account, tokenId);
            emit NewToken(tokenId, "", emptyColor);
        }
    }

    function doAirdropBySignature(address[] memory _accounts, bytes[] memory _signatures) external {
        require(0 < _accounts.length, "Nft: No account address");
        require(_accounts.length <= 30, "Exceeds limit");
        require(_accounts.length == _signatures.length, "Mismatch the parameters");
        require((totalSupply() + _accounts.length) <= capacity, "Exceeds capacity");

        bytes4[] memory emptyColor = new bytes4[](0);

        for (uint i = 0; i < _accounts.length; i ++) {
            address account = _accounts[i];
            require(airdropBlockNumber[account] == 0, "Only one time airdrop is allowed per user");
            airdropBlockNumber[account] = block.number;

            bytes memory signature = _signatures[i];
            require(_isValidSignature(account, signature), "The specified account is not allowed for airdrop");

            uint tokenId = ++ _currentTokenId;
            _safeMint(account, tokenId);
            emit NewToken(tokenId, "", emptyColor);
        }
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
        return _nameReserved[toLower(nameString)];
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
        require(validateName(newName) == true, "Nft: invalid name");
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
        _nameReserved[toLower(str)] = isReserve;
    }

    /**
     * @dev Check if the name string is valid (Alphanumeric and spaces without leading or trailing space)
     */
    function validateName(string memory str) public pure returns (bool){
        bytes memory b = bytes(str);
        if(b.length < 1) return false;
        if(b.length > 25) return false; // Cannot be longer than 25 characters
        if(b[0] == 0x20) return false; // Leading space
        if (b[b.length - 1] == 0x20) return false; // Trailing space

        bytes1 lastChar = b[0];

        for(uint i; i<b.length; i++){
            bytes1 char = b[i];

            if (char == 0x20 && lastChar == 0x20) return false; // Cannot contain continous spaces

            if(
                !(char >= 0x30 && char <= 0x39) && //9-0
                !(char >= 0x41 && char <= 0x5A) && //A-Z
                !(char >= 0x61 && char <= 0x7A) && //a-z
                !(char == 0x20) //space
            )
                return false;

            lastChar = char;
        }

        return true;
    }

    /**
     * @dev Converts the string to lowercase
     */
    function toLower(string memory str) public pure returns (string memory){
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            // Uppercase character
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

    /**
     * @dev Returns default color
     */
    function defaultColor() external view returns (bytes4[] memory color) {
        color = _defaultColor;
    }

    /**
     * @dev Returns colors array of the NFT at tokenId
     */
    function tokenColorById(uint256 tokenId) external view returns (bytes4[] memory color) {
        color = _colors[tokenId];
        if (color.length == 0) {
            color = _defaultColor;
        }
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
        require(0 < color.length, "Nft: no color");
        require(_defaultColor.length == color.length, "Nft: color length mismatch");

        _colors[tokenId] = color;
        emit ColorChange(tokenId, _colors[tokenId]);
    }

    uint256[36] private __gap;
}
