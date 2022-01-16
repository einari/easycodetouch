// Copyright (c) Einar Ingebrigtsen. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { LockState } from './LockState';
import { DesiredState } from './DesiredState';

export type State = {
  action: string;
  battery: number;
  linkquality: number;
  lock_state: LockState;
  sound_volume: string;
  state: DesiredState;
};
