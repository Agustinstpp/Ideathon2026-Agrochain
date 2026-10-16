import { expect } from "chai";
import { ethers } from "hardhat";
import { AgroChainTrace } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgroChainTrace Smart Contract", () => {
  let contract: AgroChainTrace;
  let owner: HardhatEthersSigner;
  let operator: HardhatEthersSigner;
  let unauthorizedUser: HardhatEthersSigner;

  const sampleOriginHash = ethers.keccak256(ethers.toUtf8Bytes("ORIGIN_CERT_LOT_2026_001"));
  const sampleEstablishmentHash = ethers.keccak256(ethers.toUtf8Bytes("ESTABLISHMENT_RENSPA_01.002.3.45678/99"));

  beforeEach(async () => {
    [owner, operator, unauthorizedUser] = await ethers.getSigners();

    const factory = await ethers.getContractFactory("AgroChainTrace");
    contract = (await factory.deploy()) as AgroChainTrace;
    await contract.waitForDeployment();

    // Authorize operator
    await contract.setOperator(operator.address, true);
  });

  describe("Access Control & Administration", () => {
    it("should set deployer as owner and initial authorized operator", async () => {
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.authorizedOperators(owner.address)).to.be.true;
    });

    it("should allow owner to add and remove authorized operators", async () => {
      expect(await contract.authorizedOperators(operator.address)).to.be.true;

      await expect(contract.setOperator(operator.address, false))
        .to.emit(contract, "OperatorUpdated")
        .withArgs(operator.address, false);

      expect(await contract.authorizedOperators(operator.address)).to.be.false;
    });

    it("should prevent non-owner from setting operators", async () => {
      await expect(
        contract.connect(unauthorizedUser).setOperator(unauthorizedUser.address, true)
      ).to.be.revertedWith("AgroChainTrace: caller is not the owner");
    });

    it("should prevent unauthorized callers from registering grain lots", async () => {
      await expect(
        contract.connect(unauthorizedUser).registerGrainLot(1, "Maiz Hibrido", 10000, sampleOriginHash)
      ).to.be.revertedWith("AgroChainTrace: unauthorized operator");
    });
  });

  describe("Grain Lot Registration", () => {
    it("should register a grain lot successfully with accurate parameters and emit event", async () => {
      const tx = await contract.connect(operator).registerGrainLot(101, "Maiz Amarillo", 10000, sampleOriginHash);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const lot = await contract.getGrainLot(101);
      expect(lot.id).to.equal(101n);
      expect(lot.crop).to.equal("Maiz Amarillo");
      expect(lot.initialQuantityKg).to.equal(10000n);
      expect(lot.remainingQuantityKg).to.equal(10000n);
      expect(lot.originHash).to.equal(sampleOriginHash);
      expect(lot.registrant).to.equal(operator.address);
      expect(lot.exists).to.be.true;

      expect(await contract.getGrainLotCount()).to.equal(1n);
    });

    it("should reject duplicate grain lot IDs", async () => {
      await contract.connect(operator).registerGrainLot(101, "Maiz", 10000, sampleOriginHash);

      await expect(
        contract.connect(operator).registerGrainLot(101, "Soja", 5000, sampleOriginHash)
      ).to.be.revertedWith("AgroChainTrace: grain lot ID already exists");
    });

    it("should reject zero initial quantity", async () => {
      await expect(
        contract.connect(operator).registerGrainLot(102, "Trigo", 0, sampleOriginHash)
      ).to.be.revertedWith("AgroChainTrace: initial quantity must be > 0");
    });

    it("should reject empty crop string", async () => {
      await expect(
        contract.connect(operator).registerGrainLot(103, "", 5000, sampleOriginHash)
      ).to.be.revertedWith("AgroChainTrace: crop cannot be empty");
    });

    it("should reject zero lot ID", async () => {
      await expect(
        contract.connect(operator).registerGrainLot(0, "Sorgo", 5000, sampleOriginHash)
      ).to.be.revertedWith("AgroChainTrace: ID must be > 0");
    });
  });

  describe("Cattle Lot Registration", () => {
    it("should register a cattle lot successfully with accurate parameters and emit event", async () => {
      await expect(contract.connect(operator).registerCattleLot(201, 150, sampleEstablishmentHash))
        .to.emit(contract, "CattleLotRegistered")
        .withArgs(201n, 150n, sampleEstablishmentHash, operator.address, (val: bigint) => val > 0n);

      const lot = await contract.getCattleLot(201);
      expect(lot.id).to.equal(201n);
      expect(lot.animalCount).to.equal(150n);
      expect(lot.establishmentHash).to.equal(sampleEstablishmentHash);
      expect(lot.registrant).to.equal(operator.address);
      expect(lot.exists).to.be.true;

      expect(await contract.getCattleLotCount()).to.equal(1n);
    });

    it("should reject duplicate cattle lot IDs", async () => {
      await contract.connect(operator).registerCattleLot(201, 150, sampleEstablishmentHash);

      await expect(
        contract.connect(operator).registerCattleLot(201, 200, sampleEstablishmentHash)
      ).to.be.revertedWith("AgroChainTrace: cattle lot ID already exists");
    });

    it("should reject zero animal count", async () => {
      await expect(
        contract.connect(operator).registerCattleLot(202, 0, sampleEstablishmentHash)
      ).to.be.revertedWith("AgroChainTrace: animal count must be > 0");
    });
  });

  describe("Feed Assignment (Core Double-Spending & Balance Control)", () => {
    const grainLotId = 1001n;
    const cattleLotId = 2001n;
    const initialGrainKg = 10000n;
    const periodStart = Math.floor(Date.now() / 1000);
    const periodEnd = periodStart + 86400 * 30; // 30 days

    beforeEach(async () => {
      await contract.connect(operator).registerGrainLot(grainLotId, "Silo Maiz Grano Humedo", initialGrainKg, sampleOriginHash);
      await contract.connect(operator).registerCattleLot(cattleLotId, 250, sampleEstablishmentHash);
    });

    it("should assign 2,000 kg from 10,000 kg and leave exactly 8,000 kg confirmed balance", async () => {
      const assignmentId = 5001n;
      const assignKg = 2000n;

      const tx = await contract.connect(operator).assignFeed(
        assignmentId,
        grainLotId,
        cattleLotId,
        assignKg,
        periodStart,
        periodEnd
      );

      await expect(tx)
        .to.emit(contract, "FeedAssigned")
        .withArgs(
          assignmentId,
          grainLotId,
          cattleLotId,
          assignKg,
          periodStart,
          periodEnd,
          8000n, // remaining balance
          operator.address,
          (val: bigint) => val > 0n
        );

      // Verify confirmed remaining quantity in grain lot
      const remaining = await contract.getRemainingQuantity(grainLotId);
      expect(remaining).to.equal(8000n);

      const grainLot = await contract.getGrainLot(grainLotId);
      expect(grainLot.remainingQuantityKg).to.equal(8000n);
      expect(grainLot.initialQuantityKg).to.equal(10000n);

      // Verify assignment details
      const assignment = await contract.getFeedAssignment(assignmentId);
      expect(assignment.id).to.equal(assignmentId);
      expect(assignment.grainLotId).to.equal(grainLotId);
      expect(assignment.cattleLotId).to.equal(cattleLotId);
      expect(assignment.quantityKg).to.equal(assignKg);
      expect(assignment.assignedBy).to.equal(operator.address);
      expect(assignment.exists).to.be.true;

      // Verify cross-references
      const grainAssignments = await contract.getGrainLotAssignments(grainLotId);
      expect(grainAssignments).to.deep.equal([assignmentId]);

      const cattleAssignments = await contract.getCattleLotAssignments(cattleLotId);
      expect(cattleAssignments).to.deep.equal([assignmentId]);

      expect(await contract.getAssignmentCount()).to.equal(1n);
    });

    it("CRITICAL: should strictly reject assigning 9,000 kg when only 8,000 kg remaining (anti double-spending)", async () => {
      // First assignment: 2,000 kg
      await contract.connect(operator).assignFeed(5001n, grainLotId, cattleLotId, 2000n, periodStart, periodEnd);
      expect(await contract.getRemainingQuantity(grainLotId)).to.equal(8000n);

      // Second assignment attempt: 9,000 kg (> 8,000 kg remaining) -> MUST REVERT
      await expect(
        contract.connect(operator).assignFeed(5002n, grainLotId, cattleLotId, 9000n, periodStart, periodEnd)
      ).to.be.revertedWith("AgroChainTrace: insufficient grain inventory");

      // Balance MUST remain unchanged at 8,000 kg
      expect(await contract.getRemainingQuantity(grainLotId)).to.equal(8000n);
    });

    it("should allow assigning full exact remainder down to 0 kg", async () => {
      // First assignment: 2,000 kg
      await contract.connect(operator).assignFeed(5001n, grainLotId, cattleLotId, 2000n, periodStart, periodEnd);
      // Second assignment: exactly 8,000 kg
      await contract.connect(operator).assignFeed(5002n, grainLotId, cattleLotId, 8000n, periodStart, periodEnd);

      expect(await contract.getRemainingQuantity(grainLotId)).to.equal(0n);

      // Any further assignment must revert
      await expect(
        contract.connect(operator).assignFeed(5003n, grainLotId, cattleLotId, 1n, periodStart, periodEnd)
      ).to.be.revertedWith("AgroChainTrace: insufficient grain inventory");
    });

    it("should reject assignment with non-existent grain lot", async () => {
      await expect(
        contract.connect(operator).assignFeed(5001n, 99999n, cattleLotId, 1000n, periodStart, periodEnd)
      ).to.be.revertedWith("AgroChainTrace: grain lot does not exist");
    });

    it("should reject assignment with non-existent cattle lot", async () => {
      await expect(
        contract.connect(operator).assignFeed(5001n, grainLotId, 99999n, 1000n, periodStart, periodEnd)
      ).to.be.revertedWith("AgroChainTrace: cattle lot does not exist");
    });

    it("should reject duplicate assignment ID", async () => {
      await contract.connect(operator).assignFeed(5001n, grainLotId, cattleLotId, 1000n, periodStart, periodEnd);

      await expect(
        contract.connect(operator).assignFeed(5001n, grainLotId, cattleLotId, 1000n, periodStart, periodEnd)
      ).to.be.revertedWith("AgroChainTrace: assignment already exists");
    });

    it("should reject invalid period where start > end", async () => {
      await expect(
        contract.connect(operator).assignFeed(5001n, grainLotId, cattleLotId, 1000n, periodEnd, periodStart)
      ).to.be.revertedWith("AgroChainTrace: periodStart cannot be after periodEnd");
    });

    it("should reject zero quantity assignment", async () => {
      await expect(
        contract.connect(operator).assignFeed(5001n, grainLotId, cattleLotId, 0n, periodStart, periodEnd)
      ).to.be.revertedWith("AgroChainTrace: quantity must be > 0");
    });
  });
});
