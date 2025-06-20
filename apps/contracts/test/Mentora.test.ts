// Mentora Smart Contract - Complete Test Suite
// This file orchestrates all test suites by importing them
// Run this file to execute all tests: npx hardhat test test/Mentora.test.ts

// Import all test suites - they will run automatically when this file is executed
import './Deployment.test';
import './CreateLobby.test';
import './JoinLobby.test';
import './AcceptLobby.test';
import './CancelLobby.test';
import './AbandonLobby.test';

// Test suites included:
// - Deployment: Contract deployment and initialization
// - CreateLobby: Lobby creation with validations
// - JoinLobby: Participants joining lobbies with payments
// - AcceptLobby: Masters accepting lobbies and locking funds
// - CancelLobby: Masters canceling lobbies with refunds
// - AbandonLobby: Participants abandoning lobbies individually
// Tests covering all Mentora smart contract functionality
