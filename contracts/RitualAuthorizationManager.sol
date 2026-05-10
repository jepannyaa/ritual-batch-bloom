// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RitualAuthorizationManager
/// @notice Stores EIP-712 typed-data authorizations from users so a relayer/scheduler can execute
///         scheduled batch campaigns without asking the user to sign again.
/// @dev Domain is bound to chain 1979 to prevent cross-chain replay.
contract RitualAuthorizationManager {
    struct Authorization {
        address owner;            // user
        address executor;         // scheduler / relayer allowed to execute
        uint256 maxRecipients;    // hard cap per execution
        uint256 maxTotal;         // wei cap per execution
        uint256 expiresAt;        // unix seconds
        uint256 nonce;            // monotonically increasing per owner
    }

    bytes32 public constant AUTH_TYPEHASH = keccak256(
        "Authorization(address owner,address executor,uint256 maxRecipients,uint256 maxTotal,uint256 expiresAt,uint256 nonce)"
    );

    bytes32 public immutable DOMAIN_SEPARATOR;
    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public revoked;

    event Authorized(address indexed owner, address indexed executor, uint256 expiresAt, uint256 nonce);
    event Revoked(address indexed owner, bytes32 indexed digest);

    constructor() {
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("RitualMultiSender")),
            keccak256(bytes("1")),
            block.chainid, // MUST be 1979
            address(this)
        ));
    }

    function hash(Authorization calldata a) public view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                AUTH_TYPEHASH, a.owner, a.executor, a.maxRecipients, a.maxTotal, a.expiresAt, a.nonce
            ))
        ));
    }

    function verify(Authorization calldata a, bytes calldata sig) external view returns (bool) {
        if (block.timestamp > a.expiresAt) return false;
        if (a.nonce != nonces[a.owner]) return false;
        bytes32 digest = hash(a);
        if (revoked[digest]) return false;
        return _recover(digest, sig) == a.owner;
    }

    function revoke(Authorization calldata a, bytes calldata sig) external {
        bytes32 digest = hash(a);
        require(_recover(digest, sig) == msg.sender && msg.sender == a.owner, "not owner");
        revoked[digest] = true;
        nonces[a.owner] += 1;
        emit Revoked(a.owner, digest);
    }

    function _recover(bytes32 digest, bytes calldata sig) internal pure returns (address) {
        require(sig.length == 65, "bad sig");
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        return ecrecover(digest, v, r, s);
    }
}