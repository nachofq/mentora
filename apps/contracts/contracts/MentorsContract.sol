// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MentorsEvents} from "./events/MentorsEvents.sol";

/**
 * @title Mentora
 * @dev Community lobbies with payment system
 */

contract MentorsContract is Ownable, Pausable, MentorsEvents {
    mapping(address => MentorData) public Mentors;
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

    modifier notBlacklisted(address _MentorAddress) {
        require(!isBlacklisted[_MentorAddress], BlacklistedAddress());
        _;
    }

    constructor() Ownable(msg.sender) {}

    function createMentor()
        notBlacklisted(msg.sender)
        whenNotPaused
        external
    {
        require(!Mentors[msg.sender].registered, UserRegistered());

        Mentors[msg.sender] = MentorData(true, true, 0, 0);

        emit LogCreateMentor(msg.sender);
    }

    function MentorSetActive(bool _flag)
        notBlacklisted(msg.sender)
        whenNotPaused
        external
    {
        require(Mentors[msg.sender].active != _flag, SetMentorActive());

        Mentors[msg.sender].active = _flag;

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

    function isValidMentor(address _MentorAddress)
        external
        view
        returns(bool)
    {
        return 
            Mentors[_MentorAddress].registered && 
            Mentors[_MentorAddress].active && 
            !isBlacklisted[_MentorAddress];
    }

    function getMentorData(address _MentorAddress)
        external
        view
        returns(bool registered, bool active, uint16 sessions, uint8 score)
    {
        return (
            Mentors[_MentorAddress].registered,
            Mentors[_MentorAddress].active,
            Mentors[_MentorAddress].sessions,
            Mentors[_MentorAddress].score);
    }
}