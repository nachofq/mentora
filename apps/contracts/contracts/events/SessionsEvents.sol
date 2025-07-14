// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title Mentor Events
 * @dev All events for the Mentora contract system
 */
abstract contract SessionsEvents {
    event LogCreateSession(address indexed _sender, address indexed _MentorAddress, uint256 _startTime, uint256 _sessionId);
    event LogParticipantJoined(
        uint256 indexed _sessionId,
        address indexed _newParticipant,
        uint256 _amount,
        uint256 _currentParticipants
    );

    event LogSessionCompleted(uint256 indexed _sessionId, address indexed _mentor, uint256 totalPayment);

    event LogWithdraw(address indexed _sender, uint256 _mentoraFees);

    event LogSessionAccepted(uint256 indexed _sessionId, address indexed _mentor, uint256 _sessionDeposited);
    
    event LogFundsRefunded(uint256 indexed _sessionId, address indexed _participant, uint256 _depositAmount);

    event LogLobbyCancelled(uint256 indexed _sessionId, address _mentor, uint256 _totalRefunded);

    event LogParticipantAbandoned(uint256 indexed _sessionId, address _participant, uint256 _refundAmount);
}