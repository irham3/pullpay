// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/* ---------- UMA Optimistic Oracle V3 (minimal interface) ---------- */
interface IOptimisticOracleV3 {
    function assertTruth(
        bytes memory claim,
        address asserter,
        address callbackRecipient,
        address escalationManager,
        uint64 liveness,
        IERC20 currency,
        uint256 bond,
        bytes32 identifier,
        bytes32 domainId
    ) external returns (bytes32 assertionId);

    function settleAndGetAssertionResult(bytes32 assertionId) external returns (bool);
    function defaultIdentifier() external view returns (bytes32);
}

/* ---------- EAS (minimal interface) ---------- */
struct AttestationRequestData {
    address recipient;
    uint64 expirationTime;
    bool revocable;
    bytes32 refUID;
    bytes data;
    uint256 value;
}
struct AttestationRequest {
    bytes32 schema;
    AttestationRequestData data;
}
interface IEAS {
    function attest(AttestationRequest calldata request) external payable returns (bytes32);
}

contract PullPayEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Mode { Instant, Safeguarded }
    enum Status { None, Funded, Asserted, Settled, Refunded, Rejected }

    struct Reward {
        address maintainer;
        address token;      // reward token (USDC)
        uint256 amount;     // reward amount
        uint256 bond;       // bond bundled by maintainer (same token for simplicity)
        string  repo;
        uint256 issueNumber;
        bytes32 criteriaHash; // hash/URI ref of acceptance criteria
        Mode    mode;
        uint256 deadline;
        bytes32 assertionId;
        address contributor;
        Status  status;
    }

    IOptimisticOracleV3 public immutable oo;
    IEAS public immutable eas;
    bytes32 public immutable easSchema;   // pre-registered EAS schema UID
    IERC20  public immutable bondCurrency; // e.g. USDC used for bonds
    address public relayer;
    address public escalationManager;
    uint64  public liveness = 7200;        // default challenge window (2h); short for demo

    mapping(bytes32 => Reward) public rewards;
    mapping(bytes32 => bytes32) public assertionToReward;
    mapping(bytes32 => address) public mappedWallet;

    event RewardCreated(bytes32 indexed id, address indexed maintainer, uint256 amount);
    event RewardAsserted(bytes32 indexed id, bytes32 indexed assertionId, address contributor);
    event RewardSettled(bytes32 indexed id, address indexed contributor, uint256 amount, bytes32 attestationUID);
    event RewardRejected(bytes32 indexed id);
    event RewardRefunded(bytes32 indexed id);
    event WalletMapped(bytes32 indexed id, address indexed wallet);

    modifier onlyRelayer() { require(msg.sender == relayer, "not relayer"); _; }

    constructor(
        address _oo, address _eas, bytes32 _easSchema,
        address _bondCurrency, address _relayer
    ) Ownable(msg.sender) {
        oo = IOptimisticOracleV3(_oo);
        eas = IEAS(_eas);
        easSchema = _easSchema;
        bondCurrency = IERC20(_bondCurrency);
        relayer = _relayer;
        escalationManager = address(0);
    }

    function setRelayer(address _relayer) external onlyOwner { relayer = _relayer; }
    function setLiveness(uint64 _liveness) external onlyOwner { liveness = _liveness; }
    function setEscalationManager(address _em) external onlyOwner { escalationManager = _em; }

    function setMappedWallet(bytes32 id, address wallet) external onlyRelayer {
        mappedWallet[id] = wallet;
        emit WalletMapped(id, wallet);
    }

    /* ---------- 1) Maintainer funds reward + bond ---------- */
    function createReward(
        bytes32 id, address token, uint256 amount, uint256 bond,
        string calldata repo, uint256 issueNumber, bytes32 criteriaHash,
        Mode mode, uint256 deadline
    ) external nonReentrant {
        require(rewards[id].status == Status.None, "exists");
        require(amount > 0, "zero amount");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        // bond bundled in bondCurrency (USDC); may differ from reward token
        if (bond > 0) bondCurrency.safeTransferFrom(msg.sender, address(this), bond);
        rewards[id] = Reward({
            maintainer: msg.sender, token: token, amount: amount, bond: bond,
            repo: repo, issueNumber: issueNumber, criteriaHash: criteriaHash,
            mode: mode, deadline: deadline, assertionId: bytes32(0),
            contributor: address(0), status: Status.Funded
        });
        emit RewardCreated(id, msg.sender, amount);
    }

    /* ---------- INSTANT PATH A: maintainer explicitly approves a recipient ---------- */
    function approveAndRelease(bytes32 id, address contributor) external nonReentrant {
        Reward storage r = rewards[id];
        require(msg.sender == r.maintainer, "not maintainer");
        require(r.status == Status.Funded, "bad status");
        require(r.mode == Mode.Instant, "not instant");
        require(contributor != address(0), "no contributor");
        r.contributor = contributor;
        r.status = Status.Settled;
        IERC20(r.token).safeTransfer(contributor, r.amount); // no oracle, no bond
        bytes32 uid = _attest(id, r);
        emit RewardSettled(id, contributor, r.amount, uid);
    }

    /* ---------- INSTANT PATH B: relayer settles after verifying the merge ---------- */
    function settleInstant(bytes32 id, address contributor) external onlyRelayer nonReentrant {
        Reward storage r = rewards[id];
        require(r.status == Status.Funded, "bad status");
        require(r.mode == Mode.Instant, "not instant");
        require(contributor != address(0), "no contributor");
        r.contributor = contributor;
        r.status = Status.Settled;
        IERC20(r.token).safeTransfer(contributor, r.amount);
        bytes32 uid = _attest(id, r);
        emit RewardSettled(id, contributor, r.amount, uid);
    }

    /* ---------- SAFETY NET: contributor escalates a stalled Instant reward ---------- */
    function escalateToUMA(bytes32 id, bytes calldata claim) external nonReentrant {
        Reward storage r = rewards[id];
        require(r.status == Status.Funded, "bad status");
        require(msg.sender == mappedWallet[id], "not the contributor");
        require(block.timestamp > r.deadline, "grace not elapsed"); // maintainer had time to act
        
        bondCurrency.safeTransferFrom(msg.sender, address(this), r.bond);
        bondCurrency.forceApprove(address(oo), r.bond);
        r.contributor = msg.sender;
        r.status = Status.Asserted;
        bytes32 aId = oo.assertTruth(
            claim, msg.sender, address(this), escalationManager,
            liveness, bondCurrency, r.bond, oo.defaultIdentifier(), bytes32(0)
        );
        r.assertionId = aId;
        assertionToReward[aId] = id;
        emit RewardAsserted(id, aId, msg.sender);
    }

    /* ---------- 2) Relayer asserts eligibility to UMA (Safeguarded) ---------- */
    function assertMerge(bytes32 id, address contributor, bytes calldata claim)
        external onlyRelayer nonReentrant
    {
        Reward storage r = rewards[id];
        require(r.status == Status.Funded, "bad status");
        require(r.mode == Mode.Safeguarded, "not safeguarded");
        require(contributor != address(0), "no contributor");
        r.contributor = contributor;
        r.status = Status.Asserted;
        bondCurrency.forceApprove(address(oo), r.bond);
        bytes32 aId = oo.assertTruth(
            claim, msg.sender, address(this), escalationManager,
            liveness, bondCurrency, r.bond, oo.defaultIdentifier(), bytes32(0)
        );
        r.assertionId = aId;
        assertionToReward[aId] = id;
        emit RewardAsserted(id, aId, contributor);
    }

    /* ---------- 3) UMA callback on resolution ---------- */
    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully)
        external nonReentrant
    {
        require(msg.sender == address(oo), "only oo");
        bytes32 id = assertionToReward[assertionId];
        Reward storage r = rewards[id];
        require(r.status == Status.Asserted, "bad status");
        if (assertedTruthfully) {
            r.status = Status.Settled;
            // return bond to maintainer, pay reward to contributor
            if (r.bond > 0) bondCurrency.safeTransfer(r.maintainer, r.bond);
            IERC20(r.token).safeTransfer(r.contributor, r.amount);
            bytes32 uid = _attest(id, r);
            emit RewardSettled(id, r.contributor, r.amount, uid);
        } else {
            // disputed & proven false: reward + bond return to maintainer
            r.status = Status.Rejected;
            IERC20(r.token).safeTransfer(r.maintainer, r.amount);
            if (r.bond > 0) bondCurrency.safeTransfer(r.maintainer, r.bond);
            emit RewardRejected(id);
        }
    }

    // UMA calls this if the assertion is disputed (optional hook)
    function assertionDisputedCallback(bytes32 assertionId) external {
        require(msg.sender == address(oo), "only oo");
        // no-op: final outcome handled in assertionResolvedCallback
    }

    /* ---------- 4) EAS reputation attestation ---------- */
    function _attest(bytes32 id, Reward storage r) internal returns (bytes32) {
        bytes memory data = abi.encode(
            r.repo, r.issueNumber, r.amount, r.criteriaHash, block.timestamp
        );
        return eas.attest(AttestationRequest({
            schema: easSchema,
            data: AttestationRequestData({
                recipient: r.contributor,
                expirationTime: 0,
                revocable: false,
                refUID: id,
                data: data,
                value: 0
            })
        }));
    }

    /* ---------- 5) Refund after deadline if never settled ---------- */
    function refund(bytes32 id) external nonReentrant {
        Reward storage r = rewards[id];
        require(msg.sender == r.maintainer, "not maintainer");
        require(r.status == Status.Funded && block.timestamp > r.deadline, "not refundable");
        r.status = Status.Refunded;
        IERC20(r.token).safeTransfer(r.maintainer, r.amount);
        if (r.bond > 0) bondCurrency.safeTransfer(r.maintainer, r.bond);
        emit RewardRefunded(id);
    }
    
    /* ---------- Read-only helpers ---------- */
    function getReward(bytes32 id) external view returns (
        address maintainer, address token, uint256 amount,
        string memory repo, uint256 issueNumber, Status status, uint256 deadline
    ) {
        Reward storage r = rewards[id];
        return (r.maintainer, r.token, r.amount, r.repo, r.issueNumber, r.status, r.deadline);
    }

    function isFunded(bytes32 id) external view returns (bool) {
        Reward storage r = rewards[id];
        return r.status == Status.Funded && block.timestamp <= r.deadline;
    }

    function isSolvent(bytes32 id) external view returns (bool) {
        Reward storage r = rewards[id];
        return IERC20(r.token).balanceOf(address(this)) >= r.amount;
    }
}
