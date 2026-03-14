import { z } from 'zod';

export const createVanSchema = z.object({
  make: z.string().min(1, 'La marca es obligatoria'),
  model: z.string().min(1, 'El modelo es obligatorio'),
  year: z.coerce.number().min(1900, 'Año inválido').max(new Date().getFullYear() + 1, 'Año inválido'),
  license_plate: z.string().min(1, 'La matrícula es obligatoria'),
  registration_file: z.instanceof(File).refine(file => file.size > 0, 'El documento del vehículo es obligatorio'),
  photo_front: z.instanceof(File).optional(),
  photo_back: z.instanceof(File).optional(),
  photo_side: z.instanceof(File).optional(),
  photo_interior: z.instanceof(File).optional(),
});

export type CreateVanInput = z.infer<typeof createVanSchema>;
