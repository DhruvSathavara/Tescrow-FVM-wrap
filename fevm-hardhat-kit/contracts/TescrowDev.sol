// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract TescrowDev is ERC721Enumerable {

    //  _price is the price of one Crypto Dev NFT
    uint256 public _price = 0.001 ether;

    // max number of CryptoDevs
    uint256 public maxTokenIds = 100;

    // total number of tokenIds minted
    uint256 public tokenIds;

    constructor () ERC721("Tescrow Devs", "TD") {
       
    }
   
    function mint() public payable {
        require(tokenIds < maxTokenIds, "Exceed maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    receive() external payable {}

    fallback() external payable {}
}