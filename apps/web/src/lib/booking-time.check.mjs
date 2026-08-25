import assert from 'node:assert/strict';
import { getContiguousAvailableSlots } from './booking-time.ts';

const slots = [
  {
    startTime: '2026-08-26T11:00:00.000Z',
    endTime: '2026-08-26T11:30:00.000Z',
    available: true,
    price: 100_000,
  },
  {
    startTime: '2026-08-26T11:30:00.000Z',
    endTime: '2026-08-26T12:00:00.000Z',
    available: true,
    price: 100_000,
  },
];

assert.equal(
  getContiguousAvailableSlots(
    slots,
    '2026-08-26T11:00:00.000Z',
    '2026-08-26T12:00:00.000Z',
  ).length,
  2,
);
assert.deepEqual(
  getContiguousAvailableSlots(
    [{ ...slots[0] }, { ...slots[1], available: false }],
    '2026-08-26T11:00:00.000Z',
    '2026-08-26T12:00:00.000Z',
  ),
  [],
);
assert.deepEqual(
  getContiguousAvailableSlots(
    [slots[0], { ...slots[1], startTime: '2026-08-26T12:00:00.000Z' }],
    '2026-08-26T11:00:00.000Z',
    '2026-08-26T12:00:00.000Z',
  ),
  [],
);
assert.deepEqual(
  getContiguousAvailableSlots(
    slots,
    '2026-08-26T11:15:00.000Z',
    '2026-08-26T12:00:00.000Z',
  ),
  [],
);
