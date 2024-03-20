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
exports.defaultClipboard = exports.getNewDefaultInstance = exports.ClipboardyClipboard = exports.VSCodeClipboard = exports.BaseClipboard = void 0;
const clipboardy = require("clipboardy");
const vscode = require("vscode");
/**
 * Clipboard base class to read and write text and detect changes
 */
class BaseClipboard {
    constructor() {
        this._disposables = [];
        this._onDidWillWriteText = new vscode.EventEmitter();
        this.onDidWillWriteText = this._onDidWillWriteText.event;
        this._onDidWriteText = new vscode.EventEmitter();
        this.onDidWriteText = this._onDidWriteText.event;
        this._disposables.push(this._onDidWillWriteText);
        this._disposables.push(this._onDidWriteText);
    }
    readText() {
        return this.readTextInternal();
    }
    writeText(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this._onDidWillWriteText.fire(value);
            yield this.writeTextInternal(value);
            this._onDidWriteText.fire(value);
        });
    }
    dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}
exports.BaseClipboard = BaseClipboard;
class VSCodeClipboard extends BaseClipboard {
    readTextInternal() {
        return vscode.env.clipboard.readText();
    }
    writeTextInternal(value) {
        return vscode.env.clipboard.writeText(value);
    }
}
exports.VSCodeClipboard = VSCodeClipboard;
class ClipboardyClipboard extends BaseClipboard {
    readTextInternal() {
        let promise = clipboardy.read();
        /**
         * Fix problem in `clipboardy` when clipboard text is empty on windows
         * Example: After power up or after a print screen
         */
        if (process.platform === "win32") {
            promise = promise.then(null, (reason) => {
                const ignoreMessage = "thread 'main' panicked at 'Error: Could not paste from clipboard: Error { repr: Os { code: 0, message:";
                if (reason.stderr && reason.stderr.startsWith(ignoreMessage)) {
                    // return empty content
                    return "";
                }
                throw reason;
            });
        }
        return promise;
    }
    writeTextInternal(value) {
        return clipboardy.write(value);
    }
}
exports.ClipboardyClipboard = ClipboardyClipboard;
function getNewDefaultInstance() {
    let clipboard;
    try {
        vscode.env.clipboard.readText();
        clipboard = new VSCodeClipboard();
        // tslint:disable-next-line:no-empty
    }
    catch (error) { }
    if (!clipboard) {
        clipboard = new ClipboardyClipboard();
    }
    return clipboard;
}
exports.getNewDefaultInstance = getNewDefaultInstance;
exports.defaultClipboard = getNewDefaultInstance();
//# sourceMappingURL=clipboard.js.map