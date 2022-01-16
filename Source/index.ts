// Copyright (c) Einar Ingebrigtsen. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { API } from 'homebridge';
import { EasyCodeTouch } from './lock';

export = (api: API) => {
  api.registerAccessory('EasyCodeTouch', EasyCodeTouch);
};
