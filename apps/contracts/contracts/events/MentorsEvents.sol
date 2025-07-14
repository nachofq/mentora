// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title Mentor Events
 * @dev All events for the Mentora contract system
 */
abstract contract MentorsEvents {
    event LogCreateMentor(address indexed _MentorAddress);
    event LogMentorSetActive(address indexed _MentorAddress, bool _flag);
    event LogSetBlacklist(address _sender, address indexed _MentorAddress, bool _flag);
}