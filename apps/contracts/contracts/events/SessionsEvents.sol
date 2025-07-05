// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title Mentor Events
 * @dev All events for the Mentora contract system
 */
abstract contract SessionsEvents {
    event LogCreateSession(address indexed _sender, address indexed _MentorAddress, uint256 _startTime, uint256 _sessionId);
    event ParticipantJoined(
        uint256 indexed _sessionId,
        address indexed _newParticipant,
        uint256 _amount,
        uint256 _currentParticipants
    );

    event LogSessionCompleted(uint indexed _sessionId, address indexed _mentor, uint256 totalPayment);

    event LogWithdraw(address indexed _sender, uint256 _mentoraFees);
}