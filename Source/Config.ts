// Copyright (c) Einar Ingebrigtsen. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { AccessoryConfig } from 'homebridge';

/**
 * Represents the accessory configuration for the easy code lock.
 */

export class Config {
    mqttServer = 'localhost';
    mqttPort = 1883;
    friendlyName = 'EasyCodeTouch';

    /**
     * Gets the MQTT URL.
     */
    get url() {
        return `mqtt://${this.mqttServer}:${this.mqttPort}`;
    }

    /**
     * Gets {@link Config} from {@link AccessoryConfig}
     * @param {AccessoryConfig} accessoryConfig The config from Homebridge.
     * @returns {Config} New instance
     */
    static fromAccessoryConfig(accessoryConfig: AccessoryConfig) {
        const config = new Config();
        config.mqttServer = accessoryConfig['mqtt-server'] || config.mqttServer;
        config.mqttPort = accessoryConfig['mqtt-port'] || config.mqttPort;
        config.friendlyName = accessoryConfig['friendly-name'] || config.friendlyName;
        return config;
    }
}
