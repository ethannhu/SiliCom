import { invoke, Channel } from "@tauri-apps/api/core";
import { TerminalWrapper, MessageKind } from './terminal';
import { save, message } from '@tauri-apps/plugin-dialog'
export class SessionManager {
    id = 'sessionManager';
    _appContainer = document.getElementById('session-app') as HTMLDivElement;
    _portNameInputElement = document.getElementById('port-name-input') as HTMLInputElement;
    _baudRateInputElement = document.getElementById('baud-rate-input') as HTMLInputElement;
    _openSessionButtonElement = document.getElementById('open-session-button') as HTMLButtonElement;
    _closeSessionButtonElement = document.getElementById('close-session-button') as HTMLButtonElement;
    _outputTerminal: TerminalWrapper;
    _isSessionRunning = false;
    constructor(outputTerminal: TerminalWrapper) {
        this._outputTerminal = outputTerminal;
        this._openSessionButtonElement.addEventListener('click', () => { this._openSession(); });
        this._closeSessionButtonElement.addEventListener('click', () => { this._closeSession(); });
        window.addEventListener('beforeunload', () => { this._closeSession(); });
    }
    show() {
        this._appContainer.hidden = false;
    }
    isHidden() {
        return this._appContainer.hidden;
    }
    hide() {
        this._appContainer.hidden = true;
    }
    toggleVisibility() {
        this._appContainer.hidden = true !== this._appContainer.hidden;
    }
    async _openSession() {
        const portName = this._portNameInputElement.value;
        const baudRate = Number(this._baudRateInputElement.value);
        const channel = new Channel<Uint8Array>();
        channel.onmessage = (response) => { this._responseHandler(response); }
        this._isSessionRunning = true;
        this._openSessionButtonElement.disabled = true;
        this._outputTerminal.printMessage('Starting session on ' + portName, MessageKind.INFO);
        await invoke("open_serial_port", {
            portName: portName,
            baudRate: baudRate,
            reader: channel,
        }).catch(async (reason: string) => {
            await message(reason, { title: 'Unable to start session', kind: 'error' });
        }).then(() => {
            this._outputTerminal.printMessage('Session closed', MessageKind.INFO);
        }).finally(() => {
            this._openSessionButtonElement.disabled = false;
            this._isSessionRunning = false;
        })
    }
    _closeSession() {
        if (this._isSessionRunning) {
            invoke("close_serial_port").catch(async () => {
                await message('No session is running!', { title: 'Unable to close session', kind: 'warning' })
            }).then(() => {
                this._outputTerminal.printMessage('Closing session...', MessageKind.WARNING);
            })
        }
    }
    _responseHandler(response: Uint8Array) {
        this._outputTerminal.printData(response);
    }
}