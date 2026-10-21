import { SetMetadata } from '@nestjs/common';

export const REQUIRE_STEP_UP_KEY = 'require_step_up';
export const RequireStepUp = () => SetMetadata(REQUIRE_STEP_UP_KEY, true);
