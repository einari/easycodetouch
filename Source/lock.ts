// Copyright (c) Einar Ingebrigtsen. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    AccessoryConfig,
    AccessoryPlugin,
    API,
    Characteristic,
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    HAP,
    Logging,
    Service,
} from 'homebridge';

import { DesiredState } from './DesiredState';
import { LockState } from './LockState';
import { State } from './State';
import { MQTTWrapper } from './MQTTWrapper';
import { Config } from './Config';

/**
 * Represents the accessory for the EasyCode EasyCodeTouch product.
 */
export class EasyCodeTouch implements AccessoryPlugin {
    private _currentLockState: State = {
        action: '',
        battery: 0,
        linkquality: 0,
        lock_state: LockState.Locked,
        sound_volume: '',
        state: DesiredState.NotSet,
    };

    private readonly _mqtt: MQTTWrapper;
    private readonly _name: string;
    private readonly _hap: HAP;
    private readonly _lockService: Service;
    private readonly _informationService: Service;
    private readonly _batteryService: Service;
    private readonly _currentState: Characteristic;
    private readonly _desiredState: Characteristic;
    private readonly _batteryLevel: Characteristic;
    private readonly _config: Config;

    /**
     * Initializes a new instance of the {@link EasyCodeTouch} class.
     * @param {Logger} _log For logging.
     * @param {AccessoryConfig} config The config for the accessory.
     * @param {API} api Homebridge API surface.
     */
    constructor(private readonly _log: Logging, config: AccessoryConfig, private readonly api: API) {
        this._name = config.name;
        this._hap = api.hap;

        this._lockService = new this._hap.Service.LockMechanism(this._name);
        this._batteryService = new this._hap.Service.Battery(this._name);
        this._currentState = this._lockService.getCharacteristic(this._hap.Characteristic.LockCurrentState);
        this._desiredState = this._lockService.getCharacteristic(this._hap.Characteristic.LockTargetState);
        this._batteryLevel = this._batteryService.getCharacteristic(this._hap.Characteristic.BatteryLevel);
        this._config = Config.fromAccessoryConfig(config);
        this._mqtt = new MQTTWrapper(this._config.url, this._config.friendlyName , _log);

        this._mqtt.currentState.subscribe(_ => {
            _log.info('Current state changed');
            this._currentLockState = _;
            this._batteryLevel.updateValue(this._currentLockState.battery);

            if (this._currentLockState.lock_state === LockState.Locked) {
                this._currentState.updateValue(1);
                this._desiredState.updateValue(1);
            } else {
                this._currentState.updateValue(0);
                this._desiredState.updateValue(0);
            }
        });

        this._informationService = new this._hap.Service.AccessoryInformation()
            .setCharacteristic(this._hap.Characteristic.Manufacturer, 'EasyAccess')
            .setCharacteristic(this._hap.Characteristic.Model, 'EasyCodeTouch');

        this._currentState.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
            const locked = this._currentLockState.lock_state === LockState.Locked ? 1 : 0;
            _log.info('Lock is : ' + (locked ? 'locked' : 'unlocked'));
            callback(undefined, locked);
        });

        this._desiredState.on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
            const targetState = value as number;
            _log.info(`Change desired state to be ${targetState == 0 ? 'unlock' : 'lock'}`);
            if (targetState == 1) {
                this._mqtt.lock();
            } else {
                this._mqtt.unlock();
            }
            callback();
        });

        _log.info('Switch finished initializing!');
    }

    /** @inheritdoc */
    identify(): void {
        this._log('Identify!');
    }

    /** @inheritdoc */
    getServices(): Service[] {
        return [
            this._informationService,
            this._lockService,
        ];
    }
}
