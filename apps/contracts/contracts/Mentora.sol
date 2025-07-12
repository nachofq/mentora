// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMentora.sol";
import "./events/MentoraEvents.sol";

/**
 * @title Mentora
 * @dev Community lobbies with payment system
 */
contract Mentora is Ownable, IMentora {
    uint256 private _lobbyCounter;
    mapping(uint256 => Lobby) public lobbies;

    // Mappings to track lobbies by master and participant
    mapping(address => uint256[]) private masterLobbies;
    mapping(address => uint256[]) private participantLobbies;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Creates a new lobby
     * @param master Address that will receive the payment
     * @param maxParticipants Maximum number of participants allowed
     * @param amountPerParticipant Amount each participant must pay
     * @param description Description of the lobby's objective
     * @return lobbyId The ID of the created lobby
     */
    function createLobby(
        address master,
        uint256 maxParticipants,
        uint256 amountPerParticipant,
        string calldata description
    ) external override returns (uint256 lobbyId) {
        require(master != address(0), "Master cannot be zero address");
        require(maxParticipants > 0, "Max participants must be greater than 0");
        require(
            amountPerParticipant > 0,
            "Amount per participant must be greater than 0"
        );
        require(bytes(description).length > 0, "Description cannot be empty");

        // Increment counter and assign ID
        _lobbyCounter++;
        lobbyId = _lobbyCounter;

        // Create the lobby
        Lobby storage newLobby = lobbies[lobbyId];
        newLobby.id = lobbyId;
        newLobby.creator = msg.sender;
        newLobby.master = master;
        newLobby.description = description;
        newLobby.amountPerParticipant = amountPerParticipant;
        newLobby.maxParticipants = maxParticipants;
        newLobby.state = LobbyState.Created;
        newLobby.totalDeposited = 0;

        // Add lobby to master's lobby list
        masterLobbies[master].push(lobbyId);

        emit MentoraEvents.LobbyCreated(
            lobbyId,
            msg.sender,
            master,
            description,
            amountPerParticipant,
            maxParticipants
        );

        return lobbyId;
    }

    /**
     * @dev Joins a lobby
     * @param lobbyId The ID of the lobby to join
     */
    function joinLobby(uint256 lobbyId) external payable override {
        Lobby storage lobby = lobbies[lobbyId];

        // Validations
        require(lobby.id != 0, "Lobby does not exist");
        require(
            lobby.state == LobbyState.Created,
            "Lobby is not accepting participants"
        );
        require(
            lobby.participants.length < lobby.maxParticipants,
            "Lobby is full"
        );
        require(
            lobby.participantDeposits[msg.sender] == 0,
            "Already joined this lobby"
        );
        require(
            msg.sender != lobby.master,
            "Master cannot be a participant in their own lobby"
        );
        require(
            msg.value == lobby.amountPerParticipant,
            "Incorrect payment amount"
        );

        // Update lobby state
        lobby.participants.push(msg.sender);
        lobby.participantDeposits[msg.sender] = msg.value;
        lobby.totalDeposited += msg.value;

        // Add lobby to participant's lobby list
        participantLobbies[msg.sender].push(lobbyId);

        emit MentoraEvents.ParticipantJoined(
            lobbyId,
            msg.sender,
            msg.value,
            lobby.participants.length
        );
    }

    function acceptLobby(uint256 lobbyId) external override {
        Lobby storage lobby = lobbies[lobbyId];

        // Validations
        require(lobby.id != 0, "Lobby does not exist");
        require(
            lobby.state == LobbyState.Created,
            "Lobby cannot be accepted in current state"
        );
        require(msg.sender == lobby.master, "Only lobby master can accept");

        // Change state to accepted - funds are now locked
        lobby.state = LobbyState.Accepted;

        emit MentoraEvents.LobbyAccepted(
            lobbyId,
            lobby.master,
            lobby.totalDeposited
        );
    }

    function cancelLobby(uint256 lobbyId) external override {
        Lobby storage lobby = lobbies[lobbyId];

        // Validations
        require(lobby.id != 0, "Lobby does not exist");
        require(
            lobby.state == LobbyState.Created ||
                lobby.state == LobbyState.Accepted,
            "Lobby cannot be cancelled in current state"
        );
        require(msg.sender == lobby.master, "Only lobby master can cancel");

        uint256 totalRefunded = 0;

        // Refund all participants
        for (uint256 i = 0; i < lobby.participants.length; i++) {
            address participant = lobby.participants[i];
            uint256 depositAmount = lobby.participantDeposits[participant];

            if (depositAmount > 0) {
                // Reset participant's deposit before transfer (reentrancy protection)
                lobby.participantDeposits[participant] = 0;
                totalRefunded += depositAmount;

                // Remove lobby from participant's lobby list
                _removeLobbyFromParticipant(participant, lobbyId);

                // Transfer refund to participant
                (bool success, ) = payable(participant).call{
                    value: depositAmount
                }("");
                require(success, "Refund failed");

                emit MentoraEvents.FundsRefunded(
                    lobbyId,
                    participant,
                    depositAmount
                );
            }
        }

        // Update lobby state
        lobby.state = LobbyState.Cancelled;
        lobby.totalDeposited = 0;

        emit MentoraEvents.LobbyCancelled(lobbyId, lobby.master, totalRefunded);
    }

    function abandonLobby(uint256 lobbyId) external override {
        Lobby storage lobby = lobbies[lobbyId];

        // Validations
        require(lobby.id != 0, "Lobby does not exist");
        require(
            lobby.state == LobbyState.Created,
            "Cannot abandon lobby after it has been accepted"
        );
        require(
            lobby.participantDeposits[msg.sender] > 0,
            "Not a participant in this lobby"
        );

        uint256 refundAmount = lobby.participantDeposits[msg.sender];

        // Reset participant's deposit before transfer (reentrancy protection)
        lobby.participantDeposits[msg.sender] = 0;
        lobby.totalDeposited -= refundAmount;

        // Remove participant from the participants array
        for (uint256 i = 0; i < lobby.participants.length; i++) {
            if (lobby.participants[i] == msg.sender) {
                // Move the last element to the position of the element to remove
                lobby.participants[i] = lobby.participants[
                    lobby.participants.length - 1
                ];
                // Remove the last element
                lobby.participants.pop();
                break;
            }
        }

        // Remove lobby from participant's lobby list
        _removeLobbyFromParticipant(msg.sender, lobbyId);

        // Transfer refund to participant
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund failed");

        emit MentoraEvents.ParticipantAbandoned(
            lobbyId,
            msg.sender,
            refundAmount
        );
    }

    /**
     * @dev Completes a lobby and transfers all funds to the master
     * @param lobbyId The ID of the lobby to complete
     */
    function completeLobby(uint256 lobbyId) external override {
        Lobby storage lobby = lobbies[lobbyId];

        // Validations
        require(lobby.id != 0, "Lobby does not exist");
        require(
            lobby.state == LobbyState.Accepted,
            "Lobby must be accepted to be completed"
        );
        require(msg.sender == lobby.master, "Only lobby master can complete");
        require(lobby.totalDeposited > 0, "No funds to transfer");

        uint256 totalPayment = lobby.totalDeposited;

        // Update lobby state first (reentrancy protection)
        lobby.state = LobbyState.Completed;
        lobby.totalDeposited = 0;

        // Clear all participant deposits
        for (uint256 i = 0; i < lobby.participants.length; i++) {
            address participant = lobby.participants[i];
            lobby.participantDeposits[participant] = 0;
        }

        // Transfer all funds to the master
        (bool success, ) = payable(lobby.master).call{value: totalPayment}("");
        require(success, "Payment to master failed");

        emit MentoraEvents.LobbyCompleted(lobbyId, lobby.master, totalPayment);
    }

    // View functions for querying lobby information

    /**
     * @dev Returns comprehensive information about a lobby
     * @param lobbyId The ID of the lobby to query
     * @return id Lobby ID
     * @return creator Address that created the lobby
     * @return master Address that will receive payments
     * @return description Lobby description
     * @return amountPerParticipant Required payment per participant
     * @return maxParticipants Maximum allowed participants
     * @return currentParticipants Current number of participants
     * @return state Current lobby state
     * @return totalDeposited Total amount deposited
     */
    function getLobbyInfo(
        uint256 lobbyId
    )
        external
        view
        override
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
        )
    {
        require(
            lobbyId > 0 && lobbyId <= _lobbyCounter,
            "Lobby does not exist"
        );

        Lobby storage lobby = lobbies[lobbyId];

        return (
            lobby.id,
            lobby.creator,
            lobby.master,
            lobby.description,
            lobby.amountPerParticipant,
            lobby.maxParticipants,
            lobby.participants.length,
            lobby.state,
            lobby.totalDeposited
        );
    }

    /**
     * @dev Returns the list of participants in a lobby
     * @param lobbyId The ID of the lobby to query
     * @return Array of participant addresses
     */
    function getParticipants(
        uint256 lobbyId
    ) external view override returns (address[] memory) {
        require(
            lobbyId > 0 && lobbyId <= _lobbyCounter,
            "Lobby does not exist"
        );
        return lobbies[lobbyId].participants;
    }

    /**
     * @dev Returns the deposit amount for a specific participant in a lobby
     * @param lobbyId The ID of the lobby to query
     * @param participant The address of the participant
     * @return The amount deposited by the participant
     */
    function getParticipantDeposit(
        uint256 lobbyId,
        address participant
    ) external view override returns (uint256) {
        require(
            lobbyId > 0 && lobbyId <= _lobbyCounter,
            "Lobby does not exist"
        );
        return lobbies[lobbyId].participantDeposits[participant];
    }

    /**
     * @dev Returns the total number of lobbies created
     * @return Total number of lobbies
     */
    function getTotalLobbies() external view override returns (uint256) {
        return _lobbyCounter;
    }

    /**
     * @dev Returns the list of lobby IDs where the caller is the master
     * @return Array of lobby IDs where the caller is master
     */
    function getMyLobbiesAsMaster() external view returns (uint256[] memory) {
        return masterLobbies[msg.sender];
    }

    /**
     * @dev Returns the list of lobby IDs where the caller is a participant
     * @return Array of lobby IDs where the caller is a participant
     */
    function getMyLobbiesAsParticipant()
        external
        view
        returns (uint256[] memory)
    {
        return participantLobbies[msg.sender];
    }

    /**
     * @dev Internal function to remove a lobby from a participant's lobby list
     * @param participant The participant address
     * @param lobbyId The lobby ID to remove
     */
    function _removeLobbyFromParticipant(
        address participant,
        uint256 lobbyId
    ) internal {
        uint256[] storage participantLobbyList = participantLobbies[
            participant
        ];
        for (uint256 i = 0; i < participantLobbyList.length; i++) {
            if (participantLobbyList[i] == lobbyId) {
                // Move the last element to the position of the element to remove
                participantLobbyList[i] = participantLobbyList[
                    participantLobbyList.length - 1
                ];
                // Remove the last element
                participantLobbyList.pop();
                break;
            }
        }
    }
}
