"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipboardTreeDataProvider = exports.ClipHistoryItem = void 0;
const path = require("path");
const vscode = require("vscode");
const common_1 = require("../commads/common");
const util_1 = require("../util");
class ClipHistoryItem extends vscode.TreeItem {
    constructor(clip) {
        super(clip.value);
        this.clip = clip;
        this.contextValue = "clipHistoryItem:";
        this.label = this.clip.value.replace(/\s+/g, " ").trim();
        this.tooltip = this.clip.value;
        this.command = {
            command: common_1.commandList.historyTreeDoubleClick,
            title: "Paste",
            tooltip: "Paste",
            arguments: [this.clip],
        };
        if (this.clip.createdLocation) {
            this.resourceUri = this.clip.createdLocation.uri;
            this.contextValue += "file";
            this.tooltip = `File: ${this.resourceUri.fsPath}\nValue: ${this.tooltip}\n`;
        }
        else {
            const basePath = path.join(__filename, "..", "..", "..", "resources");
            this.iconPath = {
                light: path.join(basePath, "light", "string.svg"),
                dark: path.join(basePath, "dark", "string.svg"),
            };
        }
    }
}
exports.ClipHistoryItem = ClipHistoryItem;
class ClipboardTreeDataProvider {
    constructor(_manager) {
        this._manager = _manager;
        this._disposables = [];
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this
            ._onDidChangeTreeData.event;
        this._manager.onDidChangeClipList(() => {
            this._onDidChangeTreeData.fire();
        });
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(_element) {
        const clips = this._manager.clips;
        const maxLength = `${clips.length}`.length;
        const childs = clips.map((c, index) => {
            const item = new ClipHistoryItem(c);
            const indexNumber = util_1.leftPad(index + 1, maxLength, "0");
            item.label = `${indexNumber}) ${item.label}`;
            return item;
        });
        return childs;
    }
    dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}
exports.ClipboardTreeDataProvider = ClipboardTreeDataProvider;
//# sourceMappingURL=history.js.map