// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title MentoraEvents
 * @dev All events for the Mentora contract system
 */

library MentoraEvents {
    event LobbyCreated(
        uint256 indexed lobbyId,
        address indexed creator,
        address indexed master,
        string description,
        uint256 amountPerParticipant,
        uint256 maxParticipants
    );

    event ParticipantJoined(
        uint256 indexed lobbyId,
        address indexed participant,
        uint256 amount,
        uint256 currentParticipants
    );

    event LobbyAccepted(
        uint256 indexed lobbyId,
        address indexed master,
        uint256 totalAmount
    );

    event LobbyCancelled(
        uint256 indexed lobbyId,
        address indexed master,
        uint256 totalRefunded
    );

    event ParticipantAbandoned(
        uint256 indexed lobbyId,
        address indexed participant,
        uint256 amountRefunded
    );

    event LobbyCompleted(
        uint256 indexed lobbyId,
        address indexed master,
        uint256 totalPaid
    );

    event FundsRefunded(
        uint256 indexed lobbyId,
        address indexed participant,
        uint256 amount
    );
}
