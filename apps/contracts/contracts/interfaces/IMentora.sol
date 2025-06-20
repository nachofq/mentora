// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IMentora
 * @dev Interface and data structures for the Mentora contract
 */

// Enum for lobby states
enum LobbyState {
    Created, // Lobby created, waiting for participants
    Accepted, // Master accepted, funds locked
    Cancelled, // Master cancelled, funds returned
    Payed // Final state - payment completed
}

// Struct to represent a lobby
struct Lobby {
    uint256 id;
    address creator; // Who created the lobby
    address master; // Who will receive the payment
    string description; // Lobby description/objective
    uint256 amountPerParticipant; // Amount each participant must pay
    uint256 maxParticipants; // Maximum number of participants
    address[] participants; // List of current participants
    mapping(address => uint256) participantDeposits; // Amount each participant deposited
    LobbyState state; // Current state of the lobby
    uint256 totalDeposited; // Total amount deposited
}

/**
 * @dev Interface for the main Mentora contract functions
 */
interface IMentora {
    function createLobby(
        address master,
        uint256 maxParticipants,
        uint256 amountPerParticipant,
        string calldata description
    ) external returns (uint256 lobbyId);

    function joinLobby(uint256 lobbyId) external payable;

    function acceptLobby(uint256 lobbyId) external;

    function cancelLobby(uint256 lobbyId) external;

    function abandonLobby(uint256 lobbyId) external;

    // View functions
    function getLobbyInfo(
        uint256 lobbyId
    )
        external
        view
        returns (
            uint256 id,
            address creator,
            address master,
            string memory description,
            uint256 amountPerParticipant,
            uint256 maxParticipants,
            uint256 currentParticipants,
            LobbyState state,
            uint256 totalDeposited
        );

    function getParticipants(
        uint256 lobbyId
    ) external view returns (address[] memory);

    function getParticipantDeposit(
        uint256 lobbyId,
        address participant
    ) external view returns (uint256);

    function getTotalLobbies() external view returns (uint256);
}
