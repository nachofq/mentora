// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MentorsEvents} from "./events/MentorsEvents.sol";

/**
 * @title Mentora
 * @dev Community lobbies with payment system
 */

contract Mentors is Ownable, Pausable, MentorsEvents {
    mapping(address => MentorData) public Mentor;
    mapping(address => bool) public isBlacklisted;

    struct MentorData{
        bool registered;
        bool active;
        uint16 sessions;
        uint8 score;
    }

    error BlacklistedAddress();
    error UserRegistered();
    error SetMentorActive();
    error SetBlackListError();

    modifier notBlacklisted {
        require(!isBlacklisted[msg.sender], BlacklistedAddress());
        _;
    }

    constructor() Ownable(msg.sender) {}

    function createMentor()
        notBlacklisted
        whenNotPaused
        external
    {
        require(!Mentor[msg.sender].registered, UserRegistered());

        Mentor[msg.sender] = MentorData(true, true, 0, 0);

        emit LogCreateMentor(msg.sender);
    }

    function MentorSetActive(bool _flag)
        notBlacklisted
        whenNotPaused
        external
    {
        require(Mentor[msg.sender].active != _flag, SetMentorActive());

        Mentor[msg.sender].active = _flag;

        emit LogMentorSetActive(msg.sender, _flag);
    }

    function setBlacklist(address _MentorAddress, bool _flag) 
        external
        onlyOwner
    {
        require(isBlacklisted[_MentorAddress] != _flag, SetBlackListError());
        isBlacklisted[_MentorAddress] = _flag;

        emit LogSetBlacklist(msg.sender, _MentorAddress, _flag);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

}

/*
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/GSN/Context.sol";

contract MyContract is Context, AccessControl {

    using SafeERC20 for IERC20;

    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    constructor() public  {
        _setupRole(WITHDRAWER_ROLE, _msgSender());
    }

    function withdraw(IERC20 token, address recipient, uint256 amount) public {
        require(hasRole(WITHDRAWER_ROLE, _msgSender()), "MyContract: must have withdrawer role to withdraw");
        token.safeTransfer(recipient, amount);
    }
}
*/