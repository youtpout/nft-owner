// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Player is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable,
    IERC1155Receiver
{
    using Counters for Counters.Counter;
    // we store the address of weapon contract
    IERC1155 public weaponContract;

    mapping(uint256 => uint256) public weaponEquiped;

    Counters.Counter private _tokenIdCounter;

    constructor(address _weaponContract) ERC721("Player", "PNFT") {
        weaponContract = IERC1155(_weaponContract);
    }

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // we will use erc1155 receiver to attach a weapon
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) public virtual override returns (bytes4) {
        // prevent from attach multiple weapons
        require(value == 1, "Incorrect amount");
        // check if the operator is the weapon contract
        require(operator == address(weaponContract), "Not weapon contract");
        // decode the nft receiver
        uint256 idReceiver = abi.decode(data, (uint256));
        require(
            ownerOf(idReceiver) == from,
            "Only the player owner can equip his weapon"
        );
        _linkWeapon(id, idReceiver);
        return this.onERC1155Received.selector;
    }

    // we can't attach multiple weapons
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        revert("Not implemented");
        //return this.onERC1155BatchReceived.selector;
    }

    // method the link the weapon to the player
    function _linkWeapon(uint256 id, uint256 idReceiver) internal {
        require(weaponEquiped[idReceiver] == 0, "Already a weapon equiped");
        // we attach the weapon to the player
        weaponEquiped[idReceiver] = id;
    }

    // If the player want to equip the weapon directly from this contract 
    // he needs to approve this contract before in the weapon contract
    function equipWeapon(uint256 id, uint256 idReceiver) external {
        require(ownerOf(idReceiver) == msg.sender, "You are not the owner");
        bytes memory data = abi.encode(idReceiver);
        // we use safe transfer from to pass data and ensure to call onERC1155Received
        weaponContract.safeTransferFrom(msg.sender, address(this), id, 1, data);
    }
}
