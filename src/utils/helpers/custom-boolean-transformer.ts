import { Transform } from 'class-transformer';

export function TransformToBoolean() {
  return Transform(({ value }) => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  });
}