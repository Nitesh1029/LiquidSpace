"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Monitor = void 0;
const vscode = require("vscode");
const util_1 = require("./util");
class Monitor {
    constructor(clipboard) {
        this.clipboard = clipboard;
        this._disposables = [];
        this._previousText = "";
        this._windowFocused = true;
        this.onlyWindowFocused = true;
        this._onDidChangeText = new vscode.EventEmitter();
        this.onDidChangeText = this._onDidChangeText.event;
        this.maxClipboardSize = 1000000;
        this._checkInterval = 500;
        // Update current clipboard to check changes after init
        this.readText().then(value => {
            this._previousText = value;
            // Initialize the checkInterval
            this.checkInterval = this._checkInterval;
            return value;
        });
        // Updates the previous value if you change it manually
        this._disposables.push(this.clipboard.onDidWriteText(value => {
            this._previousText = value;
        }));
        this._disposables.push(util_1.toDisposable(() => {
            if (this._timer) {
                clearInterval(this._timer);
            }
        }));
        this._windowFocused = vscode.window.state.focused;
        // Update current clip when window if focused again
        vscode.window.onDidChangeWindowState(this.onDidChangeWindowState, this, this._disposables);
    }
    get checkInterval() {
        return this._checkInterval;
    }
    set checkInterval(timeout) {
        this._checkInterval = timeout;
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = undefined;
        }
        // Minimum timeout to avoid cpu high usage
        if (timeout >= 100) {
            this._timer = setInterval(() => this.checkChangeText(), timeout);
        }
    }
    readText() {
        return __awaiter(this, void 0, void 0, function* () {
            const text = yield this.clipboard.readText();
            if (text.length > this.maxClipboardSize) {
                return "";
            }
            return text;
        });
    }
    onDidChangeWindowState(state) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prevent detect change from external copy
            if (this.onlyWindowFocused && state.focused) {
                this._previousText = yield this.readText();
            }
            this._windowFocused = state.focused;
        });
    }
    checkChangeText() {
        return __awaiter(this, void 0, void 0, function* () {
            // Don't check the clipboard when windows is not focused
            if (this.onlyWindowFocused && !this._windowFocused) {
                return;
            }
            const newText = yield this.readText();
            if (newText === this._previousText) {
                return;
            }
            const change = {
                value: newText,
                timestamp: Date.now(),
            };
            const editor = vscode.window.activeTextEditor;
            if (this._windowFocused && editor && editor.document) {
                // Set current language of copied clip
                change.language = editor.document.languageId;
                // Try get position of clip
                if (editor.selection) {
                    const selection = editor.selection;
                    change.location = {
                        range: new vscode.Range(selection.start, selection.end),
                        uri: editor.document.uri,
                    };
                }
            }
            this._onDidChangeText.fire(change);
            this._previousText = newText;
        });
    }
    dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}
exports.Monitor = Monitor;
//# sourceMappingURL=monitor.js.map