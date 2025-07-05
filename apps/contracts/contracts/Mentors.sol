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
    mapping(address => MentorData) public mentors;
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

    modifier notBlacklisted(address _mentorAddress) {
        require(!isBlacklisted[_mentorAddress], BlacklistedAddress());
        _;
    }

    constructor() Ownable(msg.sender) {}

    function createMentor()
        notBlacklisted(msg.sender)
        whenNotPaused
        external
    {
        require(!mentors[msg.sender].registered, UserRegistered());

        mentors[msg.sender] = MentorData(true, true, 0, 0);

        emit LogCreateMentor(msg.sender);
    }

    function MentorSetActive(bool _flag)
        notBlacklisted(msg.sender)
        whenNotPaused
        external
    {
        require(mentors[msg.sender].active != _flag, SetMentorActive());

        mentors[msg.sender].active = _flag;

        emit LogMentorSetActive(msg.sender, _flag);
    }

    function setBlacklist(address _mentorAddress, bool _flag) 
        external
        onlyOwner
    {
        require(isBlacklisted[_mentorAddress] != _flag, SetBlackListError());
        isBlacklisted[_mentorAddress] = _flag;

        emit LogSetBlacklist(msg.sender, _mentorAddress, _flag);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function isValidMentor(address _mentorAddress)
        external
        view
        returns(bool)
    {
        return 
            mentors[_mentorAddress].registered && 
            mentors[_mentorAddress].active && 
            !isBlacklisted[_mentorAddress];
    }

    function getMentorData(address _mentorAddress)
        external
        view
        returns(bool registered, bool active, uint16 sessions, uint8 score)
    {
        return (
            mentors[_mentorAddress].registered,
            mentors[_mentorAddress].active,
            mentors[_mentorAddress].sessions,
            mentors[_mentorAddress].score);
    }
}