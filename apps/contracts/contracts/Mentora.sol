// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Mentora
 * @dev
 */
contract Mentora is Ownable {
    constructor() Ownable(msg.sender) {}

    function ownerOnlyFunction() external onlyOwner {}

    receive() external payable {}

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
