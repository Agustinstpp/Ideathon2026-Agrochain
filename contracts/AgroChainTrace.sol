// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgroChainTrace
 * @notice Nucleo de trazabilidad verificable agroindustrial para AgroChain FeedTrace.
 * Vincula lotes agricolas con lotes ganaderos, garantizando custodia inmutable
 * y control matematico de saldos de alimento (anti double-spending de grano).
 */
contract AgroChainTrace {
    // --- Modelos de Datos ---

    struct GrainLot {
        uint256 id;
        string crop;
        uint256 initialQuantityKg;
        uint256 remainingQuantityKg;
        bytes32 originHash;
        address registrant;
        uint256 createdAt;
        bool exists;
    }

    struct CattleLot {
        uint256 id;
        uint256 animalCount;
        bytes32 establishmentHash;
        address registrant;
        uint256 createdAt;
        bool exists;
    }

    struct FeedAssignment {
        uint256 id;
        uint256 grainLotId;
        uint256 cattleLotId;
        uint256 quantityKg;
        uint256 periodStart;
        uint256 periodEnd;
        uint256 assignedAt;
        address assignedBy;
        bool exists;
    }

    // --- Estado ---

    address public owner;
    mapping(address => bool) public authorizedOperators;

    mapping(uint256 => GrainLot) private _grainLots;
    mapping(uint256 => CattleLot) private _cattleLots;
    mapping(uint256 => FeedAssignment) private _feedAssignments;

    uint256[] private _grainLotIds;
    uint256[] private _cattleLotIds;
    uint256[] private _feedAssignmentIds;

    // Mapping grainLotId => list of assignmentIds
    mapping(uint256 => uint256[]) private _grainLotAssignments;
    // Mapping cattleLotId => list of assignmentIds
    mapping(uint256 => uint256[]) private _cattleLotAssignments;

    // --- Eventos ---

    event OperatorUpdated(address indexed operator, bool authorized);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    event GrainLotRegistered(
        uint256 indexed id,
        string crop,
        uint256 initialQuantityKg,
        bytes32 originHash,
        address indexed registrant,
        uint256 timestamp
    );

    event CattleLotRegistered(
        uint256 indexed id,
        uint256 animalCount,
        bytes32 establishmentHash,
        address indexed registrant,
        uint256 timestamp
    );

    event FeedAssigned(
        uint256 indexed assignmentId,
        uint256 indexed grainLotId,
        uint256 indexed cattleLotId,
        uint256 quantityKg,
        uint256 periodStart,
        uint256 periodEnd,
        uint256 remainingQuantityKg,
        address assignedBy,
        uint256 timestamp
    );

    // --- Modificadores ---

    modifier onlyOwner() {
        require(msg.sender == owner, "AgroChainTrace: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedOperators[msg.sender],
            "AgroChainTrace: unauthorized operator"
        );
        _;
    }

    // --- Constructor ---

    constructor() {
        owner = msg.sender;
        authorizedOperators[msg.sender] = true;
        emit OwnershipTransferred(address(0), msg.sender);
        emit OperatorUpdated(msg.sender, true);
    }

    // --- Gestion de Permisos ---

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AgroChainTrace: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        authorizedOperators[newOwner] = true;
    }

    function setOperator(address operator, bool authorized) external onlyOwner {
        require(operator != address(0), "AgroChainTrace: zero address");
        authorizedOperators[operator] = authorized;
        emit OperatorUpdated(operator, authorized);
    }

    // --- Registro de Lotes Agricolas ---

    function registerGrainLot(
        uint256 id,
        string calldata crop,
        uint256 initialQuantityKg,
        bytes32 originHash
    ) external onlyAuthorized {
        require(id > 0, "AgroChainTrace: ID must be > 0");
        require(!_grainLots[id].exists, "AgroChainTrace: grain lot ID already exists");
        require(bytes(crop).length > 0, "AgroChainTrace: crop cannot be empty");
        require(initialQuantityKg > 0, "AgroChainTrace: initial quantity must be > 0");

        _grainLots[id] = GrainLot({
            id: id,
            crop: crop,
            initialQuantityKg: initialQuantityKg,
            remainingQuantityKg: initialQuantityKg,
            originHash: originHash,
            registrant: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        _grainLotIds.push(id);

        emit GrainLotRegistered(
            id,
            crop,
            initialQuantityKg,
            originHash,
            msg.sender,
            block.timestamp
        );
    }

    // --- Registro de Lotes Ganaderos ---

    function registerCattleLot(
        uint256 id,
        uint256 animalCount,
        bytes32 establishmentHash
    ) external onlyAuthorized {
        require(id > 0, "AgroChainTrace: ID must be > 0");
        require(!_cattleLots[id].exists, "AgroChainTrace: cattle lot ID already exists");
        require(animalCount > 0, "AgroChainTrace: animal count must be > 0");

        _cattleLots[id] = CattleLot({
            id: id,
            animalCount: animalCount,
            establishmentHash: establishmentHash,
            registrant: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        _cattleLotIds.push(id);

        emit CattleLotRegistered(
            id,
            animalCount,
            establishmentHash,
            msg.sender,
            block.timestamp
        );
    }

    // --- Asignacion de Alimento (Vinculacion Agricola-Ganadera) ---

    function assignFeed(
        uint256 assignmentId,
        uint256 grainLotId,
        uint256 cattleLotId,
        uint256 quantityKg,
        uint256 periodStart,
        uint256 periodEnd
    ) external onlyAuthorized {
        require(assignmentId > 0, "AgroChainTrace: assignment ID must be > 0");
        require(!_feedAssignments[assignmentId].exists, "AgroChainTrace: assignment already exists");
        require(_grainLots[grainLotId].exists, "AgroChainTrace: grain lot does not exist");
        require(_cattleLots[cattleLotId].exists, "AgroChainTrace: cattle lot does not exist");
        require(quantityKg > 0, "AgroChainTrace: quantity must be > 0");
        require(periodStart <= periodEnd, "AgroChainTrace: periodStart cannot be after periodEnd");

        GrainLot storage gLot = _grainLots[grainLotId];
        require(
            gLot.remainingQuantityKg >= quantityKg,
            "AgroChainTrace: insufficient grain inventory"
        );

        // Descuento exacto y seguro
        gLot.remainingQuantityKg -= quantityKg;

        _feedAssignments[assignmentId] = FeedAssignment({
            id: assignmentId,
            grainLotId: grainLotId,
            cattleLotId: cattleLotId,
            quantityKg: quantityKg,
            periodStart: periodStart,
            periodEnd: periodEnd,
            assignedAt: block.timestamp,
            assignedBy: msg.sender,
            exists: true
        });

        _feedAssignmentIds.push(assignmentId);
        _grainLotAssignments[grainLotId].push(assignmentId);
        _cattleLotAssignments[cattleLotId].push(assignmentId);

        emit FeedAssigned(
            assignmentId,
            grainLotId,
            cattleLotId,
            quantityKg,
            periodStart,
            periodEnd,
            gLot.remainingQuantityKg,
            msg.sender,
            block.timestamp
        );
    }

    // --- Funciones de Consulta (View) ---

    function getGrainLot(uint256 id) external view returns (GrainLot memory) {
        require(_grainLots[id].exists, "AgroChainTrace: grain lot does not exist");
        return _grainLots[id];
    }

    function getCattleLot(uint256 id) external view returns (CattleLot memory) {
        require(_cattleLots[id].exists, "AgroChainTrace: cattle lot does not exist");
        return _cattleLots[id];
    }

    function getFeedAssignment(uint256 id) external view returns (FeedAssignment memory) {
        require(_feedAssignments[id].exists, "AgroChainTrace: assignment does not exist");
        return _feedAssignments[id];
    }

    function getRemainingQuantity(uint256 grainLotId) external view returns (uint256) {
        require(_grainLots[grainLotId].exists, "AgroChainTrace: grain lot does not exist");
        return _grainLots[grainLotId].remainingQuantityKg;
    }

    function getAssignmentCount() external view returns (uint256) {
        return _feedAssignmentIds.length;
    }

    function getGrainLotCount() external view returns (uint256) {
        return _grainLotIds.length;
    }

    function getCattleLotCount() external view returns (uint256) {
        return _cattleLotIds.length;
    }

    function getGrainLotAssignments(uint256 grainLotId) external view returns (uint256[] memory) {
        require(_grainLots[grainLotId].exists, "AgroChainTrace: grain lot does not exist");
        return _grainLotAssignments[grainLotId];
    }

    function getCattleLotAssignments(uint256 cattleLotId) external view returns (uint256[] memory) {
        require(_cattleLots[cattleLotId].exists, "AgroChainTrace: cattle lot does not exist");
        return _cattleLotAssignments[cattleLotId];
    }
}
