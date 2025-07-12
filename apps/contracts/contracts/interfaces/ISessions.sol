// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title IMentora
 * @dev Interface and data structures for the Mentora contract
 */

/**
 * @dev Interface for the main Mentora contract functions
 */
interface ISessions {
    // Enum for lobby states
    enum SessionState {
        Created, // Sessioin created, waiting for participants
        Accepted, // Mentor accepted, funds locked
        Cancelled, // Mentor cancelled, funds returned
        Completed // Final state - payment completed successfully
    }

    // Struct to represent a lobby
    struct Session {
        address creator; // Who created the session
        address mentor; // Who will receive the payment
        uint256 startTime;
        uint256 endTime;
        uint256 amountPerParticipant; // Amount each participant must pay
        uint256 maxParticipants; // Maximum number of participants
        address[] participants; // List of current participants
        mapping(address => uint256) participantDeposits; // Amount each participant deposited
        SessionState state; // Current state of the lobby
        uint256 sessionDeposited; // Total amount deposited
        bool isPrivateSession; // default false;
        bool marketplace; // default false;
    }

    function createSession(
        address _mentorAddress,
        uint256 _maxParticipants,
        address[] memory participants,
        uint256 _sessionStartTime,
        uint256 _amountPerParticipant,
        uint256 _amount,
        bool _privateSession,
        bool _marketplace
    ) external returns (uint256 sessionId);

    function getSessionInfo(
        uint256 sessionId
    )
        external
        view
        returns (
             address creator,
            address mentor,
            uint256 startTime,
            uint256 endTime,
            uint256 amountPerParticipant,
            uint256 maxParticipants,
            address[] memory paparticipants,
            SessionState state,
            uint256 sessionDeposit,
            bool isPrivateSession,
            bool marketplace
        );

    function joinSession(uint256 _sessionId, uint _amount) external;

    function completeSession(uint256 _sessionId) external;

    function getSessionParticipants(
        uint256 _sessionId
    ) external view returns (address[] memory);

    function getParticipantDeposit(
        uint256 lobbyId,
        address participant
    ) external view returns (uint256);

    

    /*function acceptSession(uint256 sessionId) external;

    function cancelSession(uint256 sessionId) external;

    function abandonSession(uint256 sessionId) external; */
}
