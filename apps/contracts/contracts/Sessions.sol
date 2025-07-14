// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SessionsEvents} from "./events/SessionsEvents.sol";
import {ISessions} from "./interfaces/ISessions.sol";
import {Mentors} from "./Mentors.sol";

contract Sessions is Ownable, Pausable, ISessions, SessionsEvents {
    using SafeERC20 for IERC20;
    IERC20 public token;

    mapping(uint256 => Session) public sessions;

    uint256 constant PROPORTION = 10000;

    uint256 public sessionCounter;
    uint256 public totalDeposited;
    uint256 public fee;
    
    Mentors mentors;

    error OnlyMentor();
    error SessionError();
    error WithdrawError();
    error SessionIsFull();
    error SessionNotOpen();
    error MentorNotValid();
    error IncorrectAmount();
    error IncorrectDeposit();
    error IsPrivateSession();
    error NoFundsAvailable();
    error IncorrectStartTime();
    error MissingCretorAddress();
    error SessionDoesNotExists();
    error AddressIsParticipant();
    error NotEnoughParticipants();
    error CannotAbandonedSession();
    error SesssionMustBeAccepted();
    error SessionCantBeCancelled();
    error SenderIsNotParticipant();
    error SessionCanNotBeAccepted();
    error IncorrectMaxParticipants();
    error IncorrectParticipantsLength();
    
    
    constructor(Mentors _mentors, IERC20 _token, uint256 _fee) Ownable(msg.sender){
        mentors = _mentors;
        token = _token;
        fee = _fee; // 500 --> 5%
    }

    // Sesiones No publicable == "No publicable en el marketplace"
    // Sesiones Publicables == "Publicable en el marketplace"
    // Sesion privada = No cualquiera se puede unir.
    // Sesion pública = Cualquiera se puede unir.
    // How to close a session?
    function createSession(
        address _mentorAddress,
        uint256 _maxParticipants,
        address[] memory participants,
        uint256 _sessionStartTime,
        uint256 _minAmountPerParticipant,
        uint256 _amount,
        bool _isPrivate,
        bool _marketplace
    ) external returns (uint256 sessionId) 
    {
        require(mentors.isValidMentor(_mentorAddress), MentorNotValid());
        require(_maxParticipants > 0, IncorrectMaxParticipants());
        // Check this start time
        require(_sessionStartTime >= block.timestamp, IncorrectStartTime());
        require(_minAmountPerParticipant >= 1, NotEnoughParticipants());
        require(_amount >= _minAmountPerParticipant, IncorrectDeposit());

        // Create the session
        sessionId = sessionCounter++;
        Session storage newSession = sessions[sessionId];
        
        // If private then we need to deposit the entire session amount
        if (_isPrivate) {
            require(participants.length == _maxParticipants, IncorrectParticipantsLength());
            require(_amount >= _minAmountPerParticipant * participants.length);
        }

        totalDeposited += _amount;

        newSession.creator = msg.sender;
        newSession.mentor = _mentorAddress;
        newSession.startTime = _sessionStartTime;
        newSession.amountPerParticipant = _minAmountPerParticipant;
        newSession.maxParticipants = _maxParticipants;
        newSession.participants = participants;
        newSession.participantDeposits[msg.sender] = _amount;
        newSession.state = SessionState.Created;
        newSession.sessionDeposited += _amount;
        newSession.isPrivateSession = _isPrivate;
        newSession.marketplace = _marketplace;

        // Adding creator
        newSession.participants.push(msg.sender);

        token.safeTransferFrom(msg.sender, address(this), _amount);

        emit LogCreateSession(msg.sender, _mentorAddress, _sessionStartTime, sessionId);
    }

    // If the session is public, participants must join the session.
    function joinSession(uint256 _sessionId, uint _amount) external {
        Session storage session = sessions[_sessionId];

        // Validations
        require(_sessionId != 0, SessionDoesNotExists());
        require(
            session.state == SessionState.Created,
            SessionNotOpen()
        );

        require(
            session.participants.length < session.maxParticipants,
            SessionIsFull()
        );
        require(
            session.participantDeposits[msg.sender] == 0,
            AddressIsParticipant()
        );

        require(
            _amount >= session.amountPerParticipant,
            IncorrectAmount()
        );

        // Update session state
        session.participants.push(msg.sender);
        session.participantDeposits[msg.sender] = _amount;
        session.sessionDeposited += _amount;

        token.safeTransferFrom(msg.sender, address(this), _amount);

        emit LogParticipantJoined(
            _sessionId,
            msg.sender,
            _amount,
            session.participants.length
        );
    } 

    function acceptSession(uint256 _sessionId) external override {
        Session storage session = sessions[_sessionId];

        // Validations
        require(session.state == SessionState.Created, SessionDoesNotExists());
        require(
            session.state == SessionState.Created,
            SessionCanNotBeAccepted()
        );
        require(msg.sender == session.mentor, OnlyMentor());

        // Change state to accepted - funds are now locked
        session.state = SessionState.Accepted;

        emit LogSessionAccepted(
            _sessionId,
            session.mentor,
            session.sessionDeposited
        );
    }

    function completeSession(uint256 _sessionId) 
        external 
    {
        Session storage session = sessions[_sessionId];

        // Validations
        require(
            session.state == SessionState.Accepted,
            SesssionMustBeAccepted()
        );
        require(msg.sender == session.mentor, OnlyMentor());
        require(session.sessionDeposited > 0, NoFundsAvailable());

        uint256 totalPayment = session.sessionDeposited;

        // Update lobby state first (reentrancy protection)
        session.state = SessionState.Completed;
        session.sessionDeposited = 0;

        // Clear all participant deposits
        for (uint256 i = 0; i < session.participants.length; i++) {
            address participant = session.participants[i];
            session.participantDeposits[participant] = 0;
        }
        // Get app fees.
        totalPayment = totalPayment - ((totalPayment * fee) / PROPORTION);
        // Transfer remaining funds to the mentor
        token.safeTransfer(msg.sender, totalPayment);
        
        emit LogSessionCompleted(_sessionId, session.mentor, totalPayment);
    }

    function cancelSession(uint256 _sessionId) external override {
        Session storage session = sessions[_sessionId];

        // Validations
        require(session.state == SessionState.Created, SessionDoesNotExists());
        require(
            session.state == SessionState.Created ||
            session.state == SessionState.Accepted,
            SessionCantBeCancelled()
        );
        require(msg.sender == session.mentor, OnlyMentor());

        uint256 totalRefunded = 0;

        // We need a more robust mechanism for recovering the users' funds.
        // Refund all participants
        for (uint256 i = 0; i < session.participants.length; i++) {
            address participant = session.participants[i];
            uint256 depositAmount = session.participantDeposits[participant];

            if (depositAmount > 0) {
                // Reset participant's deposit before transfer (reentrancy protection)
                session.participantDeposits[participant] = 0;
                totalRefunded += depositAmount;

                token.safeTransfer(participant, depositAmount);

                emit LogFundsRefunded(
                    _sessionId,
                    participant,
                    depositAmount
                );
            }
        }

        // Update lobby state
        session.state = SessionState.Cancelled;
        totalDeposited -= totalRefunded;
        session.sessionDeposited = 0;

        emit LogLobbyCancelled(_sessionId, session.mentor, totalRefunded);
    }

    function abandonSession(uint256 _sessionId) external override {
        Session storage session = sessions[_sessionId];

        // Validations
        require(session.state == SessionState.Created, SessionDoesNotExists());
        require(
            session.state == SessionState.Created,
            CannotAbandonedSession()
        );
        require(
            session.participantDeposits[msg.sender] > 0,
            SenderIsNotParticipant()
        );

        uint256 refundAmount = session.participantDeposits[msg.sender];

        // Reset participant's deposit before transfer (reentrancy protection)
        session.participantDeposits[msg.sender] = 0;
        session.sessionDeposited -= refundAmount;

        // Remove participant from the participants array
        uint256 participantsLength = session.participants.length;
        for (uint256 i = 0; i < participantsLength; i++) {
            if (session.participants[i] == msg.sender) {
                // Move the last element to the position of the element to remove
                session.participants[i] = session.participants[
                    participantsLength - 1
                ];
                // Remove the last element
                session.participants.pop();
                break;
            }
        }

        // Transfer refund to participant
        token.safeTransfer(msg.sender, refundAmount);

        emit LogParticipantAbandoned(_sessionId, msg.sender, refundAmount);
    }

    function withdraw(IERC20 _token, address recipient, uint256 amount) 
        onlyOwner
        public 
    {
        uint256 mentoraFees = getContractBalance(_token) - totalDeposited;
        require(amount <= mentoraFees, WithdrawError());
        _token.safeTransfer(recipient, amount);

        emit LogWithdraw(msg.sender, mentoraFees);
    }
    
    // ********** View Functions **********
    function getSessionInfo(
        uint256 _sessionId
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
        )
    {
        require(
            _sessionId > 0 && _sessionId <= sessionCounter,
            SessionError()
        );

        Session storage session = sessions[_sessionId];

        return (
            session.creator,
            session.mentor,
            session.startTime,
            session.endTime,
            session.amountPerParticipant,
            session.maxParticipants,
            session.participants,
            session.state,
            session.sessionDeposited,
            session.isPrivateSession,
            session.marketplace
        );
    }

    // Do I need this one?
    function getSessionParticipants(uint256 _sessionId) 
        external 
        view 
        returns (address[] memory)
    {
        Session storage session = sessions[_sessionId];

        return session.participants;
    }

    function getParticipantDeposit(
        uint256 _sessionId,
        address participant
    ) external view returns (uint256){
        Session storage session = sessions[_sessionId];

        return session.participantDeposits[participant];

    }

    function getContractBalance(IERC20 _token) 
        public 
        view 
        returns(uint256)
    {
        return _token.balanceOf(address(this));
    }

}