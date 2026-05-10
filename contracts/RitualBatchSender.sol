// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RitualBatchSender
/// @notice One-signature multi distribution for native RITUAL and ERC20 on Ritual Testnet (chain 1979).
/// @dev Gas-optimized loop, reentrancy guarded, event logged. Deploy address must be wired into the
///      frontend via VITE_RITUAL_BATCH_SENDER. This file is a spec — deploy with Foundry/Hardhat.
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function permit(
        address owner, address spender, uint256 value, uint256 deadline,
        uint8 v, bytes32 r, bytes32 s
    ) external;
}

contract RitualBatchSender {
    error LengthMismatch();
    error ValueMismatch();
    error TransferFailed(address to);
    error Reentrant();

    uint256 private _lock = 1;
    modifier nonReentrant() {
        if (_lock != 1) revert Reentrant();
        _lock = 2; _; _lock = 1;
    }

    event BatchNative(address indexed sender, uint256 count, uint256 total, bytes32 indexed batchId);
    event BatchERC20(address indexed sender, address indexed token, uint256 count, uint256 total, bytes32 indexed batchId);

    /// @notice Send native RITUAL to many recipients in a single transaction.
    function batchSendNative(
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 batchId
    ) external payable nonReentrant {
        uint256 len = recipients.length;
        if (len != amounts.length) revert LengthMismatch();
        uint256 total;
        unchecked {
            for (uint256 i; i < len; ++i) {
                uint256 a = amounts[i];
                total += a;
                (bool ok, ) = recipients[i].call{ value: a }("");
                if (!ok) revert TransferFailed(recipients[i]);
            }
        }
        if (total != msg.value) revert ValueMismatch();
        emit BatchNative(msg.sender, len, total, batchId);
    }

    /// @notice Send ERC20 to many recipients in a single transaction. Caller must approve first
    ///         or use `batchSendERC20WithPermit` for one-signature ERC20 distribution.
    function batchSendERC20(
        IERC20 token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 batchId
    ) external nonReentrant {
        uint256 len = recipients.length;
        if (len != amounts.length) revert LengthMismatch();
        uint256 total;
        unchecked {
            for (uint256 i; i < len; ++i) {
                total += amounts[i];
                if (!token.transferFrom(msg.sender, recipients[i], amounts[i])) {
                    revert TransferFailed(recipients[i]);
                }
            }
        }
        emit BatchERC20(msg.sender, address(token), len, total, batchId);
    }

    function batchSendERC20WithPermit(
        IERC20 token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256 totalValue,
        uint256 deadline,
        uint8 v, bytes32 r, bytes32 s,
        bytes32 batchId
    ) external {
        token.permit(msg.sender, address(this), totalValue, deadline, v, r, s);
        this.batchSendERC20(token, recipients, amounts, batchId);
    }
}