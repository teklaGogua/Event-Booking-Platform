const { z } = require('zod');

const id = z.coerce.number().int().positive();
const idParam = z.object({ id });

const isoDate = z
  .string()
  .trim()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Must be a valid date-time (ISO 8601)')
  .transform((s) => new Date(s).toISOString());

const register = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Invalid email address')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  // Admin can never be self-assigned
  role: z.enum(['attendee', 'organizer']).default('attendee'),
});

const login = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

const eventFields = {
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().trim().max(5000),
  event_date: isoDate,
  capacity: z.number().int('Capacity must be a whole number').min(1).max(100000),
  venue_id: id,
  category_id: id,
};
const eventCreate = z.object({ ...eventFields, description: eventFields.description.default('') });
const eventUpdate = z.object(eventFields).partial().refine((o) => Object.keys(o).length > 0, 'Provide at least one field to update');

const eventListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category_id: id.optional(),
  venue_id: id.optional(),
  include_past: z.enum(['true', 'false']).default('false'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const venueBody = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(100),
  capacity: z.number().int().min(1).max(1000000),
});

const categoryBody = z.object({ name: z.string().trim().min(2).max(60) });

module.exports = { idParam, register, login, eventCreate, eventUpdate, eventListQuery, venueBody, categoryBody };
