import { z } from "zod";

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

export const CreateFeedAssignmentSchema = z
  .object({
    grain_lot_id: z.string().uuid("Invalid grain lot UUID"),
    cattle_lot_id: z.string().uuid("Invalid cattle lot UUID"),
    quantity_kg: z.number().int().positive("Assigned quantity must be greater than 0"),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
    idempotency_key: z.string().optional(),
  })
  .refine(
    (data) => new Date(data.period_start) <= new Date(data.period_end),
    {
      message: "period_start cannot be after period_end",
      path: ["period_end"],
    }
  );

export type CreateGrainLotInput = z.infer<typeof CreateGrainLotSchema>;
export type CreateCattleLotInput = z.infer<typeof CreateCattleLotSchema>;
export type CreateFeedAssignmentInput = z.infer<typeof CreateFeedAssignmentSchema>;
