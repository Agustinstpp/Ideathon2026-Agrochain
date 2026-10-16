import { z } from "zod";

export const CreateEstablishmentSchema = z.object({
  organization_id: z.string().uuid("Invalid organization UUID"),
  name: z.string().min(2, "Establishment name must have at least 2 characters").max(100),
  province: z.string().min(2, "Province must have at least 2 characters").max(50),
  locality: z.string().min(2, "Locality must have at least 2 characters").max(50),
  geojson: z.record(z.any()).optional().default({}),
});

export const CreateGrainLotSchema = z.object({
  organization_id: z.string().uuid("Invalid organization UUID"),
  establishment_id: z.string().uuid("Invalid establishment UUID"),
  external_code: z.string().min(2, "External code must have at least 2 characters").max(50),
  crop: z.string().min(2, "Crop name must have at least 2 characters").max(100),
  initial_quantity_kg: z.number().int().positive("Initial quantity must be greater than 0"),
  origin_hash: z.string().min(10, "Origin hash or certificate identifier required"),
});

export const CreateCattleLotSchema = z.object({
  organization_id: z.string().uuid("Invalid organization UUID"),
  establishment_id: z.string().uuid("Invalid establishment UUID"),
  external_code: z.string().min(2, "External code must have at least 2 characters").max(50),
  animal_count: z.number().int().positive("Animal count must be greater than 0"),
  establishment_hash: z.string().min(10, "Establishment RENSPA/hash required"),
});

/**
 * Schema flexible que acepta tanto camelCase como snake_case para feed assignments,
 * con validación estricta de fechas y asignación de idempotencia.
 */
export const CreateFeedAssignmentRawSchema = z.object({
  // Grain Lot ID
  grain_lot_id: z.string().uuid("Invalid grain lot UUID").optional(),
  grainLotId: z.string().uuid("Invalid grain lot UUID").optional(),
  
  // Cattle Lot ID
  cattle_lot_id: z.string().uuid("Invalid cattle lot UUID").optional(),
  cattleLotId: z.string().uuid("Invalid cattle lot UUID").optional(),
  
  // Quantity
  quantity_kg: z.number().int().positive("Assigned quantity must be greater than 0").optional(),
  quantityKg: z.number().int().positive("Assigned quantity must be greater than 0").optional(),
  
  // Periods
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
  
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
  
  // Idempotency
  operation_id: z.string().optional(),
  operationId: z.string().optional(),
  idempotency_key: z.string().optional(),
});

export const CreateFeedAssignmentSchema = CreateFeedAssignmentRawSchema.transform((data) => {
  const grain_lot_id = data.grain_lot_id || data.grainLotId;
  const cattle_lot_id = data.cattle_lot_id || data.cattleLotId;
  const quantity_kg = data.quantity_kg ?? data.quantityKg;
  const period_start = data.period_start || data.periodStart;
  const period_end = data.period_end || data.periodEnd;
  const operation_id = data.operation_id || data.operationId || data.idempotency_key;

  return {
    grain_lot_id: grain_lot_id!,
    cattle_lot_id: cattle_lot_id!,
    quantity_kg: quantity_kg!,
    period_start: period_start!,
    period_end: period_end!,
    operation_id,
  };
}).superRefine((data, ctx) => {
  if (!data.grain_lot_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "grain_lot_id (or grainLotId) is required",
      path: ["grain_lot_id"],
    });
  }
  if (!data.cattle_lot_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "cattle_lot_id (or cattleLotId) is required",
      path: ["cattle_lot_id"],
    });
  }
  if (data.quantity_kg === undefined || data.quantity_kg <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "quantity_kg (or quantityKg) must be a positive integer",
      path: ["quantity_kg"],
    });
  }
  if (!data.period_start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "period_start (or periodStart) is required",
      path: ["period_start"],
    });
  }
  if (!data.period_end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "period_end (or periodEnd) is required",
      path: ["period_end"],
    });
  }
  if (data.period_start && data.period_end && new Date(data.period_start) > new Date(data.period_end)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "period_start cannot be after period_end",
      path: ["period_end"],
    });
  }
});

export const CreateEvidenceDocumentSchema = z.object({
  organization_id: z.string().uuid("Invalid organization UUID"),
  establishment_id: z.string().uuid("Invalid establishment UUID").optional().nullable(),
  grain_lot_id: z.string().uuid("Invalid grain lot UUID").optional().nullable(),
  cattle_lot_id: z.string().uuid("Invalid cattle lot UUID").optional().nullable(),
  document_type: z.string().min(2, "Document type is required"),
  storage_path: z.string().min(3, "Storage path is required"),
  sha256_hash: z.string().length(64, "SHA-256 hash must be 64 hexadecimal characters"),
  is_simulated: z.boolean().optional().default(true),
});

export type CreateEstablishmentInput = z.infer<typeof CreateEstablishmentSchema>;
export type CreateGrainLotInput = z.infer<typeof CreateGrainLotSchema>;
export type CreateCattleLotInput = z.infer<typeof CreateCattleLotSchema>;
export type CreateFeedAssignmentInput = z.infer<typeof CreateFeedAssignmentSchema>;
export type CreateEvidenceDocumentInput = z.infer<typeof CreateEvidenceDocumentSchema>;
