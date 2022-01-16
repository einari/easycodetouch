// Copyright (c) Einar Ingebrigtsen. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Observable, Subject } from 'rxjs';
import { DesiredState } from './DesiredState';
import { LockState } from './LockState';
import { State } from './State';
import { connect, Client } from 'mqtt';
import { Logger } from 'homebridge';

/**
 * Represents a wrapper for the MQTT communication.
 */
export class MQTTWrapper {
    private readonly _currentState: Subject<State> = new Subject();
    private _client: Client;
    private _isConnected = false;

    /**
     * Initializes a new instance of the {@link MQTTWrapper} class.
     * @param {string} _url The MQTT URL
     */
    constructor(private readonly _url: string, private readonly _friendlyName, private readonly _log: Logger) {
        this._currentState.next({
            action: '',
            battery: 0,
            linkquality: 0,
            lock_state: LockState.Locked,
            sound_volume: '',
            state: DesiredState.NotSet,
        });

        _log.info(`Connect to MQTT ${_url} for device with friendly name '${_friendlyName}'`);

        this._client = connect(_url, {
            clientId: 'EasyCodeTouch',
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
        });

        this._client.on('connect', () => {
            this._isConnected = true;
            _log.info('Connected to MQTT broker.');

            this._client.subscribe(`zigbee2mqtt/${_friendlyName}`, () => {
                _log.info('Subscribed to status changes');
            });

            this._client.on('message', (topic, payload) => {
                const rawPayload = payload.toString();
                const state = JSON.parse(rawPayload);
                this._currentState.next(state);
                _log.info(`Lock State: ${rawPayload}`);
            });

            this.queryForState();
        });
    }

    /**
     * Gets current state observable
     */
    get currentState(): Observable<State> {
        return this._currentState;
    }

    /**
     * Locks the lock.
     */
    lock(): void {
        this.setDesiredState(true);
    }

    /**
     * Unlocks the lock.
     */
    unlock(): void {
        this.setDesiredState(false);
    }

    /**
     * Query for the state.
     */
    queryForState(): void {
        if (!this._isConnected) {
            this._log.error('Not connected');
            return;
        }
        this._client.publish(`zigbee2mqtt/${this._friendlyName}/get`, '{"state": ""}', { qos: 0, retain: false }, (error, packet) => {
            if (error) {
                this._log.error(`$(error}`);
            } else {
                this._log.info('Lock state queried');
            }
        });
    }

    private setDesiredState(locked: boolean) {
        if (!this._isConnected) {
            this._log.error('Not connected');
            return;
        }
        this._client.publish(`zigbee2mqtt/${this._friendlyName}/set`, this.getStateToPublish(locked), { qos: 0, retain: false }, (error) => {
            if (error) {
                this._log.error(`$(error}`);
            } else {
                this._log.info('Lock state published');
            }
        });
    }

    private getStateToPublish(locked: boolean) {
        return JSON.stringify({
            state: locked ? DesiredState.Lock : DesiredState.Unlock
        });
    }
}
