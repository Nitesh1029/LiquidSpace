/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./sources/TerminalLinkProvider.ts":
/*!*****************************************!*\
  !*** ./sources/TerminalLinkProvider.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerTerminalLinkProvider = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const fslib_1 = __webpack_require__(/*! @yarnpkg/fslib */ "../yarnpkg-fslib/sources/index.ts");
const vscode = (0, tslib_1.__importStar)(__webpack_require__(/*! vscode */ "vscode"));
/**
 * Regex patterns to match line and columns in filepaths
 */
const SELECTOR_PATTERNS = [
    // :LINE:COLUMN
    /:(\d+):(\d+)/,
    // :LINE
    /:(\d+)/,
    // (LINE,COLUMN)
    /\((\d+),(\d+)\)/,
    // (LINE)
    /\((\d+)\)/,
];
const COMBINED_SELECTORS = SELECTOR_PATTERNS.map(selector => `(${selector.source})`).join(`|`);
const FILEPATH_MATCHER = /(([A-Za-z]:)?\/.*((__virtual__)|(\$\$virtual)|(\.zip)).*\.[\w:]+)/.source;
const FILE_SELECTOR_MATCHER = `(${FILEPATH_MATCHER})(${COMBINED_SELECTORS})?`;
function registerTerminalLinkProvider() {
    const terminalProvider = {
        provideTerminalLinks(context) {
            const linkResult = [];
            const line = context.line.replace(/\\/g, `/`);
            const matcher = new RegExp(FILE_SELECTOR_MATCHER, `gm`);
            let match = null;
            while ((match = matcher.exec(line))) {
                const [filepath] = match;
                if (fslib_1.npath.isAbsolute(filepath)) {
                    linkResult.push({
                        startIndex: match.index,
                        length: filepath.length,
                        tooltip: `Open file in editor (ZipFS)`,
                        data: filepath,
                    });
                }
            }
            return linkResult;
        },
        async handleTerminalLink(link) {
            let selection = undefined;
            let matchIndex = undefined;
            for (const pattern of SELECTOR_PATTERNS) {
                const match = link.data.match(pattern);
                if (match) {
                    const [, line, column] = match;
                    const startLine = Math.max(Number(line !== null && line !== void 0 ? line : 0) - 1, 0);
                    const startColumn = Math.max(Number(column !== null && column !== void 0 ? column : 0) - 1, 0);
                    selection = new vscode.Range(startLine, startColumn, startLine, startColumn);
                    matchIndex = match.index;
                    break;
                }
            }
            await vscode.window.showTextDocument(vscode.Uri.parse(`zip:${link.data.substr(0, matchIndex).replace(/^\/?/, `/`)}`), {
                selection,
            });
        },
    };
    return vscode.window.registerTerminalLinkProvider(terminalProvider);
}
exports.registerTerminalLinkProvider = registerTerminalLinkProvider;


/***/ }),

/***/ "./sources/ZipFSProvider.ts":
/*!**********************************!*\
  !*** ./sources/ZipFSProvider.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZipFSProvider = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const fslib_1 = __webpack_require__(/*! @yarnpkg/fslib */ "../yarnpkg-fslib/sources/index.ts");
const libzip_1 = __webpack_require__(/*! @yarnpkg/libzip */ "../yarnpkg-libzip/sources/sync.ts");
const vscode = (0, tslib_1.__importStar)(__webpack_require__(/*! vscode */ "vscode"));
class ZipFSProvider {
    constructor() {
        this.fs = new fslib_1.PosixFS(new fslib_1.VirtualFS({
            baseFs: new fslib_1.ZipOpenFS({
                libzip: (0, libzip_1.getLibzipSync)(),
                useCache: true,
                maxOpenFiles: 80,
            }),
        }));
        this._emitter = new vscode.EventEmitter();
        this.onDidChangeFile = this._emitter.event;
    }
    stat(uri) {
        const stat = this.fs.statSync(uri.fsPath);
        switch (true) {
            case stat.isDirectory():
            case fslib_1.npath.extname(uri.fsPath) === `.zip`:
                {
                    stat.type = vscode.FileType.Directory;
                }
                break;
            case stat.isFile():
                {
                    stat.type = vscode.FileType.File;
                }
                break;
            case stat.isSymbolicLink():
                {
                    stat.type = vscode.FileType.SymbolicLink;
                }
                break;
            default:
                {
                    stat.type = vscode.FileType.Unknown;
                }
                break;
        }
        return stat;
    }
    readDirectory(uri) {
        const listing = this.fs.readdirSync(uri.fsPath);
        return listing.map(entry => {
            const { type } = this.stat(vscode.Uri.joinPath(uri, entry));
            return [entry, type];
        });
    }
    readFile(uri) {
        return this.fs.readFileSync(uri.fsPath);
    }
    writeFile(uri, content, options) {
        if (!options.create && !this.fs.existsSync(uri.fsPath))
            throw vscode.FileSystemError.FileNotFound(uri);
        if (options.create && !options.overwrite && this.fs.existsSync(uri.fsPath))
            throw vscode.FileSystemError.FileExists(uri);
        this.fs.writeFileSync(uri.fsPath, Buffer.from(content));
    }
    rename(oldUri, newUri, options) {
        throw new Error(`Not supported`);
    }
    delete(uri, options) {
        this.fs.removeSync(uri.fsPath, options);
    }
    createDirectory(uri) {
        this.fs.mkdirSync(uri.fsPath);
    }
    watch(resource, opts) {
        return new vscode.Disposable(() => { });
    }
}
exports.ZipFSProvider = ZipFSProvider;


/***/ }),

/***/ "../yarnpkg-fslib/sources/AliasFS.ts":
/*!*******************************************!*\
  !*** ../yarnpkg-fslib/sources/AliasFS.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AliasFS = void 0;
const ProxiedFS_1 = __webpack_require__(/*! ./ProxiedFS */ "../yarnpkg-fslib/sources/ProxiedFS.ts");
class AliasFS extends ProxiedFS_1.ProxiedFS {
    constructor(target, { baseFs, pathUtils }) {
        super(pathUtils);
        this.target = target;
        this.baseFs = baseFs;
    }
    getRealPath() {
        return this.target;
    }
    getBaseFs() {
        return this.baseFs;
    }
    mapFromBase(p) {
        return p;
    }
    mapToBase(p) {
        return p;
    }
}
exports.AliasFS = AliasFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/CwdFS.ts":
/*!*****************************************!*\
  !*** ../yarnpkg-fslib/sources/CwdFS.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CwdFS = void 0;
const NodeFS_1 = __webpack_require__(/*! ./NodeFS */ "../yarnpkg-fslib/sources/NodeFS.ts");
const ProxiedFS_1 = __webpack_require__(/*! ./ProxiedFS */ "../yarnpkg-fslib/sources/ProxiedFS.ts");
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
class CwdFS extends ProxiedFS_1.ProxiedFS {
    constructor(target, { baseFs = new NodeFS_1.NodeFS() } = {}) {
        super(path_1.ppath);
        this.target = this.pathUtils.normalize(target);
        this.baseFs = baseFs;
    }
    getRealPath() {
        return this.pathUtils.resolve(this.baseFs.getRealPath(), this.target);
    }
    resolve(p) {
        if (this.pathUtils.isAbsolute(p)) {
            return path_1.ppath.normalize(p);
        }
        else {
            return this.baseFs.resolve(path_1.ppath.join(this.target, p));
        }
    }
    mapFromBase(path) {
        return path;
    }
    mapToBase(path) {
        if (this.pathUtils.isAbsolute(path)) {
            return path;
        }
        else {
            return this.pathUtils.join(this.target, path);
        }
    }
}
exports.CwdFS = CwdFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/FakeFS.ts":
/*!******************************************!*\
  !*** ../yarnpkg-fslib/sources/FakeFS.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.normalizeLineEndings = exports.BasePortableFakeFS = exports.FakeFS = void 0;
const os_1 = __webpack_require__(/*! os */ "os");
const copyPromise_1 = __webpack_require__(/*! ./algorithms/copyPromise */ "../yarnpkg-fslib/sources/algorithms/copyPromise.ts");
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
class FakeFS {
    constructor(pathUtils) {
        this.pathUtils = pathUtils;
    }
    async *genTraversePromise(init, { stableSort = false } = {}) {
        const stack = [init];
        while (stack.length > 0) {
            const p = stack.shift();
            const entry = await this.lstatPromise(p);
            if (entry.isDirectory()) {
                const entries = await this.readdirPromise(p);
                if (stableSort) {
                    for (const entry of entries.sort()) {
                        stack.push(this.pathUtils.join(p, entry));
                    }
                }
                else {
                    throw new Error(`Not supported`);
                }
            }
            else {
                yield p;
            }
        }
    }
    async removePromise(p, { recursive = true, maxRetries = 5 } = {}) {
        let stat;
        try {
            stat = await this.lstatPromise(p);
        }
        catch (error) {
            if (error.code === `ENOENT`) {
                return;
            }
            else {
                throw error;
            }
        }
        if (stat.isDirectory()) {
            if (recursive) {
                const entries = await this.readdirPromise(p);
                await Promise.all(entries.map(entry => {
                    return this.removePromise(this.pathUtils.resolve(p, entry));
                }));
            }
            // 5 gives 1s worth of retries at worst
            let t = 0;
            do {
                try {
                    await this.rmdirPromise(p);
                    break;
                }
                catch (error) {
                    if (error.code === `EBUSY` || error.code === `ENOTEMPTY`) {
                        if (maxRetries === 0) {
                            break;
                        }
                        else {
                            await new Promise(resolve => setTimeout(resolve, t * 100));
                            continue;
                        }
                    }
                    else {
                        throw error;
                    }
                }
            } while (t++ < maxRetries);
        }
        else {
            await this.unlinkPromise(p);
        }
    }
    removeSync(p, { recursive = true } = {}) {
        let stat;
        try {
            stat = this.lstatSync(p);
        }
        catch (error) {
            if (error.code === `ENOENT`) {
                return;
            }
            else {
                throw error;
            }
        }
        if (stat.isDirectory()) {
            if (recursive)
                for (const entry of this.readdirSync(p))
                    this.removeSync(this.pathUtils.resolve(p, entry));
            this.rmdirSync(p);
        }
        else {
            this.unlinkSync(p);
        }
    }
    async mkdirpPromise(p, { chmod, utimes } = {}) {
        p = this.resolve(p);
        if (p === this.pathUtils.dirname(p))
            return;
        const parts = p.split(this.pathUtils.sep);
        for (let u = 2; u <= parts.length; ++u) {
            const subPath = parts.slice(0, u).join(this.pathUtils.sep);
            if (!this.existsSync(subPath)) {
                try {
                    await this.mkdirPromise(subPath);
                }
                catch (error) {
                    if (error.code === `EEXIST`) {
                        continue;
                    }
                    else {
                        throw error;
                    }
                }
                if (chmod != null)
                    await this.chmodPromise(subPath, chmod);
                if (utimes != null) {
                    await this.utimesPromise(subPath, utimes[0], utimes[1]);
                }
                else {
                    const parentStat = await this.statPromise(this.pathUtils.dirname(subPath));
                    await this.utimesPromise(subPath, parentStat.atime, parentStat.mtime);
                }
            }
        }
    }
    mkdirpSync(p, { chmod, utimes } = {}) {
        p = this.resolve(p);
        if (p === this.pathUtils.dirname(p))
            return;
        const parts = p.split(this.pathUtils.sep);
        for (let u = 2; u <= parts.length; ++u) {
            const subPath = parts.slice(0, u).join(this.pathUtils.sep);
            if (!this.existsSync(subPath)) {
                try {
                    this.mkdirSync(subPath);
                }
                catch (error) {
                    if (error.code === `EEXIST`) {
                        continue;
                    }
                    else {
                        throw error;
                    }
                }
                if (chmod != null)
                    this.chmodSync(subPath, chmod);
                if (utimes != null) {
                    this.utimesSync(subPath, utimes[0], utimes[1]);
                }
                else {
                    const parentStat = this.statSync(this.pathUtils.dirname(subPath));
                    this.utimesSync(subPath, parentStat.atime, parentStat.mtime);
                }
            }
        }
    }
    async copyPromise(destination, source, { baseFs = this, overwrite = true, stableSort = false, stableTime = false, linkStrategy = null } = {}) {
        return await (0, copyPromise_1.copyPromise)(this, destination, baseFs, source, { overwrite, stableSort, stableTime, linkStrategy });
    }
    copySync(destination, source, { baseFs = this, overwrite = true } = {}) {
        const stat = baseFs.lstatSync(source);
        const exists = this.existsSync(destination);
        if (stat.isDirectory()) {
            this.mkdirpSync(destination);
            const directoryListing = baseFs.readdirSync(source);
            for (const entry of directoryListing) {
                this.copySync(this.pathUtils.join(destination, entry), baseFs.pathUtils.join(source, entry), { baseFs, overwrite });
            }
        }
        else if (stat.isFile()) {
            if (!exists || overwrite) {
                if (exists)
                    this.removeSync(destination);
                const content = baseFs.readFileSync(source);
                this.writeFileSync(destination, content);
            }
        }
        else if (stat.isSymbolicLink()) {
            if (!exists || overwrite) {
                if (exists)
                    this.removeSync(destination);
                const target = baseFs.readlinkSync(source);
                this.symlinkSync((0, path_1.convertPath)(this.pathUtils, target), destination);
            }
        }
        else {
            throw new Error(`Unsupported file type (file: ${source}, mode: 0o${stat.mode.toString(8).padStart(6, `0`)})`);
        }
        const mode = stat.mode & 0o777;
        this.chmodSync(destination, mode);
    }
    async changeFilePromise(p, content, opts = {}) {
        if (Buffer.isBuffer(content)) {
            return this.changeFileBufferPromise(p, content, opts);
        }
        else {
            return this.changeFileTextPromise(p, content, opts);
        }
    }
    async changeFileBufferPromise(p, content, { mode } = {}) {
        let current = Buffer.alloc(0);
        try {
            current = await this.readFilePromise(p);
        }
        catch (error) {
            // ignore errors, no big deal
        }
        if (Buffer.compare(current, content) === 0)
            return;
        await this.writeFilePromise(p, content, { mode });
    }
    async changeFileTextPromise(p, content, { automaticNewlines, mode } = {}) {
        let current = ``;
        try {
            current = await this.readFilePromise(p, `utf8`);
        }
        catch (error) {
            // ignore errors, no big deal
        }
        const normalizedContent = automaticNewlines
            ? normalizeLineEndings(current, content)
            : content;
        if (current === normalizedContent)
            return;
        await this.writeFilePromise(p, normalizedContent, { mode });
    }
    changeFileSync(p, content, opts = {}) {
        if (Buffer.isBuffer(content)) {
            return this.changeFileBufferSync(p, content, opts);
        }
        else {
            return this.changeFileTextSync(p, content, opts);
        }
    }
    changeFileBufferSync(p, content, { mode } = {}) {
        let current = Buffer.alloc(0);
        try {
            current = this.readFileSync(p);
        }
        catch (error) {
            // ignore errors, no big deal
        }
        if (Buffer.compare(current, content) === 0)
            return;
        this.writeFileSync(p, content, { mode });
    }
    changeFileTextSync(p, content, { automaticNewlines = false, mode } = {}) {
        let current = ``;
        try {
            current = this.readFileSync(p, `utf8`);
        }
        catch (error) {
            // ignore errors, no big deal
        }
        const normalizedContent = automaticNewlines
            ? normalizeLineEndings(current, content)
            : content;
        if (current === normalizedContent)
            return;
        this.writeFileSync(p, normalizedContent, { mode });
    }
    async movePromise(fromP, toP) {
        try {
            await this.renamePromise(fromP, toP);
        }
        catch (error) {
            if (error.code === `EXDEV`) {
                await this.copyPromise(toP, fromP);
                await this.removePromise(fromP);
            }
            else {
                throw error;
            }
        }
    }
    moveSync(fromP, toP) {
        try {
            this.renameSync(fromP, toP);
        }
        catch (error) {
            if (error.code === `EXDEV`) {
                this.copySync(toP, fromP);
                this.removeSync(fromP);
            }
            else {
                throw error;
            }
        }
    }
    async lockPromise(affectedPath, callback) {
        const lockPath = `${affectedPath}.flock`;
        const interval = 1000 / 60;
        const startTime = Date.now();
        let fd = null;
        // Even when we detect that a lock file exists, we still look inside to see
        // whether the pid that created it is still alive. It's not foolproof
        // (there are false positive), but there are no false negative and that's
        // all that matters in 99% of the cases.
        const isAlive = async () => {
            let pid;
            try {
                ([pid] = await this.readJsonPromise(lockPath));
            }
            catch (error) {
                // If we can't read the file repeatedly, we assume the process was
                // aborted before even writing finishing writing the payload.
                return Date.now() - startTime < 500;
            }
            try {
                // "As a special case, a signal of 0 can be used to test for the
                // existence of a process" - so we check whether it's alive.
                process.kill(pid, 0);
                return true;
            }
            catch (error) {
                return false;
            }
        };
        while (fd === null) {
            try {
                fd = await this.openPromise(lockPath, `wx`);
            }
            catch (error) {
                if (error.code === `EEXIST`) {
                    if (!await isAlive()) {
                        try {
                            await this.unlinkPromise(lockPath);
                            continue;
                        }
                        catch (error) {
                            // No big deal if we can't remove it. Just fallback to wait for
                            // it to be eventually released by its owner.
                        }
                    }
                    if (Date.now() - startTime < 60 * 1000) {
                        await new Promise(resolve => setTimeout(resolve, interval));
                    }
                    else {
                        throw new Error(`Couldn't acquire a lock in a reasonable time (via ${lockPath})`);
                    }
                }
                else {
                    throw error;
                }
            }
        }
        await this.writePromise(fd, JSON.stringify([process.pid]));
        try {
            return await callback();
        }
        finally {
            try {
                // closePromise needs to come before unlinkPromise otherwise another process can attempt
                // to get the file handle after the unlink but before close resuling in
                // EPERM: operation not permitted, open
                await this.closePromise(fd);
                await this.unlinkPromise(lockPath);
            }
            catch (error) {
                // noop
            }
        }
    }
    async readJsonPromise(p) {
        const content = await this.readFilePromise(p, `utf8`);
        try {
            return JSON.parse(content);
        }
        catch (error) {
            error.message += ` (in ${p})`;
            throw error;
        }
    }
    readJsonSync(p) {
        const content = this.readFileSync(p, `utf8`);
        try {
            return JSON.parse(content);
        }
        catch (error) {
            error.message += ` (in ${p})`;
            throw error;
        }
    }
    async writeJsonPromise(p, data) {
        return await this.writeFilePromise(p, `${JSON.stringify(data, null, 2)}\n`);
    }
    writeJsonSync(p, data) {
        return this.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
    }
    async preserveTimePromise(p, cb) {
        const stat = await this.lstatPromise(p);
        const result = await cb();
        if (typeof result !== `undefined`)
            p = result;
        if (this.lutimesPromise) {
            await this.lutimesPromise(p, stat.atime, stat.mtime);
        }
        else if (!stat.isSymbolicLink()) {
            await this.utimesPromise(p, stat.atime, stat.mtime);
        }
    }
    async preserveTimeSync(p, cb) {
        const stat = this.lstatSync(p);
        const result = cb();
        if (typeof result !== `undefined`)
            p = result;
        if (this.lutimesSync) {
            this.lutimesSync(p, stat.atime, stat.mtime);
        }
        else if (!stat.isSymbolicLink()) {
            this.utimesSync(p, stat.atime, stat.mtime);
        }
    }
}
exports.FakeFS = FakeFS;
class BasePortableFakeFS extends FakeFS {
    constructor() {
        super(path_1.ppath);
    }
}
exports.BasePortableFakeFS = BasePortableFakeFS;
function getEndOfLine(content) {
    const matches = content.match(/\r?\n/g);
    if (matches === null)
        return os_1.EOL;
    const crlf = matches.filter(nl => nl === `\r\n`).length;
    const lf = matches.length - crlf;
    return crlf > lf ? `\r\n` : `\n`;
}
function normalizeLineEndings(originalContent, newContent) {
    return newContent.replace(/\r?\n/g, getEndOfLine(originalContent));
}
exports.normalizeLineEndings = normalizeLineEndings;


/***/ }),

/***/ "../yarnpkg-fslib/sources/JailFS.ts":
/*!******************************************!*\
  !*** ../yarnpkg-fslib/sources/JailFS.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JailFS = void 0;
const NodeFS_1 = __webpack_require__(/*! ./NodeFS */ "../yarnpkg-fslib/sources/NodeFS.ts");
const ProxiedFS_1 = __webpack_require__(/*! ./ProxiedFS */ "../yarnpkg-fslib/sources/ProxiedFS.ts");
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
const JAIL_ROOT = path_1.PortablePath.root;
class JailFS extends ProxiedFS_1.ProxiedFS {
    constructor(target, { baseFs = new NodeFS_1.NodeFS() } = {}) {
        super(path_1.ppath);
        this.target = this.pathUtils.resolve(path_1.PortablePath.root, target);
        this.baseFs = baseFs;
    }
    getRealPath() {
        return this.pathUtils.resolve(this.baseFs.getRealPath(), this.pathUtils.relative(path_1.PortablePath.root, this.target));
    }
    getTarget() {
        return this.target;
    }
    getBaseFs() {
        return this.baseFs;
    }
    mapToBase(p) {
        const normalized = this.pathUtils.normalize(p);
        if (this.pathUtils.isAbsolute(p))
            return this.pathUtils.resolve(this.target, this.pathUtils.relative(JAIL_ROOT, p));
        if (normalized.match(/^\.\.\/?/))
            throw new Error(`Resolving this path (${p}) would escape the jail`);
        return this.pathUtils.resolve(this.target, p);
    }
    mapFromBase(p) {
        return this.pathUtils.resolve(JAIL_ROOT, this.pathUtils.relative(this.target, p));
    }
}
exports.JailFS = JailFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/LazyFS.ts":
/*!******************************************!*\
  !*** ../yarnpkg-fslib/sources/LazyFS.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LazyFS = void 0;
const ProxiedFS_1 = __webpack_require__(/*! ./ProxiedFS */ "../yarnpkg-fslib/sources/ProxiedFS.ts");
class LazyFS extends ProxiedFS_1.ProxiedFS {
    constructor(factory, pathUtils) {
        super(pathUtils);
        this.instance = null;
        this.factory = factory;
    }
    get baseFs() {
        if (!this.instance)
            this.instance = this.factory();
        return this.instance;
    }
    set baseFs(value) {
        this.instance = value;
    }
    mapFromBase(p) {
        return p;
    }
    mapToBase(p) {
        return p;
    }
}
exports.LazyFS = LazyFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/NoFS.ts":
/*!****************************************!*\
  !*** ../yarnpkg-fslib/sources/NoFS.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NoFS = void 0;
const FakeFS_1 = __webpack_require__(/*! ./FakeFS */ "../yarnpkg-fslib/sources/FakeFS.ts");
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
const makeError = () => Object.assign(new Error(`ENOSYS: unsupported filesystem access`), { code: `ENOSYS` });
class NoFS extends FakeFS_1.FakeFS {
    constructor() {
        super(path_1.ppath);
    }
    getExtractHint() {
        throw makeError();
    }
    getRealPath() {
        throw makeError();
    }
    resolve() {
        throw makeError();
    }
    async openPromise() {
        throw makeError();
    }
    openSync() {
        throw makeError();
    }
    async opendirPromise() {
        throw makeError();
    }
    opendirSync() {
        throw makeError();
    }
    async readPromise() {
        throw makeError();
    }
    readSync() {
        throw makeError();
    }
    async writePromise() {
        throw makeError();
    }
    writeSync() {
        throw makeError();
    }
    async closePromise() {
        throw makeError();
    }
    closeSync() {
        throw makeError();
    }
    createWriteStream() {
        throw makeError();
    }
    createReadStream() {
        throw makeError();
    }
    async realpathPromise() {
        throw makeError();
    }
    realpathSync() {
        throw makeError();
    }
    async readdirPromise() {
        throw makeError();
    }
    readdirSync() {
        throw makeError();
    }
    async existsPromise(p) {
        throw makeError();
    }
    existsSync(p) {
        throw makeError();
    }
    async accessPromise() {
        throw makeError();
    }
    accessSync() {
        throw makeError();
    }
    async statPromise() {
        throw makeError();
    }
    statSync() {
        throw makeError();
    }
    async fstatPromise(fd) {
        throw makeError();
    }
    fstatSync(fd) {
        throw makeError();
    }
    async lstatPromise(p) {
        throw makeError();
    }
    lstatSync(p) {
        throw makeError();
    }
    async chmodPromise() {
        throw makeError();
    }
    chmodSync() {
        throw makeError();
    }
    async chownPromise() {
        throw makeError();
    }
    chownSync() {
        throw makeError();
    }
    async mkdirPromise() {
        throw makeError();
    }
    mkdirSync() {
        throw makeError();
    }
    async rmdirPromise() {
        throw makeError();
    }
    rmdirSync() {
        throw makeError();
    }
    async linkPromise() {
        throw makeError();
    }
    linkSync() {
        throw makeError();
    }
    async symlinkPromise() {
        throw makeError();
    }
    symlinkSync() {
        throw makeError();
    }
    async renamePromise() {
        throw makeError();
    }
    renameSync() {
        throw makeError();
    }
    async copyFilePromise() {
        throw makeError();
    }
    copyFileSync() {
        throw makeError();
    }
    async appendFilePromise() {
        throw makeError();
    }
    appendFileSync() {
        throw makeError();
    }
    async writeFilePromise() {
        throw makeError();
    }
    writeFileSync() {
        throw makeError();
    }
    async unlinkPromise() {
        throw makeError();
    }
    unlinkSync() {
        throw makeError();
    }
    async utimesPromise() {
        throw makeError();
    }
    utimesSync() {
        throw makeError();
    }
    async readFilePromise() {
        throw makeError();
    }
    readFileSync() {
        throw makeError();
    }
    async readlinkPromise() {
        throw makeError();
    }
    readlinkSync() {
        throw makeError();
    }
    async truncatePromise() {
        throw makeError();
    }
    truncateSync() {
        throw makeError();
    }
    watch() {
        throw makeError();
    }
    watchFile() {
        throw makeError();
    }
    unwatchFile() {
        throw makeError();
    }
}
exports.NoFS = NoFS;
NoFS.instance = new NoFS();


/***/ }),

/***/ "../yarnpkg-fslib/sources/NodeFS.ts":
/*!******************************************!*\
  !*** ../yarnpkg-fslib/sources/NodeFS.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NodeFS = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const fs_1 = (0, tslib_1.__importDefault)(__webpack_require__(/*! fs */ "fs"));
const FakeFS_1 = __webpack_require__(/*! ./FakeFS */ "../yarnpkg-fslib/sources/FakeFS.ts");
const errors_1 = __webpack_require__(/*! ./errors */ "../yarnpkg-fslib/sources/errors.ts");
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
class NodeFS extends FakeFS_1.BasePortableFakeFS {
    constructor(realFs = fs_1.default) {
        super();
        this.realFs = realFs;
        // @ts-expect-error
        if (typeof this.realFs.lutimes !== `undefined`) {
            this.lutimesPromise = this.lutimesPromiseImpl;
            this.lutimesSync = this.lutimesSyncImpl;
        }
    }
    getExtractHint() {
        return false;
    }
    getRealPath() {
        return path_1.PortablePath.root;
    }
    resolve(p) {
        return path_1.ppath.resolve(p);
    }
    async openPromise(p, flags, mode) {
        return await new Promise((resolve, reject) => {
            this.realFs.open(path_1.npath.fromPortablePath(p), flags, mode, this.makeCallback(resolve, reject));
        });
    }
    openSync(p, flags, mode) {
        return this.realFs.openSync(path_1.npath.fromPortablePath(p), flags, mode);
    }
    async opendirPromise(p, opts) {
        return await new Promise((resolve, reject) => {
            if (typeof opts !== `undefined`) {
                this.realFs.opendir(path_1.npath.fromPortablePath(p), opts, this.makeCallback(resolve, reject));
            }
            else {
                this.realFs.opendir(path_1.npath.fromPortablePath(p), this.makeCallback(resolve, reject));
            }
        }).then(dir => {
            return Object.defineProperty(dir, `path`, { value: p, configurable: true, writable: true });
        });
    }
    opendirSync(p, opts) {
        const dir = typeof opts !== `undefined`
            ? this.realFs.opendirSync(path_1.npath.fromPortablePath(p), opts)
            : this.realFs.opendirSync(path_1.npath.fromPortablePath(p));
        return Object.defineProperty(dir, `path`, { value: p, configurable: true, writable: true });
    }
    async readPromise(fd, buffer, offset = 0, length = 0, position = -1) {
        return await new Promise((resolve, reject) => {
            this.realFs.read(fd, buffer, offset, length, position, (error, bytesRead) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(bytesRead);
                }
            });
        });
    }
    readSync(fd, buffer, offset, length, position) {
        return this.realFs.readSync(fd, buffer, offset, length, position);
    }
    async writePromise(fd, buffer, offset, length, position) {
        return await new Promise((resolve, reject) => {
            if (typeof buffer === `string`) {
                return this.realFs.write(fd, buffer, offset, this.makeCallback(resolve, reject));
            }
            else {
                return this.realFs.write(fd, buffer, offset, length, position, this.makeCallback(resolve, reject));
            }
        });
    }
    writeSync(fd, buffer, offset, length, position) {
        if (typeof buffer === `string`) {
            return this.realFs.writeSync(fd, buffer, offset);
        }
        else {
            return this.realFs.writeSync(fd, buffer, offset, length, position);
        }
    }
    async closePromise(fd) {
        await new Promise((resolve, reject) => {
            this.realFs.close(fd, this.makeCallback(resolve, reject));
        });
    }
    closeSync(fd) {
        this.realFs.closeSync(fd);
    }
    createReadStream(p, opts) {
        const realPath = (p !== null ? path_1.npath.fromPortablePath(p) : p);
        return this.realFs.createReadStream(realPath, opts);
    }
    createWriteStream(p, opts) {
        const realPath = (p !== null ? path_1.npath.fromPortablePath(p) : p);
        return this.realFs.createWriteStream(realPath, opts);
    }
    async realpathPromise(p) {
        return await new Promise((resolve, reject) => {
            this.realFs.realpath(path_1.npath.fromPortablePath(p), {}, this.makeCallback(resolve, reject));
        }).then(path => {
            return path_1.npath.toPortablePath(path);
        });
    }
    realpathSync(p) {
        return path_1.npath.toPortablePath(this.realFs.realpathSync(path_1.npath.fromPortablePath(p), {}));
    }
    async existsPromise(p) {
        return await new Promise(resolve => {
            this.realFs.exists(path_1.npath.fromPortablePath(p), resolve);
        });
    }
    accessSync(p, mode) {
        return this.realFs.accessSync(path_1.npath.fromPortablePath(p), mode);
    }
    async accessPromise(p, mode) {
        return await new Promise((resolve, reject) => {
            this.realFs.access(path_1.npath.fromPortablePath(p), mode, this.makeCallback(resolve, reject));
        });
    }
    existsSync(p) {
        return this.realFs.existsSync(path_1.npath.fromPortablePath(p));
    }
    async statPromise(p, opts) {
        return await new Promise((resolve, reject) => {
            if (opts) {
                this.realFs.stat(path_1.npath.fromPortablePath(p), opts, this.makeCallback(resolve, reject));
            }
            else {
                this.realFs.stat(path_1.npath.fromPortablePath(p), this.makeCallback(resolve, reject));
            }
        });
    }
    statSync(p, opts) {
        if (opts) {
            return this.realFs.statSync(path_1.npath.fromPortablePath(p), opts);
        }
        else {
            return this.realFs.statSync(path_1.npath.fromPortablePath(p));
        }
    }
    async fstatPromise(fd, opts) {
        return await new Promise((resolve, reject) => {
            if (opts) {
                // @ts-expect-error - The node typings doesn't know about the options
                this.realFs.fstat(fd, opts, this.makeCallback(resolve, reject));
            }
            else {
                this.realFs.fstat(fd, this.makeCallback(resolve, reject));
            }
        });
    }
    fstatSync(fd, opts) {
        if (opts) {
            // @ts-expect-error - The node typings doesn't know about the options
            return this.realFs.fstatSync(fd, opts);
        }
        else {
            return this.realFs.fstatSync(fd);
        }
    }
    async lstatPromise(p, opts) {
        return await new Promise((resolve, reject) => {
            if (opts) {
                // @ts-expect-error - TS does not know this takes options
                this.realFs.lstat(path_1.npath.fromPortablePath(p), opts, this.makeCallback(resolve, reject));
            }
            else {
                this.realFs.lstat(path_1.npath.fromPortablePath(p), this.makeCallback(resolve, reject));
            }
        });
    }
    lstatSync(p, opts) {
        if (opts) {
            // @ts-expect-error - TS does not know this takes options
            return this.realFs.lstatSync(path_1.npath.fromPortablePath(p), opts);
        }
        else {
            return this.realFs.lstatSync(path_1.npath.fromPortablePath(p));
        }
    }
    async chmodPromise(p, mask) {
        return await new Promise((resolve, reject) => {
            this.realFs.chmod(path_1.npath.fromPortablePath(p), mask, this.makeCallback(resolve, reject));
        });
    }
    chmodSync(p, mask) {
        return this.realFs.chmodSync(path_1.npath.fromPortablePath(p), mask);
    }
    async chownPromise(p, uid, gid) {
        return await new Promise((resolve, reject) => {
            this.realFs.chown(path_1.npath.fromPortablePath(p), uid, gid, this.makeCallback(resolve, reject));
        });
    }
    chownSync(p, uid, gid) {
        return this.realFs.chownSync(path_1.npath.fromPortablePath(p), uid, gid);
    }
    async renamePromise(oldP, newP) {
        return await new Promise((resolve, reject) => {
            this.realFs.rename(path_1.npath.fromPortablePath(oldP), path_1.npath.fromPortablePath(newP), this.makeCallback(resolve, reject));
        });
    }
    renameSync(oldP, newP) {
        return this.realFs.renameSync(path_1.npath.fromPortablePath(oldP), path_1.npath.fromPortablePath(newP));
    }
    async copyFilePromise(sourceP, destP, flags = 0) {
        return await new Promise((resolve, reject) => {
            this.realFs.copyFile(path_1.npath.fromPortablePath(sourceP), path_1.npath.fromPortablePath(destP), flags, this.makeCallback(resolve, reject));
        });
    }
    copyFileSync(sourceP, destP, flags = 0) {
        return this.realFs.copyFileSync(path_1.npath.fromPortablePath(sourceP), path_1.npath.fromPortablePath(destP), flags);
    }
    async appendFilePromise(p, content, opts) {
        return await new Promise((resolve, reject) => {
            const fsNativePath = typeof p === `string` ? path_1.npath.fromPortablePath(p) : p;
            if (opts) {
                this.realFs.appendFile(fsNativePath, content, opts, this.makeCallback(resolve, reject));
            }
            else {
                this.realFs.appendFile(fsNativePath, content, this.makeCallback(resolve, reject));
            }
        });
    }
    appendFileSync(p, content, opts) {
        const fsNativePath = typeof p === `string` ? path_1.npath.fromPortablePath(p) : p;
        if (opts) {
            this.realFs.appendFileSync(fsNativePath, content, opts);
        }
        else {
            this.realFs.appendFileSync(fsNativePath, content);
        }
    }
    async writeFilePromise(p, content, opts) {
        return await new Promise((resolve, reject) => {
            const fsNativePath = typeof p === `string` ? path_1.npath.fromPortablePath(p) : p;
            if (opts) {
                this.realFs.writeFile(fsNativePath, content, opts, this.makeCallback(resolve, reject));
            }
            else {
                this.realFs.writeFile(fsNativePath, content, this.makeCallback(resolve, reject));
            }
        });
    }
    writeFileSync(p, content, opts) {
        const fsNativePath = typeof p === `string` ? path_1.npath.fromPortablePath(p) : p;
        if (opts) {
            this.realFs.writeFileSync(fsNativePath, content, opts);
        }
        else {
            this.realFs.writeFileSync(fsNativePath, content);
        }
    }
    async unlinkPromise(p) {
        return await new Promise((resolve, reject) => {
            this.realFs.unlink(path_1.npath.fromPortablePath(p), this.makeCallback(resolve, reject));
        });
    }
    unlinkSync(p) {
        return this.realFs.unlinkSync(path_1.npath.fromPortablePath(p));
    }
    async utimesPromise(p, atime, mtime) {
        return await new Promise((resolve, reject) => {
            this.realFs.utimes(path_1.npath.fromPortablePath(p), atime, mtime, this.makeCallback(resolve, reject));
        });
    }
    utimesSync(p, atime, mtime) {
        this.realFs.utimesSync(path_1.npath.fromPortablePath(p), atime, mtime);
    }
    async lutimesPromiseImpl(p, atime, mtime) {
        // @ts-expect-error: Not yet in DefinitelyTyped
        const lutimes = this.realFs.lutimes;
        if (typeof lutimes === `undefined`)
            throw (0, errors_1.ENOSYS)(`unavailable Node binding`, `lutimes '${p}'`);
        return await new Promise((resolve, reject) => {
            lutimes.call(this.realFs, path_1.npath.fromPortablePath(p), atime, mtime, this.makeCallback(resolve, reject));
        });
    }
    lutimesSyncImpl(p, atime, mtime) {
        // @ts-expect-error: Not yet in DefinitelyTyped
        const lutimesSync = this.realFs.lutimesSync;
        if (typeof lutimesSync === `undefined`)
            throw (0, errors_1.ENOSYS)(`unavailable Node binding`, `lutimes '${p}'`);
        lutimesSync.call(this.realFs, path_1.npath.fromPortablePath(p), atime, mtime);
    }
    async mkdirPromise(p, opts) {
        return await new Promise((resolve, reject) => {
            this.realFs.mkdir(path_1.npath.fromPortablePath(p), opts, this.makeCallback(resolve, reject));
        });
    }
    mkdirSync(p, opts) {
        return this.realFs.mkdirSync(path_1.npath.fromPortablePath(p), opts);
    }
    async rmdirPromise(p, opts) {
        return await new Promise((resolve, reject) => {
            // TODO: always pass opts when min node version is 12.10+
            if (opts) {
                this.realFs.rmdir(path_1.npath.fromPortablePath(p), opts, this.makeCallback(resolve, reject));
            }
            else {
                this.realFs.rmdir(path_1.npath.fromPortablePath(p), this.makeCallback(resolve, reject));
            }
        });
    }
    rmdirSync(p, opts) {
        return this.realFs.rmdirSync(path_1.npath.fromPortablePath(p), opts);
    }
    async linkPromise(existingP, newP) {
        return await new Promise((resolve, reject) => {
            this.realFs.link(path_1.npath.fromPortablePath(existingP), path_1.npath.fromPortablePath(newP), this.makeCallback(resolve, reject));
        });
    }
    linkSync(existingP, newP) {
        return this.realFs.linkSync(path_1.npath.fromPortablePath(existingP), path_1.npath.fromPortablePath(newP));
    }
    async symlinkPromise(target, p, type) {
        return await new Promise((resolve, reject) => {
            this.realFs.symlink(path_1.npath.fromPortablePath(target.replace(/\/+$/, ``)), path_1.npath.fromPortablePath(p), type, this.makeCallback(resolve, reject));
        });
    }
    symlinkSync(target, p, type) {
        return this.realFs.symlinkSync(path_1.npath.fromPortablePath(target.replace(/\/+$/, ``)), path_1.npath.fromPortablePath(p), type);
    }
    async readFilePromise(p, encoding) {
        return await new Promise((resolve, reject) => {
            const fsNativePath = typeof p === `string` ? path_1.npath.fromPortablePath(p) : p;
            this.realFs.readFile(fsNativePath, encoding, this.makeCallback(resolve, reject));
        });
    }
    readFileSync(p, encoding) {
        const fsNativePath = typeof p === `string` ? path_1.npath.fromPortablePath(p) : p;
        return this.realFs.readFileSync(fsNativePath, encoding);
    }
    async readdirPromise(p, opts) {
        return await new Promise((resolve, reject) => {
            if (opts === null || opts === void 0 ? void 0 : opts.withFileTypes) {
                this.realFs.readdir(path_1.npath.fromPortablePath(p), { withFileTypes: true }, this.makeCallback(resolve, reject));
            }
            else {
                this.realFs.readdir(path_1.npath.fromPortablePath(p), this.makeCallback(value => resolve(value), reject));
            }
        });
    }
    readdirSync(p, opts) {
        if (opts === null || opts === void 0 ? void 0 : opts.withFileTypes) {
            return this.realFs.readdirSync(path_1.npath.fromPortablePath(p), { withFileTypes: true });
        }
        else {
            return this.realFs.readdirSync(path_1.npath.fromPortablePath(p));
        }
    }
    async readlinkPromise(p) {
        return await new Promise((resolve, reject) => {
            this.realFs.readlink(path_1.npath.fromPortablePath(p), this.makeCallback(resolve, reject));
        }).then(path => {
            return path_1.npath.toPortablePath(path);
        });
    }
    readlinkSync(p) {
        return path_1.npath.toPortablePath(this.realFs.readlinkSync(path_1.npath.fromPortablePath(p)));
    }
    async truncatePromise(p, len) {
        return await new Promise((resolve, reject) => {
            this.realFs.truncate(path_1.npath.fromPortablePath(p), len, this.makeCallback(resolve, reject));
        });
    }
    truncateSync(p, len) {
        return this.realFs.truncateSync(path_1.npath.fromPortablePath(p), len);
    }
    watch(p, a, b) {
        return this.realFs.watch(path_1.npath.fromPortablePath(p), 
        // @ts-expect-error
        a, b);
    }
    watchFile(p, a, b) {
        return this.realFs.watchFile(path_1.npath.fromPortablePath(p), 
        // @ts-expect-error
        a, b);
    }
    unwatchFile(p, cb) {
        return this.realFs.unwatchFile(path_1.npath.fromPortablePath(p), cb);
    }
    makeCallback(resolve, reject) {
        return (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        };
    }
}
exports.NodeFS = NodeFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/PosixFS.ts":
/*!*******************************************!*\
  !*** ../yarnpkg-fslib/sources/PosixFS.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PosixFS = void 0;
const ProxiedFS_1 = __webpack_require__(/*! ./ProxiedFS */ "../yarnpkg-fslib/sources/ProxiedFS.ts");
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
class PosixFS extends ProxiedFS_1.ProxiedFS {
    constructor(baseFs) {
        super(path_1.npath);
        this.baseFs = baseFs;
    }
    mapFromBase(path) {
        return path_1.npath.fromPortablePath(path);
    }
    mapToBase(path) {
        return path_1.npath.toPortablePath(path);
    }
}
exports.PosixFS = PosixFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/ProxiedFS.ts":
/*!*********************************************!*\
  !*** ../yarnpkg-fslib/sources/ProxiedFS.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProxiedFS = void 0;
const FakeFS_1 = __webpack_require__(/*! ./FakeFS */ "../yarnpkg-fslib/sources/FakeFS.ts");
class ProxiedFS extends FakeFS_1.FakeFS {
    getExtractHint(hints) {
        return this.baseFs.getExtractHint(hints);
    }
    resolve(path) {
        return this.mapFromBase(this.baseFs.resolve(this.mapToBase(path)));
    }
    getRealPath() {
        return this.mapFromBase(this.baseFs.getRealPath());
    }
    async openPromise(p, flags, mode) {
        return this.baseFs.openPromise(this.mapToBase(p), flags, mode);
    }
    openSync(p, flags, mode) {
        return this.baseFs.openSync(this.mapToBase(p), flags, mode);
    }
    async opendirPromise(p, opts) {
        return Object.assign(await this.baseFs.opendirPromise(this.mapToBase(p), opts), { path: p });
    }
    opendirSync(p, opts) {
        return Object.assign(this.baseFs.opendirSync(this.mapToBase(p), opts), { path: p });
    }
    async readPromise(fd, buffer, offset, length, position) {
        return await this.baseFs.readPromise(fd, buffer, offset, length, position);
    }
    readSync(fd, buffer, offset, length, position) {
        return this.baseFs.readSync(fd, buffer, offset, length, position);
    }
    async writePromise(fd, buffer, offset, length, position) {
        if (typeof buffer === `string`) {
            return await this.baseFs.writePromise(fd, buffer, offset);
        }
        else {
            return await this.baseFs.writePromise(fd, buffer, offset, length, position);
        }
    }
    writeSync(fd, buffer, offset, length, position) {
        if (typeof buffer === `string`) {
            return this.baseFs.writeSync(fd, buffer, offset);
        }
        else {
            return this.baseFs.writeSync(fd, buffer, offset, length, position);
        }
    }
    async closePromise(fd) {
        return this.baseFs.closePromise(fd);
    }
    closeSync(fd) {
        this.baseFs.closeSync(fd);
    }
    createReadStream(p, opts) {
        return this.baseFs.createReadStream(p !== null ? this.mapToBase(p) : p, opts);
    }
    createWriteStream(p, opts) {
        return this.baseFs.createWriteStream(p !== null ? this.mapToBase(p) : p, opts);
    }
    async realpathPromise(p) {
        return this.mapFromBase(await this.baseFs.realpathPromise(this.mapToBase(p)));
    }
    realpathSync(p) {
        return this.mapFromBase(this.baseFs.realpathSync(this.mapToBase(p)));
    }
    async existsPromise(p) {
        return this.baseFs.existsPromise(this.mapToBase(p));
    }
    existsSync(p) {
        return this.baseFs.existsSync(this.mapToBase(p));
    }
    accessSync(p, mode) {
        return this.baseFs.accessSync(this.mapToBase(p), mode);
    }
    async accessPromise(p, mode) {
        return this.baseFs.accessPromise(this.mapToBase(p), mode);
    }
    async statPromise(p, opts) {
        return this.baseFs.statPromise(this.mapToBase(p), opts);
    }
    statSync(p, opts) {
        return this.baseFs.statSync(this.mapToBase(p), opts);
    }
    async fstatPromise(fd, opts) {
        return this.baseFs.fstatPromise(fd, opts);
    }
    fstatSync(fd, opts) {
        return this.baseFs.fstatSync(fd, opts);
    }
    async lstatPromise(p, opts) {
        return this.baseFs.lstatPromise(this.mapToBase(p), opts);
    }
    lstatSync(p, opts) {
        return this.baseFs.lstatSync(this.mapToBase(p), opts);
    }
    async chmodPromise(p, mask) {
        return this.baseFs.chmodPromise(this.mapToBase(p), mask);
    }
    chmodSync(p, mask) {
        return this.baseFs.chmodSync(this.mapToBase(p), mask);
    }
    async chownPromise(p, uid, gid) {
        return this.baseFs.chownPromise(this.mapToBase(p), uid, gid);
    }
    chownSync(p, uid, gid) {
        return this.baseFs.chownSync(this.mapToBase(p), uid, gid);
    }
    async renamePromise(oldP, newP) {
        return this.baseFs.renamePromise(this.mapToBase(oldP), this.mapToBase(newP));
    }
    renameSync(oldP, newP) {
        return this.baseFs.renameSync(this.mapToBase(oldP), this.mapToBase(newP));
    }
    async copyFilePromise(sourceP, destP, flags = 0) {
        return this.baseFs.copyFilePromise(this.mapToBase(sourceP), this.mapToBase(destP), flags);
    }
    copyFileSync(sourceP, destP, flags = 0) {
        return this.baseFs.copyFileSync(this.mapToBase(sourceP), this.mapToBase(destP), flags);
    }
    async appendFilePromise(p, content, opts) {
        return this.baseFs.appendFilePromise(this.fsMapToBase(p), content, opts);
    }
    appendFileSync(p, content, opts) {
        return this.baseFs.appendFileSync(this.fsMapToBase(p), content, opts);
    }
    async writeFilePromise(p, content, opts) {
        return this.baseFs.writeFilePromise(this.fsMapToBase(p), content, opts);
    }
    writeFileSync(p, content, opts) {
        return this.baseFs.writeFileSync(this.fsMapToBase(p), content, opts);
    }
    async unlinkPromise(p) {
        return this.baseFs.unlinkPromise(this.mapToBase(p));
    }
    unlinkSync(p) {
        return this.baseFs.unlinkSync(this.mapToBase(p));
    }
    async utimesPromise(p, atime, mtime) {
        return this.baseFs.utimesPromise(this.mapToBase(p), atime, mtime);
    }
    utimesSync(p, atime, mtime) {
        return this.baseFs.utimesSync(this.mapToBase(p), atime, mtime);
    }
    async mkdirPromise(p, opts) {
        return this.baseFs.mkdirPromise(this.mapToBase(p), opts);
    }
    mkdirSync(p, opts) {
        return this.baseFs.mkdirSync(this.mapToBase(p), opts);
    }
    async rmdirPromise(p, opts) {
        return this.baseFs.rmdirPromise(this.mapToBase(p), opts);
    }
    rmdirSync(p, opts) {
        return this.baseFs.rmdirSync(this.mapToBase(p), opts);
    }
    async linkPromise(existingP, newP) {
        return this.baseFs.linkPromise(this.mapToBase(existingP), this.mapToBase(newP));
    }
    linkSync(existingP, newP) {
        return this.baseFs.linkSync(this.mapToBase(existingP), this.mapToBase(newP));
    }
    async symlinkPromise(target, p, type) {
        const mappedP = this.mapToBase(p);
        if (this.pathUtils.isAbsolute(target))
            return this.baseFs.symlinkPromise(this.mapToBase(target), mappedP, type);
        const mappedAbsoluteTarget = this.mapToBase(this.pathUtils.join(this.pathUtils.dirname(p), target));
        const mappedTarget = this.baseFs.pathUtils.relative(this.baseFs.pathUtils.dirname(mappedP), mappedAbsoluteTarget);
        return this.baseFs.symlinkPromise(mappedTarget, mappedP, type);
    }
    symlinkSync(target, p, type) {
        const mappedP = this.mapToBase(p);
        if (this.pathUtils.isAbsolute(target))
            return this.baseFs.symlinkSync(this.mapToBase(target), mappedP, type);
        const mappedAbsoluteTarget = this.mapToBase(this.pathUtils.join(this.pathUtils.dirname(p), target));
        const mappedTarget = this.baseFs.pathUtils.relative(this.baseFs.pathUtils.dirname(mappedP), mappedAbsoluteTarget);
        return this.baseFs.symlinkSync(mappedTarget, mappedP, type);
    }
    async readFilePromise(p, encoding) {
        // This weird condition is required to tell TypeScript that the signatures are proper (otherwise it thinks that only the generic one is covered)
        if (encoding === `utf8`) {
            return this.baseFs.readFilePromise(this.fsMapToBase(p), encoding);
        }
        else {
            return this.baseFs.readFilePromise(this.fsMapToBase(p), encoding);
        }
    }
    readFileSync(p, encoding) {
        // This weird condition is required to tell TypeScript that the signatures are proper (otherwise it thinks that only the generic one is covered)
        if (encoding === `utf8`) {
            return this.baseFs.readFileSync(this.fsMapToBase(p), encoding);
        }
        else {
            return this.baseFs.readFileSync(this.fsMapToBase(p), encoding);
        }
    }
    async readdirPromise(p, opts) {
        return this.baseFs.readdirPromise(this.mapToBase(p), opts);
    }
    readdirSync(p, opts) {
        return this.baseFs.readdirSync(this.mapToBase(p), opts);
    }
    async readlinkPromise(p) {
        return this.mapFromBase(await this.baseFs.readlinkPromise(this.mapToBase(p)));
    }
    readlinkSync(p) {
        return this.mapFromBase(this.baseFs.readlinkSync(this.mapToBase(p)));
    }
    async truncatePromise(p, len) {
        return this.baseFs.truncatePromise(this.mapToBase(p), len);
    }
    truncateSync(p, len) {
        return this.baseFs.truncateSync(this.mapToBase(p), len);
    }
    watch(p, a, b) {
        return this.baseFs.watch(this.mapToBase(p), 
        // @ts-expect-error
        a, b);
    }
    watchFile(p, a, b) {
        return this.baseFs.watchFile(this.mapToBase(p), 
        // @ts-expect-error
        a, b);
    }
    unwatchFile(p, cb) {
        return this.baseFs.unwatchFile(this.mapToBase(p), cb);
    }
    fsMapToBase(p) {
        if (typeof p === `number`) {
            return p;
        }
        else {
            return this.mapToBase(p);
        }
    }
}
exports.ProxiedFS = ProxiedFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/URLFS.ts":
/*!*****************************************!*\
  !*** ../yarnpkg-fslib/sources/URLFS.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.URLFS = void 0;
const url_1 = __webpack_require__(/*! url */ "url");
const ProxiedFS_1 = __webpack_require__(/*! ./ProxiedFS */ "../yarnpkg-fslib/sources/ProxiedFS.ts");
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
/**
 * Adds support for file URLs to the wrapped `baseFs`, but *not* inside the typings.
 *
 * Only exists for compatibility with Node's behavior.
 *
 * Automatically wraps all FS instances passed to `patchFs` & `extendFs`.
 *
 * Don't use it!
 */
class URLFS extends ProxiedFS_1.ProxiedFS {
    constructor(baseFs) {
        super(path_1.npath);
        this.baseFs = baseFs;
    }
    mapFromBase(path) {
        return path;
    }
    mapToBase(path) {
        if (path instanceof url_1.URL)
            return (0, url_1.fileURLToPath)(path);
        return path;
    }
}
exports.URLFS = URLFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/VirtualFS.ts":
/*!*********************************************!*\
  !*** ../yarnpkg-fslib/sources/VirtualFS.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VirtualFS = void 0;
const NodeFS_1 = __webpack_require__(/*! ./NodeFS */ "../yarnpkg-fslib/sources/NodeFS.ts");
const ProxiedFS_1 = __webpack_require__(/*! ./ProxiedFS */ "../yarnpkg-fslib/sources/ProxiedFS.ts");
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
const NUMBER_REGEXP = /^[0-9]+$/;
// $0: full path
// $1: virtual folder
// $2: virtual segment
// $3: hash
// $4: depth
// $5: subpath
const VIRTUAL_REGEXP = /^(\/(?:[^/]+\/)*?(?:\$\$virtual|__virtual__))((?:\/((?:[^/]+-)?[a-f0-9]+)(?:\/([^/]+))?)?((?:\/.*)?))$/;
const VALID_COMPONENT = /^([^/]+-)?[a-f0-9]+$/;
class VirtualFS extends ProxiedFS_1.ProxiedFS {
    constructor({ baseFs = new NodeFS_1.NodeFS() } = {}) {
        super(path_1.ppath);
        this.baseFs = baseFs;
    }
    static makeVirtualPath(base, component, to) {
        if (path_1.ppath.basename(base) !== `__virtual__`)
            throw new Error(`Assertion failed: Virtual folders must be named "__virtual__"`);
        if (!path_1.ppath.basename(component).match(VALID_COMPONENT))
            throw new Error(`Assertion failed: Virtual components must be ended by an hexadecimal hash`);
        // Obtains the relative distance between the virtual path and its actual target
        const target = path_1.ppath.relative(path_1.ppath.dirname(base), to);
        const segments = target.split(`/`);
        // Counts how many levels we need to go back to start applying the rest of the path
        let depth = 0;
        while (depth < segments.length && segments[depth] === `..`)
            depth += 1;
        const finalSegments = segments.slice(depth);
        const fullVirtualPath = path_1.ppath.join(base, component, String(depth), ...finalSegments);
        return fullVirtualPath;
    }
    static resolveVirtual(p) {
        const match = p.match(VIRTUAL_REGEXP);
        if (!match || (!match[3] && match[5]))
            return p;
        const target = path_1.ppath.dirname(match[1]);
        if (!match[3] || !match[4])
            return target;
        const isnum = NUMBER_REGEXP.test(match[4]);
        if (!isnum)
            return p;
        const depth = Number(match[4]);
        const backstep = `../`.repeat(depth);
        const subpath = (match[5] || `.`);
        return VirtualFS.resolveVirtual(path_1.ppath.join(target, backstep, subpath));
    }
    getExtractHint(hints) {
        return this.baseFs.getExtractHint(hints);
    }
    getRealPath() {
        return this.baseFs.getRealPath();
    }
    realpathSync(p) {
        const match = p.match(VIRTUAL_REGEXP);
        if (!match)
            return this.baseFs.realpathSync(p);
        if (!match[5])
            return p;
        const realpath = this.baseFs.realpathSync(this.mapToBase(p));
        return VirtualFS.makeVirtualPath(match[1], match[3], realpath);
    }
    async realpathPromise(p) {
        const match = p.match(VIRTUAL_REGEXP);
        if (!match)
            return await this.baseFs.realpathPromise(p);
        if (!match[5])
            return p;
        const realpath = await this.baseFs.realpathPromise(this.mapToBase(p));
        return VirtualFS.makeVirtualPath(match[1], match[3], realpath);
    }
    mapToBase(p) {
        if (this.pathUtils.isAbsolute(p))
            return VirtualFS.resolveVirtual(p);
        const resolvedRoot = VirtualFS.resolveVirtual(this.baseFs.resolve(path_1.PortablePath.dot));
        const resolvedP = VirtualFS.resolveVirtual(this.baseFs.resolve(p));
        return path_1.ppath.relative(resolvedRoot, resolvedP) || path_1.PortablePath.dot;
    }
    mapFromBase(p) {
        return p;
    }
}
exports.VirtualFS = VirtualFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/ZipFS.ts":
/*!*****************************************!*\
  !*** ../yarnpkg-fslib/sources/ZipFS.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZipFS = exports.makeEmptyArchive = exports.DEFAULT_COMPRESSION_LEVEL = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const fs_1 = __webpack_require__(/*! fs */ "fs");
const stream_1 = __webpack_require__(/*! stream */ "stream");
const util_1 = __webpack_require__(/*! util */ "util");
const zlib_1 = (0, tslib_1.__importDefault)(__webpack_require__(/*! zlib */ "zlib"));
const FakeFS_1 = __webpack_require__(/*! ./FakeFS */ "../yarnpkg-fslib/sources/FakeFS.ts");
const NodeFS_1 = __webpack_require__(/*! ./NodeFS */ "../yarnpkg-fslib/sources/NodeFS.ts");
const opendir_1 = __webpack_require__(/*! ./algorithms/opendir */ "../yarnpkg-fslib/sources/algorithms/opendir.ts");
const watchFile_1 = __webpack_require__(/*! ./algorithms/watchFile */ "../yarnpkg-fslib/sources/algorithms/watchFile.ts");
const constants_1 = __webpack_require__(/*! ./constants */ "../yarnpkg-fslib/sources/constants.ts");
const errors = (0, tslib_1.__importStar)(__webpack_require__(/*! ./errors */ "../yarnpkg-fslib/sources/errors.ts"));
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
const statUtils = (0, tslib_1.__importStar)(__webpack_require__(/*! ./statUtils */ "../yarnpkg-fslib/sources/statUtils.ts"));
exports.DEFAULT_COMPRESSION_LEVEL = `mixed`;
function toUnixTimestamp(time) {
    if (typeof time === `string` && String(+time) === time)
        return +time;
    if (Number.isFinite(time)) {
        if (time < 0) {
            return Date.now() / 1000;
        }
        else {
            return time;
        }
    }
    // convert to 123.456 UNIX timestamp
    if ((0, util_1.isDate)(time))
        return time.getTime() / 1000;
    throw new Error(`Invalid time`);
}
function makeEmptyArchive() {
    return Buffer.from([
        0x50, 0x4B, 0x05, 0x06,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00,
    ]);
}
exports.makeEmptyArchive = makeEmptyArchive;
class ZipFS extends FakeFS_1.BasePortableFakeFS {
    constructor(source, opts) {
        super();
        this.lzSource = null;
        this.listings = new Map();
        this.entries = new Map();
        /**
         * A cache of indices mapped to file sources.
         * Populated by `setFileSource` calls.
         * Required for supporting read after write.
         */
        this.fileSources = new Map();
        this.fds = new Map();
        this.nextFd = 0;
        this.ready = false;
        this.readOnly = false;
        this.libzip = opts.libzip;
        const pathOptions = opts;
        this.level = typeof pathOptions.level !== `undefined`
            ? pathOptions.level
            : exports.DEFAULT_COMPRESSION_LEVEL;
        source !== null && source !== void 0 ? source : (source = makeEmptyArchive());
        if (typeof source === `string`) {
            const { baseFs = new NodeFS_1.NodeFS() } = pathOptions;
            this.baseFs = baseFs;
            this.path = source;
        }
        else {
            this.path = null;
            this.baseFs = null;
        }
        if (opts.stats) {
            this.stats = opts.stats;
        }
        else {
            if (typeof source === `string`) {
                try {
                    this.stats = this.baseFs.statSync(source);
                }
                catch (error) {
                    if (error.code === `ENOENT` && pathOptions.create) {
                        this.stats = statUtils.makeDefaultStats();
                    }
                    else {
                        throw error;
                    }
                }
            }
            else {
                this.stats = statUtils.makeDefaultStats();
            }
        }
        const errPtr = this.libzip.malloc(4);
        try {
            let flags = 0;
            if (typeof source === `string` && pathOptions.create)
                flags |= this.libzip.ZIP_CREATE | this.libzip.ZIP_TRUNCATE;
            if (opts.readOnly) {
                flags |= this.libzip.ZIP_RDONLY;
                this.readOnly = true;
            }
            if (typeof source === `string`) {
                this.zip = this.libzip.open(path_1.npath.fromPortablePath(source), flags, errPtr);
            }
            else {
                const lzSource = this.allocateUnattachedSource(source);
                try {
                    this.zip = this.libzip.openFromSource(lzSource, flags, errPtr);
                    this.lzSource = lzSource;
                }
                catch (error) {
                    this.libzip.source.free(lzSource);
                    throw error;
                }
            }
            if (this.zip === 0) {
                const error = this.libzip.struct.errorS();
                this.libzip.error.initWithCode(error, this.libzip.getValue(errPtr, `i32`));
                throw this.makeLibzipError(error);
            }
        }
        finally {
            this.libzip.free(errPtr);
        }
        this.listings.set(path_1.PortablePath.root, new Set());
        const entryCount = this.libzip.getNumEntries(this.zip, 0);
        for (let t = 0; t < entryCount; ++t) {
            const raw = this.libzip.getName(this.zip, t, 0);
            if (path_1.ppath.isAbsolute(raw))
                continue;
            const p = path_1.ppath.resolve(path_1.PortablePath.root, raw);
            this.registerEntry(p, t);
            // If the raw path is a directory, register it
            // to prevent empty folder being skipped
            if (raw.endsWith(`/`)) {
                this.registerListing(p);
            }
        }
        this.symlinkCount = this.libzip.ext.countSymlinks(this.zip);
        if (this.symlinkCount === -1)
            throw this.makeLibzipError(this.libzip.getError(this.zip));
        this.ready = true;
    }
    makeLibzipError(error) {
        const errorCode = this.libzip.struct.errorCodeZip(error);
        const strerror = this.libzip.error.strerror(error);
        const libzipError = new errors.LibzipError(strerror, this.libzip.errors[errorCode]);
        // This error should never come up because of the file source cache
        if (errorCode === this.libzip.errors.ZIP_ER_CHANGED)
            throw new Error(`Assertion failed: Unexpected libzip error: ${libzipError.message}`);
        return libzipError;
    }
    getExtractHint(hints) {
        for (const fileName of this.entries.keys()) {
            const ext = this.pathUtils.extname(fileName);
            if (hints.relevantExtensions.has(ext)) {
                return true;
            }
        }
        return false;
    }
    getAllFiles() {
        return Array.from(this.entries.keys());
    }
    getRealPath() {
        if (!this.path)
            throw new Error(`ZipFS don't have real paths when loaded from a buffer`);
        return this.path;
    }
    getBufferAndClose() {
        this.prepareClose();
        if (!this.lzSource)
            throw new Error(`ZipFS was not created from a Buffer`);
        try {
            // Prevent close from cleaning up the source
            this.libzip.source.keep(this.lzSource);
            // Close the zip archive
            if (this.libzip.close(this.zip) === -1)
                throw this.makeLibzipError(this.libzip.getError(this.zip));
            // Open the source for reading
            if (this.libzip.source.open(this.lzSource) === -1)
                throw this.makeLibzipError(this.libzip.source.error(this.lzSource));
            // Move to the end of source
            if (this.libzip.source.seek(this.lzSource, 0, 0, this.libzip.SEEK_END) === -1)
                throw this.makeLibzipError(this.libzip.source.error(this.lzSource));
            // Get the size of source
            const size = this.libzip.source.tell(this.lzSource);
            if (size === -1)
                throw this.makeLibzipError(this.libzip.source.error(this.lzSource));
            // Move to the start of source
            if (this.libzip.source.seek(this.lzSource, 0, 0, this.libzip.SEEK_SET) === -1)
                throw this.makeLibzipError(this.libzip.source.error(this.lzSource));
            const buffer = this.libzip.malloc(size);
            if (!buffer)
                throw new Error(`Couldn't allocate enough memory`);
            try {
                const rc = this.libzip.source.read(this.lzSource, buffer, size);
                if (rc === -1)
                    throw this.makeLibzipError(this.libzip.source.error(this.lzSource));
                else if (rc < size)
                    throw new Error(`Incomplete read`);
                else if (rc > size)
                    throw new Error(`Overread`);
                const memory = this.libzip.HEAPU8.subarray(buffer, buffer + size);
                return Buffer.from(memory);
            }
            finally {
                this.libzip.free(buffer);
            }
        }
        finally {
            this.libzip.source.close(this.lzSource);
            this.libzip.source.free(this.lzSource);
            this.ready = false;
        }
    }
    prepareClose() {
        if (!this.ready)
            throw errors.EBUSY(`archive closed, close`);
        (0, watchFile_1.unwatchAllFiles)(this);
    }
    saveAndClose() {
        if (!this.path || !this.baseFs)
            throw new Error(`ZipFS cannot be saved and must be discarded when loaded from a buffer`);
        this.prepareClose();
        if (this.readOnly) {
            this.discardAndClose();
            return;
        }
        const newMode = this.baseFs.existsSync(this.path) || this.stats.mode === statUtils.DEFAULT_MODE
            ? undefined
            : this.stats.mode;
        // zip_close doesn't persist empty archives
        if (this.entries.size === 0) {
            this.discardAndClose();
            this.baseFs.writeFileSync(this.path, makeEmptyArchive(), { mode: newMode });
        }
        else {
            const rc = this.libzip.close(this.zip);
            if (rc === -1)
                throw this.makeLibzipError(this.libzip.getError(this.zip));
            if (typeof newMode !== `undefined`) {
                this.baseFs.chmodSync(this.path, newMode);
            }
        }
        this.ready = false;
    }
    discardAndClose() {
        this.prepareClose();
        this.libzip.discard(this.zip);
        this.ready = false;
    }
    resolve(p) {
        return path_1.ppath.resolve(path_1.PortablePath.root, p);
    }
    async openPromise(p, flags, mode) {
        return this.openSync(p, flags, mode);
    }
    openSync(p, flags, mode) {
        const fd = this.nextFd++;
        this.fds.set(fd, { cursor: 0, p });
        return fd;
    }
    hasOpenFileHandles() {
        return !!this.fds.size;
    }
    async opendirPromise(p, opts) {
        return this.opendirSync(p, opts);
    }
    opendirSync(p, opts = {}) {
        const resolvedP = this.resolveFilename(`opendir '${p}'`, p);
        if (!this.entries.has(resolvedP) && !this.listings.has(resolvedP))
            throw errors.ENOENT(`opendir '${p}'`);
        const directoryListing = this.listings.get(resolvedP);
        if (!directoryListing)
            throw errors.ENOTDIR(`opendir '${p}'`);
        const entries = [...directoryListing];
        const fd = this.openSync(resolvedP, `r`);
        const onClose = () => {
            this.closeSync(fd);
        };
        return (0, opendir_1.opendir)(this, resolvedP, entries, { onClose });
    }
    async readPromise(fd, buffer, offset, length, position) {
        return this.readSync(fd, buffer, offset, length, position);
    }
    readSync(fd, buffer, offset = 0, length = buffer.byteLength, position = -1) {
        const entry = this.fds.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`read`);
        let realPosition;
        if (position === -1 || position === null)
            realPosition = entry.cursor;
        else
            realPosition = position;
        const source = this.readFileSync(entry.p);
        source.copy(buffer, offset, realPosition, realPosition + length);
        const bytesRead = Math.max(0, Math.min(source.length - realPosition, length));
        if (position === -1 || position === null)
            entry.cursor += bytesRead;
        return bytesRead;
    }
    async writePromise(fd, buffer, offset, length, position) {
        if (typeof buffer === `string`) {
            return this.writeSync(fd, buffer, position);
        }
        else {
            return this.writeSync(fd, buffer, offset, length, position);
        }
    }
    writeSync(fd, buffer, offset, length, position) {
        const entry = this.fds.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`read`);
        throw new Error(`Unimplemented`);
    }
    async closePromise(fd) {
        return this.closeSync(fd);
    }
    closeSync(fd) {
        const entry = this.fds.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`read`);
        this.fds.delete(fd);
    }
    createReadStream(p, { encoding } = {}) {
        if (p === null)
            throw new Error(`Unimplemented`);
        const fd = this.openSync(p, `r`);
        const stream = Object.assign(new stream_1.PassThrough({
            emitClose: true,
            autoDestroy: true,
            destroy: (error, callback) => {
                clearImmediate(immediate);
                this.closeSync(fd);
                callback(error);
            },
        }), {
            close() {
                stream.destroy();
            },
            bytesRead: 0,
            path: p,
        });
        const immediate = setImmediate(async () => {
            try {
                const data = await this.readFilePromise(p, encoding);
                stream.bytesRead = data.length;
                stream.end(data);
            }
            catch (error) {
                stream.destroy(error);
            }
        });
        return stream;
    }
    createWriteStream(p, { encoding } = {}) {
        if (this.readOnly)
            throw errors.EROFS(`open '${p}'`);
        if (p === null)
            throw new Error(`Unimplemented`);
        const chunks = [];
        const fd = this.openSync(p, `w`);
        const stream = Object.assign(new stream_1.PassThrough({
            autoDestroy: true,
            emitClose: true,
            destroy: (error, callback) => {
                try {
                    if (error) {
                        callback(error);
                    }
                    else {
                        this.writeFileSync(p, Buffer.concat(chunks), encoding);
                        callback(null);
                    }
                }
                catch (err) {
                    callback(err);
                }
                finally {
                    this.closeSync(fd);
                }
            },
        }), {
            bytesWritten: 0,
            path: p,
            close() {
                stream.destroy();
            },
        });
        stream.on(`data`, chunk => {
            const chunkBuffer = Buffer.from(chunk);
            stream.bytesWritten += chunkBuffer.length;
            chunks.push(chunkBuffer);
        });
        return stream;
    }
    async realpathPromise(p) {
        return this.realpathSync(p);
    }
    realpathSync(p) {
        const resolvedP = this.resolveFilename(`lstat '${p}'`, p);
        if (!this.entries.has(resolvedP) && !this.listings.has(resolvedP))
            throw errors.ENOENT(`lstat '${p}'`);
        return resolvedP;
    }
    async existsPromise(p) {
        return this.existsSync(p);
    }
    existsSync(p) {
        if (!this.ready)
            throw errors.EBUSY(`archive closed, existsSync '${p}'`);
        if (this.symlinkCount === 0) {
            const resolvedP = path_1.ppath.resolve(path_1.PortablePath.root, p);
            return this.entries.has(resolvedP) || this.listings.has(resolvedP);
        }
        let resolvedP;
        try {
            resolvedP = this.resolveFilename(`stat '${p}'`, p);
        }
        catch (error) {
            return false;
        }
        return this.entries.has(resolvedP) || this.listings.has(resolvedP);
    }
    async accessPromise(p, mode) {
        return this.accessSync(p, mode);
    }
    accessSync(p, mode = fs_1.constants.F_OK) {
        const resolvedP = this.resolveFilename(`access '${p}'`, p);
        if (!this.entries.has(resolvedP) && !this.listings.has(resolvedP))
            throw errors.ENOENT(`access '${p}'`);
        if (this.readOnly && (mode & fs_1.constants.W_OK)) {
            throw errors.EROFS(`access '${p}'`);
        }
    }
    async statPromise(p, opts) {
        return this.statSync(p, opts);
    }
    statSync(p, opts) {
        const resolvedP = this.resolveFilename(`stat '${p}'`, p);
        if (!this.entries.has(resolvedP) && !this.listings.has(resolvedP))
            throw errors.ENOENT(`stat '${p}'`);
        if (p[p.length - 1] === `/` && !this.listings.has(resolvedP))
            throw errors.ENOTDIR(`stat '${p}'`);
        return this.statImpl(`stat '${p}'`, resolvedP, opts);
    }
    async fstatPromise(fd, opts) {
        return this.fstatSync(fd, opts);
    }
    fstatSync(fd, opts) {
        const entry = this.fds.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`fstatSync`);
        const { p } = entry;
        const resolvedP = this.resolveFilename(`stat '${p}'`, p);
        if (!this.entries.has(resolvedP) && !this.listings.has(resolvedP))
            throw errors.ENOENT(`stat '${p}'`);
        if (p[p.length - 1] === `/` && !this.listings.has(resolvedP))
            throw errors.ENOTDIR(`stat '${p}'`);
        return this.statImpl(`fstat '${p}'`, resolvedP, opts);
    }
    async lstatPromise(p, opts) {
        return this.lstatSync(p, opts);
    }
    lstatSync(p, opts) {
        const resolvedP = this.resolveFilename(`lstat '${p}'`, p, false);
        if (!this.entries.has(resolvedP) && !this.listings.has(resolvedP))
            throw errors.ENOENT(`lstat '${p}'`);
        if (p[p.length - 1] === `/` && !this.listings.has(resolvedP))
            throw errors.ENOTDIR(`lstat '${p}'`);
        return this.statImpl(`lstat '${p}'`, resolvedP, opts);
    }
    statImpl(reason, p, opts = {}) {
        const entry = this.entries.get(p);
        // File, or explicit directory
        if (typeof entry !== `undefined`) {
            const stat = this.libzip.struct.statS();
            const rc = this.libzip.statIndex(this.zip, entry, 0, 0, stat);
            if (rc === -1)
                throw this.makeLibzipError(this.libzip.getError(this.zip));
            const uid = this.stats.uid;
            const gid = this.stats.gid;
            const size = (this.libzip.struct.statSize(stat) >>> 0);
            const blksize = 512;
            const blocks = Math.ceil(size / blksize);
            const mtimeMs = (this.libzip.struct.statMtime(stat) >>> 0) * 1000;
            const atimeMs = mtimeMs;
            const birthtimeMs = mtimeMs;
            const ctimeMs = mtimeMs;
            const atime = new Date(atimeMs);
            const birthtime = new Date(birthtimeMs);
            const ctime = new Date(ctimeMs);
            const mtime = new Date(mtimeMs);
            const type = this.listings.has(p)
                ? constants_1.S_IFDIR
                : this.isSymbolicLink(entry)
                    ? constants_1.S_IFLNK
                    : constants_1.S_IFREG;
            const defaultMode = type === constants_1.S_IFDIR
                ? 0o755
                : 0o644;
            const mode = type | (this.getUnixMode(entry, defaultMode) & 0o777);
            const crc = this.libzip.struct.statCrc(stat);
            const statInstance = Object.assign(new statUtils.StatEntry(), { uid, gid, size, blksize, blocks, atime, birthtime, ctime, mtime, atimeMs, birthtimeMs, ctimeMs, mtimeMs, mode, crc });
            return opts.bigint === true ? statUtils.convertToBigIntStats(statInstance) : statInstance;
        }
        // Implicit directory
        if (this.listings.has(p)) {
            const uid = this.stats.uid;
            const gid = this.stats.gid;
            const size = 0;
            const blksize = 512;
            const blocks = 0;
            const atimeMs = this.stats.mtimeMs;
            const birthtimeMs = this.stats.mtimeMs;
            const ctimeMs = this.stats.mtimeMs;
            const mtimeMs = this.stats.mtimeMs;
            const atime = new Date(atimeMs);
            const birthtime = new Date(birthtimeMs);
            const ctime = new Date(ctimeMs);
            const mtime = new Date(mtimeMs);
            const mode = constants_1.S_IFDIR | 0o755;
            const crc = 0;
            const statInstance = Object.assign(new statUtils.StatEntry(), { uid, gid, size, blksize, blocks, atime, birthtime, ctime, mtime, atimeMs, birthtimeMs, ctimeMs, mtimeMs, mode, crc });
            return opts.bigint === true ? statUtils.convertToBigIntStats(statInstance) : statInstance;
        }
        throw new Error(`Unreachable`);
    }
    getUnixMode(index, defaultMode) {
        const rc = this.libzip.file.getExternalAttributes(this.zip, index, 0, 0, this.libzip.uint08S, this.libzip.uint32S);
        if (rc === -1)
            throw this.makeLibzipError(this.libzip.getError(this.zip));
        const opsys = this.libzip.getValue(this.libzip.uint08S, `i8`) >>> 0;
        if (opsys !== this.libzip.ZIP_OPSYS_UNIX)
            return defaultMode;
        return this.libzip.getValue(this.libzip.uint32S, `i32`) >>> 16;
    }
    registerListing(p) {
        let listing = this.listings.get(p);
        if (listing)
            return listing;
        const parentListing = this.registerListing(path_1.ppath.dirname(p));
        listing = new Set();
        parentListing.add(path_1.ppath.basename(p));
        this.listings.set(p, listing);
        return listing;
    }
    registerEntry(p, index) {
        const parentListing = this.registerListing(path_1.ppath.dirname(p));
        parentListing.add(path_1.ppath.basename(p));
        this.entries.set(p, index);
    }
    unregisterListing(p) {
        this.listings.delete(p);
        const parentListing = this.listings.get(path_1.ppath.dirname(p));
        parentListing === null || parentListing === void 0 ? void 0 : parentListing.delete(path_1.ppath.basename(p));
    }
    unregisterEntry(p) {
        this.unregisterListing(p);
        const entry = this.entries.get(p);
        this.entries.delete(p);
        if (typeof entry === `undefined`)
            return;
        this.fileSources.delete(entry);
        if (this.isSymbolicLink(entry)) {
            this.symlinkCount--;
        }
    }
    deleteEntry(p, index) {
        this.unregisterEntry(p);
        const rc = this.libzip.delete(this.zip, index);
        if (rc === -1) {
            throw this.makeLibzipError(this.libzip.getError(this.zip));
        }
    }
    resolveFilename(reason, p, resolveLastComponent = true) {
        if (!this.ready)
            throw errors.EBUSY(`archive closed, ${reason}`);
        let resolvedP = path_1.ppath.resolve(path_1.PortablePath.root, p);
        if (resolvedP === `/`)
            return path_1.PortablePath.root;
        const fileIndex = this.entries.get(resolvedP);
        if (resolveLastComponent && fileIndex !== undefined) {
            if (this.symlinkCount !== 0 && this.isSymbolicLink(fileIndex)) {
                const target = this.getFileSource(fileIndex).toString();
                return this.resolveFilename(reason, path_1.ppath.resolve(path_1.ppath.dirname(resolvedP), target), true);
            }
            else {
                return resolvedP;
            }
        }
        while (true) {
            const parentP = this.resolveFilename(reason, path_1.ppath.dirname(resolvedP), true);
            const isDir = this.listings.has(parentP);
            const doesExist = this.entries.has(parentP);
            if (!isDir && !doesExist)
                throw errors.ENOENT(reason);
            if (!isDir)
                throw errors.ENOTDIR(reason);
            resolvedP = path_1.ppath.resolve(parentP, path_1.ppath.basename(resolvedP));
            if (!resolveLastComponent || this.symlinkCount === 0)
                break;
            const index = this.libzip.name.locate(this.zip, resolvedP.slice(1));
            if (index === -1)
                break;
            if (this.isSymbolicLink(index)) {
                const target = this.getFileSource(index).toString();
                resolvedP = path_1.ppath.resolve(path_1.ppath.dirname(resolvedP), target);
            }
            else {
                break;
            }
        }
        return resolvedP;
    }
    allocateBuffer(content) {
        if (!Buffer.isBuffer(content))
            content = Buffer.from(content);
        const buffer = this.libzip.malloc(content.byteLength);
        if (!buffer)
            throw new Error(`Couldn't allocate enough memory`);
        // Copy the file into the Emscripten heap
        const heap = new Uint8Array(this.libzip.HEAPU8.buffer, buffer, content.byteLength);
        heap.set(content);
        return { buffer, byteLength: content.byteLength };
    }
    allocateUnattachedSource(content) {
        const error = this.libzip.struct.errorS();
        const { buffer, byteLength } = this.allocateBuffer(content);
        const source = this.libzip.source.fromUnattachedBuffer(buffer, byteLength, 0, true, error);
        if (source === 0) {
            this.libzip.free(error);
            throw this.makeLibzipError(error);
        }
        return source;
    }
    allocateSource(content) {
        const { buffer, byteLength } = this.allocateBuffer(content);
        const source = this.libzip.source.fromBuffer(this.zip, buffer, byteLength, 0, true);
        if (source === 0) {
            this.libzip.free(buffer);
            throw this.makeLibzipError(this.libzip.getError(this.zip));
        }
        return source;
    }
    setFileSource(p, content) {
        const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
        const target = path_1.ppath.relative(path_1.PortablePath.root, p);
        const lzSource = this.allocateSource(content);
        try {
            const newIndex = this.libzip.file.add(this.zip, target, lzSource, this.libzip.ZIP_FL_OVERWRITE);
            if (newIndex === -1)
                throw this.makeLibzipError(this.libzip.getError(this.zip));
            if (this.level !== `mixed`) {
                // Use store for level 0, and deflate for 1..9
                let method;
                if (this.level === 0)
                    method = this.libzip.ZIP_CM_STORE;
                else
                    method = this.libzip.ZIP_CM_DEFLATE;
                const rc = this.libzip.file.setCompression(this.zip, newIndex, 0, method, this.level);
                if (rc === -1) {
                    throw this.makeLibzipError(this.libzip.getError(this.zip));
                }
            }
            this.fileSources.set(newIndex, buffer);
            return newIndex;
        }
        catch (error) {
            this.libzip.source.free(lzSource);
            throw error;
        }
    }
    isSymbolicLink(index) {
        if (this.symlinkCount === 0)
            return false;
        const attrs = this.libzip.file.getExternalAttributes(this.zip, index, 0, 0, this.libzip.uint08S, this.libzip.uint32S);
        if (attrs === -1)
            throw this.makeLibzipError(this.libzip.getError(this.zip));
        const opsys = this.libzip.getValue(this.libzip.uint08S, `i8`) >>> 0;
        if (opsys !== this.libzip.ZIP_OPSYS_UNIX)
            return false;
        const attributes = this.libzip.getValue(this.libzip.uint32S, `i32`) >>> 16;
        return (attributes & constants_1.S_IFMT) === constants_1.S_IFLNK;
    }
    getFileSource(index, opts = { asyncDecompress: false }) {
        const cachedFileSource = this.fileSources.get(index);
        if (typeof cachedFileSource !== `undefined`)
            return cachedFileSource;
        const stat = this.libzip.struct.statS();
        const rc = this.libzip.statIndex(this.zip, index, 0, 0, stat);
        if (rc === -1)
            throw this.makeLibzipError(this.libzip.getError(this.zip));
        const size = this.libzip.struct.statCompSize(stat);
        const compressionMethod = this.libzip.struct.statCompMethod(stat);
        const buffer = this.libzip.malloc(size);
        try {
            const file = this.libzip.fopenIndex(this.zip, index, 0, this.libzip.ZIP_FL_COMPRESSED);
            if (file === 0)
                throw this.makeLibzipError(this.libzip.getError(this.zip));
            try {
                const rc = this.libzip.fread(file, buffer, size, 0);
                if (rc === -1)
                    throw this.makeLibzipError(this.libzip.file.getError(file));
                else if (rc < size)
                    throw new Error(`Incomplete read`);
                else if (rc > size)
                    throw new Error(`Overread`);
                const memory = this.libzip.HEAPU8.subarray(buffer, buffer + size);
                const data = Buffer.from(memory);
                if (compressionMethod === 0) {
                    this.fileSources.set(index, data);
                    return data;
                }
                else if (opts.asyncDecompress) {
                    return new Promise((resolve, reject) => {
                        zlib_1.default.inflateRaw(data, (error, result) => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                this.fileSources.set(index, result);
                                resolve(result);
                            }
                        });
                    });
                }
                else {
                    const decompressedData = zlib_1.default.inflateRawSync(data);
                    this.fileSources.set(index, decompressedData);
                    return decompressedData;
                }
            }
            finally {
                this.libzip.fclose(file);
            }
        }
        finally {
            this.libzip.free(buffer);
        }
    }
    async chmodPromise(p, mask) {
        return this.chmodSync(p, mask);
    }
    chmodSync(p, mask) {
        if (this.readOnly)
            throw errors.EROFS(`chmod '${p}'`);
        // We don't allow to make the extracted entries group-writable
        mask &= 0o755;
        const resolvedP = this.resolveFilename(`chmod '${p}'`, p, false);
        const entry = this.entries.get(resolvedP);
        if (typeof entry === `undefined`)
            throw new Error(`Assertion failed: The entry should have been registered (${resolvedP})`);
        const oldMod = this.getUnixMode(entry, constants_1.S_IFREG | 0o000);
        const newMod = oldMod & (~0o777) | mask;
        const rc = this.libzip.file.setExternalAttributes(this.zip, entry, 0, 0, this.libzip.ZIP_OPSYS_UNIX, newMod << 16);
        if (rc === -1) {
            throw this.makeLibzipError(this.libzip.getError(this.zip));
        }
    }
    async chownPromise(p, uid, gid) {
        return this.chownSync(p, uid, gid);
    }
    chownSync(p, uid, gid) {
        throw new Error(`Unimplemented`);
    }
    async renamePromise(oldP, newP) {
        return this.renameSync(oldP, newP);
    }
    renameSync(oldP, newP) {
        throw new Error(`Unimplemented`);
    }
    async copyFilePromise(sourceP, destP, flags) {
        const { indexSource, indexDest, resolvedDestP } = this.prepareCopyFile(sourceP, destP, flags);
        const source = await this.getFileSource(indexSource, { asyncDecompress: true });
        const newIndex = this.setFileSource(resolvedDestP, source);
        if (newIndex !== indexDest) {
            this.registerEntry(resolvedDestP, newIndex);
        }
    }
    copyFileSync(sourceP, destP, flags = 0) {
        const { indexSource, indexDest, resolvedDestP } = this.prepareCopyFile(sourceP, destP, flags);
        const source = this.getFileSource(indexSource);
        const newIndex = this.setFileSource(resolvedDestP, source);
        if (newIndex !== indexDest) {
            this.registerEntry(resolvedDestP, newIndex);
        }
    }
    prepareCopyFile(sourceP, destP, flags = 0) {
        if (this.readOnly)
            throw errors.EROFS(`copyfile '${sourceP} -> '${destP}'`);
        if ((flags & fs_1.constants.COPYFILE_FICLONE_FORCE) !== 0)
            throw errors.ENOSYS(`unsupported clone operation`, `copyfile '${sourceP}' -> ${destP}'`);
        const resolvedSourceP = this.resolveFilename(`copyfile '${sourceP} -> ${destP}'`, sourceP);
        const indexSource = this.entries.get(resolvedSourceP);
        if (typeof indexSource === `undefined`)
            throw errors.EINVAL(`copyfile '${sourceP}' -> '${destP}'`);
        const resolvedDestP = this.resolveFilename(`copyfile '${sourceP}' -> ${destP}'`, destP);
        const indexDest = this.entries.get(resolvedDestP);
        if ((flags & (fs_1.constants.COPYFILE_EXCL | fs_1.constants.COPYFILE_FICLONE_FORCE)) !== 0 && typeof indexDest !== `undefined`)
            throw errors.EEXIST(`copyfile '${sourceP}' -> '${destP}'`);
        return {
            indexSource,
            resolvedDestP,
            indexDest,
        };
    }
    async appendFilePromise(p, content, opts) {
        if (this.readOnly)
            throw errors.EROFS(`open '${p}'`);
        if (typeof opts === `undefined`)
            opts = { flag: `a` };
        else if (typeof opts === `string`)
            opts = { flag: `a`, encoding: opts };
        else if (typeof opts.flag === `undefined`)
            opts = { flag: `a`, ...opts };
        return this.writeFilePromise(p, content, opts);
    }
    appendFileSync(p, content, opts = {}) {
        if (this.readOnly)
            throw errors.EROFS(`open '${p}'`);
        if (typeof opts === `undefined`)
            opts = { flag: `a` };
        else if (typeof opts === `string`)
            opts = { flag: `a`, encoding: opts };
        else if (typeof opts.flag === `undefined`)
            opts = { flag: `a`, ...opts };
        return this.writeFileSync(p, content, opts);
    }
    fdToPath(fd, reason) {
        var _a;
        const path = (_a = this.fds.get(fd)) === null || _a === void 0 ? void 0 : _a.p;
        if (typeof path === `undefined`)
            throw errors.EBADF(reason);
        return path;
    }
    async writeFilePromise(p, content, opts) {
        const { encoding, mode, index, resolvedP } = this.prepareWriteFile(p, opts);
        if (index !== undefined && typeof opts === `object` && opts.flag && opts.flag.includes(`a`))
            content = Buffer.concat([await this.getFileSource(index, { asyncDecompress: true }), Buffer.from(content)]);
        if (encoding !== null)
            content = content.toString(encoding);
        const newIndex = this.setFileSource(resolvedP, content);
        if (newIndex !== index)
            this.registerEntry(resolvedP, newIndex);
        if (mode !== null) {
            await this.chmodPromise(resolvedP, mode);
        }
    }
    writeFileSync(p, content, opts) {
        const { encoding, mode, index, resolvedP } = this.prepareWriteFile(p, opts);
        if (index !== undefined && typeof opts === `object` && opts.flag && opts.flag.includes(`a`))
            content = Buffer.concat([this.getFileSource(index), Buffer.from(content)]);
        if (encoding !== null)
            content = content.toString(encoding);
        const newIndex = this.setFileSource(resolvedP, content);
        if (newIndex !== index)
            this.registerEntry(resolvedP, newIndex);
        if (mode !== null) {
            this.chmodSync(resolvedP, mode);
        }
    }
    prepareWriteFile(p, opts) {
        if (typeof p === `number`)
            p = this.fdToPath(p, `read`);
        if (this.readOnly)
            throw errors.EROFS(`open '${p}'`);
        const resolvedP = this.resolveFilename(`open '${p}'`, p);
        if (this.listings.has(resolvedP))
            throw errors.EISDIR(`open '${p}'`);
        let encoding = null, mode = null;
        if (typeof opts === `string`) {
            encoding = opts;
        }
        else if (typeof opts === `object`) {
            ({
                encoding = null,
                mode = null,
            } = opts);
        }
        const index = this.entries.get(resolvedP);
        return {
            encoding,
            mode,
            resolvedP,
            index,
        };
    }
    async unlinkPromise(p) {
        return this.unlinkSync(p);
    }
    unlinkSync(p) {
        if (this.readOnly)
            throw errors.EROFS(`unlink '${p}'`);
        const resolvedP = this.resolveFilename(`unlink '${p}'`, p);
        if (this.listings.has(resolvedP))
            throw errors.EISDIR(`unlink '${p}'`);
        const index = this.entries.get(resolvedP);
        if (typeof index === `undefined`)
            throw errors.EINVAL(`unlink '${p}'`);
        this.deleteEntry(resolvedP, index);
    }
    async utimesPromise(p, atime, mtime) {
        return this.utimesSync(p, atime, mtime);
    }
    utimesSync(p, atime, mtime) {
        if (this.readOnly)
            throw errors.EROFS(`utimes '${p}'`);
        const resolvedP = this.resolveFilename(`utimes '${p}'`, p);
        this.utimesImpl(resolvedP, mtime);
    }
    async lutimesPromise(p, atime, mtime) {
        return this.lutimesSync(p, atime, mtime);
    }
    lutimesSync(p, atime, mtime) {
        if (this.readOnly)
            throw errors.EROFS(`lutimes '${p}'`);
        const resolvedP = this.resolveFilename(`utimes '${p}'`, p, false);
        this.utimesImpl(resolvedP, mtime);
    }
    utimesImpl(resolvedP, mtime) {
        if (this.listings.has(resolvedP))
            if (!this.entries.has(resolvedP))
                this.hydrateDirectory(resolvedP);
        const entry = this.entries.get(resolvedP);
        if (entry === undefined)
            throw new Error(`Unreachable`);
        const rc = this.libzip.file.setMtime(this.zip, entry, 0, toUnixTimestamp(mtime), 0);
        if (rc === -1) {
            throw this.makeLibzipError(this.libzip.getError(this.zip));
        }
    }
    async mkdirPromise(p, opts) {
        return this.mkdirSync(p, opts);
    }
    mkdirSync(p, { mode = 0o755, recursive = false } = {}) {
        if (recursive) {
            this.mkdirpSync(p, { chmod: mode });
            return;
        }
        if (this.readOnly)
            throw errors.EROFS(`mkdir '${p}'`);
        const resolvedP = this.resolveFilename(`mkdir '${p}'`, p);
        if (this.entries.has(resolvedP) || this.listings.has(resolvedP))
            throw errors.EEXIST(`mkdir '${p}'`);
        this.hydrateDirectory(resolvedP);
        this.chmodSync(resolvedP, mode);
    }
    async rmdirPromise(p, opts) {
        return this.rmdirSync(p, opts);
    }
    rmdirSync(p, { recursive = false } = {}) {
        if (this.readOnly)
            throw errors.EROFS(`rmdir '${p}'`);
        if (recursive) {
            this.removeSync(p);
            return;
        }
        const resolvedP = this.resolveFilename(`rmdir '${p}'`, p);
        const directoryListing = this.listings.get(resolvedP);
        if (!directoryListing)
            throw errors.ENOTDIR(`rmdir '${p}'`);
        if (directoryListing.size > 0)
            throw errors.ENOTEMPTY(`rmdir '${p}'`);
        const index = this.entries.get(resolvedP);
        if (typeof index === `undefined`)
            throw errors.EINVAL(`rmdir '${p}'`);
        this.deleteEntry(p, index);
    }
    hydrateDirectory(resolvedP) {
        const index = this.libzip.dir.add(this.zip, path_1.ppath.relative(path_1.PortablePath.root, resolvedP));
        if (index === -1)
            throw this.makeLibzipError(this.libzip.getError(this.zip));
        this.registerListing(resolvedP);
        this.registerEntry(resolvedP, index);
        return index;
    }
    async linkPromise(existingP, newP) {
        return this.linkSync(existingP, newP);
    }
    linkSync(existingP, newP) {
        // Zip archives don't support hard links:
        // https://stackoverflow.com/questions/8859616/are-hard-links-possible-within-a-zip-archive
        throw errors.EOPNOTSUPP(`link '${existingP}' -> '${newP}'`);
    }
    async symlinkPromise(target, p) {
        return this.symlinkSync(target, p);
    }
    symlinkSync(target, p) {
        if (this.readOnly)
            throw errors.EROFS(`symlink '${target}' -> '${p}'`);
        const resolvedP = this.resolveFilename(`symlink '${target}' -> '${p}'`, p);
        if (this.listings.has(resolvedP))
            throw errors.EISDIR(`symlink '${target}' -> '${p}'`);
        if (this.entries.has(resolvedP))
            throw errors.EEXIST(`symlink '${target}' -> '${p}'`);
        const index = this.setFileSource(resolvedP, target);
        this.registerEntry(resolvedP, index);
        const rc = this.libzip.file.setExternalAttributes(this.zip, index, 0, 0, this.libzip.ZIP_OPSYS_UNIX, (constants_1.S_IFLNK | 0o777) << 16);
        if (rc === -1)
            throw this.makeLibzipError(this.libzip.getError(this.zip));
        this.symlinkCount += 1;
    }
    async readFilePromise(p, encoding) {
        // This is messed up regarding the TS signatures
        if (typeof encoding === `object`)
            // @ts-expect-error
            encoding = encoding ? encoding.encoding : undefined;
        const data = await this.readFileBuffer(p, { asyncDecompress: true });
        return encoding ? data.toString(encoding) : data;
    }
    readFileSync(p, encoding) {
        // This is messed up regarding the TS signatures
        if (typeof encoding === `object`)
            // @ts-expect-error
            encoding = encoding ? encoding.encoding : undefined;
        const data = this.readFileBuffer(p);
        return encoding ? data.toString(encoding) : data;
    }
    readFileBuffer(p, opts = { asyncDecompress: false }) {
        if (typeof p === `number`)
            p = this.fdToPath(p, `read`);
        const resolvedP = this.resolveFilename(`open '${p}'`, p);
        if (!this.entries.has(resolvedP) && !this.listings.has(resolvedP))
            throw errors.ENOENT(`open '${p}'`);
        // Ensures that the last component is a directory, if the user said so (even if it is we'll throw right after with EISDIR anyway)
        if (p[p.length - 1] === `/` && !this.listings.has(resolvedP))
            throw errors.ENOTDIR(`open '${p}'`);
        if (this.listings.has(resolvedP))
            throw errors.EISDIR(`read`);
        const entry = this.entries.get(resolvedP);
        if (entry === undefined)
            throw new Error(`Unreachable`);
        return this.getFileSource(entry, opts);
    }
    async readdirPromise(p, opts) {
        return this.readdirSync(p, opts);
    }
    readdirSync(p, opts) {
        const resolvedP = this.resolveFilename(`scandir '${p}'`, p);
        if (!this.entries.has(resolvedP) && !this.listings.has(resolvedP))
            throw errors.ENOENT(`scandir '${p}'`);
        const directoryListing = this.listings.get(resolvedP);
        if (!directoryListing)
            throw errors.ENOTDIR(`scandir '${p}'`);
        const entries = [...directoryListing];
        if (!(opts === null || opts === void 0 ? void 0 : opts.withFileTypes))
            return entries;
        return entries.map(name => {
            return Object.assign(this.statImpl(`lstat`, path_1.ppath.join(p, name)), {
                name,
            });
        });
    }
    async readlinkPromise(p) {
        const entry = this.prepareReadlink(p);
        return (await this.getFileSource(entry, { asyncDecompress: true })).toString();
    }
    readlinkSync(p) {
        const entry = this.prepareReadlink(p);
        return this.getFileSource(entry).toString();
    }
    prepareReadlink(p) {
        const resolvedP = this.resolveFilename(`readlink '${p}'`, p, false);
        if (!this.entries.has(resolvedP) && !this.listings.has(resolvedP))
            throw errors.ENOENT(`readlink '${p}'`);
        // Ensure that the last component is a directory (if it is we'll throw right after with EISDIR anyway)
        if (p[p.length - 1] === `/` && !this.listings.has(resolvedP))
            throw errors.ENOTDIR(`open '${p}'`);
        if (this.listings.has(resolvedP))
            throw errors.EINVAL(`readlink '${p}'`);
        const entry = this.entries.get(resolvedP);
        if (entry === undefined)
            throw new Error(`Unreachable`);
        if (!this.isSymbolicLink(entry))
            throw errors.EINVAL(`readlink '${p}'`);
        return entry;
    }
    async truncatePromise(p, len = 0) {
        const resolvedP = this.resolveFilename(`open '${p}'`, p);
        const index = this.entries.get(resolvedP);
        if (typeof index === `undefined`)
            throw errors.EINVAL(`open '${p}'`);
        const source = await this.getFileSource(index, { asyncDecompress: true });
        const truncated = Buffer.alloc(len, 0x00);
        source.copy(truncated);
        return await this.writeFilePromise(p, truncated);
    }
    truncateSync(p, len = 0) {
        const resolvedP = this.resolveFilename(`open '${p}'`, p);
        const index = this.entries.get(resolvedP);
        if (typeof index === `undefined`)
            throw errors.EINVAL(`open '${p}'`);
        const source = this.getFileSource(index);
        const truncated = Buffer.alloc(len, 0x00);
        source.copy(truncated);
        return this.writeFileSync(p, truncated);
    }
    watch(p, a, b) {
        let persistent;
        switch (typeof a) {
            case `function`:
            case `string`:
            case `undefined`:
                {
                    persistent = true;
                }
                break;
            default:
                {
                    ({ persistent = true } = a);
                }
                break;
        }
        if (!persistent)
            return { on: () => { }, close: () => { } };
        const interval = setInterval(() => { }, 24 * 60 * 60 * 1000);
        return { on: () => { }, close: () => {
                clearInterval(interval);
            } };
    }
    watchFile(p, a, b) {
        const resolvedP = path_1.ppath.resolve(path_1.PortablePath.root, p);
        return (0, watchFile_1.watchFile)(this, resolvedP, a, b);
    }
    unwatchFile(p, cb) {
        const resolvedP = path_1.ppath.resolve(path_1.PortablePath.root, p);
        return (0, watchFile_1.unwatchFile)(this, resolvedP, cb);
    }
}
exports.ZipFS = ZipFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/ZipOpenFS.ts":
/*!*********************************************!*\
  !*** ../yarnpkg-fslib/sources/ZipOpenFS.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZipOpenFS = exports.getArchivePart = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const fs_1 = __webpack_require__(/*! fs */ "fs");
const FakeFS_1 = __webpack_require__(/*! ./FakeFS */ "../yarnpkg-fslib/sources/FakeFS.ts");
const NodeFS_1 = __webpack_require__(/*! ./NodeFS */ "../yarnpkg-fslib/sources/NodeFS.ts");
const ZipFS_1 = __webpack_require__(/*! ./ZipFS */ "../yarnpkg-fslib/sources/ZipFS.ts");
const watchFile_1 = __webpack_require__(/*! ./algorithms/watchFile */ "../yarnpkg-fslib/sources/algorithms/watchFile.ts");
const errors = (0, tslib_1.__importStar)(__webpack_require__(/*! ./errors */ "../yarnpkg-fslib/sources/errors.ts"));
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
const ZIP_FD = 0x80000000;
/**
 * Extracts the archive part (ending in the first instance of `extension`) from a path.
 *
 * The indexOf-based implementation is ~3.7x faster than a RegExp-based implementation.
 */
const getArchivePart = (path, extension) => {
    let idx = path.indexOf(extension);
    if (idx <= 0)
        return null;
    let nextCharIdx = idx;
    while (idx >= 0) {
        nextCharIdx = idx + extension.length;
        if (path[nextCharIdx] === path_1.ppath.sep)
            break;
        // Disallow files named ".zip"
        if (path[idx - 1] === path_1.ppath.sep)
            return null;
        idx = path.indexOf(extension, nextCharIdx);
    }
    // The path either has to end in ".zip" or contain an archive subpath (".zip/...")
    if (path.length > nextCharIdx && path[nextCharIdx] !== path_1.ppath.sep)
        return null;
    return path.slice(0, nextCharIdx);
};
exports.getArchivePart = getArchivePart;
class ZipOpenFS extends FakeFS_1.BasePortableFakeFS {
    constructor({ libzip, baseFs = new NodeFS_1.NodeFS(), filter = null, maxOpenFiles = Infinity, readOnlyArchives = false, useCache = true, maxAge = 5000, fileExtensions = null }) {
        super();
        this.fdMap = new Map();
        this.nextFd = 3;
        this.isZip = new Set();
        this.notZip = new Set();
        this.realPaths = new Map();
        this.limitOpenFilesTimeout = null;
        this.libzipFactory = typeof libzip !== `function`
            ? () => libzip
            : libzip;
        this.baseFs = baseFs;
        this.zipInstances = useCache ? new Map() : null;
        this.filter = filter;
        this.maxOpenFiles = maxOpenFiles;
        this.readOnlyArchives = readOnlyArchives;
        this.maxAge = maxAge;
        this.fileExtensions = fileExtensions;
    }
    static async openPromise(fn, opts) {
        const zipOpenFs = new ZipOpenFS(opts);
        try {
            return await fn(zipOpenFs);
        }
        finally {
            zipOpenFs.saveAndClose();
        }
    }
    get libzip() {
        if (typeof this.libzipInstance === `undefined`)
            this.libzipInstance = this.libzipFactory();
        return this.libzipInstance;
    }
    getExtractHint(hints) {
        return this.baseFs.getExtractHint(hints);
    }
    getRealPath() {
        return this.baseFs.getRealPath();
    }
    saveAndClose() {
        (0, watchFile_1.unwatchAllFiles)(this);
        if (this.zipInstances) {
            for (const [path, { zipFs }] of this.zipInstances.entries()) {
                zipFs.saveAndClose();
                this.zipInstances.delete(path);
            }
        }
    }
    discardAndClose() {
        (0, watchFile_1.unwatchAllFiles)(this);
        if (this.zipInstances) {
            for (const [path, { zipFs }] of this.zipInstances.entries()) {
                zipFs.discardAndClose();
                this.zipInstances.delete(path);
            }
        }
    }
    resolve(p) {
        return this.baseFs.resolve(p);
    }
    remapFd(zipFs, fd) {
        const remappedFd = this.nextFd++ | ZIP_FD;
        this.fdMap.set(remappedFd, [zipFs, fd]);
        return remappedFd;
    }
    async openPromise(p, flags, mode) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.openPromise(p, flags, mode);
        }, async (zipFs, { subPath }) => {
            return this.remapFd(zipFs, await zipFs.openPromise(subPath, flags, mode));
        });
    }
    openSync(p, flags, mode) {
        return this.makeCallSync(p, () => {
            return this.baseFs.openSync(p, flags, mode);
        }, (zipFs, { subPath }) => {
            return this.remapFd(zipFs, zipFs.openSync(subPath, flags, mode));
        });
    }
    async opendirPromise(p, opts) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.opendirPromise(p, opts);
        }, async (zipFs, { subPath }) => {
            return await zipFs.opendirPromise(subPath, opts);
        }, {
            requireSubpath: false,
        });
    }
    opendirSync(p, opts) {
        return this.makeCallSync(p, () => {
            return this.baseFs.opendirSync(p, opts);
        }, (zipFs, { subPath }) => {
            return zipFs.opendirSync(subPath, opts);
        }, {
            requireSubpath: false,
        });
    }
    async readPromise(fd, buffer, offset, length, position) {
        if ((fd & ZIP_FD) === 0)
            return await this.baseFs.readPromise(fd, buffer, offset, length, position);
        const entry = this.fdMap.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`read`);
        const [zipFs, realFd] = entry;
        return await zipFs.readPromise(realFd, buffer, offset, length, position);
    }
    readSync(fd, buffer, offset, length, position) {
        if ((fd & ZIP_FD) === 0)
            return this.baseFs.readSync(fd, buffer, offset, length, position);
        const entry = this.fdMap.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`readSync`);
        const [zipFs, realFd] = entry;
        return zipFs.readSync(realFd, buffer, offset, length, position);
    }
    async writePromise(fd, buffer, offset, length, position) {
        if ((fd & ZIP_FD) === 0) {
            if (typeof buffer === `string`) {
                return await this.baseFs.writePromise(fd, buffer, offset);
            }
            else {
                return await this.baseFs.writePromise(fd, buffer, offset, length, position);
            }
        }
        const entry = this.fdMap.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`write`);
        const [zipFs, realFd] = entry;
        if (typeof buffer === `string`) {
            return await zipFs.writePromise(realFd, buffer, offset);
        }
        else {
            return await zipFs.writePromise(realFd, buffer, offset, length, position);
        }
    }
    writeSync(fd, buffer, offset, length, position) {
        if ((fd & ZIP_FD) === 0) {
            if (typeof buffer === `string`) {
                return this.baseFs.writeSync(fd, buffer, offset);
            }
            else {
                return this.baseFs.writeSync(fd, buffer, offset, length, position);
            }
        }
        const entry = this.fdMap.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`writeSync`);
        const [zipFs, realFd] = entry;
        if (typeof buffer === `string`) {
            return zipFs.writeSync(realFd, buffer, offset);
        }
        else {
            return zipFs.writeSync(realFd, buffer, offset, length, position);
        }
    }
    async closePromise(fd) {
        if ((fd & ZIP_FD) === 0)
            return await this.baseFs.closePromise(fd);
        const entry = this.fdMap.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`close`);
        this.fdMap.delete(fd);
        const [zipFs, realFd] = entry;
        return await zipFs.closePromise(realFd);
    }
    closeSync(fd) {
        if ((fd & ZIP_FD) === 0)
            return this.baseFs.closeSync(fd);
        const entry = this.fdMap.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`closeSync`);
        this.fdMap.delete(fd);
        const [zipFs, realFd] = entry;
        return zipFs.closeSync(realFd);
    }
    createReadStream(p, opts) {
        if (p === null)
            return this.baseFs.createReadStream(p, opts);
        return this.makeCallSync(p, () => {
            return this.baseFs.createReadStream(p, opts);
        }, (zipFs, { subPath }) => {
            return zipFs.createReadStream(subPath, opts);
        });
    }
    createWriteStream(p, opts) {
        if (p === null)
            return this.baseFs.createWriteStream(p, opts);
        return this.makeCallSync(p, () => {
            return this.baseFs.createWriteStream(p, opts);
        }, (zipFs, { subPath }) => {
            return zipFs.createWriteStream(subPath, opts);
        });
    }
    async realpathPromise(p) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.realpathPromise(p);
        }, async (zipFs, { archivePath, subPath }) => {
            let realArchivePath = this.realPaths.get(archivePath);
            if (typeof realArchivePath === `undefined`) {
                realArchivePath = await this.baseFs.realpathPromise(archivePath);
                this.realPaths.set(archivePath, realArchivePath);
            }
            return this.pathUtils.join(realArchivePath, this.pathUtils.relative(path_1.PortablePath.root, await zipFs.realpathPromise(subPath)));
        });
    }
    realpathSync(p) {
        return this.makeCallSync(p, () => {
            return this.baseFs.realpathSync(p);
        }, (zipFs, { archivePath, subPath }) => {
            let realArchivePath = this.realPaths.get(archivePath);
            if (typeof realArchivePath === `undefined`) {
                realArchivePath = this.baseFs.realpathSync(archivePath);
                this.realPaths.set(archivePath, realArchivePath);
            }
            return this.pathUtils.join(realArchivePath, this.pathUtils.relative(path_1.PortablePath.root, zipFs.realpathSync(subPath)));
        });
    }
    async existsPromise(p) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.existsPromise(p);
        }, async (zipFs, { subPath }) => {
            return await zipFs.existsPromise(subPath);
        });
    }
    existsSync(p) {
        return this.makeCallSync(p, () => {
            return this.baseFs.existsSync(p);
        }, (zipFs, { subPath }) => {
            return zipFs.existsSync(subPath);
        });
    }
    async accessPromise(p, mode) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.accessPromise(p, mode);
        }, async (zipFs, { subPath }) => {
            return await zipFs.accessPromise(subPath, mode);
        });
    }
    accessSync(p, mode) {
        return this.makeCallSync(p, () => {
            return this.baseFs.accessSync(p, mode);
        }, (zipFs, { subPath }) => {
            return zipFs.accessSync(subPath, mode);
        });
    }
    async statPromise(p, opts) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.statPromise(p, opts);
        }, async (zipFs, { subPath }) => {
            return await zipFs.statPromise(subPath, opts);
        });
    }
    statSync(p, opts) {
        return this.makeCallSync(p, () => {
            return this.baseFs.statSync(p, opts);
        }, (zipFs, { subPath }) => {
            return zipFs.statSync(subPath, opts);
        });
    }
    async fstatPromise(fd, opts) {
        if ((fd & ZIP_FD) === 0)
            return this.baseFs.fstatPromise(fd, opts);
        const entry = this.fdMap.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`fstat`);
        const [zipFs, realFd] = entry;
        return zipFs.fstatPromise(realFd, opts);
    }
    fstatSync(fd, opts) {
        if ((fd & ZIP_FD) === 0)
            return this.baseFs.fstatSync(fd, opts);
        const entry = this.fdMap.get(fd);
        if (typeof entry === `undefined`)
            throw errors.EBADF(`fstatSync`);
        const [zipFs, realFd] = entry;
        return zipFs.fstatSync(realFd, opts);
    }
    async lstatPromise(p, opts) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.lstatPromise(p, opts);
        }, async (zipFs, { subPath }) => {
            return await zipFs.lstatPromise(subPath, opts);
        });
    }
    lstatSync(p, opts) {
        return this.makeCallSync(p, () => {
            return this.baseFs.lstatSync(p, opts);
        }, (zipFs, { subPath }) => {
            return zipFs.lstatSync(subPath, opts);
        });
    }
    async chmodPromise(p, mask) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.chmodPromise(p, mask);
        }, async (zipFs, { subPath }) => {
            return await zipFs.chmodPromise(subPath, mask);
        });
    }
    chmodSync(p, mask) {
        return this.makeCallSync(p, () => {
            return this.baseFs.chmodSync(p, mask);
        }, (zipFs, { subPath }) => {
            return zipFs.chmodSync(subPath, mask);
        });
    }
    async chownPromise(p, uid, gid) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.chownPromise(p, uid, gid);
        }, async (zipFs, { subPath }) => {
            return await zipFs.chownPromise(subPath, uid, gid);
        });
    }
    chownSync(p, uid, gid) {
        return this.makeCallSync(p, () => {
            return this.baseFs.chownSync(p, uid, gid);
        }, (zipFs, { subPath }) => {
            return zipFs.chownSync(subPath, uid, gid);
        });
    }
    async renamePromise(oldP, newP) {
        return await this.makeCallPromise(oldP, async () => {
            return await this.makeCallPromise(newP, async () => {
                return await this.baseFs.renamePromise(oldP, newP);
            }, async () => {
                throw Object.assign(new Error(`EEXDEV: cross-device link not permitted`), { code: `EEXDEV` });
            });
        }, async (zipFsO, { subPath: subPathO }) => {
            return await this.makeCallPromise(newP, async () => {
                throw Object.assign(new Error(`EEXDEV: cross-device link not permitted`), { code: `EEXDEV` });
            }, async (zipFsN, { subPath: subPathN }) => {
                if (zipFsO !== zipFsN) {
                    throw Object.assign(new Error(`EEXDEV: cross-device link not permitted`), { code: `EEXDEV` });
                }
                else {
                    return await zipFsO.renamePromise(subPathO, subPathN);
                }
            });
        });
    }
    renameSync(oldP, newP) {
        return this.makeCallSync(oldP, () => {
            return this.makeCallSync(newP, () => {
                return this.baseFs.renameSync(oldP, newP);
            }, () => {
                throw Object.assign(new Error(`EEXDEV: cross-device link not permitted`), { code: `EEXDEV` });
            });
        }, (zipFsO, { subPath: subPathO }) => {
            return this.makeCallSync(newP, () => {
                throw Object.assign(new Error(`EEXDEV: cross-device link not permitted`), { code: `EEXDEV` });
            }, (zipFsN, { subPath: subPathN }) => {
                if (zipFsO !== zipFsN) {
                    throw Object.assign(new Error(`EEXDEV: cross-device link not permitted`), { code: `EEXDEV` });
                }
                else {
                    return zipFsO.renameSync(subPathO, subPathN);
                }
            });
        });
    }
    async copyFilePromise(sourceP, destP, flags = 0) {
        const fallback = async (sourceFs, sourceP, destFs, destP) => {
            if ((flags & fs_1.constants.COPYFILE_FICLONE_FORCE) !== 0)
                throw Object.assign(new Error(`EXDEV: cross-device clone not permitted, copyfile '${sourceP}' -> ${destP}'`), { code: `EXDEV` });
            if ((flags & fs_1.constants.COPYFILE_EXCL) && await this.existsPromise(sourceP))
                throw Object.assign(new Error(`EEXIST: file already exists, copyfile '${sourceP}' -> '${destP}'`), { code: `EEXIST` });
            let content;
            try {
                content = await sourceFs.readFilePromise(sourceP);
            }
            catch (error) {
                throw Object.assign(new Error(`EINVAL: invalid argument, copyfile '${sourceP}' -> '${destP}'`), { code: `EINVAL` });
            }
            await destFs.writeFilePromise(destP, content);
        };
        return await this.makeCallPromise(sourceP, async () => {
            return await this.makeCallPromise(destP, async () => {
                return await this.baseFs.copyFilePromise(sourceP, destP, flags);
            }, async (zipFsD, { subPath: subPathD }) => {
                return await fallback(this.baseFs, sourceP, zipFsD, subPathD);
            });
        }, async (zipFsS, { subPath: subPathS }) => {
            return await this.makeCallPromise(destP, async () => {
                return await fallback(zipFsS, subPathS, this.baseFs, destP);
            }, async (zipFsD, { subPath: subPathD }) => {
                if (zipFsS !== zipFsD) {
                    return await fallback(zipFsS, subPathS, zipFsD, subPathD);
                }
                else {
                    return await zipFsS.copyFilePromise(subPathS, subPathD, flags);
                }
            });
        });
    }
    copyFileSync(sourceP, destP, flags = 0) {
        const fallback = (sourceFs, sourceP, destFs, destP) => {
            if ((flags & fs_1.constants.COPYFILE_FICLONE_FORCE) !== 0)
                throw Object.assign(new Error(`EXDEV: cross-device clone not permitted, copyfile '${sourceP}' -> ${destP}'`), { code: `EXDEV` });
            if ((flags & fs_1.constants.COPYFILE_EXCL) && this.existsSync(sourceP))
                throw Object.assign(new Error(`EEXIST: file already exists, copyfile '${sourceP}' -> '${destP}'`), { code: `EEXIST` });
            let content;
            try {
                content = sourceFs.readFileSync(sourceP);
            }
            catch (error) {
                throw Object.assign(new Error(`EINVAL: invalid argument, copyfile '${sourceP}' -> '${destP}'`), { code: `EINVAL` });
            }
            destFs.writeFileSync(destP, content);
        };
        return this.makeCallSync(sourceP, () => {
            return this.makeCallSync(destP, () => {
                return this.baseFs.copyFileSync(sourceP, destP, flags);
            }, (zipFsD, { subPath: subPathD }) => {
                return fallback(this.baseFs, sourceP, zipFsD, subPathD);
            });
        }, (zipFsS, { subPath: subPathS }) => {
            return this.makeCallSync(destP, () => {
                return fallback(zipFsS, subPathS, this.baseFs, destP);
            }, (zipFsD, { subPath: subPathD }) => {
                if (zipFsS !== zipFsD) {
                    return fallback(zipFsS, subPathS, zipFsD, subPathD);
                }
                else {
                    return zipFsS.copyFileSync(subPathS, subPathD, flags);
                }
            });
        });
    }
    async appendFilePromise(p, content, opts) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.appendFilePromise(p, content, opts);
        }, async (zipFs, { subPath }) => {
            return await zipFs.appendFilePromise(subPath, content, opts);
        });
    }
    appendFileSync(p, content, opts) {
        return this.makeCallSync(p, () => {
            return this.baseFs.appendFileSync(p, content, opts);
        }, (zipFs, { subPath }) => {
            return zipFs.appendFileSync(subPath, content, opts);
        });
    }
    async writeFilePromise(p, content, opts) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.writeFilePromise(p, content, opts);
        }, async (zipFs, { subPath }) => {
            return await zipFs.writeFilePromise(subPath, content, opts);
        });
    }
    writeFileSync(p, content, opts) {
        return this.makeCallSync(p, () => {
            return this.baseFs.writeFileSync(p, content, opts);
        }, (zipFs, { subPath }) => {
            return zipFs.writeFileSync(subPath, content, opts);
        });
    }
    async unlinkPromise(p) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.unlinkPromise(p);
        }, async (zipFs, { subPath }) => {
            return await zipFs.unlinkPromise(subPath);
        });
    }
    unlinkSync(p) {
        return this.makeCallSync(p, () => {
            return this.baseFs.unlinkSync(p);
        }, (zipFs, { subPath }) => {
            return zipFs.unlinkSync(subPath);
        });
    }
    async utimesPromise(p, atime, mtime) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.utimesPromise(p, atime, mtime);
        }, async (zipFs, { subPath }) => {
            return await zipFs.utimesPromise(subPath, atime, mtime);
        });
    }
    utimesSync(p, atime, mtime) {
        return this.makeCallSync(p, () => {
            return this.baseFs.utimesSync(p, atime, mtime);
        }, (zipFs, { subPath }) => {
            return zipFs.utimesSync(subPath, atime, mtime);
        });
    }
    async mkdirPromise(p, opts) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.mkdirPromise(p, opts);
        }, async (zipFs, { subPath }) => {
            return await zipFs.mkdirPromise(subPath, opts);
        });
    }
    mkdirSync(p, opts) {
        return this.makeCallSync(p, () => {
            return this.baseFs.mkdirSync(p, opts);
        }, (zipFs, { subPath }) => {
            return zipFs.mkdirSync(subPath, opts);
        });
    }
    async rmdirPromise(p, opts) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.rmdirPromise(p, opts);
        }, async (zipFs, { subPath }) => {
            return await zipFs.rmdirPromise(subPath, opts);
        });
    }
    rmdirSync(p, opts) {
        return this.makeCallSync(p, () => {
            return this.baseFs.rmdirSync(p, opts);
        }, (zipFs, { subPath }) => {
            return zipFs.rmdirSync(subPath, opts);
        });
    }
    async linkPromise(existingP, newP) {
        return await this.makeCallPromise(newP, async () => {
            return await this.baseFs.linkPromise(existingP, newP);
        }, async (zipFs, { subPath }) => {
            return await zipFs.linkPromise(existingP, subPath);
        });
    }
    linkSync(existingP, newP) {
        return this.makeCallSync(newP, () => {
            return this.baseFs.linkSync(existingP, newP);
        }, (zipFs, { subPath }) => {
            return zipFs.linkSync(existingP, subPath);
        });
    }
    async symlinkPromise(target, p, type) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.symlinkPromise(target, p, type);
        }, async (zipFs, { subPath }) => {
            return await zipFs.symlinkPromise(target, subPath);
        });
    }
    symlinkSync(target, p, type) {
        return this.makeCallSync(p, () => {
            return this.baseFs.symlinkSync(target, p, type);
        }, (zipFs, { subPath }) => {
            return zipFs.symlinkSync(target, subPath);
        });
    }
    async readFilePromise(p, encoding) {
        return this.makeCallPromise(p, async () => {
            // This weird switch is required to tell TypeScript that the signatures are proper (otherwise it thinks that only the generic one is covered)
            switch (encoding) {
                case `utf8`:
                    return await this.baseFs.readFilePromise(p, encoding);
                default:
                    return await this.baseFs.readFilePromise(p, encoding);
            }
        }, async (zipFs, { subPath }) => {
            return await zipFs.readFilePromise(subPath, encoding);
        });
    }
    readFileSync(p, encoding) {
        return this.makeCallSync(p, () => {
            // This weird switch is required to tell TypeScript that the signatures are proper (otherwise it thinks that only the generic one is covered)
            switch (encoding) {
                case `utf8`:
                    return this.baseFs.readFileSync(p, encoding);
                default:
                    return this.baseFs.readFileSync(p, encoding);
            }
        }, (zipFs, { subPath }) => {
            return zipFs.readFileSync(subPath, encoding);
        });
    }
    async readdirPromise(p, opts) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.readdirPromise(p, opts);
        }, async (zipFs, { subPath }) => {
            return await zipFs.readdirPromise(subPath, opts);
        }, {
            requireSubpath: false,
        });
    }
    readdirSync(p, opts) {
        return this.makeCallSync(p, () => {
            return this.baseFs.readdirSync(p, opts);
        }, (zipFs, { subPath }) => {
            return zipFs.readdirSync(subPath, opts);
        }, {
            requireSubpath: false,
        });
    }
    async readlinkPromise(p) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.readlinkPromise(p);
        }, async (zipFs, { subPath }) => {
            return await zipFs.readlinkPromise(subPath);
        });
    }
    readlinkSync(p) {
        return this.makeCallSync(p, () => {
            return this.baseFs.readlinkSync(p);
        }, (zipFs, { subPath }) => {
            return zipFs.readlinkSync(subPath);
        });
    }
    async truncatePromise(p, len) {
        return await this.makeCallPromise(p, async () => {
            return await this.baseFs.truncatePromise(p, len);
        }, async (zipFs, { subPath }) => {
            return await zipFs.truncatePromise(subPath, len);
        });
    }
    truncateSync(p, len) {
        return this.makeCallSync(p, () => {
            return this.baseFs.truncateSync(p, len);
        }, (zipFs, { subPath }) => {
            return zipFs.truncateSync(subPath, len);
        });
    }
    watch(p, a, b) {
        return this.makeCallSync(p, () => {
            return this.baseFs.watch(p, 
            // @ts-expect-error
            a, b);
        }, (zipFs, { subPath }) => {
            return zipFs.watch(subPath, 
            // @ts-expect-error
            a, b);
        });
    }
    watchFile(p, a, b) {
        return this.makeCallSync(p, () => {
            return this.baseFs.watchFile(p, 
            // @ts-expect-error
            a, b);
        }, () => {
            return (0, watchFile_1.watchFile)(this, p, a, b);
        });
    }
    unwatchFile(p, cb) {
        return this.makeCallSync(p, () => {
            return this.baseFs.unwatchFile(p, cb);
        }, () => {
            return (0, watchFile_1.unwatchFile)(this, p, cb);
        });
    }
    async makeCallPromise(p, discard, accept, { requireSubpath = true } = {}) {
        if (typeof p !== `string`)
            return await discard();
        const normalizedP = this.resolve(p);
        const zipInfo = this.findZip(normalizedP);
        if (!zipInfo)
            return await discard();
        if (requireSubpath && zipInfo.subPath === `/`)
            return await discard();
        return await this.getZipPromise(zipInfo.archivePath, async (zipFs) => await accept(zipFs, zipInfo));
    }
    makeCallSync(p, discard, accept, { requireSubpath = true } = {}) {
        if (typeof p !== `string`)
            return discard();
        const normalizedP = this.resolve(p);
        const zipInfo = this.findZip(normalizedP);
        if (!zipInfo)
            return discard();
        if (requireSubpath && zipInfo.subPath === `/`)
            return discard();
        return this.getZipSync(zipInfo.archivePath, zipFs => accept(zipFs, zipInfo));
    }
    findZip(p) {
        if (this.filter && !this.filter.test(p))
            return null;
        let filePath = ``;
        while (true) {
            const pathPartWithArchive = p.substr(filePath.length);
            let archivePart;
            if (!this.fileExtensions) {
                archivePart = (0, exports.getArchivePart)(pathPartWithArchive, `.zip`);
            }
            else {
                for (const ext of this.fileExtensions) {
                    archivePart = (0, exports.getArchivePart)(pathPartWithArchive, ext);
                    if (archivePart) {
                        break;
                    }
                }
            }
            if (!archivePart)
                return null;
            filePath = this.pathUtils.join(filePath, archivePart);
            if (this.isZip.has(filePath) === false) {
                if (this.notZip.has(filePath))
                    continue;
                try {
                    if (!this.baseFs.lstatSync(filePath).isFile()) {
                        this.notZip.add(filePath);
                        continue;
                    }
                }
                catch {
                    return null;
                }
                this.isZip.add(filePath);
            }
            return {
                archivePath: filePath,
                subPath: this.pathUtils.join(path_1.PortablePath.root, p.substr(filePath.length)),
            };
        }
    }
    limitOpenFiles(max) {
        if (this.zipInstances === null)
            return;
        const now = Date.now();
        let nextExpiresAt = now + this.maxAge;
        let closeCount = max === null ? 0 : this.zipInstances.size - max;
        for (const [path, { zipFs, expiresAt, refCount }] of this.zipInstances.entries()) {
            if (refCount !== 0 || zipFs.hasOpenFileHandles()) {
                continue;
            }
            else if (now >= expiresAt) {
                zipFs.saveAndClose();
                this.zipInstances.delete(path);
                closeCount -= 1;
                continue;
            }
            else if (max === null || closeCount <= 0) {
                nextExpiresAt = expiresAt;
                break;
            }
            zipFs.saveAndClose();
            this.zipInstances.delete(path);
            closeCount -= 1;
        }
        if (this.limitOpenFilesTimeout === null && ((max === null && this.zipInstances.size > 0) || max !== null)) {
            this.limitOpenFilesTimeout = setTimeout(() => {
                this.limitOpenFilesTimeout = null;
                this.limitOpenFiles(null);
            }, nextExpiresAt - now).unref();
        }
    }
    async getZipPromise(p, accept) {
        const getZipOptions = async () => ({
            baseFs: this.baseFs,
            libzip: this.libzip,
            readOnly: this.readOnlyArchives,
            stats: await this.baseFs.statPromise(p),
        });
        if (this.zipInstances) {
            let cachedZipFs = this.zipInstances.get(p);
            if (!cachedZipFs) {
                const zipOptions = await getZipOptions();
                // We need to recheck because concurrent getZipPromise calls may
                // have instantiated the zip archive while we were waiting
                cachedZipFs = this.zipInstances.get(p);
                if (!cachedZipFs) {
                    cachedZipFs = {
                        zipFs: new ZipFS_1.ZipFS(p, zipOptions),
                        expiresAt: 0,
                        refCount: 0,
                    };
                }
            }
            // Removing then re-adding the field allows us to easily implement
            // a basic LRU garbage collection strategy
            this.zipInstances.delete(p);
            this.limitOpenFiles(this.maxOpenFiles - 1);
            this.zipInstances.set(p, cachedZipFs);
            cachedZipFs.expiresAt = Date.now() + this.maxAge;
            cachedZipFs.refCount += 1;
            try {
                return await accept(cachedZipFs.zipFs);
            }
            finally {
                cachedZipFs.refCount -= 1;
            }
        }
        else {
            const zipFs = new ZipFS_1.ZipFS(p, await getZipOptions());
            try {
                return await accept(zipFs);
            }
            finally {
                zipFs.saveAndClose();
            }
        }
    }
    getZipSync(p, accept) {
        const getZipOptions = () => ({
            baseFs: this.baseFs,
            libzip: this.libzip,
            readOnly: this.readOnlyArchives,
            stats: this.baseFs.statSync(p),
        });
        if (this.zipInstances) {
            let cachedZipFs = this.zipInstances.get(p);
            if (!cachedZipFs) {
                cachedZipFs = {
                    zipFs: new ZipFS_1.ZipFS(p, getZipOptions()),
                    expiresAt: 0,
                    refCount: 0,
                };
            }
            // Removing then re-adding the field allows us to easily implement
            // a basic LRU garbage collection strategy
            this.zipInstances.delete(p);
            this.limitOpenFiles(this.maxOpenFiles - 1);
            this.zipInstances.set(p, cachedZipFs);
            cachedZipFs.expiresAt = Date.now() + this.maxAge;
            return accept(cachedZipFs.zipFs);
        }
        else {
            const zipFs = new ZipFS_1.ZipFS(p, getZipOptions());
            try {
                return accept(zipFs);
            }
            finally {
                zipFs.saveAndClose();
            }
        }
    }
}
exports.ZipOpenFS = ZipOpenFS;


/***/ }),

/***/ "../yarnpkg-fslib/sources/algorithms/copyPromise.ts":
/*!**********************************************************!*\
  !*** ../yarnpkg-fslib/sources/algorithms/copyPromise.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.copyPromise = exports.LinkStrategy = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const fs_1 = (0, tslib_1.__importDefault)(__webpack_require__(/*! fs */ "fs"));
const constants = (0, tslib_1.__importStar)(__webpack_require__(/*! ../constants */ "../yarnpkg-fslib/sources/constants.ts"));
const path_1 = __webpack_require__(/*! ../path */ "../yarnpkg-fslib/sources/path.ts");
const defaultTime = new Date(constants.SAFE_TIME * 1000);
var LinkStrategy;
(function (LinkStrategy) {
    LinkStrategy["Allow"] = "allow";
    LinkStrategy["ReadOnly"] = "readOnly";
})(LinkStrategy = exports.LinkStrategy || (exports.LinkStrategy = {}));
async function copyPromise(destinationFs, destination, sourceFs, source, opts) {
    const normalizedDestination = destinationFs.pathUtils.normalize(destination);
    const normalizedSource = sourceFs.pathUtils.normalize(source);
    const prelayout = [];
    const postlayout = [];
    const referenceTime = opts.stableTime
        ? { mtime: defaultTime, atime: defaultTime }
        : await sourceFs.lstatPromise(normalizedSource);
    await destinationFs.mkdirpPromise(destinationFs.pathUtils.dirname(destination), { utimes: [referenceTime.atime, referenceTime.mtime] });
    const updateTime = typeof destinationFs.lutimesPromise === `function`
        ? destinationFs.lutimesPromise.bind(destinationFs)
        : destinationFs.utimesPromise.bind(destinationFs);
    await copyImpl(prelayout, postlayout, updateTime, destinationFs, normalizedDestination, sourceFs, normalizedSource, opts);
    for (const operation of prelayout)
        await operation();
    await Promise.all(postlayout.map(operation => {
        return operation();
    }));
}
exports.copyPromise = copyPromise;
async function copyImpl(prelayout, postlayout, updateTime, destinationFs, destination, sourceFs, source, opts) {
    var _a, _b;
    const destinationStat = await maybeLStat(destinationFs, destination);
    const sourceStat = await sourceFs.lstatPromise(source);
    const referenceTime = opts.stableTime
        ? { mtime: defaultTime, atime: defaultTime }
        : sourceStat;
    let updated;
    switch (true) {
        case sourceStat.isDirectory():
            {
                updated = await copyFolder(prelayout, postlayout, updateTime, destinationFs, destination, destinationStat, sourceFs, source, sourceStat, opts);
            }
            break;
        case sourceStat.isFile():
            {
                updated = await copyFile(prelayout, postlayout, updateTime, destinationFs, destination, destinationStat, sourceFs, source, sourceStat, opts);
            }
            break;
        case sourceStat.isSymbolicLink():
            {
                updated = await copySymlink(prelayout, postlayout, updateTime, destinationFs, destination, destinationStat, sourceFs, source, sourceStat, opts);
            }
            break;
        default:
            {
                throw new Error(`Unsupported file type (${sourceStat.mode})`);
            }
            break;
    }
    if (updated || ((_a = destinationStat === null || destinationStat === void 0 ? void 0 : destinationStat.mtime) === null || _a === void 0 ? void 0 : _a.getTime()) !== referenceTime.mtime.getTime() || ((_b = destinationStat === null || destinationStat === void 0 ? void 0 : destinationStat.atime) === null || _b === void 0 ? void 0 : _b.getTime()) !== referenceTime.atime.getTime()) {
        postlayout.push(() => updateTime(destination, referenceTime.atime, referenceTime.mtime));
        updated = true;
    }
    if (destinationStat === null || (destinationStat.mode & 0o777) !== (sourceStat.mode & 0o777)) {
        postlayout.push(() => destinationFs.chmodPromise(destination, sourceStat.mode & 0o777));
        updated = true;
    }
    return updated;
}
async function maybeLStat(baseFs, p) {
    try {
        return await baseFs.lstatPromise(p);
    }
    catch (e) {
        return null;
    }
}
async function copyFolder(prelayout, postlayout, updateTime, destinationFs, destination, destinationStat, sourceFs, source, sourceStat, opts) {
    if (destinationStat !== null && !destinationStat.isDirectory()) {
        if (opts.overwrite) {
            prelayout.push(async () => destinationFs.removePromise(destination));
            destinationStat = null;
        }
        else {
            return false;
        }
    }
    let updated = false;
    if (destinationStat === null) {
        prelayout.push(async () => {
            try {
                await destinationFs.mkdirPromise(destination, { mode: sourceStat.mode });
            }
            catch (err) {
                if (err.code !== `EEXIST`) {
                    throw err;
                }
            }
        });
        updated = true;
    }
    const entries = await sourceFs.readdirPromise(source);
    if (opts.stableSort) {
        for (const entry of entries.sort()) {
            if (await copyImpl(prelayout, postlayout, updateTime, destinationFs, destinationFs.pathUtils.join(destination, entry), sourceFs, sourceFs.pathUtils.join(source, entry), opts)) {
                updated = true;
            }
        }
    }
    else {
        const entriesUpdateStatus = await Promise.all(entries.map(async (entry) => {
            await copyImpl(prelayout, postlayout, updateTime, destinationFs, destinationFs.pathUtils.join(destination, entry), sourceFs, sourceFs.pathUtils.join(source, entry), opts);
        }));
        if (entriesUpdateStatus.some(status => status)) {
            updated = true;
        }
    }
    return updated;
}
const isCloneSupportedCache = new WeakMap();
function makeLinkOperation(opFs, destination, source, sourceStat, linkStrategy) {
    return async () => {
        await opFs.linkPromise(source, destination);
        if (linkStrategy === LinkStrategy.ReadOnly) {
            // We mutate the stat, otherwise it'll be reset by copyImpl
            sourceStat.mode &= ~0o222;
            await opFs.chmodPromise(destination, sourceStat.mode);
        }
    };
}
function makeCloneLinkOperation(opFs, destination, source, sourceStat, linkStrategy) {
    const isCloneSupported = isCloneSupportedCache.get(opFs);
    if (typeof isCloneSupported === `undefined`) {
        return async () => {
            try {
                await opFs.copyFilePromise(source, destination, fs_1.default.constants.COPYFILE_FICLONE_FORCE);
                isCloneSupportedCache.set(opFs, true);
            }
            catch (err) {
                if (err.code === `ENOSYS` || err.code === `ENOTSUP`) {
                    isCloneSupportedCache.set(opFs, false);
                    await makeLinkOperation(opFs, destination, source, sourceStat, linkStrategy)();
                }
                else {
                    throw err;
                }
            }
        };
    }
    else {
        if (isCloneSupported) {
            return async () => opFs.copyFilePromise(source, destination, fs_1.default.constants.COPYFILE_FICLONE_FORCE);
        }
        else {
            return makeLinkOperation(opFs, destination, source, sourceStat, linkStrategy);
        }
    }
}
async function copyFile(prelayout, postlayout, updateTime, destinationFs, destination, destinationStat, sourceFs, source, sourceStat, opts) {
    var _a;
    if (destinationStat !== null) {
        if (opts.overwrite) {
            prelayout.push(async () => destinationFs.removePromise(destination));
            destinationStat = null;
        }
        else {
            return false;
        }
    }
    const linkStrategy = (_a = opts.linkStrategy) !== null && _a !== void 0 ? _a : null;
    const op = destinationFs === sourceFs
        ? linkStrategy !== null
            ? makeCloneLinkOperation(destinationFs, destination, source, sourceStat, linkStrategy)
            : async () => destinationFs.copyFilePromise(source, destination, fs_1.default.constants.COPYFILE_FICLONE)
        : linkStrategy !== null
            ? makeLinkOperation(destinationFs, destination, source, sourceStat, linkStrategy)
            : async () => destinationFs.writeFilePromise(destination, await sourceFs.readFilePromise(source));
    prelayout.push(async () => op());
    return true;
}
async function copySymlink(prelayout, postlayout, updateTime, destinationFs, destination, destinationStat, sourceFs, source, sourceStat, opts) {
    if (destinationStat !== null) {
        if (opts.overwrite) {
            prelayout.push(async () => destinationFs.removePromise(destination));
            destinationStat = null;
        }
        else {
            return false;
        }
    }
    prelayout.push(async () => {
        await destinationFs.symlinkPromise((0, path_1.convertPath)(destinationFs.pathUtils, await sourceFs.readlinkPromise(source)), destination);
    });
    return true;
}


/***/ }),

/***/ "../yarnpkg-fslib/sources/algorithms/opendir.ts":
/*!******************************************************!*\
  !*** ../yarnpkg-fslib/sources/algorithms/opendir.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.opendir = exports.CustomDir = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const errors = (0, tslib_1.__importStar)(__webpack_require__(/*! ../errors */ "../yarnpkg-fslib/sources/errors.ts"));
class CustomDir {
    constructor(path, nextDirent, opts = {}) {
        this.path = path;
        this.nextDirent = nextDirent;
        this.opts = opts;
        this.closed = false;
    }
    throwIfClosed() {
        if (this.closed) {
            throw errors.ERR_DIR_CLOSED();
        }
    }
    async *[Symbol.asyncIterator]() {
        try {
            let dirent;
            // eslint-disable-next-line no-cond-assign
            while ((dirent = await this.read()) !== null) {
                yield dirent;
            }
        }
        finally {
            await this.close();
        }
    }
    read(cb) {
        const dirent = this.readSync();
        if (typeof cb !== `undefined`)
            return cb(null, dirent);
        return Promise.resolve(dirent);
    }
    readSync() {
        this.throwIfClosed();
        return this.nextDirent();
    }
    close(cb) {
        this.closeSync();
        if (typeof cb !== `undefined`)
            return cb(null);
        return Promise.resolve();
    }
    closeSync() {
        var _a, _b;
        this.throwIfClosed();
        (_b = (_a = this.opts).onClose) === null || _b === void 0 ? void 0 : _b.call(_a);
        this.closed = true;
    }
}
exports.CustomDir = CustomDir;
function opendir(fakeFs, path, entries, opts) {
    const nextDirent = () => {
        const filename = entries.shift();
        if (typeof filename === `undefined`)
            return null;
        return Object.assign(fakeFs.statSync(fakeFs.pathUtils.join(path, filename)), {
            name: filename,
        });
    };
    return new CustomDir(path, nextDirent, opts);
}
exports.opendir = opendir;


/***/ }),

/***/ "../yarnpkg-fslib/sources/algorithms/watchFile.ts":
/*!********************************************************!*\
  !*** ../yarnpkg-fslib/sources/algorithms/watchFile.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.unwatchAllFiles = exports.unwatchFile = exports.watchFile = void 0;
const CustomStatWatcher_1 = __webpack_require__(/*! ./watchFile/CustomStatWatcher */ "../yarnpkg-fslib/sources/algorithms/watchFile/CustomStatWatcher.ts");
const statWatchersByFakeFS = new WeakMap();
function watchFile(fakeFs, path, a, b) {
    let bigint;
    let persistent;
    let interval;
    let listener;
    switch (typeof a) {
        case `function`:
            {
                bigint = false;
                persistent = true;
                interval = 5007;
                listener = a;
            }
            break;
        default:
            {
                ({
                    bigint = false,
                    persistent = true,
                    interval = 5007,
                } = a);
                listener = b;
            }
            break;
    }
    let statWatchers = statWatchersByFakeFS.get(fakeFs);
    if (typeof statWatchers === `undefined`)
        statWatchersByFakeFS.set(fakeFs, statWatchers = new Map());
    let statWatcher = statWatchers.get(path);
    if (typeof statWatcher === `undefined`) {
        statWatcher = CustomStatWatcher_1.CustomStatWatcher.create(fakeFs, path, { bigint });
        statWatchers.set(path, statWatcher);
    }
    statWatcher.registerChangeListener(listener, { persistent, interval });
    return statWatcher;
}
exports.watchFile = watchFile;
function unwatchFile(fakeFs, path, cb) {
    const statWatchers = statWatchersByFakeFS.get(fakeFs);
    if (typeof statWatchers === `undefined`)
        return;
    const statWatcher = statWatchers.get(path);
    if (typeof statWatcher === `undefined`)
        return;
    if (typeof cb === `undefined`)
        statWatcher.unregisterAllChangeListeners();
    else
        statWatcher.unregisterChangeListener(cb);
    if (!statWatcher.hasChangeListeners()) {
        statWatcher.stop();
        statWatchers.delete(path);
    }
}
exports.unwatchFile = unwatchFile;
function unwatchAllFiles(fakeFs) {
    const statWatchers = statWatchersByFakeFS.get(fakeFs);
    if (typeof statWatchers === `undefined`)
        return;
    for (const path of statWatchers.keys()) {
        unwatchFile(fakeFs, path);
    }
}
exports.unwatchAllFiles = unwatchAllFiles;


/***/ }),

/***/ "../yarnpkg-fslib/sources/algorithms/watchFile/CustomStatWatcher.ts":
/*!**************************************************************************!*\
  !*** ../yarnpkg-fslib/sources/algorithms/watchFile/CustomStatWatcher.ts ***!
  \**************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CustomStatWatcher = exports.assertStatus = exports.Status = exports.Event = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const events_1 = __webpack_require__(/*! events */ "events");
const statUtils = (0, tslib_1.__importStar)(__webpack_require__(/*! ../../statUtils */ "../yarnpkg-fslib/sources/statUtils.ts"));
var Event;
(function (Event) {
    Event["Change"] = "change";
    Event["Stop"] = "stop";
})(Event = exports.Event || (exports.Event = {}));
var Status;
(function (Status) {
    Status["Ready"] = "ready";
    Status["Running"] = "running";
    Status["Stopped"] = "stopped";
})(Status = exports.Status || (exports.Status = {}));
function assertStatus(current, expected) {
    if (current !== expected) {
        throw new Error(`Invalid StatWatcher status: expected '${expected}', got '${current}'`);
    }
}
exports.assertStatus = assertStatus;
class CustomStatWatcher extends events_1.EventEmitter {
    constructor(fakeFs, path, { bigint = false } = {}) {
        super();
        this.status = Status.Ready;
        this.changeListeners = new Map();
        this.startTimeout = null;
        this.fakeFs = fakeFs;
        this.path = path;
        this.bigint = bigint;
        this.lastStats = this.stat();
    }
    static create(fakeFs, path, opts) {
        const statWatcher = new CustomStatWatcher(fakeFs, path, opts);
        statWatcher.start();
        return statWatcher;
    }
    start() {
        assertStatus(this.status, Status.Ready);
        this.status = Status.Running;
        // Node allows other listeners to be registered up to 3 milliseconds
        // after the watcher has been started, so that's what we're doing too
        this.startTimeout = setTimeout(() => {
            this.startTimeout = null;
            // Per the Node FS docs:
            // "When an fs.watchFile operation results in an ENOENT error,
            // it will invoke the listener once, with all the fields zeroed
            // (or, for dates, the Unix Epoch)."
            if (!this.fakeFs.existsSync(this.path)) {
                this.emit(Event.Change, this.lastStats, this.lastStats);
            }
        }, 3);
    }
    stop() {
        assertStatus(this.status, Status.Running);
        this.status = Status.Stopped;
        if (this.startTimeout !== null) {
            clearTimeout(this.startTimeout);
            this.startTimeout = null;
        }
        this.emit(Event.Stop);
    }
    stat() {
        try {
            return this.fakeFs.statSync(this.path, { bigint: this.bigint });
        }
        catch (error) {
            // From observation, all errors seem to be mostly ignored by Node.
            // Checked with ENOENT, ENOTDIR, EPERM
            const statInstance = this.bigint
                ? new statUtils.BigIntStatsEntry()
                : new statUtils.StatEntry();
            return statUtils.clearStats(statInstance);
        }
    }
    /**
     * Creates an interval whose callback compares the current stats with the previous stats and notifies all listeners in case of changes.
     *
     * @param opts.persistent Decides whether the interval should be immediately unref-ed.
     */
    makeInterval(opts) {
        const interval = setInterval(() => {
            const currentStats = this.stat();
            const previousStats = this.lastStats;
            if (statUtils.areStatsEqual(currentStats, previousStats))
                return;
            this.lastStats = currentStats;
            this.emit(Event.Change, currentStats, previousStats);
        }, opts.interval);
        return opts.persistent ? interval : interval.unref();
    }
    /**
     * Registers a listener and assigns it an interval.
     */
    registerChangeListener(listener, opts) {
        this.addListener(Event.Change, listener);
        this.changeListeners.set(listener, this.makeInterval(opts));
    }
    /**
     * Unregisters the listener and clears the assigned interval.
     */
    unregisterChangeListener(listener) {
        this.removeListener(Event.Change, listener);
        const interval = this.changeListeners.get(listener);
        if (typeof interval !== `undefined`)
            clearInterval(interval);
        this.changeListeners.delete(listener);
    }
    /**
     * Unregisters all listeners and clears all assigned intervals.
     */
    unregisterAllChangeListeners() {
        for (const listener of this.changeListeners.keys()) {
            this.unregisterChangeListener(listener);
        }
    }
    hasChangeListeners() {
        return this.changeListeners.size > 0;
    }
    /**
     * Refs all stored intervals.
     */
    ref() {
        for (const interval of this.changeListeners.values())
            interval.ref();
        return this;
    }
    /**
     * Unrefs all stored intervals.
     */
    unref() {
        for (const interval of this.changeListeners.values())
            interval.unref();
        return this;
    }
}
exports.CustomStatWatcher = CustomStatWatcher;


/***/ }),

/***/ "../yarnpkg-fslib/sources/constants.ts":
/*!*********************************************!*\
  !*** ../yarnpkg-fslib/sources/constants.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SAFE_TIME = exports.S_IFLNK = exports.S_IFREG = exports.S_IFDIR = exports.S_IFMT = void 0;
exports.S_IFMT = 0o170000;
exports.S_IFDIR = 0o040000;
exports.S_IFREG = 0o100000;
exports.S_IFLNK = 0o120000;
/**
 * Unix timestamp for `1984-06-22T21:50:00.000Z`
 *
 * It needs to be after 1980-01-01 because that's what Zip supports, and it
 * needs to have a slight offset to account for different timezones (because
 * zip assumes that all times are local to whoever writes the file, which is
 * really silly).
 */
exports.SAFE_TIME = 456789000;


/***/ }),

/***/ "../yarnpkg-fslib/sources/errors.ts":
/*!******************************************!*\
  !*** ../yarnpkg-fslib/sources/errors.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LibzipError = exports.ERR_DIR_CLOSED = exports.EOPNOTSUPP = exports.ENOTEMPTY = exports.EROFS = exports.EEXIST = exports.EISDIR = exports.ENOTDIR = exports.ENOENT = exports.EBADF = exports.EINVAL = exports.ENOSYS = exports.EBUSY = void 0;
function makeError(code, message) {
    return Object.assign(new Error(`${code}: ${message}`), { code });
}
function EBUSY(message) {
    return makeError(`EBUSY`, message);
}
exports.EBUSY = EBUSY;
function ENOSYS(message, reason) {
    return makeError(`ENOSYS`, `${message}, ${reason}`);
}
exports.ENOSYS = ENOSYS;
function EINVAL(reason) {
    return makeError(`EINVAL`, `invalid argument, ${reason}`);
}
exports.EINVAL = EINVAL;
function EBADF(reason) {
    return makeError(`EBADF`, `bad file descriptor, ${reason}`);
}
exports.EBADF = EBADF;
function ENOENT(reason) {
    return makeError(`ENOENT`, `no such file or directory, ${reason}`);
}
exports.ENOENT = ENOENT;
function ENOTDIR(reason) {
    return makeError(`ENOTDIR`, `not a directory, ${reason}`);
}
exports.ENOTDIR = ENOTDIR;
function EISDIR(reason) {
    return makeError(`EISDIR`, `illegal operation on a directory, ${reason}`);
}
exports.EISDIR = EISDIR;
function EEXIST(reason) {
    return makeError(`EEXIST`, `file already exists, ${reason}`);
}
exports.EEXIST = EEXIST;
function EROFS(reason) {
    return makeError(`EROFS`, `read-only filesystem, ${reason}`);
}
exports.EROFS = EROFS;
function ENOTEMPTY(reason) {
    return makeError(`ENOTEMPTY`, `directory not empty, ${reason}`);
}
exports.ENOTEMPTY = ENOTEMPTY;
function EOPNOTSUPP(reason) {
    return makeError(`EOPNOTSUPP`, `operation not supported, ${reason}`);
}
exports.EOPNOTSUPP = EOPNOTSUPP;
// ------------------------------------------------------------------------
function ERR_DIR_CLOSED() {
    return makeError(`ERR_DIR_CLOSED`, `Directory handle was closed`);
}
exports.ERR_DIR_CLOSED = ERR_DIR_CLOSED;
// ------------------------------------------------------------------------
class LibzipError extends Error {
    constructor(message, code) {
        super(message);
        this.name = `Libzip Error`;
        this.code = code;
    }
}
exports.LibzipError = LibzipError;


/***/ }),

/***/ "../yarnpkg-fslib/sources/index.ts":
/*!*****************************************!*\
  !*** ../yarnpkg-fslib/sources/index.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.xfs = exports.extendFs = exports.patchFs = exports.ZipOpenFS = exports.ZipFS = exports.VirtualFS = exports.ProxiedFS = exports.PosixFS = exports.NodeFS = exports.NoFS = exports.LazyFS = exports.JailFS = exports.CwdFS = exports.FakeFS = exports.AliasFS = exports.toFilename = exports.ppath = exports.npath = exports.Filename = exports.PortablePath = exports.DEFAULT_COMPRESSION_LEVEL = exports.normalizeLineEndings = exports.statUtils = exports.opendir = exports.LinkStrategy = exports.constants = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const constants = (0, tslib_1.__importStar)(__webpack_require__(/*! ./constants */ "../yarnpkg-fslib/sources/constants.ts"));
exports.constants = constants;
const statUtils = (0, tslib_1.__importStar)(__webpack_require__(/*! ./statUtils */ "../yarnpkg-fslib/sources/statUtils.ts"));
exports.statUtils = statUtils;
var copyPromise_1 = __webpack_require__(/*! ./algorithms/copyPromise */ "../yarnpkg-fslib/sources/algorithms/copyPromise.ts");
Object.defineProperty(exports, "LinkStrategy", ({ enumerable: true, get: function () { return copyPromise_1.LinkStrategy; } }));
var opendir_1 = __webpack_require__(/*! ./algorithms/opendir */ "../yarnpkg-fslib/sources/algorithms/opendir.ts");
Object.defineProperty(exports, "opendir", ({ enumerable: true, get: function () { return opendir_1.opendir; } }));
var FakeFS_1 = __webpack_require__(/*! ./FakeFS */ "../yarnpkg-fslib/sources/FakeFS.ts");
Object.defineProperty(exports, "normalizeLineEndings", ({ enumerable: true, get: function () { return FakeFS_1.normalizeLineEndings; } }));
var ZipFS_1 = __webpack_require__(/*! ./ZipFS */ "../yarnpkg-fslib/sources/ZipFS.ts");
Object.defineProperty(exports, "DEFAULT_COMPRESSION_LEVEL", ({ enumerable: true, get: function () { return ZipFS_1.DEFAULT_COMPRESSION_LEVEL; } }));
var path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
Object.defineProperty(exports, "PortablePath", ({ enumerable: true, get: function () { return path_1.PortablePath; } }));
Object.defineProperty(exports, "Filename", ({ enumerable: true, get: function () { return path_1.Filename; } }));
var path_2 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
Object.defineProperty(exports, "npath", ({ enumerable: true, get: function () { return path_2.npath; } }));
Object.defineProperty(exports, "ppath", ({ enumerable: true, get: function () { return path_2.ppath; } }));
Object.defineProperty(exports, "toFilename", ({ enumerable: true, get: function () { return path_2.toFilename; } }));
var AliasFS_1 = __webpack_require__(/*! ./AliasFS */ "../yarnpkg-fslib/sources/AliasFS.ts");
Object.defineProperty(exports, "AliasFS", ({ enumerable: true, get: function () { return AliasFS_1.AliasFS; } }));
var FakeFS_2 = __webpack_require__(/*! ./FakeFS */ "../yarnpkg-fslib/sources/FakeFS.ts");
Object.defineProperty(exports, "FakeFS", ({ enumerable: true, get: function () { return FakeFS_2.FakeFS; } }));
var CwdFS_1 = __webpack_require__(/*! ./CwdFS */ "../yarnpkg-fslib/sources/CwdFS.ts");
Object.defineProperty(exports, "CwdFS", ({ enumerable: true, get: function () { return CwdFS_1.CwdFS; } }));
var JailFS_1 = __webpack_require__(/*! ./JailFS */ "../yarnpkg-fslib/sources/JailFS.ts");
Object.defineProperty(exports, "JailFS", ({ enumerable: true, get: function () { return JailFS_1.JailFS; } }));
var LazyFS_1 = __webpack_require__(/*! ./LazyFS */ "../yarnpkg-fslib/sources/LazyFS.ts");
Object.defineProperty(exports, "LazyFS", ({ enumerable: true, get: function () { return LazyFS_1.LazyFS; } }));
var NoFS_1 = __webpack_require__(/*! ./NoFS */ "../yarnpkg-fslib/sources/NoFS.ts");
Object.defineProperty(exports, "NoFS", ({ enumerable: true, get: function () { return NoFS_1.NoFS; } }));
var NodeFS_1 = __webpack_require__(/*! ./NodeFS */ "../yarnpkg-fslib/sources/NodeFS.ts");
Object.defineProperty(exports, "NodeFS", ({ enumerable: true, get: function () { return NodeFS_1.NodeFS; } }));
var PosixFS_1 = __webpack_require__(/*! ./PosixFS */ "../yarnpkg-fslib/sources/PosixFS.ts");
Object.defineProperty(exports, "PosixFS", ({ enumerable: true, get: function () { return PosixFS_1.PosixFS; } }));
var ProxiedFS_1 = __webpack_require__(/*! ./ProxiedFS */ "../yarnpkg-fslib/sources/ProxiedFS.ts");
Object.defineProperty(exports, "ProxiedFS", ({ enumerable: true, get: function () { return ProxiedFS_1.ProxiedFS; } }));
var VirtualFS_1 = __webpack_require__(/*! ./VirtualFS */ "../yarnpkg-fslib/sources/VirtualFS.ts");
Object.defineProperty(exports, "VirtualFS", ({ enumerable: true, get: function () { return VirtualFS_1.VirtualFS; } }));
var ZipFS_2 = __webpack_require__(/*! ./ZipFS */ "../yarnpkg-fslib/sources/ZipFS.ts");
Object.defineProperty(exports, "ZipFS", ({ enumerable: true, get: function () { return ZipFS_2.ZipFS; } }));
var ZipOpenFS_1 = __webpack_require__(/*! ./ZipOpenFS */ "../yarnpkg-fslib/sources/ZipOpenFS.ts");
Object.defineProperty(exports, "ZipOpenFS", ({ enumerable: true, get: function () { return ZipOpenFS_1.ZipOpenFS; } }));
var patchFs_1 = __webpack_require__(/*! ./patchFs */ "../yarnpkg-fslib/sources/patchFs.ts");
Object.defineProperty(exports, "patchFs", ({ enumerable: true, get: function () { return patchFs_1.patchFs; } }));
Object.defineProperty(exports, "extendFs", ({ enumerable: true, get: function () { return patchFs_1.extendFs; } }));
var xfs_1 = __webpack_require__(/*! ./xfs */ "../yarnpkg-fslib/sources/xfs.ts");
Object.defineProperty(exports, "xfs", ({ enumerable: true, get: function () { return xfs_1.xfs; } }));


/***/ }),

/***/ "../yarnpkg-fslib/sources/patchFs.ts":
/*!*******************************************!*\
  !*** ../yarnpkg-fslib/sources/patchFs.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extendFs = exports.patchFs = void 0;
const util_1 = __webpack_require__(/*! util */ "util");
const URLFS_1 = __webpack_require__(/*! ./URLFS */ "../yarnpkg-fslib/sources/URLFS.ts");
const SYNC_IMPLEMENTATIONS = new Set([
    `accessSync`,
    `appendFileSync`,
    `createReadStream`,
    `createWriteStream`,
    `chmodSync`,
    `chownSync`,
    `closeSync`,
    `copyFileSync`,
    `linkSync`,
    `lstatSync`,
    `fstatSync`,
    `lutimesSync`,
    `mkdirSync`,
    `openSync`,
    `opendirSync`,
    `readSync`,
    `readlinkSync`,
    `readFileSync`,
    `readdirSync`,
    `readlinkSync`,
    `realpathSync`,
    `renameSync`,
    `rmdirSync`,
    `statSync`,
    `symlinkSync`,
    `truncateSync`,
    `unlinkSync`,
    `unwatchFile`,
    `utimesSync`,
    `watch`,
    `watchFile`,
    `writeFileSync`,
    `writeSync`,
]);
const ASYNC_IMPLEMENTATIONS = new Set([
    `accessPromise`,
    `appendFilePromise`,
    `chmodPromise`,
    `chownPromise`,
    `closePromise`,
    `copyFilePromise`,
    `linkPromise`,
    `fstatPromise`,
    `lstatPromise`,
    `lutimesPromise`,
    `mkdirPromise`,
    `openPromise`,
    `opendirPromise`,
    `readdirPromise`,
    `realpathPromise`,
    `readFilePromise`,
    `readdirPromise`,
    `readlinkPromise`,
    `renamePromise`,
    `rmdirPromise`,
    `statPromise`,
    `symlinkPromise`,
    `truncatePromise`,
    `unlinkPromise`,
    `utimesPromise`,
    `writeFilePromise`,
    `writeSync`,
]);
const FILEHANDLE_IMPLEMENTATIONS = new Set([
    `appendFilePromise`,
    `chmodPromise`,
    `chownPromise`,
    `closePromise`,
    `readPromise`,
    `readFilePromise`,
    `statPromise`,
    `truncatePromise`,
    `utimesPromise`,
    `writePromise`,
    `writeFilePromise`,
]);
function patchFs(patchedFs, fakeFs) {
    // We wrap the `fakeFs` with a `URLFS` to add support for URL instances
    fakeFs = new URLFS_1.URLFS(fakeFs);
    const setupFn = (target, name, replacement) => {
        const orig = target[name];
        target[name] = replacement;
        // Preserve any util.promisify implementations
        if (typeof (orig === null || orig === void 0 ? void 0 : orig[util_1.promisify.custom]) !== `undefined`) {
            replacement[util_1.promisify.custom] = orig[util_1.promisify.custom];
        }
    };
    /** Callback implementations */
    {
        setupFn(patchedFs, `exists`, (p, ...args) => {
            const hasCallback = typeof args[args.length - 1] === `function`;
            const callback = hasCallback ? args.pop() : () => { };
            process.nextTick(() => {
                fakeFs.existsPromise(p).then(exists => {
                    callback(exists);
                }, () => {
                    callback(false);
                });
            });
        });
        setupFn(patchedFs, `read`, (p, buffer, ...args) => {
            const hasCallback = typeof args[args.length - 1] === `function`;
            const callback = hasCallback ? args.pop() : () => { };
            process.nextTick(() => {
                fakeFs.readPromise(p, buffer, ...args).then(bytesRead => {
                    callback(null, bytesRead, buffer);
                }, error => {
                    // https://github.com/nodejs/node/blob/1317252dfe8824fd9cfee125d2aaa94004db2f3b/lib/fs.js#L655-L658
                    // Known issue: bytesRead could theoretically be > than 0, but we currently always return 0
                    callback(error, 0, buffer);
                });
            });
        });
        for (const fnName of ASYNC_IMPLEMENTATIONS) {
            const origName = fnName.replace(/Promise$/, ``);
            if (typeof patchedFs[origName] === `undefined`)
                continue;
            const fakeImpl = fakeFs[fnName];
            if (typeof fakeImpl === `undefined`)
                continue;
            const wrapper = (...args) => {
                const hasCallback = typeof args[args.length - 1] === `function`;
                const callback = hasCallback ? args.pop() : () => { };
                process.nextTick(() => {
                    fakeImpl.apply(fakeFs, args).then((result) => {
                        callback(null, result);
                    }, (error) => {
                        callback(error);
                    });
                });
            };
            setupFn(patchedFs, origName, wrapper);
        }
        patchedFs.realpath.native = patchedFs.realpath;
    }
    /** Sync implementations */
    {
        setupFn(patchedFs, `existsSync`, (p) => {
            try {
                return fakeFs.existsSync(p);
            }
            catch (error) {
                return false;
            }
        });
        for (const fnName of SYNC_IMPLEMENTATIONS) {
            const origName = fnName;
            if (typeof patchedFs[origName] === `undefined`)
                continue;
            const fakeImpl = fakeFs[fnName];
            if (typeof fakeImpl === `undefined`)
                continue;
            setupFn(patchedFs, origName, fakeImpl.bind(fakeFs));
        }
        patchedFs.realpathSync.native = patchedFs.realpathSync;
    }
    /** Promise implementations */
    {
        // `fs.promises` is a getter that returns a reference to require(`fs/promises`),
        // so we can just patch `fs.promises` and both will be updated
        const origEmitWarning = process.emitWarning;
        process.emitWarning = () => { };
        let patchedFsPromises;
        try {
            patchedFsPromises = patchedFs.promises;
        }
        finally {
            process.emitWarning = origEmitWarning;
        }
        if (typeof patchedFsPromises !== `undefined`) {
            // `fs.promises.exists` doesn't exist
            for (const fnName of ASYNC_IMPLEMENTATIONS) {
                const origName = fnName.replace(/Promise$/, ``);
                if (typeof patchedFsPromises[origName] === `undefined`)
                    continue;
                const fakeImpl = fakeFs[fnName];
                if (typeof fakeImpl === `undefined`)
                    continue;
                // Open is a bit particular with fs.promises: it returns a file handle
                // instance instead of the traditional file descriptor number
                if (fnName === `open`)
                    continue;
                setupFn(patchedFsPromises, origName, fakeImpl.bind(fakeFs));
            }
            class FileHandle {
                constructor(fd) {
                    this.fd = fd;
                }
            }
            for (const fnName of FILEHANDLE_IMPLEMENTATIONS) {
                const origName = fnName.replace(/Promise$/, ``);
                const fakeImpl = fakeFs[fnName];
                if (typeof fakeImpl === `undefined`)
                    continue;
                setupFn(FileHandle.prototype, origName, function (...args) {
                    return fakeImpl.call(fakeFs, this.fd, ...args);
                });
            }
            setupFn(patchedFsPromises, `open`, async (...args) => {
                // @ts-expect-error
                const fd = await fakeFs.openPromise(...args);
                return new FileHandle(fd);
            });
            // `fs.promises.realpath` doesn't have a `native` property
        }
    }
    /** util.promisify implementations */
    {
        // Override the promisified version of `fs.read` to return an object as per
        // https://github.com/nodejs/node/blob/dc79f3f37caf6f25b8efee4623bec31e2c20f595/lib/fs.js#L559-L560
        // and
        // https://github.com/nodejs/node/blob/ba684805b6c0eded76e5cd89ee00328ac7a59365/lib/internal/util.js#L293
        // @ts-expect-error
        patchedFs.read[util_1.promisify.custom] = async (p, buffer, ...args) => {
            const res = fakeFs.readPromise(p, buffer, ...args);
            return { bytesRead: await res, buffer };
        };
    }
}
exports.patchFs = patchFs;
function extendFs(realFs, fakeFs) {
    const patchedFs = Object.create(realFs);
    patchFs(patchedFs, fakeFs);
    return patchedFs;
}
exports.extendFs = extendFs;


/***/ }),

/***/ "../yarnpkg-fslib/sources/path.ts":
/*!****************************************!*\
  !*** ../yarnpkg-fslib/sources/path.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toFilename = exports.convertPath = exports.ppath = exports.npath = exports.Filename = exports.PortablePath = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const path_1 = (0, tslib_1.__importDefault)(__webpack_require__(/*! path */ "path"));
var PathType;
(function (PathType) {
    PathType[PathType["File"] = 0] = "File";
    PathType[PathType["Portable"] = 1] = "Portable";
    PathType[PathType["Native"] = 2] = "Native";
})(PathType || (PathType = {}));
exports.PortablePath = {
    root: `/`,
    dot: `.`,
};
exports.Filename = {
    nodeModules: `node_modules`,
    manifest: `package.json`,
    lockfile: `yarn.lock`,
    virtual: `__virtual__`,
    /**
     * @deprecated
     */
    pnpJs: `.pnp.js`,
    pnpCjs: `.pnp.cjs`,
    rc: `.yarnrc.yml`,
};
exports.npath = Object.create(path_1.default);
exports.ppath = Object.create(path_1.default.posix);
exports.npath.cwd = () => process.cwd();
exports.ppath.cwd = () => toPortablePath(process.cwd());
exports.ppath.resolve = (...segments) => {
    if (segments.length > 0 && exports.ppath.isAbsolute(segments[0])) {
        return path_1.default.posix.resolve(...segments);
    }
    else {
        return path_1.default.posix.resolve(exports.ppath.cwd(), ...segments);
    }
};
const contains = function (pathUtils, from, to) {
    from = pathUtils.normalize(from);
    to = pathUtils.normalize(to);
    if (from === to)
        return `.`;
    if (!from.endsWith(pathUtils.sep))
        from = (from + pathUtils.sep);
    if (to.startsWith(from)) {
        return to.slice(from.length);
    }
    else {
        return null;
    }
};
exports.npath.fromPortablePath = fromPortablePath;
exports.npath.toPortablePath = toPortablePath;
exports.npath.contains = (from, to) => contains(exports.npath, from, to);
exports.ppath.contains = (from, to) => contains(exports.ppath, from, to);
const WINDOWS_PATH_REGEXP = /^([a-zA-Z]:.*)$/;
const UNC_WINDOWS_PATH_REGEXP = /^\\\\(\.\\)?(.*)$/;
const PORTABLE_PATH_REGEXP = /^\/([a-zA-Z]:.*)$/;
const UNC_PORTABLE_PATH_REGEXP = /^\/unc\/(\.dot\/)?(.*)$/;
// Path should look like "/N:/berry/scripts/plugin-pack.js"
// And transform to "N:\berry\scripts\plugin-pack.js"
function fromPortablePath(p) {
    if (process.platform !== `win32`)
        return p;
    let portablePathMatch, uncPortablePathMatch;
    if ((portablePathMatch = p.match(PORTABLE_PATH_REGEXP)))
        p = portablePathMatch[1];
    else if ((uncPortablePathMatch = p.match(UNC_PORTABLE_PATH_REGEXP)))
        p = `\\\\${uncPortablePathMatch[1] ? `.\\` : ``}${uncPortablePathMatch[2]}`;
    else
        return p;
    return p.replace(/\//g, `\\`);
}
// Path should look like "N:/berry/scripts/plugin-pack.js"
// And transform to "/N:/berry/scripts/plugin-pack.js"
function toPortablePath(p) {
    if (process.platform !== `win32`)
        return p;
    let windowsPathMatch, uncWindowsPathMatch;
    if ((windowsPathMatch = p.match(WINDOWS_PATH_REGEXP)))
        p = `/${windowsPathMatch[1]}`;
    else if ((uncWindowsPathMatch = p.match(UNC_WINDOWS_PATH_REGEXP)))
        p = `/unc/${uncWindowsPathMatch[1] ? `.dot/` : ``}${uncWindowsPathMatch[2]}`;
    return p.replace(/\\/g, `/`);
}
function convertPath(targetPathUtils, sourcePath) {
    return (targetPathUtils === exports.npath ? fromPortablePath(sourcePath) : toPortablePath(sourcePath));
}
exports.convertPath = convertPath;
function toFilename(filename) {
    if (exports.npath.parse(filename).dir !== `` || exports.ppath.parse(filename).dir !== ``)
        throw new Error(`Invalid filename: "${filename}"`);
    return filename;
}
exports.toFilename = toFilename;


/***/ }),

/***/ "../yarnpkg-fslib/sources/statUtils.ts":
/*!*********************************************!*\
  !*** ../yarnpkg-fslib/sources/statUtils.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.areStatsEqual = exports.convertToBigIntStats = exports.clearStats = exports.makeEmptyStats = exports.makeDefaultStats = exports.BigIntStatsEntry = exports.StatEntry = exports.DirEntry = exports.DEFAULT_MODE = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const nodeUtils = (0, tslib_1.__importStar)(__webpack_require__(/*! util */ "util"));
const constants_1 = __webpack_require__(/*! ./constants */ "../yarnpkg-fslib/sources/constants.ts");
exports.DEFAULT_MODE = constants_1.S_IFREG | 0o644;
class DirEntry {
    constructor() {
        this.name = ``;
        this.mode = 0;
    }
    isBlockDevice() {
        return false;
    }
    isCharacterDevice() {
        return false;
    }
    isDirectory() {
        return (this.mode & constants_1.S_IFMT) === constants_1.S_IFDIR;
    }
    isFIFO() {
        return false;
    }
    isFile() {
        return (this.mode & constants_1.S_IFMT) === constants_1.S_IFREG;
    }
    isSocket() {
        return false;
    }
    isSymbolicLink() {
        return (this.mode & constants_1.S_IFMT) === constants_1.S_IFLNK;
    }
}
exports.DirEntry = DirEntry;
class StatEntry {
    constructor() {
        this.uid = 0;
        this.gid = 0;
        this.size = 0;
        this.blksize = 0;
        this.atimeMs = 0;
        this.mtimeMs = 0;
        this.ctimeMs = 0;
        this.birthtimeMs = 0;
        this.atime = new Date(0);
        this.mtime = new Date(0);
        this.ctime = new Date(0);
        this.birthtime = new Date(0);
        this.dev = 0;
        this.ino = 0;
        this.mode = exports.DEFAULT_MODE;
        this.nlink = 1;
        this.rdev = 0;
        this.blocks = 1;
    }
    isBlockDevice() {
        return false;
    }
    isCharacterDevice() {
        return false;
    }
    isDirectory() {
        return (this.mode & constants_1.S_IFMT) === constants_1.S_IFDIR;
    }
    isFIFO() {
        return false;
    }
    isFile() {
        return (this.mode & constants_1.S_IFMT) === constants_1.S_IFREG;
    }
    isSocket() {
        return false;
    }
    isSymbolicLink() {
        return (this.mode & constants_1.S_IFMT) === constants_1.S_IFLNK;
    }
}
exports.StatEntry = StatEntry;
class BigIntStatsEntry {
    constructor() {
        this.uid = BigInt(0);
        this.gid = BigInt(0);
        this.size = BigInt(0);
        this.blksize = BigInt(0);
        this.atimeMs = BigInt(0);
        this.mtimeMs = BigInt(0);
        this.ctimeMs = BigInt(0);
        this.birthtimeMs = BigInt(0);
        this.atimeNs = BigInt(0);
        this.mtimeNs = BigInt(0);
        this.ctimeNs = BigInt(0);
        this.birthtimeNs = BigInt(0);
        this.atime = new Date(0);
        this.mtime = new Date(0);
        this.ctime = new Date(0);
        this.birthtime = new Date(0);
        this.dev = BigInt(0);
        this.ino = BigInt(0);
        this.mode = BigInt(exports.DEFAULT_MODE);
        this.nlink = BigInt(1);
        this.rdev = BigInt(0);
        this.blocks = BigInt(1);
    }
    isBlockDevice() {
        return false;
    }
    isCharacterDevice() {
        return false;
    }
    isDirectory() {
        return (this.mode & BigInt(constants_1.S_IFMT)) === BigInt(constants_1.S_IFDIR);
    }
    isFIFO() {
        return false;
    }
    isFile() {
        return (this.mode & BigInt(constants_1.S_IFMT)) === BigInt(constants_1.S_IFREG);
    }
    isSocket() {
        return false;
    }
    isSymbolicLink() {
        return (this.mode & BigInt(constants_1.S_IFMT)) === BigInt(constants_1.S_IFLNK);
    }
}
exports.BigIntStatsEntry = BigIntStatsEntry;
function makeDefaultStats() {
    return new StatEntry();
}
exports.makeDefaultStats = makeDefaultStats;
function makeEmptyStats() {
    return clearStats(makeDefaultStats());
}
exports.makeEmptyStats = makeEmptyStats;
/**
 * Mutates the provided stats object to zero it out then returns it for convenience
 */
function clearStats(stats) {
    for (const key in stats) {
        if (Object.prototype.hasOwnProperty.call(stats, key)) {
            const element = stats[key];
            if (typeof element === `number`) {
                // @ts-expect-error Typescript can't tell that stats[key] is a number
                stats[key] = 0;
            }
            else if (typeof element === `bigint`) {
                // @ts-expect-error Typescript can't tell that stats[key] is a bigint
                stats[key] = BigInt(0);
            }
            else if (nodeUtils.types.isDate(element)) {
                // @ts-expect-error Typescript can't tell that stats[key] is a bigint
                stats[key] = new Date(0);
            }
        }
    }
    return stats;
}
exports.clearStats = clearStats;
function convertToBigIntStats(stats) {
    const bigintStats = new BigIntStatsEntry();
    for (const key in stats) {
        if (Object.prototype.hasOwnProperty.call(stats, key)) {
            const element = stats[key];
            if (typeof element === `number`) {
                // @ts-expect-error Typescript isn't able to tell this is valid
                bigintStats[key] = BigInt(element);
            }
            else if (nodeUtils.types.isDate(element)) {
                // @ts-expect-error Typescript isn't able to tell this is valid
                bigintStats[key] = new Date(element);
            }
        }
    }
    bigintStats.atimeNs = bigintStats.atimeMs * BigInt(1e6);
    bigintStats.mtimeNs = bigintStats.mtimeMs * BigInt(1e6);
    bigintStats.ctimeNs = bigintStats.ctimeMs * BigInt(1e6);
    bigintStats.birthtimeNs = bigintStats.birthtimeMs * BigInt(1e6);
    return bigintStats;
}
exports.convertToBigIntStats = convertToBigIntStats;
function areStatsEqual(a, b) {
    if (a.atimeMs !== b.atimeMs)
        return false;
    if (a.birthtimeMs !== b.birthtimeMs)
        return false;
    if (a.blksize !== b.blksize)
        return false;
    if (a.blocks !== b.blocks)
        return false;
    if (a.ctimeMs !== b.ctimeMs)
        return false;
    if (a.dev !== b.dev)
        return false;
    if (a.gid !== b.gid)
        return false;
    if (a.ino !== b.ino)
        return false;
    if (a.isBlockDevice() !== b.isBlockDevice())
        return false;
    if (a.isCharacterDevice() !== b.isCharacterDevice())
        return false;
    if (a.isDirectory() !== b.isDirectory())
        return false;
    if (a.isFIFO() !== b.isFIFO())
        return false;
    if (a.isFile() !== b.isFile())
        return false;
    if (a.isSocket() !== b.isSocket())
        return false;
    if (a.isSymbolicLink() !== b.isSymbolicLink())
        return false;
    if (a.mode !== b.mode)
        return false;
    if (a.mtimeMs !== b.mtimeMs)
        return false;
    if (a.nlink !== b.nlink)
        return false;
    if (a.rdev !== b.rdev)
        return false;
    if (a.size !== b.size)
        return false;
    if (a.uid !== b.uid)
        return false;
    const aN = a;
    const bN = b;
    if (aN.atimeNs !== bN.atimeNs)
        return false;
    if (aN.mtimeNs !== bN.mtimeNs)
        return false;
    if (aN.ctimeNs !== bN.ctimeNs)
        return false;
    if (aN.birthtimeNs !== bN.birthtimeNs)
        return false;
    return true;
}
exports.areStatsEqual = areStatsEqual;


/***/ }),

/***/ "../yarnpkg-fslib/sources/xfs.ts":
/*!***************************************!*\
  !*** ../yarnpkg-fslib/sources/xfs.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.xfs = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const os_1 = (0, tslib_1.__importDefault)(__webpack_require__(/*! os */ "os"));
const NodeFS_1 = __webpack_require__(/*! ./NodeFS */ "../yarnpkg-fslib/sources/NodeFS.ts");
const path_1 = __webpack_require__(/*! ./path */ "../yarnpkg-fslib/sources/path.ts");
function getTempName(prefix) {
    const tmpdir = path_1.npath.toPortablePath(os_1.default.tmpdir());
    const hash = Math.ceil(Math.random() * 0x100000000).toString(16).padStart(8, `0`);
    return path_1.ppath.join(tmpdir, `${prefix}${hash}`);
}
const tmpdirs = new Set();
let cleanExitRegistered = false;
function registerCleanExit() {
    if (cleanExitRegistered)
        return;
    cleanExitRegistered = true;
    process.once(`exit`, () => {
        exports.xfs.rmtempSync();
    });
}
exports.xfs = Object.assign(new NodeFS_1.NodeFS(), {
    detachTemp(p) {
        tmpdirs.delete(p);
    },
    mktempSync(cb) {
        registerCleanExit();
        while (true) {
            const p = getTempName(`xfs-`);
            try {
                this.mkdirSync(p);
            }
            catch (error) {
                if (error.code === `EEXIST`) {
                    continue;
                }
                else {
                    throw error;
                }
            }
            const realP = this.realpathSync(p);
            tmpdirs.add(realP);
            if (typeof cb !== `undefined`) {
                try {
                    return cb(realP);
                }
                finally {
                    if (tmpdirs.has(realP)) {
                        tmpdirs.delete(realP);
                        try {
                            this.removeSync(realP);
                        }
                        catch {
                            // Too bad if there's an error
                        }
                    }
                }
            }
            else {
                return realP;
            }
        }
    },
    async mktempPromise(cb) {
        registerCleanExit();
        while (true) {
            const p = getTempName(`xfs-`);
            try {
                await this.mkdirPromise(p);
            }
            catch (error) {
                if (error.code === `EEXIST`) {
                    continue;
                }
                else {
                    throw error;
                }
            }
            const realP = await this.realpathPromise(p);
            tmpdirs.add(realP);
            if (typeof cb !== `undefined`) {
                try {
                    return await cb(realP);
                }
                finally {
                    if (tmpdirs.has(realP)) {
                        tmpdirs.delete(realP);
                        try {
                            await this.removePromise(realP);
                        }
                        catch {
                            // Too bad if there's an error
                        }
                    }
                }
            }
            else {
                return realP;
            }
        }
    },
    async rmtempPromise() {
        await Promise.all(Array.from(tmpdirs.values()).map(async (p) => {
            try {
                await exports.xfs.removePromise(p, { maxRetries: 0 });
                tmpdirs.delete(p);
            }
            catch {
                // Too bad if there's an error
            }
        }));
    },
    rmtempSync() {
        for (const p of tmpdirs) {
            try {
                exports.xfs.removeSync(p);
                tmpdirs.delete(p);
            }
            catch {
                // Too bad if there's an error
            }
        }
    },
});


/***/ }),

/***/ "../yarnpkg-libzip/sources/makeInterface.ts":
/*!**************************************************!*\
  !*** ../yarnpkg-libzip/sources/makeInterface.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeInterface = exports.Errors = void 0;
const number64 = [
    `number`,
    `number`, // high
];
var Errors;
(function (Errors) {
    Errors[Errors["ZIP_ER_OK"] = 0] = "ZIP_ER_OK";
    Errors[Errors["ZIP_ER_MULTIDISK"] = 1] = "ZIP_ER_MULTIDISK";
    Errors[Errors["ZIP_ER_RENAME"] = 2] = "ZIP_ER_RENAME";
    Errors[Errors["ZIP_ER_CLOSE"] = 3] = "ZIP_ER_CLOSE";
    Errors[Errors["ZIP_ER_SEEK"] = 4] = "ZIP_ER_SEEK";
    Errors[Errors["ZIP_ER_READ"] = 5] = "ZIP_ER_READ";
    Errors[Errors["ZIP_ER_WRITE"] = 6] = "ZIP_ER_WRITE";
    Errors[Errors["ZIP_ER_CRC"] = 7] = "ZIP_ER_CRC";
    Errors[Errors["ZIP_ER_ZIPCLOSED"] = 8] = "ZIP_ER_ZIPCLOSED";
    Errors[Errors["ZIP_ER_NOENT"] = 9] = "ZIP_ER_NOENT";
    Errors[Errors["ZIP_ER_EXISTS"] = 10] = "ZIP_ER_EXISTS";
    Errors[Errors["ZIP_ER_OPEN"] = 11] = "ZIP_ER_OPEN";
    Errors[Errors["ZIP_ER_TMPOPEN"] = 12] = "ZIP_ER_TMPOPEN";
    Errors[Errors["ZIP_ER_ZLIB"] = 13] = "ZIP_ER_ZLIB";
    Errors[Errors["ZIP_ER_MEMORY"] = 14] = "ZIP_ER_MEMORY";
    Errors[Errors["ZIP_ER_CHANGED"] = 15] = "ZIP_ER_CHANGED";
    Errors[Errors["ZIP_ER_COMPNOTSUPP"] = 16] = "ZIP_ER_COMPNOTSUPP";
    Errors[Errors["ZIP_ER_EOF"] = 17] = "ZIP_ER_EOF";
    Errors[Errors["ZIP_ER_INVAL"] = 18] = "ZIP_ER_INVAL";
    Errors[Errors["ZIP_ER_NOZIP"] = 19] = "ZIP_ER_NOZIP";
    Errors[Errors["ZIP_ER_INTERNAL"] = 20] = "ZIP_ER_INTERNAL";
    Errors[Errors["ZIP_ER_INCONS"] = 21] = "ZIP_ER_INCONS";
    Errors[Errors["ZIP_ER_REMOVE"] = 22] = "ZIP_ER_REMOVE";
    Errors[Errors["ZIP_ER_DELETED"] = 23] = "ZIP_ER_DELETED";
    Errors[Errors["ZIP_ER_ENCRNOTSUPP"] = 24] = "ZIP_ER_ENCRNOTSUPP";
    Errors[Errors["ZIP_ER_RDONLY"] = 25] = "ZIP_ER_RDONLY";
    Errors[Errors["ZIP_ER_NOPASSWD"] = 26] = "ZIP_ER_NOPASSWD";
    Errors[Errors["ZIP_ER_WRONGPASSWD"] = 27] = "ZIP_ER_WRONGPASSWD";
    Errors[Errors["ZIP_ER_OPNOTSUPP"] = 28] = "ZIP_ER_OPNOTSUPP";
    Errors[Errors["ZIP_ER_INUSE"] = 29] = "ZIP_ER_INUSE";
    Errors[Errors["ZIP_ER_TELL"] = 30] = "ZIP_ER_TELL";
    Errors[Errors["ZIP_ER_COMPRESSED_DATA"] = 31] = "ZIP_ER_COMPRESSED_DATA";
})(Errors = exports.Errors || (exports.Errors = {}));
const makeInterface = (libzip) => ({
    // Those are getters because they can change after memory growth
    get HEAP8() {
        return libzip.HEAP8;
    },
    get HEAPU8() {
        return libzip.HEAPU8;
    },
    errors: Errors,
    SEEK_SET: 0,
    SEEK_CUR: 1,
    SEEK_END: 2,
    ZIP_CHECKCONS: 4,
    ZIP_CREATE: 1,
    ZIP_EXCL: 2,
    ZIP_TRUNCATE: 8,
    ZIP_RDONLY: 16,
    ZIP_FL_OVERWRITE: 8192,
    ZIP_FL_COMPRESSED: 4,
    ZIP_OPSYS_DOS: 0x00,
    ZIP_OPSYS_AMIGA: 0x01,
    ZIP_OPSYS_OPENVMS: 0x02,
    ZIP_OPSYS_UNIX: 0x03,
    ZIP_OPSYS_VM_CMS: 0x04,
    ZIP_OPSYS_ATARI_ST: 0x05,
    ZIP_OPSYS_OS_2: 0x06,
    ZIP_OPSYS_MACINTOSH: 0x07,
    ZIP_OPSYS_Z_SYSTEM: 0x08,
    ZIP_OPSYS_CPM: 0x09,
    ZIP_OPSYS_WINDOWS_NTFS: 0x0a,
    ZIP_OPSYS_MVS: 0x0b,
    ZIP_OPSYS_VSE: 0x0c,
    ZIP_OPSYS_ACORN_RISC: 0x0d,
    ZIP_OPSYS_VFAT: 0x0e,
    ZIP_OPSYS_ALTERNATE_MVS: 0x0f,
    ZIP_OPSYS_BEOS: 0x10,
    ZIP_OPSYS_TANDEM: 0x11,
    ZIP_OPSYS_OS_400: 0x12,
    ZIP_OPSYS_OS_X: 0x13,
    ZIP_CM_DEFAULT: -1,
    ZIP_CM_STORE: 0,
    ZIP_CM_DEFLATE: 8,
    uint08S: libzip._malloc(1),
    uint16S: libzip._malloc(2),
    uint32S: libzip._malloc(4),
    uint64S: libzip._malloc(8),
    malloc: libzip._malloc,
    free: libzip._free,
    getValue: libzip.getValue,
    open: libzip.cwrap(`zip_open`, `number`, [`string`, `number`, `number`]),
    openFromSource: libzip.cwrap(`zip_open_from_source`, `number`, [`number`, `number`, `number`]),
    close: libzip.cwrap(`zip_close`, `number`, [`number`]),
    discard: libzip.cwrap(`zip_discard`, null, [`number`]),
    getError: libzip.cwrap(`zip_get_error`, `number`, [`number`]),
    getName: libzip.cwrap(`zip_get_name`, `string`, [`number`, `number`, `number`]),
    getNumEntries: libzip.cwrap(`zip_get_num_entries`, `number`, [`number`, `number`]),
    delete: libzip.cwrap(`zip_delete`, `number`, [`number`, `number`]),
    stat: libzip.cwrap(`zip_stat`, `number`, [`number`, `string`, `number`, `number`]),
    statIndex: libzip.cwrap(`zip_stat_index`, `number`, [`number`, ...number64, `number`, `number`]),
    fopen: libzip.cwrap(`zip_fopen`, `number`, [`number`, `string`, `number`]),
    fopenIndex: libzip.cwrap(`zip_fopen_index`, `number`, [`number`, ...number64, `number`]),
    fread: libzip.cwrap(`zip_fread`, `number`, [`number`, `number`, `number`, `number`]),
    fclose: libzip.cwrap(`zip_fclose`, `number`, [`number`]),
    dir: {
        add: libzip.cwrap(`zip_dir_add`, `number`, [`number`, `string`]),
    },
    file: {
        add: libzip.cwrap(`zip_file_add`, `number`, [`number`, `string`, `number`, `number`]),
        getError: libzip.cwrap(`zip_file_get_error`, `number`, [`number`]),
        getExternalAttributes: libzip.cwrap(`zip_file_get_external_attributes`, `number`, [`number`, ...number64, `number`, `number`, `number`]),
        setExternalAttributes: libzip.cwrap(`zip_file_set_external_attributes`, `number`, [`number`, ...number64, `number`, `number`, `number`]),
        setMtime: libzip.cwrap(`zip_file_set_mtime`, `number`, [`number`, ...number64, `number`, `number`]),
        setCompression: libzip.cwrap(`zip_set_file_compression`, `number`, [`number`, ...number64, `number`, `number`]),
    },
    ext: {
        countSymlinks: libzip.cwrap(`zip_ext_count_symlinks`, `number`, [`number`]),
    },
    error: {
        initWithCode: libzip.cwrap(`zip_error_init_with_code`, null, [`number`, `number`]),
        strerror: libzip.cwrap(`zip_error_strerror`, `string`, [`number`]),
    },
    name: {
        locate: libzip.cwrap(`zip_name_locate`, `number`, [`number`, `string`, `number`]),
    },
    source: {
        fromUnattachedBuffer: libzip.cwrap(`zip_source_buffer_create`, `number`, [`number`, `number`, `number`, `number`]),
        fromBuffer: libzip.cwrap(`zip_source_buffer`, `number`, [`number`, `number`, ...number64, `number`]),
        free: libzip.cwrap(`zip_source_free`, null, [`number`]),
        keep: libzip.cwrap(`zip_source_keep`, null, [`number`]),
        open: libzip.cwrap(`zip_source_open`, `number`, [`number`]),
        close: libzip.cwrap(`zip_source_close`, `number`, [`number`]),
        seek: libzip.cwrap(`zip_source_seek`, `number`, [`number`, ...number64, `number`]),
        tell: libzip.cwrap(`zip_source_tell`, `number`, [`number`]),
        read: libzip.cwrap(`zip_source_read`, `number`, [`number`, `number`, `number`]),
        error: libzip.cwrap(`zip_source_error`, `number`, [`number`]),
        setMtime: libzip.cwrap(`zip_source_set_mtime`, `number`, [`number`, `number`]),
    },
    struct: {
        stat: libzip.cwrap(`zipstruct_stat`, `number`, []),
        statS: libzip.cwrap(`zipstruct_statS`, `number`, []),
        statName: libzip.cwrap(`zipstruct_stat_name`, `string`, [`number`]),
        statIndex: libzip.cwrap(`zipstruct_stat_index`, `number`, [`number`]),
        statSize: libzip.cwrap(`zipstruct_stat_size`, `number`, [`number`]),
        statCompSize: libzip.cwrap(`zipstruct_stat_comp_size`, `number`, [`number`]),
        statCompMethod: libzip.cwrap(`zipstruct_stat_comp_method`, `number`, [`number`]),
        statMtime: libzip.cwrap(`zipstruct_stat_mtime`, `number`, [`number`]),
        statCrc: libzip.cwrap(`zipstruct_stat_crc`, `number`, [`number`]),
        error: libzip.cwrap(`zipstruct_error`, `number`, []),
        errorS: libzip.cwrap(`zipstruct_errorS`, `number`, []),
        errorCodeZip: libzip.cwrap(`zipstruct_error_code_zip`, `number`, [`number`]),
    },
});
exports.makeInterface = makeInterface;


/***/ }),

/***/ "../yarnpkg-libzip/sources/sync.ts":
/*!*****************************************!*\
  !*** ../yarnpkg-libzip/sources/sync.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getLibzipPromise = exports.getLibzipSync = void 0;
const makeInterface_1 = __webpack_require__(/*! ./makeInterface */ "../yarnpkg-libzip/sources/makeInterface.ts");
let mod = null;
function getLibzipSync() {
    if (mod === null)
        mod = (0, makeInterface_1.makeInterface)(__webpack_require__(/*! ./libzipSync */ "../yarnpkg-libzip/sources/libzipSync.js"));
    return mod;
}
exports.getLibzipSync = getLibzipSync;
async function getLibzipPromise() {
    return getLibzipSync();
}
exports.getLibzipPromise = getLibzipPromise;


/***/ }),

/***/ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js":
/*!****************************************************************************************************!*\
  !*** ../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "__extends": () => (/* binding */ __extends),
/* harmony export */   "__assign": () => (/* binding */ __assign),
/* harmony export */   "__rest": () => (/* binding */ __rest),
/* harmony export */   "__decorate": () => (/* binding */ __decorate),
/* harmony export */   "__param": () => (/* binding */ __param),
/* harmony export */   "__metadata": () => (/* binding */ __metadata),
/* harmony export */   "__awaiter": () => (/* binding */ __awaiter),
/* harmony export */   "__generator": () => (/* binding */ __generator),
/* harmony export */   "__createBinding": () => (/* binding */ __createBinding),
/* harmony export */   "__exportStar": () => (/* binding */ __exportStar),
/* harmony export */   "__values": () => (/* binding */ __values),
/* harmony export */   "__read": () => (/* binding */ __read),
/* harmony export */   "__spread": () => (/* binding */ __spread),
/* harmony export */   "__spreadArrays": () => (/* binding */ __spreadArrays),
/* harmony export */   "__await": () => (/* binding */ __await),
/* harmony export */   "__asyncGenerator": () => (/* binding */ __asyncGenerator),
/* harmony export */   "__asyncDelegator": () => (/* binding */ __asyncDelegator),
/* harmony export */   "__asyncValues": () => (/* binding */ __asyncValues),
/* harmony export */   "__makeTemplateObject": () => (/* binding */ __makeTemplateObject),
/* harmony export */   "__importStar": () => (/* binding */ __importStar),
/* harmony export */   "__importDefault": () => (/* binding */ __importDefault),
/* harmony export */   "__classPrivateFieldGet": () => (/* binding */ __classPrivateFieldGet),
/* harmony export */   "__classPrivateFieldSet": () => (/* binding */ __classPrivateFieldSet)
/* harmony export */ });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __createBinding(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}

function __exportStar(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
}


/***/ }),

/***/ "../yarnpkg-libzip/sources/libzipSync.js":
/*!***********************************************!*\
  !*** ../yarnpkg-libzip/sources/libzipSync.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var frozenFs = Object.assign({}, __webpack_require__(/*! fs */ "fs"));
var Module = typeof Module !== "undefined" ? Module : {};
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = function(status, toThrow) {
  throw toThrow;
};
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = true;
var scriptDirectory = "";
function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}
var read_, readBinary;
var nodeFS;
var nodePath;
if (ENVIRONMENT_IS_NODE) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = __webpack_require__(/*! path */ "path").dirname(scriptDirectory) + "/";
  } else {
    scriptDirectory = __dirname + "/";
  }
  read_ = function shell_read(filename, binary) {
    var ret = tryParseAsDataURI(filename);
    if (ret) {
      return binary ? ret : ret.toString();
    }
    if (!nodeFS) nodeFS = frozenFs;
    if (!nodePath) nodePath = __webpack_require__(/*! path */ "path");
    filename = nodePath["normalize"](filename);
    return nodeFS["readFileSync"](filename, binary ? null : "utf8");
  };
  readBinary = function readBinary(filename) {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };
  if (process["argv"].length > 1) {
    thisProgram = process["argv"][1].replace(/\\/g, "/");
  }
  arguments_ = process["argv"].slice(2);
  if (true) {
    module["exports"] = Module;
  }
  quit_ = function(status) {
    process["exit"](status);
  };
  Module["inspect"] = function() {
    return "[Emscripten Module object]";
  };
} else {
}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
if (Module["quit"]) quit_ = Module["quit"];
var STACK_ALIGN = 16;
function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN;
  return Math.ceil(size / factor) * factor;
}
var tempRet0 = 0;
var setTempRet0 = function(value) {
  tempRet0 = value;
};
var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
var noExitRuntime = Module["noExitRuntime"] || true;
if (typeof WebAssembly !== "object") {
  abort("no native wasm support detected");
}
function getValue(ptr, type, noSafe) {
  type = type || "i8";
  if (type.charAt(type.length - 1) === "*") type = "i32";
  switch (type) {
    case "i1":
      return HEAP8[ptr >> 0];
    case "i8":
      return HEAP8[ptr >> 0];
    case "i16":
      return HEAP16[ptr >> 1];
    case "i32":
      return HEAP32[ptr >> 2];
    case "i64":
      return HEAP32[ptr >> 2];
    case "float":
      return HEAPF32[ptr >> 2];
    case "double":
      return HEAPF64[ptr >> 3];
    default:
      abort("invalid type for getValue: " + type);
  }
  return null;
}
var wasmMemory;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed: " + text);
  }
}
function getCFunc(ident) {
  var func = Module["_" + ident];
  assert(
    func,
    "Cannot call unknown function " + ident + ", make sure it is exported"
  );
  return func;
}
function ccall(ident, returnType, argTypes, args, opts) {
  var toC = {
    string: function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    array: function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };
  function convertReturnValue(ret) {
    if (returnType === "string") return UTF8ToString(ret);
    if (returnType === "boolean") return Boolean(ret);
    return ret;
  }
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}
function cwrap(ident, returnType, argTypes, opts) {
  argTypes = argTypes || [];
  var numericArgs = argTypes.every(function(type) {
    return type === "number";
  });
  var numericRet = returnType !== "string";
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  }
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  };
}
var UTF8Decoder =
  typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  } else {
    var str = "";
    while (idx < endPtr) {
      var u0 = heap[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      var u1 = heap[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode(((u0 & 31) << 6) | u1);
        continue;
      }
      var u2 = heap[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
      }
    }
  }
  return str;
}
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
    }
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | (u >> 6);
      heap[outIdx++] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | (u >> 12);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      heap[outIdx++] = 240 | (u >> 18);
      heap[outIdx++] = 128 | ((u >> 12) & 63);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    }
  }
  heap[outIdx] = 0;
  return outIdx - startIdx;
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343)
      u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023);
    if (u <= 127) ++len;
    else if (u <= 2047) len += 2;
    else if (u <= 65535) len += 3;
    else len += 4;
  }
  return len;
}
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}
function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}
function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module["HEAP8"] = HEAP8 = new Int8Array(buf);
  Module["HEAP16"] = HEAP16 = new Int16Array(buf);
  Module["HEAP32"] = HEAP32 = new Int32Array(buf);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}
var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function")
      Module["preRun"] = [Module["preRun"]];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
  runtimeInitialized = true;
  if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
  TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}
function postRun() {
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function")
      Module["postRun"] = [Module["postRun"]];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
  return id;
}
function addRunDependency(id) {
  runDependencies++;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
}
function removeRunDependency(id) {
  runDependencies--;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
function abort(what) {
  if (Module["onAbort"]) {
    Module["onAbort"](what);
  }
  what += "";
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
  var e = new WebAssembly.RuntimeError(what);
  throw e;
}
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
  return filename.startsWith(dataURIPrefix);
}
var wasmBinaryFile =
  "data:application/octet-stream;base64,AGFzbQEAAAABlAInYAF/AX9gA39/fwF/YAF/AGACf38Bf2ACf38AYAV/f39/fwF/YAR/f39/AX9gA39/fwBgBH9+f38Bf2AAAX9gBX9/f35/AX5gA39+fwF/YAF/AX5gAn9+AX9gBH9/fn8BfmADf35/AX5gA39/fgF/YAR/f35/AX9gBn9/f39/fwF/YAR/f39/AGADf39+AX5gAn5/AX9gA398fwBgBH9/f38BfmADf39/AX5gBn98f39/fwF/YAV/f35/fwF/YAV/fn9/fwF/YAV/f39/fwBgAn9+AGACf38BfmACf3wAYAh/fn5/f39+fwF/YAV/f39+fwBgAABgBX5+f35/AX5gAnx/AXxgAn9+AX5gBX9/f39/AX4CeRQBYQFhAAIBYQFiAAABYQFjAAMBYQFkAAYBYQFlAAEBYQFmAAABYQFnAAYBYQFoAAABYQFpAAMBYQFqAAMBYQFrAAMBYQFsAAMBYQFtAAABYQFuAAUBYQFvAAEBYQFwAAMBYQFxAAEBYQFyAAABYQFzAAEBYQF0AAADggKAAgcCAgQAAQECAgANBAQOBwICAhwLEw0AAA0dFAwMAAcCDBAeAgMCAwIAAgEABwgUBBUIBgADAAwABAgIAgEGBgABAB8XAQEDAhMCAwUFEQICIA8GAgMYAQgCAQAABwUBGAAaAxIBAAcEAyERCCIHAQsVAQMABQMDAwAFBAACIwYAAQEAGw0bFw0BBAALCwMDDAwAAwAHJAMBBAgaAQECBQMBAwMABwcHAgICAiURCwgICwEmCQkAAAAKAAIABQAGBgUFBQEDBgYGBRISBgQBAQEAAAIJBgABAA4AAQEPCQABBBkJCQkAAAADCgoBAQIQAAAAAgEDAwkEAQoABQ4AAAkEBQFwAR8fBQcBAYACgIACBgkBfwFB0KDBAgsHvgI8AXUCAAF2AIABAXcAkwIBeADxAQF5AM8BAXoAzQEBQQDLAQFCAMoBAUMAyQEBRADIAQFFAMcBAUYAkgIBRwCRAgFIAI4CAUkA6QEBSgDiAQFLAOEBAUwAPQFNAOABAU4A+gEBTwD5AQFQAPIBAVEA+wEBUgDfAQFTAN4BAVQA3QEBVQDcAQFWAOMBAVcA2wEBWADaAQFZANkBAVoA2AEBXwDXAQEkAOoBAmFhAJwBAmJhANYBAmNhANUBAmRhANQBAmVhADECZmEA6wECZ2EAGwJoYQDOAQJpYQBJAmphANMBAmthANIBAmxhAGgCbWEA0QECbmEA6AECb2EA0AECcGEA5AECcWEAigICcmEA+AECc2EA9wECdGEA9gECdWEA5wECdmEA5gECd2EA5QECeGEAGAJ5YQAVAnphAQAJQQEAQQELHswBkAKNAo8CjAKLArYBiQKIAocChgKFAoQCgwKCAoECgAL/Af4B/QH8AVr1AfQB8wHwAe8B7gHtAewBCq2RCYACQAEBfyMAQRBrIgMgADYCDCADIAE2AgggAyACNgIEIAMoAgwEQCADKAIMIAMoAgg2AgAgAygCDCADKAIENgIECwvMDAEHfwJAIABFDQAgAEEIayIDIABBBGsoAgAiAUF4cSIAaiEFAkAgAUEBcQ0AIAFBA3FFDQEgAyADKAIAIgFrIgNByJsBKAIASQ0BIAAgAWohACADQcybASgCAEcEQCABQf8BTQRAIAMoAggiAiABQQN2IgRBA3RB4JsBakYaIAIgAygCDCIBRgRAQbibAUG4mwEoAgBBfiAEd3E2AgAMAwsgAiABNgIMIAEgAjYCCAwCCyADKAIYIQYCQCADIAMoAgwiAUcEQCADKAIIIgIgATYCDCABIAI2AggMAQsCQCADQRRqIgIoAgAiBA0AIANBEGoiAigCACIEDQBBACEBDAELA0AgAiEHIAQiAUEUaiICKAIAIgQNACABQRBqIQIgASgCECIEDQALIAdBADYCAAsgBkUNAQJAIAMgAygCHCICQQJ0QeidAWoiBCgCAEYEQCAEIAE2AgAgAQ0BQbybAUG8mwEoAgBBfiACd3E2AgAMAwsgBkEQQRQgBigCECADRhtqIAE2AgAgAUUNAgsgASAGNgIYIAMoAhAiAgRAIAEgAjYCECACIAE2AhgLIAMoAhQiAkUNASABIAI2AhQgAiABNgIYDAELIAUoAgQiAUEDcUEDRw0AQcCbASAANgIAIAUgAUF+cTYCBCADIABBAXI2AgQgACADaiAANgIADwsgAyAFTw0AIAUoAgQiAUEBcUUNAAJAIAFBAnFFBEAgBUHQmwEoAgBGBEBB0JsBIAM2AgBBxJsBQcSbASgCACAAaiIANgIAIAMgAEEBcjYCBCADQcybASgCAEcNA0HAmwFBADYCAEHMmwFBADYCAA8LIAVBzJsBKAIARgRAQcybASADNgIAQcCbAUHAmwEoAgAgAGoiADYCACADIABBAXI2AgQgACADaiAANgIADwsgAUF4cSAAaiEAAkAgAUH/AU0EQCAFKAIIIgIgAUEDdiIEQQN0QeCbAWpGGiACIAUoAgwiAUYEQEG4mwFBuJsBKAIAQX4gBHdxNgIADAILIAIgATYCDCABIAI2AggMAQsgBSgCGCEGAkAgBSAFKAIMIgFHBEAgBSgCCCICQcibASgCAEkaIAIgATYCDCABIAI2AggMAQsCQCAFQRRqIgIoAgAiBA0AIAVBEGoiAigCACIEDQBBACEBDAELA0AgAiEHIAQiAUEUaiICKAIAIgQNACABQRBqIQIgASgCECIEDQALIAdBADYCAAsgBkUNAAJAIAUgBSgCHCICQQJ0QeidAWoiBCgCAEYEQCAEIAE2AgAgAQ0BQbybAUG8mwEoAgBBfiACd3E2AgAMAgsgBkEQQRQgBigCECAFRhtqIAE2AgAgAUUNAQsgASAGNgIYIAUoAhAiAgRAIAEgAjYCECACIAE2AhgLIAUoAhQiAkUNACABIAI2AhQgAiABNgIYCyADIABBAXI2AgQgACADaiAANgIAIANBzJsBKAIARw0BQcCbASAANgIADwsgBSABQX5xNgIEIAMgAEEBcjYCBCAAIANqIAA2AgALIABB/wFNBEAgAEEDdiIBQQN0QeCbAWohAAJ/QbibASgCACICQQEgAXQiAXFFBEBBuJsBIAEgAnI2AgAgAAwBCyAAKAIICyECIAAgAzYCCCACIAM2AgwgAyAANgIMIAMgAjYCCA8LQR8hAiADQgA3AhAgAEH///8HTQRAIABBCHYiASABQYD+P2pBEHZBCHEiAXQiAiACQYDgH2pBEHZBBHEiAnQiBCAEQYCAD2pBEHZBAnEiBHRBD3YgASACciAEcmsiAUEBdCAAIAFBFWp2QQFxckEcaiECCyADIAI2AhwgAkECdEHonQFqIQECQAJAAkBBvJsBKAIAIgRBASACdCIHcUUEQEG8mwEgBCAHcjYCACABIAM2AgAgAyABNgIYDAELIABBAEEZIAJBAXZrIAJBH0YbdCECIAEoAgAhAQNAIAEiBCgCBEF4cSAARg0CIAJBHXYhASACQQF0IQIgBCABQQRxaiIHQRBqKAIAIgENAAsgByADNgIQIAMgBDYCGAsgAyADNgIMIAMgAzYCCAwBCyAEKAIIIgAgAzYCDCAEIAM2AgggA0EANgIYIAMgBDYCDCADIAA2AggLQdibAUHYmwEoAgBBAWsiAEF/IAAbNgIACwtCAQF/IwBBEGsiASQAIAEgADYCDCABKAIMBEAgASgCDC0AAUEBcQRAIAEoAgwoAgQQFQsgASgCDBAVCyABQRBqJAALQwEBfyMAQRBrIgIkACACIAA2AgwgAiABNgIIIAIoAgwCfyMAQRBrIgAgAigCCDYCDCAAKAIMQQxqCxBDIAJBEGokAAuiLgEMfyMAQRBrIgwkAAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAAQfQBTQRAQbibASgCACIFQRAgAEELakF4cSAAQQtJGyIIQQN2IgJ2IgFBA3EEQCABQX9zQQFxIAJqIgNBA3QiAUHomwFqKAIAIgRBCGohAAJAIAQoAggiAiABQeCbAWoiAUYEQEG4mwEgBUF+IAN3cTYCAAwBCyACIAE2AgwgASACNgIICyAEIANBA3QiAUEDcjYCBCABIARqIgEgASgCBEEBcjYCBAwNCyAIQcCbASgCACIKTQ0BIAEEQAJAQQIgAnQiAEEAIABrciABIAJ0cSIAQQAgAGtxQQFrIgAgAEEMdkEQcSICdiIBQQV2QQhxIgAgAnIgASAAdiIBQQJ2QQRxIgByIAEgAHYiAUEBdkECcSIAciABIAB2IgFBAXZBAXEiAHIgASAAdmoiA0EDdCIAQeibAWooAgAiBCgCCCIBIABB4JsBaiIARgRAQbibASAFQX4gA3dxIgU2AgAMAQsgASAANgIMIAAgATYCCAsgBEEIaiEAIAQgCEEDcjYCBCAEIAhqIgIgA0EDdCIBIAhrIgNBAXI2AgQgASAEaiADNgIAIAoEQCAKQQN2IgFBA3RB4JsBaiEHQcybASgCACEEAn8gBUEBIAF0IgFxRQRAQbibASABIAVyNgIAIAcMAQsgBygCCAshASAHIAQ2AgggASAENgIMIAQgBzYCDCAEIAE2AggLQcybASACNgIAQcCbASADNgIADA0LQbybASgCACIGRQ0BIAZBACAGa3FBAWsiACAAQQx2QRBxIgJ2IgFBBXZBCHEiACACciABIAB2IgFBAnZBBHEiAHIgASAAdiIBQQF2QQJxIgByIAEgAHYiAUEBdkEBcSIAciABIAB2akECdEHonQFqKAIAIgEoAgRBeHEgCGshAyABIQIDQAJAIAIoAhAiAEUEQCACKAIUIgBFDQELIAAoAgRBeHEgCGsiAiADIAIgA0kiAhshAyAAIAEgAhshASAAIQIMAQsLIAEgCGoiCSABTQ0CIAEoAhghCyABIAEoAgwiBEcEQCABKAIIIgBByJsBKAIASRogACAENgIMIAQgADYCCAwMCyABQRRqIgIoAgAiAEUEQCABKAIQIgBFDQQgAUEQaiECCwNAIAIhByAAIgRBFGoiAigCACIADQAgBEEQaiECIAQoAhAiAA0ACyAHQQA2AgAMCwtBfyEIIABBv39LDQAgAEELaiIAQXhxIQhBvJsBKAIAIglFDQBBACAIayEDAkACQAJAAn9BACAIQYACSQ0AGkEfIAhB////B0sNABogAEEIdiIAIABBgP4/akEQdkEIcSICdCIAIABBgOAfakEQdkEEcSIBdCIAIABBgIAPakEQdkECcSIAdEEPdiABIAJyIAByayIAQQF0IAggAEEVanZBAXFyQRxqCyIFQQJ0QeidAWooAgAiAkUEQEEAIQAMAQtBACEAIAhBAEEZIAVBAXZrIAVBH0YbdCEBA0ACQCACKAIEQXhxIAhrIgcgA08NACACIQQgByIDDQBBACEDIAIhAAwDCyAAIAIoAhQiByAHIAIgAUEddkEEcWooAhAiAkYbIAAgBxshACABQQF0IQEgAg0ACwsgACAEckUEQEECIAV0IgBBACAAa3IgCXEiAEUNAyAAQQAgAGtxQQFrIgAgAEEMdkEQcSICdiIBQQV2QQhxIgAgAnIgASAAdiIBQQJ2QQRxIgByIAEgAHYiAUEBdkECcSIAciABIAB2IgFBAXZBAXEiAHIgASAAdmpBAnRB6J0BaigCACEACyAARQ0BCwNAIAAoAgRBeHEgCGsiASADSSECIAEgAyACGyEDIAAgBCACGyEEIAAoAhAiAQR/IAEFIAAoAhQLIgANAAsLIARFDQAgA0HAmwEoAgAgCGtPDQAgBCAIaiIGIARNDQEgBCgCGCEFIAQgBCgCDCIBRwRAIAQoAggiAEHImwEoAgBJGiAAIAE2AgwgASAANgIIDAoLIARBFGoiAigCACIARQRAIAQoAhAiAEUNBCAEQRBqIQILA0AgAiEHIAAiAUEUaiICKAIAIgANACABQRBqIQIgASgCECIADQALIAdBADYCAAwJCyAIQcCbASgCACICTQRAQcybASgCACEDAkAgAiAIayIBQRBPBEBBwJsBIAE2AgBBzJsBIAMgCGoiADYCACAAIAFBAXI2AgQgAiADaiABNgIAIAMgCEEDcjYCBAwBC0HMmwFBADYCAEHAmwFBADYCACADIAJBA3I2AgQgAiADaiIAIAAoAgRBAXI2AgQLIANBCGohAAwLCyAIQcSbASgCACIGSQRAQcSbASAGIAhrIgE2AgBB0JsBQdCbASgCACICIAhqIgA2AgAgACABQQFyNgIEIAIgCEEDcjYCBCACQQhqIQAMCwtBACEAIAhBL2oiCQJ/QZCfASgCAARAQZifASgCAAwBC0GcnwFCfzcCAEGUnwFCgKCAgICABDcCAEGQnwEgDEEMakFwcUHYqtWqBXM2AgBBpJ8BQQA2AgBB9J4BQQA2AgBBgCALIgFqIgVBACABayIHcSICIAhNDQpB8J4BKAIAIgQEQEHongEoAgAiAyACaiIBIANNDQsgASAESw0LC0H0ngEtAABBBHENBQJAAkBB0JsBKAIAIgMEQEH4ngEhAANAIAMgACgCACIBTwRAIAEgACgCBGogA0sNAwsgACgCCCIADQALC0EAEDwiAUF/Rg0GIAIhBUGUnwEoAgAiA0EBayIAIAFxBEAgAiABayAAIAFqQQAgA2txaiEFCyAFIAhNDQYgBUH+////B0sNBkHwngEoAgAiBARAQeieASgCACIDIAVqIgAgA00NByAAIARLDQcLIAUQPCIAIAFHDQEMCAsgBSAGayAHcSIFQf7///8HSw0FIAUQPCIBIAAoAgAgACgCBGpGDQQgASEACwJAIABBf0YNACAIQTBqIAVNDQBBmJ8BKAIAIgEgCSAFa2pBACABa3EiAUH+////B0sEQCAAIQEMCAsgARA8QX9HBEAgASAFaiEFIAAhAQwIC0EAIAVrEDwaDAULIAAiAUF/Rw0GDAQLAAtBACEEDAcLQQAhAQwFCyABQX9HDQILQfSeAUH0ngEoAgBBBHI2AgALIAJB/v///wdLDQEgAhA8IQFBABA8IQAgAUF/Rg0BIABBf0YNASAAIAFNDQEgACABayIFIAhBKGpNDQELQeieAUHongEoAgAgBWoiADYCAEHsngEoAgAgAEkEQEHsngEgADYCAAsCQAJAAkBB0JsBKAIAIgcEQEH4ngEhAANAIAEgACgCACIDIAAoAgQiAmpGDQIgACgCCCIADQALDAILQcibASgCACIAQQAgACABTRtFBEBByJsBIAE2AgALQQAhAEH8ngEgBTYCAEH4ngEgATYCAEHYmwFBfzYCAEHcmwFBkJ8BKAIANgIAQYSfAUEANgIAA0AgAEEDdCIDQeibAWogA0HgmwFqIgI2AgAgA0HsmwFqIAI2AgAgAEEBaiIAQSBHDQALQcSbASAFQShrIgNBeCABa0EHcUEAIAFBCGpBB3EbIgBrIgI2AgBB0JsBIAAgAWoiADYCACAAIAJBAXI2AgQgASADakEoNgIEQdSbAUGgnwEoAgA2AgAMAgsgAC0ADEEIcQ0AIAMgB0sNACABIAdNDQAgACACIAVqNgIEQdCbASAHQXggB2tBB3FBACAHQQhqQQdxGyIAaiICNgIAQcSbAUHEmwEoAgAgBWoiASAAayIANgIAIAIgAEEBcjYCBCABIAdqQSg2AgRB1JsBQaCfASgCADYCAAwBC0HImwEoAgAgAUsEQEHImwEgATYCAAsgASAFaiECQfieASEAAkACQAJAAkACQAJAA0AgAiAAKAIARwRAIAAoAggiAA0BDAILCyAALQAMQQhxRQ0BC0H4ngEhAANAIAcgACgCACICTwRAIAIgACgCBGoiBCAHSw0DCyAAKAIIIQAMAAsACyAAIAE2AgAgACAAKAIEIAVqNgIEIAFBeCABa0EHcUEAIAFBCGpBB3EbaiIJIAhBA3I2AgQgAkF4IAJrQQdxQQAgAkEIakEHcRtqIgUgCCAJaiIGayECIAUgB0YEQEHQmwEgBjYCAEHEmwFBxJsBKAIAIAJqIgA2AgAgBiAAQQFyNgIEDAMLIAVBzJsBKAIARgRAQcybASAGNgIAQcCbAUHAmwEoAgAgAmoiADYCACAGIABBAXI2AgQgACAGaiAANgIADAMLIAUoAgQiAEEDcUEBRgRAIABBeHEhBwJAIABB/wFNBEAgBSgCCCIDIABBA3YiAEEDdEHgmwFqRhogAyAFKAIMIgFGBEBBuJsBQbibASgCAEF+IAB3cTYCAAwCCyADIAE2AgwgASADNgIIDAELIAUoAhghCAJAIAUgBSgCDCIBRwRAIAUoAggiACABNgIMIAEgADYCCAwBCwJAIAVBFGoiACgCACIDDQAgBUEQaiIAKAIAIgMNAEEAIQEMAQsDQCAAIQQgAyIBQRRqIgAoAgAiAw0AIAFBEGohACABKAIQIgMNAAsgBEEANgIACyAIRQ0AAkAgBSAFKAIcIgNBAnRB6J0BaiIAKAIARgRAIAAgATYCACABDQFBvJsBQbybASgCAEF+IAN3cTYCAAwCCyAIQRBBFCAIKAIQIAVGG2ogATYCACABRQ0BCyABIAg2AhggBSgCECIABEAgASAANgIQIAAgATYCGAsgBSgCFCIARQ0AIAEgADYCFCAAIAE2AhgLIAUgB2ohBSACIAdqIQILIAUgBSgCBEF+cTYCBCAGIAJBAXI2AgQgAiAGaiACNgIAIAJB/wFNBEAgAkEDdiIAQQN0QeCbAWohAgJ/QbibASgCACIBQQEgAHQiAHFFBEBBuJsBIAAgAXI2AgAgAgwBCyACKAIICyEAIAIgBjYCCCAAIAY2AgwgBiACNgIMIAYgADYCCAwDC0EfIQAgAkH///8HTQRAIAJBCHYiACAAQYD+P2pBEHZBCHEiA3QiACAAQYDgH2pBEHZBBHEiAXQiACAAQYCAD2pBEHZBAnEiAHRBD3YgASADciAAcmsiAEEBdCACIABBFWp2QQFxckEcaiEACyAGIAA2AhwgBkIANwIQIABBAnRB6J0BaiEEAkBBvJsBKAIAIgNBASAAdCIBcUUEQEG8mwEgASADcjYCACAEIAY2AgAgBiAENgIYDAELIAJBAEEZIABBAXZrIABBH0YbdCEAIAQoAgAhAQNAIAEiAygCBEF4cSACRg0DIABBHXYhASAAQQF0IQAgAyABQQRxaiIEKAIQIgENAAsgBCAGNgIQIAYgAzYCGAsgBiAGNgIMIAYgBjYCCAwCC0HEmwEgBUEoayIDQXggAWtBB3FBACABQQhqQQdxGyIAayICNgIAQdCbASAAIAFqIgA2AgAgACACQQFyNgIEIAEgA2pBKDYCBEHUmwFBoJ8BKAIANgIAIAcgBEEnIARrQQdxQQAgBEEna0EHcRtqQS9rIgAgACAHQRBqSRsiAkEbNgIEIAJBgJ8BKQIANwIQIAJB+J4BKQIANwIIQYCfASACQQhqNgIAQfyeASAFNgIAQfieASABNgIAQYSfAUEANgIAIAJBGGohAANAIABBBzYCBCAAQQhqIQEgAEEEaiEAIAEgBEkNAAsgAiAHRg0DIAIgAigCBEF+cTYCBCAHIAIgB2siBEEBcjYCBCACIAQ2AgAgBEH/AU0EQCAEQQN2IgBBA3RB4JsBaiECAn9BuJsBKAIAIgFBASAAdCIAcUUEQEG4mwEgACABcjYCACACDAELIAIoAggLIQAgAiAHNgIIIAAgBzYCDCAHIAI2AgwgByAANgIIDAQLQR8hACAHQgA3AhAgBEH///8HTQRAIARBCHYiACAAQYD+P2pBEHZBCHEiAnQiACAAQYDgH2pBEHZBBHEiAXQiACAAQYCAD2pBEHZBAnEiAHRBD3YgASACciAAcmsiAEEBdCAEIABBFWp2QQFxckEcaiEACyAHIAA2AhwgAEECdEHonQFqIQMCQEG8mwEoAgAiAkEBIAB0IgFxRQRAQbybASABIAJyNgIAIAMgBzYCACAHIAM2AhgMAQsgBEEAQRkgAEEBdmsgAEEfRht0IQAgAygCACEBA0AgASICKAIEQXhxIARGDQQgAEEddiEBIABBAXQhACACIAFBBHFqIgMoAhAiAQ0ACyADIAc2AhAgByACNgIYCyAHIAc2AgwgByAHNgIIDAMLIAMoAggiACAGNgIMIAMgBjYCCCAGQQA2AhggBiADNgIMIAYgADYCCAsgCUEIaiEADAULIAIoAggiACAHNgIMIAIgBzYCCCAHQQA2AhggByACNgIMIAcgADYCCAtBxJsBKAIAIgAgCE0NAEHEmwEgACAIayIBNgIAQdCbAUHQmwEoAgAiAiAIaiIANgIAIAAgAUEBcjYCBCACIAhBA3I2AgQgAkEIaiEADAMLQbSbAUEwNgIAQQAhAAwCCwJAIAVFDQACQCAEKAIcIgJBAnRB6J0BaiIAKAIAIARGBEAgACABNgIAIAENAUG8mwEgCUF+IAJ3cSIJNgIADAILIAVBEEEUIAUoAhAgBEYbaiABNgIAIAFFDQELIAEgBTYCGCAEKAIQIgAEQCABIAA2AhAgACABNgIYCyAEKAIUIgBFDQAgASAANgIUIAAgATYCGAsCQCADQQ9NBEAgBCADIAhqIgBBA3I2AgQgACAEaiIAIAAoAgRBAXI2AgQMAQsgBCAIQQNyNgIEIAYgA0EBcjYCBCADIAZqIAM2AgAgA0H/AU0EQCADQQN2IgBBA3RB4JsBaiECAn9BuJsBKAIAIgFBASAAdCIAcUUEQEG4mwEgACABcjYCACACDAELIAIoAggLIQAgAiAGNgIIIAAgBjYCDCAGIAI2AgwgBiAANgIIDAELQR8hACADQf///wdNBEAgA0EIdiIAIABBgP4/akEQdkEIcSICdCIAIABBgOAfakEQdkEEcSIBdCIAIABBgIAPakEQdkECcSIAdEEPdiABIAJyIAByayIAQQF0IAMgAEEVanZBAXFyQRxqIQALIAYgADYCHCAGQgA3AhAgAEECdEHonQFqIQICQAJAIAlBASAAdCIBcUUEQEG8mwEgASAJcjYCACACIAY2AgAgBiACNgIYDAELIANBAEEZIABBAXZrIABBH0YbdCEAIAIoAgAhCANAIAgiASgCBEF4cSADRg0CIABBHXYhAiAAQQF0IQAgASACQQRxaiICKAIQIggNAAsgAiAGNgIQIAYgATYCGAsgBiAGNgIMIAYgBjYCCAwBCyABKAIIIgAgBjYCDCABIAY2AgggBkEANgIYIAYgATYCDCAGIAA2AggLIARBCGohAAwBCwJAIAtFDQACQCABKAIcIgJBAnRB6J0BaiIAKAIAIAFGBEAgACAENgIAIAQNAUG8mwEgBkF+IAJ3cTYCAAwCCyALQRBBFCALKAIQIAFGG2ogBDYCACAERQ0BCyAEIAs2AhggASgCECIABEAgBCAANgIQIAAgBDYCGAsgASgCFCIARQ0AIAQgADYCFCAAIAQ2AhgLAkAgA0EPTQRAIAEgAyAIaiIAQQNyNgIEIAAgAWoiACAAKAIEQQFyNgIEDAELIAEgCEEDcjYCBCAJIANBAXI2AgQgAyAJaiADNgIAIAoEQCAKQQN2IgBBA3RB4JsBaiEEQcybASgCACECAn9BASAAdCIAIAVxRQRAQbibASAAIAVyNgIAIAQMAQsgBCgCCAshACAEIAI2AgggACACNgIMIAIgBDYCDCACIAA2AggLQcybASAJNgIAQcCbASADNgIACyABQQhqIQALIAxBEGokACAAC4MEAQN/IAJBgARPBEAgACABIAIQEhogAA8LIAAgAmohAwJAIAAgAXNBA3FFBEACQCAAQQNxRQRAIAAhAgwBCyACQQFIBEAgACECDAELIAAhAgNAIAIgAS0AADoAACABQQFqIQEgAkEBaiICQQNxRQ0BIAIgA0kNAAsLAkAgA0F8cSIEQcAASQ0AIAIgBEFAaiIFSw0AA0AgAiABKAIANgIAIAIgASgCBDYCBCACIAEoAgg2AgggAiABKAIMNgIMIAIgASgCEDYCECACIAEoAhQ2AhQgAiABKAIYNgIYIAIgASgCHDYCHCACIAEoAiA2AiAgAiABKAIkNgIkIAIgASgCKDYCKCACIAEoAiw2AiwgAiABKAIwNgIwIAIgASgCNDYCNCACIAEoAjg2AjggAiABKAI8NgI8IAFBQGshASACQUBrIgIgBU0NAAsLIAIgBE8NAQNAIAIgASgCADYCACABQQRqIQEgAkEEaiICIARJDQALDAELIANBBEkEQCAAIQIMAQsgACADQQRrIgRLBEAgACECDAELIAAhAgNAIAIgAS0AADoAACACIAEtAAE6AAEgAiABLQACOgACIAIgAS0AAzoAAyABQQRqIQEgAkEEaiICIARNDQALCyACIANJBEADQCACIAEtAAA6AAAgAUEBaiEBIAJBAWoiAiADRw0ACwsgAAu4GAECfyMAQRBrIgQkACAEIAA2AgwgBCABNgIIIAQgAjYCBCAEKAIMIQAgBCgCCCECIAQoAgQhAyMAQSBrIgEkACABIAA2AhggASACNgIUIAEgAzYCEAJAIAEoAhRFBEAgAUEANgIcDAELIAFBATYCDCABLQAMBEAgASgCFCECIAEoAhAhAyMAQSBrIgAgASgCGDYCHCAAIAI2AhggACADNgIUIAAgACgCHDYCECAAIAAoAhBBf3M2AhADQCAAKAIUBH8gACgCGEEDcUEARwVBAAtBAXEEQCAAKAIQIQIgACAAKAIYIgNBAWo2AhggACADLQAAIAJzQf8BcUECdEGQFWooAgAgACgCEEEIdnM2AhAgACAAKAIUQQFrNgIUDAELCyAAIAAoAhg2AgwDQCAAKAIUQSBPBEAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQFWooAgAgACgCEEEQdkH/AXFBAnRBkB1qKAIAIAAoAhBB/wFxQQJ0QZAtaigCACAAKAIQQQh2Qf8BcUECdEGQJWooAgBzc3M2AhAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQFWooAgAgACgCEEEQdkH/AXFBAnRBkB1qKAIAIAAoAhBB/wFxQQJ0QZAtaigCACAAKAIQQQh2Qf8BcUECdEGQJWooAgBzc3M2AhAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQFWooAgAgACgCEEEQdkH/AXFBAnRBkB1qKAIAIAAoAhBB/wFxQQJ0QZAtaigCACAAKAIQQQh2Qf8BcUECdEGQJWooAgBzc3M2AhAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQFWooAgAgACgCEEEQdkH/AXFBAnRBkB1qKAIAIAAoAhBB/wFxQQJ0QZAtaigCACAAKAIQQQh2Qf8BcUECdEGQJWooAgBzc3M2AhAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQFWooAgAgACgCEEEQdkH/AXFBAnRBkB1qKAIAIAAoAhBB/wFxQQJ0QZAtaigCACAAKAIQQQh2Qf8BcUECdEGQJWooAgBzc3M2AhAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQFWooAgAgACgCEEEQdkH/AXFBAnRBkB1qKAIAIAAoAhBB/wFxQQJ0QZAtaigCACAAKAIQQQh2Qf8BcUECdEGQJWooAgBzc3M2AhAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQFWooAgAgACgCEEEQdkH/AXFBAnRBkB1qKAIAIAAoAhBB/wFxQQJ0QZAtaigCACAAKAIQQQh2Qf8BcUECdEGQJWooAgBzc3M2AhAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQFWooAgAgACgCEEEQdkH/AXFBAnRBkB1qKAIAIAAoAhBB/wFxQQJ0QZAtaigCACAAKAIQQQh2Qf8BcUECdEGQJWooAgBzc3M2AhAgACAAKAIUQSBrNgIUDAELCwNAIAAoAhRBBE8EQCAAIAAoAgwiAkEEajYCDCAAIAIoAgAgACgCEHM2AhAgACAAKAIQQRh2QQJ0QZAVaigCACAAKAIQQRB2Qf8BcUECdEGQHWooAgAgACgCEEH/AXFBAnRBkC1qKAIAIAAoAhBBCHZB/wFxQQJ0QZAlaigCAHNzczYCECAAIAAoAhRBBGs2AhQMAQsLIAAgACgCDDYCGCAAKAIUBEADQCAAKAIQIQIgACAAKAIYIgNBAWo2AhggACADLQAAIAJzQf8BcUECdEGQFWooAgAgACgCEEEIdnM2AhAgACAAKAIUQQFrIgI2AhQgAg0ACwsgACAAKAIQQX9zNgIQIAEgACgCEDYCHAwBCyABKAIUIQIgASgCECEDIwBBIGsiACABKAIYNgIcIAAgAjYCGCAAIAM2AhQgACAAKAIcQQh2QYD+A3EgACgCHEEYdmogACgCHEGA/gNxQQh0aiAAKAIcQf8BcUEYdGo2AhAgACAAKAIQQX9zNgIQA0AgACgCFAR/IAAoAhhBA3FBAEcFQQALQQFxBEAgACgCEEEYdiECIAAgACgCGCIDQQFqNgIYIAAgAy0AACACc0ECdEGQNWooAgAgACgCEEEIdHM2AhAgACAAKAIUQQFrNgIUDAELCyAAIAAoAhg2AgwDQCAAKAIUQSBPBEAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQzQBqKAIAIAAoAhBBEHZB/wFxQQJ0QZDFAGooAgAgACgCEEH/AXFBAnRBkDVqKAIAIAAoAhBBCHZB/wFxQQJ0QZA9aigCAHNzczYCECAAIAAoAgwiAkEEajYCDCAAIAIoAgAgACgCEHM2AhAgACAAKAIQQRh2QQJ0QZDNAGooAgAgACgCEEEQdkH/AXFBAnRBkMUAaigCACAAKAIQQf8BcUECdEGQNWooAgAgACgCEEEIdkH/AXFBAnRBkD1qKAIAc3NzNgIQIAAgACgCDCICQQRqNgIMIAAgAigCACAAKAIQczYCECAAIAAoAhBBGHZBAnRBkM0AaigCACAAKAIQQRB2Qf8BcUECdEGQxQBqKAIAIAAoAhBB/wFxQQJ0QZA1aigCACAAKAIQQQh2Qf8BcUECdEGQPWooAgBzc3M2AhAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQzQBqKAIAIAAoAhBBEHZB/wFxQQJ0QZDFAGooAgAgACgCEEH/AXFBAnRBkDVqKAIAIAAoAhBBCHZB/wFxQQJ0QZA9aigCAHNzczYCECAAIAAoAgwiAkEEajYCDCAAIAIoAgAgACgCEHM2AhAgACAAKAIQQRh2QQJ0QZDNAGooAgAgACgCEEEQdkH/AXFBAnRBkMUAaigCACAAKAIQQf8BcUECdEGQNWooAgAgACgCEEEIdkH/AXFBAnRBkD1qKAIAc3NzNgIQIAAgACgCDCICQQRqNgIMIAAgAigCACAAKAIQczYCECAAIAAoAhBBGHZBAnRBkM0AaigCACAAKAIQQRB2Qf8BcUECdEGQxQBqKAIAIAAoAhBB/wFxQQJ0QZA1aigCACAAKAIQQQh2Qf8BcUECdEGQPWooAgBzc3M2AhAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQzQBqKAIAIAAoAhBBEHZB/wFxQQJ0QZDFAGooAgAgACgCEEH/AXFBAnRBkDVqKAIAIAAoAhBBCHZB/wFxQQJ0QZA9aigCAHNzczYCECAAIAAoAgwiAkEEajYCDCAAIAIoAgAgACgCEHM2AhAgACAAKAIQQRh2QQJ0QZDNAGooAgAgACgCEEEQdkH/AXFBAnRBkMUAaigCACAAKAIQQf8BcUECdEGQNWooAgAgACgCEEEIdkH/AXFBAnRBkD1qKAIAc3NzNgIQIAAgACgCFEEgazYCFAwBCwsDQCAAKAIUQQRPBEAgACAAKAIMIgJBBGo2AgwgACACKAIAIAAoAhBzNgIQIAAgACgCEEEYdkECdEGQzQBqKAIAIAAoAhBBEHZB/wFxQQJ0QZDFAGooAgAgACgCEEH/AXFBAnRBkDVqKAIAIAAoAhBBCHZB/wFxQQJ0QZA9aigCAHNzczYCECAAIAAoAhRBBGs2AhQMAQsLIAAgACgCDDYCGCAAKAIUBEADQCAAKAIQQRh2IQIgACAAKAIYIgNBAWo2AhggACADLQAAIAJzQQJ0QZA1aigCACAAKAIQQQh0czYCECAAIAAoAhRBAWsiAjYCFCACDQALCyAAIAAoAhBBf3M2AhAgASAAKAIQQQh2QYD+A3EgACgCEEEYdmogACgCEEGA/gNxQQh0aiAAKAIQQf8BcUEYdGo2AhwLIAEoAhwhACABQSBqJAAgBEEQaiQAIAAL7AIBAn8jAEEQayIBJAAgASAANgIMAkAgASgCDEUNACABKAIMKAIwBEAgASgCDCIAIAAoAjBBAWs2AjALIAEoAgwoAjANACABKAIMKAIgBEAgASgCDEEBNgIgIAEoAgwQMRoLIAEoAgwoAiRBAUYEQCABKAIMEGcLAkAgASgCDCgCLEUNACABKAIMLQAoQQFxDQAgASgCDCECIwBBEGsiACABKAIMKAIsNgIMIAAgAjYCCCAAQQA2AgQDQCAAKAIEIAAoAgwoAkRJBEAgACgCDCgCTCAAKAIEQQJ0aigCACAAKAIIRgRAIAAoAgwoAkwgACgCBEECdGogACgCDCgCTCAAKAIMKAJEQQFrQQJ0aigCADYCACAAKAIMIgAgACgCREEBazYCRAUgACAAKAIEQQFqNgIEDAILCwsLIAEoAgxBAEIAQQUQIRogASgCDCgCAARAIAEoAgwoAgAQGwsgASgCDBAVCyABQRBqJAALnwIBAn8jAEEQayIBJAAgASAANgIMIAEgASgCDCgCHDYCBCABKAIEIQIjAEEQayIAJAAgACACNgIMIAAoAgwQuwEgAEEQaiQAIAEgASgCBCgCFDYCCCABKAIIIAEoAgwoAhBLBEAgASABKAIMKAIQNgIICwJAIAEoAghFDQAgASgCDCgCDCABKAIEKAIQIAEoAggQGRogASgCDCIAIAEoAgggACgCDGo2AgwgASgCBCIAIAEoAgggACgCEGo2AhAgASgCDCIAIAEoAgggACgCFGo2AhQgASgCDCIAIAAoAhAgASgCCGs2AhAgASgCBCIAIAAoAhQgASgCCGs2AhQgASgCBCgCFA0AIAEoAgQgASgCBCgCCDYCEAsgAUEQaiQAC2ABAX8jAEEQayIBJAAgASAANgIIIAEgASgCCEICEB42AgQCQCABKAIERQRAIAFBADsBDgwBCyABIAEoAgQtAAAgASgCBC0AAUEIdGo7AQ4LIAEvAQ4hACABQRBqJAAgAAvpAQEBfyMAQSBrIgIkACACIAA2AhwgAiABNwMQIAIpAxAhASMAQSBrIgAgAigCHDYCGCAAIAE3AxACQAJAAkAgACgCGC0AAEEBcUUNACAAKQMQIAAoAhgpAxAgACkDEHxWDQAgACgCGCkDCCAAKAIYKQMQIAApAxB8Wg0BCyAAKAIYQQA6AAAgAEEANgIcDAELIAAgACgCGCgCBCAAKAIYKQMQp2o2AgwgACAAKAIMNgIcCyACIAAoAhw2AgwgAigCDARAIAIoAhwiACACKQMQIAApAxB8NwMQCyACKAIMIQAgAkEgaiQAIAALbwEBfyMAQRBrIgIkACACIAA2AgggAiABOwEGIAIgAigCCEICEB42AgACQCACKAIARQRAIAJBfzYCDAwBCyACKAIAIAIvAQY6AAAgAigCACACLwEGQQh2OgABIAJBADYCDAsgAigCDBogAkEQaiQAC48BAQF/IwBBEGsiAiQAIAIgADYCCCACIAE2AgQgAiACKAIIQgQQHjYCAAJAIAIoAgBFBEAgAkF/NgIMDAELIAIoAgAgAigCBDoAACACKAIAIAIoAgRBCHY6AAEgAigCACACKAIEQRB2OgACIAIoAgAgAigCBEEYdjoAAyACQQA2AgwLIAIoAgwaIAJBEGokAAu2AgEBfyMAQTBrIgQkACAEIAA2AiQgBCABNgIgIAQgAjcDGCAEIAM2AhQCQCAEKAIkKQMYQgEgBCgCFK2Gg1AEQCAEKAIkQQxqQRxBABAUIARCfzcDKAwBCwJAIAQoAiQoAgBFBEAgBCAEKAIkKAIIIAQoAiAgBCkDGCAEKAIUIAQoAiQoAgQRDgA3AwgMAQsgBCAEKAIkKAIAIAQoAiQoAgggBCgCICAEKQMYIAQoAhQgBCgCJCgCBBEKADcDCAsgBCkDCEIAUwRAAkAgBCgCFEEERg0AIAQoAhRBDkYNAAJAIAQoAiQgBEIIQQQQIUIAUwRAIAQoAiRBDGpBFEEAEBQMAQsgBCgCJEEMaiAEKAIAIAQoAgQQFAsLCyAEIAQpAwg3AygLIAQpAyghAiAEQTBqJAAgAgsXACAALQAAQSBxRQRAIAEgAiAAEHIaCwtQAQF/IwBBEGsiASQAIAEgADYCDANAIAEoAgwEQCABIAEoAgwoAgA2AgggASgCDCgCDBAVIAEoAgwQFSABIAEoAgg2AgwMAQsLIAFBEGokAAt9AQF/IwBBEGsiASQAIAEgADYCDCABKAIMBEAgAUIANwMAA0AgASkDACABKAIMKQMIWkUEQCABKAIMKAIAIAEpAwCnQQR0ahBiIAEgASkDAEIBfDcDAAwBCwsgASgCDCgCABAVIAEoAgwoAigQJSABKAIMEBULIAFBEGokAAs+AQF/IwBBEGsiASQAIAEgADYCDCABKAIMBEAgASgCDCgCABAVIAEoAgwoAgwQFSABKAIMEBULIAFBEGokAAtuAQF/IwBBgAJrIgUkAAJAIARBgMAEcQ0AIAIgA0wNACAFIAFB/wFxIAIgA2siAkGAAiACQYACSSIBGxAyIAFFBEADQCAAIAVBgAIQIiACQYACayICQf8BSw0ACwsgACAFIAIQIgsgBUGAAmokAAvRAQEBfyMAQTBrIgMkACADIAA2AiggAyABNwMgIAMgAjYCHAJAIAMoAigtAChBAXEEQCADQX82AiwMAQsCQCADKAIoKAIgBEAgAygCHEUNASADKAIcQQFGDQEgAygCHEECRg0BCyADKAIoQQxqQRJBABAUIANBfzYCLAwBCyADIAMpAyA3AwggAyADKAIcNgIQIAMoAiggA0EIakIQQQYQIUIAUwRAIANBfzYCLAwBCyADKAIoQQA6ADQgA0EANgIsCyADKAIsIQAgA0EwaiQAIAALmBcBAn8jAEEwayIEJAAgBCAANgIsIAQgATYCKCAEIAI2AiQgBCADNgIgIARBADYCFAJAIAQoAiwoAoQBQQBKBEAgBCgCLCgCACgCLEECRgRAIwBBEGsiACAEKAIsNgIIIABB/4D/n382AgQgAEEANgIAAkADQCAAKAIAQR9MBEACQCAAKAIEQQFxRQ0AIAAoAghBlAFqIAAoAgBBAnRqLwEARQ0AIABBADYCDAwDCyAAIAAoAgBBAWo2AgAgACAAKAIEQQF2NgIEDAELCwJAAkAgACgCCC8BuAENACAAKAIILwG8AQ0AIAAoAggvAcgBRQ0BCyAAQQE2AgwMAQsgAEEgNgIAA0AgACgCAEGAAkgEQCAAKAIIQZQBaiAAKAIAQQJ0ai8BAARAIABBATYCDAwDBSAAIAAoAgBBAWo2AgAMAgsACwsgAEEANgIMCyAAKAIMIQAgBCgCLCgCACAANgIsCyAEKAIsIAQoAixBmBZqEHsgBCgCLCAEKAIsQaQWahB7IAQoAiwhASMAQRBrIgAkACAAIAE2AgwgACgCDCAAKAIMQZQBaiAAKAIMKAKcFhC5ASAAKAIMIAAoAgxBiBNqIAAoAgwoAqgWELkBIAAoAgwgACgCDEGwFmoQeyAAQRI2AggDQAJAIAAoAghBA0gNACAAKAIMQfwUaiAAKAIILQDgbEECdGovAQINACAAIAAoAghBAWs2AggMAQsLIAAoAgwiASABKAKoLSAAKAIIQQNsQRFqajYCqC0gACgCCCEBIABBEGokACAEIAE2AhQgBCAEKAIsKAKoLUEKakEDdjYCHCAEIAQoAiwoAqwtQQpqQQN2NgIYIAQoAhggBCgCHE0EQCAEIAQoAhg2AhwLDAELIAQgBCgCJEEFaiIANgIYIAQgADYCHAsCQAJAIAQoAhwgBCgCJEEEakkNACAEKAIoRQ0AIAQoAiwgBCgCKCAEKAIkIAQoAiAQXAwBCwJAAkAgBCgCLCgCiAFBBEcEQCAEKAIYIAQoAhxHDQELIARBAzYCEAJAIAQoAiwoArwtQRAgBCgCEGtKBEAgBCAEKAIgQQJqNgIMIAQoAiwiACAALwG4LSAEKAIMQf//A3EgBCgCLCgCvC10cjsBuC0gBCgCLC8BuC1B/wFxIQEgBCgCLCgCCCECIAQoAiwiAygCFCEAIAMgAEEBajYCFCAAIAJqIAE6AAAgBCgCLC8BuC1BCHYhASAEKAIsKAIIIQIgBCgCLCIDKAIUIQAgAyAAQQFqNgIUIAAgAmogAToAACAEKAIsIAQoAgxB//8DcUEQIAQoAiwoArwta3U7AbgtIAQoAiwiACAAKAK8LSAEKAIQQRBrajYCvC0MAQsgBCgCLCIAIAAvAbgtIAQoAiBBAmpB//8DcSAEKAIsKAK8LXRyOwG4LSAEKAIsIgAgBCgCECAAKAK8LWo2ArwtCyAEKAIsQZDgAEGQ6QAQugEMAQsgBEEDNgIIAkAgBCgCLCgCvC1BECAEKAIIa0oEQCAEIAQoAiBBBGo2AgQgBCgCLCIAIAAvAbgtIAQoAgRB//8DcSAEKAIsKAK8LXRyOwG4LSAEKAIsLwG4LUH/AXEhASAEKAIsKAIIIQIgBCgCLCIDKAIUIQAgAyAAQQFqNgIUIAAgAmogAToAACAEKAIsLwG4LUEIdiEBIAQoAiwoAgghAiAEKAIsIgMoAhQhACADIABBAWo2AhQgACACaiABOgAAIAQoAiwgBCgCBEH//wNxQRAgBCgCLCgCvC1rdTsBuC0gBCgCLCIAIAAoArwtIAQoAghBEGtqNgK8LQwBCyAEKAIsIgAgAC8BuC0gBCgCIEEEakH//wNxIAQoAiwoArwtdHI7AbgtIAQoAiwiACAEKAIIIAAoArwtajYCvC0LIAQoAiwhASAEKAIsKAKcFkEBaiECIAQoAiwoAqgWQQFqIQMgBCgCFEEBaiEFIwBBQGoiACQAIAAgATYCPCAAIAI2AjggACADNgI0IAAgBTYCMCAAQQU2AigCQCAAKAI8KAK8LUEQIAAoAihrSgRAIAAgACgCOEGBAms2AiQgACgCPCIBIAEvAbgtIAAoAiRB//8DcSAAKAI8KAK8LXRyOwG4LSAAKAI8LwG4LUH/AXEhAiAAKAI8KAIIIQMgACgCPCIFKAIUIQEgBSABQQFqNgIUIAEgA2ogAjoAACAAKAI8LwG4LUEIdiECIAAoAjwoAgghAyAAKAI8IgUoAhQhASAFIAFBAWo2AhQgASADaiACOgAAIAAoAjwgACgCJEH//wNxQRAgACgCPCgCvC1rdTsBuC0gACgCPCIBIAEoArwtIAAoAihBEGtqNgK8LQwBCyAAKAI8IgEgAS8BuC0gACgCOEGBAmtB//8DcSAAKAI8KAK8LXRyOwG4LSAAKAI8IgEgACgCKCABKAK8LWo2ArwtCyAAQQU2AiACQCAAKAI8KAK8LUEQIAAoAiBrSgRAIAAgACgCNEEBazYCHCAAKAI8IgEgAS8BuC0gACgCHEH//wNxIAAoAjwoArwtdHI7AbgtIAAoAjwvAbgtQf8BcSECIAAoAjwoAgghAyAAKAI8IgUoAhQhASAFIAFBAWo2AhQgASADaiACOgAAIAAoAjwvAbgtQQh2IQIgACgCPCgCCCEDIAAoAjwiBSgCFCEBIAUgAUEBajYCFCABIANqIAI6AAAgACgCPCAAKAIcQf//A3FBECAAKAI8KAK8LWt1OwG4LSAAKAI8IgEgASgCvC0gACgCIEEQa2o2ArwtDAELIAAoAjwiASABLwG4LSAAKAI0QQFrQf//A3EgACgCPCgCvC10cjsBuC0gACgCPCIBIAAoAiAgASgCvC1qNgK8LQsgAEEENgIYAkAgACgCPCgCvC1BECAAKAIYa0oEQCAAIAAoAjBBBGs2AhQgACgCPCIBIAEvAbgtIAAoAhRB//8DcSAAKAI8KAK8LXRyOwG4LSAAKAI8LwG4LUH/AXEhAiAAKAI8KAIIIQMgACgCPCIFKAIUIQEgBSABQQFqNgIUIAEgA2ogAjoAACAAKAI8LwG4LUEIdiECIAAoAjwoAgghAyAAKAI8IgUoAhQhASAFIAFBAWo2AhQgASADaiACOgAAIAAoAjwgACgCFEH//wNxQRAgACgCPCgCvC1rdTsBuC0gACgCPCIBIAEoArwtIAAoAhhBEGtqNgK8LQwBCyAAKAI8IgEgAS8BuC0gACgCMEEEa0H//wNxIAAoAjwoArwtdHI7AbgtIAAoAjwiASAAKAIYIAEoArwtajYCvC0LIABBADYCLANAIAAoAiwgACgCMEgEQCAAQQM2AhACQCAAKAI8KAK8LUEQIAAoAhBrSgRAIAAgACgCPEH8FGogACgCLC0A4GxBAnRqLwECNgIMIAAoAjwiASABLwG4LSAAKAIMQf//A3EgACgCPCgCvC10cjsBuC0gACgCPC8BuC1B/wFxIQIgACgCPCgCCCEDIAAoAjwiBSgCFCEBIAUgAUEBajYCFCABIANqIAI6AAAgACgCPC8BuC1BCHYhAiAAKAI8KAIIIQMgACgCPCIFKAIUIQEgBSABQQFqNgIUIAEgA2ogAjoAACAAKAI8IAAoAgxB//8DcUEQIAAoAjwoArwta3U7AbgtIAAoAjwiASABKAK8LSAAKAIQQRBrajYCvC0MAQsgACgCPCIBIAEvAbgtIAAoAjxB/BRqIAAoAiwtAOBsQQJ0ai8BAiAAKAI8KAK8LXRyOwG4LSAAKAI8IgEgACgCECABKAK8LWo2ArwtCyAAIAAoAixBAWo2AiwMAQsLIAAoAjwgACgCPEGUAWogACgCOEEBaxC4ASAAKAI8IAAoAjxBiBNqIAAoAjRBAWsQuAEgAEFAayQAIAQoAiwgBCgCLEGUAWogBCgCLEGIE2oQugELCyAEKAIsEL0BIAQoAiAEQCAEKAIsELwBCyAEQTBqJAAL1AEBAX8jAEEgayICJAAgAiAANgIYIAIgATcDECACIAIoAhhFOgAPAkAgAigCGEUEQCACIAIpAxCnEBgiADYCGCAARQRAIAJBADYCHAwCCwsgAkEYEBgiADYCCCAARQRAIAItAA9BAXEEQCACKAIYEBULIAJBADYCHAwBCyACKAIIQQE6AAAgAigCCCACKAIYNgIEIAIoAgggAikDEDcDCCACKAIIQgA3AxAgAigCCCACLQAPQQFxOgABIAIgAigCCDYCHAsgAigCHCEAIAJBIGokACAAC3gBAX8jAEEQayIBJAAgASAANgIIIAEgASgCCEIEEB42AgQCQCABKAIERQRAIAFBADYCDAwBCyABIAEoAgQtAAAgASgCBC0AASABKAIELQACIAEoAgQtAANBCHRqQQh0akEIdGo2AgwLIAEoAgwhACABQRBqJAAgAAt/AQN/IAAhAQJAIABBA3EEQANAIAEtAABFDQIgAUEBaiIBQQNxDQALCwNAIAEiAkEEaiEBIAIoAgAiA0F/cyADQYGChAhrcUGAgYKEeHFFDQALIANB/wFxRQRAIAIgAGsPCwNAIAItAAEhAyACQQFqIgEhAiADDQALCyABIABrC2EBAX8jAEEQayICIAA2AgggAiABNwMAAkAgAikDACACKAIIKQMIVgRAIAIoAghBADoAACACQX82AgwMAQsgAigCCEEBOgAAIAIoAgggAikDADcDECACQQA2AgwLIAIoAgwL7wEBAX8jAEEgayICJAAgAiAANgIYIAIgATcDECACIAIoAhhCCBAeNgIMAkAgAigCDEUEQCACQX82AhwMAQsgAigCDCACKQMQQv8BgzwAACACKAIMIAIpAxBCCIhC/wGDPAABIAIoAgwgAikDEEIQiEL/AYM8AAIgAigCDCACKQMQQhiIQv8BgzwAAyACKAIMIAIpAxBCIIhC/wGDPAAEIAIoAgwgAikDEEIoiEL/AYM8AAUgAigCDCACKQMQQjCIQv8BgzwABiACKAIMIAIpAxBCOIhC/wGDPAAHIAJBADYCHAsgAigCHBogAkEgaiQAC4cDAQF/IwBBMGsiAyQAIAMgADYCJCADIAE2AiAgAyACNwMYAkAgAygCJC0AKEEBcQRAIANCfzcDKAwBCwJAAkAgAygCJCgCIEUNACADKQMYQv///////////wBWDQAgAykDGFANASADKAIgDQELIAMoAiRBDGpBEkEAEBQgA0J/NwMoDAELIAMoAiQtADVBAXEEQCADQn83AygMAQsCfyMAQRBrIgAgAygCJDYCDCAAKAIMLQA0QQFxCwRAIANCADcDKAwBCyADKQMYUARAIANCADcDKAwBCyADQgA3AxADQCADKQMQIAMpAxhUBEAgAyADKAIkIAMoAiAgAykDEKdqIAMpAxggAykDEH1BARAhIgI3AwggAkIAUwRAIAMoAiRBAToANSADKQMQUARAIANCfzcDKAwECyADIAMpAxA3AygMAwsgAykDCFAEQCADKAIkQQE6ADQFIAMgAykDCCADKQMQfDcDEAwCCwsLIAMgAykDEDcDKAsgAykDKCECIANBMGokACACCzYBAX8jAEEQayIBIAA2AgwCfiABKAIMLQAAQQFxBEAgASgCDCkDCCABKAIMKQMQfQwBC0IACwuyAQIBfwF+IwBBEGsiASQAIAEgADYCBCABIAEoAgRC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AkEBNgIQIAJBADYCCANAAkAgAigCCCACKAIYLwEETw0AAkAgAigCDCACKAIIai0AAEEfSwRAIAIoAgwgAigCCGotAABBgAFJDQELIAIoAgwgAigCCGotAABBDUYNACACKAIMIAIoAghqLQAAQQpGDQAgAigCDCACKAIIai0AAEEJRgRADAELIAJBAzYCEAJAIAIoAgwgAigCCGotAABB4AFxQcABRgRAIAJBATYCAAwBCwJAIAIoAgwgAigCCGotAABB8AFxQeABRgRAIAJBAjYCAAwBCwJAIAIoAgwgAigCCGotAABB+AFxQfABRgRAIAJBAzYCAAwBCyACQQQ2AhAMBAsLCyACKAIYLwEEIAIoAgggAigCAGpNBEAgAkEENgIQDAILIAJBATYCBANAIAIoAgQgAigCAE0EQCACKAIMIAIoAgggAigCBGpqLQAAQcABcUGAAUcEQCACQQQ2AhAMBgUgAiACKAIEQQFqNgIEDAILAAsLIAIgAigCACACKAIIajYCCAsgAiACKAIIQQFqNgIIDAELCwsgAigCGCACKAIQNgIIIAIoAhQEQAJAIAIoAhRBAkcNACACKAIQQQNHDQAgAkECNgIQIAIoAhhBAjYCCAsCQCACKAIUIAIoAhBGDQAgAigCEEEBRg0AIAJBBTYCHAwCCwsgAiACKAIQNgIcCyACKAIcC2oBAX8jAEEQayIBIAA2AgwgASgCDEIANwMAIAEoAgxBADYCCCABKAIMQn83AxAgASgCDEEANgIsIAEoAgxBfzYCKCABKAIMQgA3AxggASgCDEIANwMgIAEoAgxBADsBMCABKAIMQQA7ATILUgECf0GQlwEoAgAiASAAQQNqQXxxIgJqIQACQCACQQAgACABTRsNACAAPwBBEHRLBEAgABATRQ0BC0GQlwEgADYCACABDwtBtJsBQTA2AgBBfwuNBQEDfyMAQRBrIgEkACABIAA2AgwgASgCDARAIAEoAgwoAgAEQCABKAIMKAIAEDEaIAEoAgwoAgAQGwsgASgCDCgCHBAVIAEoAgwoAiAQJSABKAIMKAIkECUgASgCDCgCUCECIwBBEGsiACQAIAAgAjYCDCAAKAIMBEAgACgCDCgCEARAIABBADYCCANAIAAoAgggACgCDCgCAEkEQCAAKAIMKAIQIAAoAghBAnRqKAIABEAgACgCDCgC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A3EQHwsgAygCpAEoAhQgA0GeAWogA0GcAWoQgQEgAygCTCADLwGeARAfIAMoAkwgAy8BnAEQHwJAAkAgAy0AhQFBAXFFDQAgAygCpAEpAyhCFFoNACADKAJMQQAQIAwBCyADKAJMIAMoAqQBKAIYECALAkACQCADKAKgAUGAAnFBgAJHDQAgAygCpAEpAyBC/////w9UBEAgAygCpAEpAyhC/////w9UDQELIAMoAkxBfxAgIAMoAkxBfxAgDAELAkAgAygCpAEpAyBC/////w9UBEAgAygCTCADKAKkASkDIKcQIAwBCyADKAJMQX8QIAsCQCADKAKkASkDKEL/////D1QEQCADKAJMIAMoAqQBKQMopxAgDAELIAMoAkxBfxAgCwsgAygCTCADKAKkASgCMBBTQf//A3EQHyADIAMoAqQBKAI0IAMoAqABEIYBQf//A3EgAygCkAFBgAYQhgFB//8DcWo2AogBIAMoAkwgAygCiAFB//8DcRAfIAMoAqABQYACcUUEQCADKAJMIAMoAqQBKAI4EFNB//8DcRAfIAMoAkwgAygCpAEoAjxB//8DcRAfIAMoAkwgAygCpAEvAUAQHyADKAJMIAMoAqQBKAJEECACQCADKAKkASkDSEL/////D1QEQCADKAJMIAMoAqQBKQNIpxAgDAELIAMoAkxBfxAgCwsCfyMAQRBrIgAgAygCTDYCDCAAKAIMLQAAQQFxRQsEQCADKAKoAUEIakEUQQAQFCADKAJMEBYgAygCkAEQIyADQX82AqwBDAELIAMoAqgBIANB0ABqAn4jAEEQayIAIAMoAkw2AgwCfiAAKAIMLQAAQQFxBEAgACgCDCkDEAwBC0IACwsQNUEASARAIAMoAkwQFiADKAKQARAjIANBfzYCrAEMAQsgAygCTBAWIAMoAqQBKAIwBEAgAygCqAEgAygCpAEoAjAQigFBAEgEQCADKAKQARAjIANBfzYCrAEMAgsLIAMoApABBEAgAygCqAEgAygCkAFBgAYQhQFBAEgEQCADKAKQARAjIANBfzYCrAEMAgsLIAMoApABECMgAygCpAEoAjQEQCADKAKoASADKAKkASgCNCADKAKgARCFAUEASARAIANBfzYCrAEMAgsLIAMoAqABQYACcUUEQCADKAKkASgCOARAIAMoAqgBIAMoAqQBKAI4EIoB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HCAAIAAoAhRBAWo2AhQMAQsLIAAoAggQR0EBcUUEQCAAKAIgQRRBABAUIAAoAggQFiAAQX82AiwMAQsgACgCCBAWIAAgACgCHDYCLAsgACgCLCECIABBMGokACADIAIiADYCBCAAQQBIBEAgA0IANwMoDAELIAMpAwggAygCBK18Qv///////////wBWBEAgAygCFEEEQRYQFCADQgA3AygMAQsgAyADKQMIIAMoAgStfDcDKAsgAykDKCEBIANBMGokACABC20BAX8jAEEgayIEJAAgBCAANgIYIAQgATYCFCAEIAI2AhAgBCADNgIMAkAgBCgCGEUEQCAEQQA2AhwMAQsgBCAEKAIUIAQoAhAgBCgCDCAEKAIYQQhqEJIBNgIcCyAEKAIcIQAgBEEgaiQAIAALVQEBfyMAQRBrIgEkACABIAA2AgwCQAJAIAEoAgwoAiRBAUYNACABKAIMKAIkQQJGDQAMAQsgASgCDEEAQgBBChAhGiABKAIMQQA2AiQLIAFBEGokAAumAQEBfyMAQRBrIgIkACACIAA2AgggAiABNgIEAkAgAigCCC0AKEEBcQRAIAJBfzYCDAwBCyACKAIIKAIABEAgAigCCCgCACACKAIEEGhBAEgEQCACKAIIQQxqIAIoAggoAgAQFyACQX82AgwMAgsLIAIoAgggAkEEakIEQRMQIUIAUwRAIAJBfzYCDAwBCyACQQA2AgwLIAIoAgwhACACQRBqJAAgAAuNCAIBfwF+IwBBkAFrIgMkACADIAA2AoQBIAMgATYCgAEgAyACNgJ8IAMQTwJAIAMoAoABKQMIQgBSBEAgAyADKAKAASgCACgCACkDSDcDYCADIAMoAoABKAIAKAIAKQNINwNoDAELIANCADcDYCADQgA3A2gLIANCADcDcAJAA0AgAykDcCADKAKAASkDCFQEQCADKAKAASgCACADKQNwp0EEdGooAgApA0ggAykDaFQEQCADIAMoAoABKAIAIAMpA3CnQQR0aigCACkDSDcDaAsgAykDaCADKAKAASkDIFYEQCADKAJ8QRNBABAUIANCfzcDiAEMAwsgAyADKAKAASgCACADKQNwp0EEdGooAgApA0ggAygCgAEoAgAgAykDcKdBBHRqKAIAKQMgfCADKAKAASgCACADKQNwp0EEdGooAgAoAjAQU0H//wNxrXxCHnw3A1ggAykDWCADKQNgVgRAIAMgAykDWDcDYAsgAykDYCADKAKAASkDIFYEQCADKAJ8QRNBABAUIANCfzcDiAEMAwsgAygChAEoAgAgAygCgAEoAgAgAykDcKdBBHRqKAIAKQNIQQAQJ0EASARAIAMoAnwgAygChAEoAgAQFyADQn83A4gBDAMLIAMgAygChAEoAgBBAEEBIAMoAnwQxgFCf1EEQCADEF0gA0J/NwOIAQwDCwJ/IAMoAoABKAIAIAMpA3CnQQR0aigCACEBIwBBEGsiACQAIAAgATYCCCAAIAM2AgQCQAJAAkAgACgCCC8BCiAAKAIELwEKSA0AIAAoAggoAhAgACgCBCgCEEcNACAAKAIIKAIUIAAoAgQoAhRHDQAgACgCCCgCMCAAKAIEKAIwEIsBDQELIABBfzYCDAwBCwJAAkAgACgCCCgCGCAAKAIEKAIYRw0AIAAoAggpAyAgACgCBCkDIFINACAAKAIIKQMoIAAoAgQpAyhRDQELAkACQCAAKAIELwEMQQhxRQ0AIAAoAgQoAhgNACAAKAIEKQMgQgBSDQAgACgCBCkDKFANAQsgAEF/NgIMDAILCyAAQQA2AgwLIAAoAgwhASAAQRBqJAAgAQsEQCADKAJ8QRVBABAUIAMQXSADQn83A4gBDAMFIAMoAoABKAIAIAMpA3CnQQR0aigCACgCNCADKAI0EIkBIQAgAygCgAEoAgAgAykDcKdBBHRqKAIAIAA2AjQgAygCgAEoAgAgAykDcKdBBHRqKAIAQQE6AAQgA0EANgI0IAMQXSADIAMpA3BCAXw3A3AMAgsACwsgAwJ+IAMpA2AgAykDaH1C////////////AFQEQCADKQNgIAMpA2h9DAELQv///////////wALNwOIAQsgAykDiAEhBCADQZABaiQAIAQL1AQBAX8jAEEgayIDJAAgAyAANgIYIAMgATYCFCADIAI2AhAgAygCECEBIwBBEGsiACQAIAAgATYCCCAAQdgAEBg2AgQCQCAAKAIERQRAIAAoAghBDkEAEBQgAEEANgIMDAELIAAoAgghAiMAQRBrIgEkACABIAI2AgggAUEYEBgiAjYCBAJAIAJFBEAgASgCCEEOQQAQFCABQQA2AgwMAQsgASgCBEEANgIAIAEoAgRCADcDCCABKAIEQQA2AhAgASABKAIENgIMCyABKAIMIQIgAUEQaiQAIAAoAgQgAjYCUCACRQRAIAAoAgQQFSAAQQA2AgwMAQsgACgCBEEANgIAIAAoAgRBADYCBCMAQRBrIgEgACgCBEEIajYCDCABKAIMQQA2AgAgASgCDEEANgIEIAEoAgxBADYCCCAAKAIEQQA2AhggACgCBEEANgIUIAAoAgRBADYCHCAAKAIEQQA2AiQgACgCBEEANgIgIAAoAgRBADoAKCAAKAIEQgA3AzggACgCBEIANwMwIAAoAgRBADYCQCAAKAIEQQA2AkggACgCBEEANgJEIAAoAgRBADYCTCAAKAIEQQA2AlQgACAAKAIENgIMCyAAKAIMIQEgAEEQaiQAIAMgASIANgIMAkAgAEUEQCADQQA2AhwMAQsgAygCDCADKAIYNgIAIAMoAgwgAygCFDYCBCADKAIUQRBxBEAgAygCDCIAIAAoAhRBAnI2AhQgAygCDCIAIAAoAhhBAnI2AhgLIAMgAygCDDYCHAsgAygCHCEAIANBIGokACAAC9UBAQF/IwBBIGsiBCQAIAQgADYCGCAEIAE3AxAgBCACNgIMIAQgAzYCCAJAAkAgBCkDEEL///////////8AVwRAIAQpAxBCgICAgICAgICAf1kNAQsgBCgCCEEEQT0QFCAEQX82AhwMAQsCfyAEKQMQIQEgBCgCDCEAIAQoAhgiAigCTEF/TARAIAIgASAAEKABDAELIAIgASAAEKABC0EASARAIAQoAghBBEG0mwEoAgAQFCAEQX82AhwMAQsgBEEANgIcCyAEKAIcIQAgBEEgaiQAIAALJABBACAAEAUiACAAQRtGGyIABH9BtJsBIAA2AgBBAAVBAAsaC3ABAX8jAEEQayIDJAAgAwJ/IAFBwABxRQRAQQAgAUGAgIQCcUGAgIQCRw0BGgsgAyACQQRqNgIMIAIoAgALNgIAIAAgAUGAgAJyIAMQECIAQYFgTwRAQbSbAUEAIABrNgIAQX8hAAsgA0EQaiQAIAALMwEBfwJ/IAAQByIBQWFGBEAgABARIQELIAFBgWBPCwR/QbSbAUEAIAFrNgIAQX8FIAELC2kBAn8CQCAAKAIUIAAoAhxNDQAgAEEAQQAgACgCJBEBABogACgCFA0AQX8PCyAAKAIEIgEgACgCCCICSQRAIAAgASACa6xBASAAKAIoEQ8AGgsgAEEANgIcIABCADcDECAAQgA3AgRBAAvaAwEGfyMAQRBrIgUkACAFIAI2AgwjAEGgAWsiBCQAIARBCGpBkIcBQZABEBkaIAQgADYCNCAEIAA2AhwgBEF+IABrIgNB/////wcgA0H/////B0kbIgY2AjggBCAAIAZqIgA2AiQgBCAANgIYIARBCGohACMAQdABayIDJAAgAyACNgLMASADQaABakEAQSgQMiADIAMoAswBNgLIAQJAQQAgASADQcgBaiADQdAAaiADQaABahBxQQBIDQAgACgCTEEATiEHIAAoAgAhAiAALABKQQBMBEAgACACQV9xNgIACyACQSBxIQgCfyAAKAIwBEAgACABIANByAFqIANB0ABqIANBoAFqEHEMAQsgAEHQADYCMCAAIANB0ABqNgIQIAAgAzYCHCAAIAM2AhQgACgCLCECIAAgAzYCLCAAIAEgA0HIAWogA0HQAGogA0GgAWoQcSACRQ0AGiAAQQBBACAAKAIkEQEAGiAAQQA2AjAgACACNgIsIABBADYCHCAAQQA2AhAgACgCFBogAEEANgIUQQALGiAAIAAoAgAgCHI2AgAgB0UNAAsgA0HQAWokACAGBEAgBCgCHCIAIAAgBCgCGEZrQQA6AAALIARBoAFqJAAgBUEQaiQAC4wSAg9/AX4jAEHQAGsiBSQAIAUgATYCTCAFQTdqIRMgBUE4aiEQQQAhAQNAAkAgDUEASA0AQf////8HIA1rIAFIBEBBtJsBQT02AgBBfyENDAELIAEgDWohDQsgBSgCTCIHIQECQAJAAkACQAJAAkACQAJAIAUCfwJAIActAAAiBgRAA0ACQAJAIAZB/wFxIgZFBEAgASEGDAELIAZBJUcNASABIQYDQCABLQABQSVHDQEgBSABQQJqIgg2AkwgBkEBaiEGIAEtAAIhDiAIIQEgDkElRg0ACwsgBiAHayEBIAAEQCAAIAcgARAiCyABDQ0gBSgCTCEBIAUoAkwsAAFBMGtBCk8NAyABLQACQSRHDQMgASwAAUEwayEPQQEhESABQQNqDAQLIAUgAUEBaiIINgJMIAEtAAEhBiAIIQEMAAsACyANIQsgAA0IIBFFDQJBASEBA0AgBCABQQJ0aigCACIABEAgAyABQQN0aiAAIAIQqAFBASELIAFBAWoiAUEKRw0BDAoLC0EBIQsgAUEKTw0IA0AgBCABQQJ0aigCAA0IIAFBAWoiAUEKRw0ACwwIC0F/IQ8gAUEBagsiATYCTEEAIQgCQCABLAAAIgxBIGsiBkEfSw0AQQEgBnQiBkGJ0QRxRQ0AA0ACQCAFIAFBAWoiCDYCTCABLAABIgxBIGsiAUEgTw0AQQEgAXQiAUGJ0QRxRQ0AIAEgBnIhBiAIIQEMAQsLIAghASAGIQgLAkAgDEEqRgRAIAUCfwJAIAEsAAFBMGtBCk8NACAFKAJMIgEtAAJBJEcNACABLAABQQJ0IARqQcABa0EKNgIAIAEsAAFBA3QgA2pBgANrKAIAIQpBASERIAFBA2oMAQsgEQ0IQQAhEUEAIQogAARAIAIgAigCACIBQQRqNgIAIAEoAgAhCgsgBSgCTEEBagsiATYCTCAKQX9KDQFBACAKayEKIAhBgMAAciEIDAELIAVBzABqEKcBIgpBAEgNBiAFKAJMIQELQX8hCQJAIAEtAABBLkcNACABLQABQSpGBEACQCABLAACQTBrQQpPDQAgBSgCTCIBLQADQSRHDQAgASwAAkECdCAEakHAAWtBCjYCACABLAACQQN0IANqQYADaygCACEJIAUgAUEEaiIBNgJMDAILIBENByAABH8gAiACKAIAIgFBBGo2AgAgASgCAAVBAAshCSAFIAUoAkxBAmoiATYCTAwBCyAFIAFBAWo2AkwgBUHMAGoQpwEhCSAFKAJMIQELQQAhBgNAIAYhEkF/IQsgASwAAEHBAGtBOUsNByAFIAFBAWoiDDYCTCABLAAAIQYgDCEBIAYgEkE6bGpB74IBai0AACIGQQFrQQhJDQALIAZBE0YNAiAGRQ0GIA9BAE4EQCAEIA9BAnRqIAY2AgAgBSADIA9BA3RqKQMANwNADAQLIAANAQtBACELDAULIAVBQGsgBiACEKgBIAUoAkwhDAwCCyAPQX9KDQMLQQAhASAARQ0ECyAIQf//e3EiDiAIIAhBgMAAcRshBkEAIQtBpAghDyAQIQgCQAJAAkACfwJAAkACQAJAAn8CQAJAAkACQAJAAkACQCAMQQFrLAAAIgFBX3EgASABQQ9xQQNGGyABIBIbIgFB2ABrDiEEEhISEhISEhIOEg8GDg4OEgYSEhISAgUDEhIJEgESEgQACwJAIAFBwQBrDgcOEgsSDg4OAAsgAUHTAEYNCQwRCyAFKQNAIRRBpAgMBQtBACEBAkACQAJAAkACQAJAAkAgEkH/AXEOCAABAgMEFwUGFwsgBSgCQCANNgIADBYLIAUoAkAgDTYCAAwVCyAFKAJAIA2sNwMADBQLIAUoAkAgDTsBAAwTCyAFKAJAIA06AAAMEgsgBSgCQCANNgIADBELIAUoAkAgDaw3AwAMEAsgCUEIIAlBCEsbIQkgBkEIciEGQfgAIQELIBAhByABQSBxIQ4gBSkDQCIUUEUEQANAIAdBAWsiByAUp0EPcUGAhwFqLQAAIA5yOgAAIBRCD1YhDCAUQgSIIRQgDA0ACwsgBSkDQFANAyAGQQhxRQ0DIAFBBHZBpAhqIQ9BAiELDAMLIBAhASAFKQNAIhRQRQRAA0AgAUEBayIBIBSnQQdxQTByOgAAIBRCB1YhByAUQgOIIRQgBw0ACwsgASEHIAZBCHFFDQIgCSAQIAdrIgFBAWogASAJSBshCQwCCyAFKQNAIhRCf1cEQCAFQgAgFH0iFDcDQEEBIQtBpAgMAQsgBkGAEHEEQEEBIQtBpQgMAQtBpghBpAggBkEBcSILGwshDyAUIBAQRCEHCyAGQf//e3EgBiAJQX9KGyEGAkAgBSkDQCIUQgBSDQAgCQ0AQQAhCSAQIQcMCgsgCSAUUCAQIAdraiIBIAEgCUgbIQkMCQsgBSgCQCIBQdgSIAEbIgdBACAJEKsBIgEgByAJaiABGyEIIA4hBiABIAdrIAkgARshCQwICyAJBEAgBSgCQAwCC0EAIQEgAEEgIApBACAGECYMAgsgBUEANgIMIAUgBSkDQD4CCCAFIAVBCGo2AkBBfyEJIAVBCGoLIQhBACEBAkADQCAIKAIAIgdFDQECQCAFQQRqIAcQqgEiB0EASCIODQAgByAJIAFrSw0AIAhBBGohCCAJIAEgB2oiAUsNAQwCCwtBfyELIA4NBQsgAEEgIAogASAGECYgAUUEQEEAIQEMAQtBACEIIAUoAkAhDANAIAwoAgAiB0UNASAFQQRqIAcQqgEiByAIaiIIIAFKDQEgACAFQQRqIAcQIiAMQQRqIQwgASAISw0ACwsgAEEgIAogASAGQYDAAHMQJiAKIAEgASAKSBshAQwFCyAAIAUrA0AgCiAJIAYgAUEXERkAIQEMBAsgBSAFKQNAPAA3QQEhCSATIQcgDiEGDAILQX8hCwsgBUHQAGokACALDwsgAEEgIAsgCCAHayIOIAkgCSAOSBsiDGoiCCAKIAggCkobIgEgCCAGECYgACAPIAsQIiAAQTAgASAIIAZBgIAEcxAmIABBMCAMIA5BABAmIAAgByAOECIgAEEgIAEgCCAGQYDAAHMQJgwACwALkAIBA38CQCABIAIoAhAiBAR/IAQFQQAhBAJ/IAIgAi0ASiIDQQFrIANyOgBKIAIoAgAiA0EIcQRAIAIgA0EgcjYCAEF/DAELIAJCADcCBCACIAIoAiwiAzYCHCACIAM2AhQgAiADIAIoAjBqNgIQQQALDQEgAigCEAsgAigCFCIFa0sEQCACIAAgASACKAIkEQEADwsCfyACLABLQX9KBEAgASEEA0AgASAEIgNFDQIaIAAgA0EBayIEai0AAEEKRw0ACyACIAAgAyACKAIkEQEAIgQgA0kNAiAAIANqIQAgAigCFCEFIAEgA2sMAQsgAQshBCAFIAAgBBAZGiACIAIoAhQgBGo2AhQgASEECyAEC0gCAX8BfiMAQRBrIgMkACADIAA2AgwgAyABNgIIIAMgAjYCBCADKAIMIAMoAgggAygCBCADKAIMQQhqEFchBCADQRBqJAAgBAt3AQF/IwBBEGsiASAANgIIIAFChSo3AwACQCABKAIIRQRAIAFBADYCDAwBCwNAIAEoAggtAAAEQCABIAEoAggtAACtIAEpAwBCIX58Qv////8PgzcDACABIAEoAghBAWo2AggMAQsLIAEgASkDAD4CDAsgASgCDAuHBQEBfyMAQTBrIgUkACAFIAA2AiggBSABNgIkIAUgAjcDGCAFIAM2AhQgBSAENgIQAkACQAJAIAUoAihFDQAgBSgCJEUNACAFKQMYQv///////////wBYDQELIAUoAhBBEkEAEBQgBUEAOgAvDAELIAUoAigoAgBFBEAgBSgCKEGAAiAFKAIQEFlBAXFFBEAgBUEAOgAvDAILCyAFIAUoAiQQdDYCDCAFIAUoAgwgBSgCKCgCAHA2AgggBSAFKAIoKAIQIAUoAghBAnRqKAIANgIEA0ACQCAFKAIERQ0AAkAgBSgCBCgCHCAFKAIMRw0AIAUoAiQgBSgCBCgCABBaDQACQAJAIAUoAhRBCHEEQCAFKAIEKQMIQn9SDQELIAUoAgQpAxBCf1ENAQsgBSgCEEEKQQAQFCAFQQA6AC8MBAsMAQsgBSAFKAIEKAIYNgIEDAELCyAFKAIERQRAIAVBIBAYIgA2AgQgAEUEQCAFKAIQQQ5BABAUIAVBADoALwwCCyAFKAIEIAUoAiQ2AgAgBSgCBCAFKAIoKAIQIAUoAghBAnRqKAIANgIYIAUoAigoAhAgBSgCCEECdGogBSgCBDYCACAFKAIEIAUoAgw2AhwgBSgCBEJ/NwMIIAUoAigiACAAKQMIQgF8NwMIAkAgBSgCKCIAKQMIuiAAKAIAuEQAAAAAAADoP6JkRQ0AIAUoAigoAgBBgICAgHhPDQAgBSgCKCAFKAIoKAIAQQF0IAUoAhAQWUEBcUUEQCAFQQA6AC8MAwsLCyAFKAIUQQhxBEAgBSgCBCAFKQMYNwMICyAFKAIEIAUpAxg3AxAgBUEBOgAvCyAFLQAvQQFxIQAgBUEwaiQAIAALWQIBfwF+AkACf0EAIABFDQAaIACtIAGtfiIDpyICIAAgAXJBgIAESQ0AGkF/IAIgA0IgiKcbCyICEBgiAEUNACAAQQRrLQAAQQNxRQ0AIABBACACEDILIAAL1BEBAX8jAEGwAWsiBiQAIAYgADYCqAEgBiABNgKkASAGIAI2AqABIAYgAzYCnAEgBiAENgKYASAGIAU2ApQBIAZBADYCkAEDQCAGKAKQAUEPS0UEQCAGQSBqIAYoApABQQF0akEAOwEAIAYgBigCkAFBAWo2ApABDAELCyAGQQA2AowBA0AgBigCjAEgBigCoAFPRQRAIAZBIGogBigCpAEgBigCjAFBAXRqLwEAQQF0aiIAIAAvAQBBAWo7AQAgBiAGKAKMAUEBajYCjAEMAQsLIAYgBigCmAEoAgA2AoABIAZBDzYChAEDQAJAIAYoAoQBQQFJDQAgBkEgaiAGKAKEAUEBdGovAQANACAGIAYoAoQBQQFrNgKEAQwBCwsgBigCgAEgBigChAFLBEAgBiAGKAKEATYCgAELAkAgBigChAFFBEAgBkHAADoAWCAGQQE6AFkgBkEAOwFaIAYoApwBIgEoAgAhACABIABBBGo2AgAgACAGQdgAaigBADYBACAGKAKcASIBKAIAIQAgASAAQQRqNgIAIAAgBkHYAGooAQA2AQAgBigCmAFBATYCACAGQQA2AqwBDAELIAZBATYCiAEDQAJAIAYoAogBIAYoAoQBTw0AIAZBIGogBigCiAFBAXRqLwEADQAgBiAGKAKIAUEBajYCiAEMAQsLIAYoAoABIAYoAogBSQRAIAYgBigCiAE2AoABCyAGQQE2AnQgBkEBNgKQAQNAIAYoApABQQ9NBEAgBiAGKAJ0QQF0NgJ0IAYgBigCdCAGQSBqIAYoApABQQF0ai8BAGs2AnQgBigCdEEASARAIAZBfzYCrAEMAwUgBiAGKAKQAUEBajYCkAEMAgsACwsCQCAGKAJ0QQBMDQAgBigCqAEEQCAGKAKEAUEBRg0BCyAGQX82AqwBDAELIAZBADsBAiAGQQE2ApABA0AgBigCkAFBD09FBEAgBigCkAFBAWpBAXQgBmogBigCkAFBAXQgBmovAQAgBkEgaiAGKAKQAUEBdGovAQBqOwEAIAYgBigCkAFBAWo2ApABDAELCyAGQQA2AowBA0AgBigCjAEgBigCoAFJBEAgBigCpAEgBigCjAFBAXRqLwEABEAgBigClAEhASAGKAKkASAGKAKMASICQQF0ai8BAEEBdCAGaiIDLwEAIQAgAyAAQQFqOwEAIABB//8DcUEBdCABaiACOwEACyAGIAYoAowBQQFqNgKMAQwBCwsCQAJAAkACQCAGKAKoAQ4CAAECCyAGIAYoApQBIgA2AkwgBiAANgJQIAZBFDYCSAwCCyAGQYDwADYCUCAGQcDwADYCTCAGQYECNgJIDAELIAZBgPEANgJQIAZBwPEANgJMIAZBADYCSAsgBkEANgJsIAZBADYCjAEgBiAGKAKIATYCkAEgBiAGKAKcASgCADYCVCAGIAYoAoABNgJ8IAZBADYCeCAGQX82AmAgBkEBIAYoAoABdDYCcCAGIAYoAnBBAWs2AlwCQAJAIAYoAqgBQQFGBEAgBigCcEHUBksNAQsgBigCqAFBAkcNASAGKAJwQdAETQ0BCyAGQQE2AqwBDAELA0AgBiAGKAKQASAGKAJ4azoAWQJAIAYoAkggBigClAEgBigCjAFBAXRqLwEAQQFqSwRAIAZBADoAWCAGIAYoApQBIAYoAowBQQF0ai8BADsBWgwBCwJAIAYoApQBIAYoAowBQQF0ai8BACAGKAJITwRAIAYgBigCTCAGKAKUASAGKAKMAUEBdGovAQAgBigCSGtBAXRqLwEAOgBYIAYgBigCUCAGKAKUASAGKAKMAUEBdGovAQAgBigCSGtBAXRqLwEAOwFaDAELIAZB4AA6AFggBkEAOwFaCwsgBkEBIAYoApABIAYoAnhrdDYCaCAGQQEgBigCfHQ2AmQgBiAGKAJkNgKIAQNAIAYgBigCZCAGKAJoazYCZCAGKAJUIAYoAmQgBigCbCAGKAJ4dmpBAnRqIAZB2ABqKAEANgEAIAYoAmQNAAsgBkEBIAYoApABQQFrdDYCaANAIAYoAmwgBigCaHEEQCAGIAYoAmhBAXY2AmgMAQsLAkAgBigCaARAIAYgBigCbCAGKAJoQQFrcTYCbCAGIAYoAmggBigCbGo2AmwMAQsgBkEANgJsCyAGIAYoAowBQQFqNgKMASAGQSBqIAYoApABQQF0aiIBLwEAQQFrIQAgASAAOwEAAkAgAEH//wNxRQRAIAYoApABIAYoAoQBRg0BIAYgBigCpAEgBigClAEgBigCjAFBAXRqLwEAQQF0ai8BADYCkAELAkAgBigCkAEgBigCgAFNDQAgBigCYCAGKAJsIAYoAlxxRg0AIAYoAnhFBEAgBiAGKAKAATYCeAsgBiAGKAJUIAYoAogBQQJ0ajYCVCAGIAYoApABIAYoAnhrNgJ8IAZBASAGKAJ8dDYCdANAAkAgBigChAEgBigCfCAGKAJ4ak0NACAGIAYoAnQgBkEgaiAGKAJ8IAYoAnhqQQF0ai8BAGs2AnQgBigCdEEATA0AIAYgBigCfEEBajYCfCAGIAYoAnRBAXQ2AnQMAQsLIAYgBigCcEEBIAYoAnx0ajYCcAJAAkAgBigCqAFBAUYEQCAGKAJwQdQGSw0BCyAGKAKoAUECRw0BIAYoAnBB0ARNDQELIAZBATYCrAEMBAsgBiAGKAJsIAYoAlxxNgJgIAYoApwBKAIAIAYoAmBBAnRqIAYoAnw6AAAgBigCnAEoAgAgBigCYEECdGogBigCgAE6AAEgBigCnAEoAgAgBigCYEECdGogBigCVCAGKAKcASgCAGtBAnU7AQILDAELCyAGKAJsBEAgBkHAADoAWCAGIAYoApABIAYoAnhrOgBZIAZBADsBWiAGKAJUIAYoAmxBAnRqIAZB2ABqKAEANgEACyAGKAKcASIAIAAoAgAgBigCcEECdGo2AgAgBigCmAEgBigCgAE2AgAgBkEANgKsAQsgBigCrAEhACAGQbABaiQAIAALsQIBAX8jAEEgayIDJAAgAyAANgIYIAMgATYCFCADIAI2AhAgAyADKAIYKAIENgIMIAMoAgwgAygCEEsEQCADIAMoAhA2AgwLAkAgAygCDEUEQCADQQA2AhwMAQsgAygCGCIAIAAoAgQgAygCDGs2AgQgAygCFCADKAIYKAIAIAMoAgwQGRoCQCADKAIYKAIcKAIYQQFGBEAgAygCGCgCMCADKAIUIAMoAgwQPiEAIAMoAhggADYCMAwBCyADKAIYKAIcKAIYQQJGBEAgAygCGCgCMCADKAIUIAMoAgwQGiEAIAMoAhggADYCMAsLIAMoAhgiACADKAIMIAAoAgBqNgIAIAMoAhgiACADKAIMIAAoAghqNgIIIAMgAygCDDYCHAsgAygCHCEAIANBIGokACAAC+0BAQF/IwBBEGsiASAANgIIAkACQAJAIAEoAghFDQAgASgCCCgCIEUNACABKAIIKAIkDQELIAFBATYCDAwBCyABIAEoAggoAhw2AgQCQAJAIAEoAgRFDQAgASgCBCgCACABKAIIRw0AIAEoAgQoAgRBKkYNASABKAIEKAIEQTlGDQEgASgCBCgCBEHFAEYNASABKAIEKAIEQckARg0BIAEoAgQoAgRB2wBGDQEgASgCBCgCBEHnAEYNASABKAIEKAIEQfEARg0BIAEoAgQoAgRBmgVGDQELIAFBATYCDAwBCyABQQA2AgwLIAEoAgwL0gQBAX8jAEEgayIDIAA2AhwgAyABNgIYIAMgAjYCFCADIAMoAhxB3BZqIAMoAhRBAnRqKAIANgIQIAMgAygCFEEBdDYCDANAAkAgAygCDCADKAIcKALQKEoNAAJAIAMoAgwgAygCHCgC0ChODQAgAygCGCADKAIcIAMoAgxBAnRqQeAWaigCAEECdGovAQAgAygCGCADKAIcQdwWaiADKAIMQQJ0aigCAEECdGovAQBOBEAgAygCGCADKAIcIAMoAgxBAnRqQeAWaigCAEECdGovAQAgAygCGCADKAIcQdwWaiADKAIMQQJ0aigCAEECdGovAQBHDQEgAygCHCADKAIMQQJ0akHgFmooAgAgAygCHEHYKGpqLQAAIAMoAhxB3BZqIAMoAgxBAnRqKAIAIAMoAhxB2Chqai0AAEoNAQsgAyADKAIMQQFqNgIMCyADKAIYIAMoAhBBAnRqLwEAIAMoAhggAygCHEHcFmogAygCDEECdGooAgBBAnRqLwEASA0AAkAgAygCGCADKAIQQQJ0ai8BACADKAIYIAMoAhxB3BZqIAMoAgxBAnRqKAIAQQJ0ai8BAEcNACADKAIQIAMoAhxB2Chqai0AACADKAIcQdwWaiADKAIMQQJ0aigCACADKAIcQdgoamotAABKDQAMAQsgAygCHEHcFmogAygCFEECdGogAygCHEHcFmogAygCDEECdGooAgA2AgAgAyADKAIMNgIUIAMgAygCDEEBdDYCDAwBCwsgAygCHEHcFmogAygCFEECdGogAygCEDYCAAvXEwEDfyMAQTBrIgIkACACIAA2AiwgAiABNgIoIAIgAigCKCgCADYCJCACIAIoAigoAggoAgA2AiAgAiACKAIoKAIIKAIMNgIcIAJBfzYCECACKAIsQQA2AtAoIAIoAixBvQQ2AtQoIAJBADYCGANAIAIoAhggAigCHEgEQAJAIAIoAiQgAigCGEECdGovAQAEQCACIAIoAhgiATYCECACKAIsQdwWaiEDIAIoAiwiBCgC0ChBAWohACAEIAA2AtAoIABBAnQgA2ogATYCACACKAIYIAIoAixB2ChqakEAOgAADAELIAIoAiQgAigCGEECdGpBADsBAgsgAiACKAIYQQFqNgIYDAELCwNAIAIoAiwoAtAoQQJIBEACQCACKAIQQQJIBEAgAiACKAIQQQFqIgA2AhAMAQtBACEACyACKAIsQdwWaiEDIAIoAiwiBCgC0ChBAWohASAEIAE2AtAoIAFBAnQgA2ogADYCACACIAA2AgwgAigCJCACKAIMQQJ0akEBOwEAIAIoAgwgAigCLEHYKGpqQQA6AAAgAigCLCIAIAAoAqgtQQFrNgKoLSACKAIgBEAgAigCLCIAIAAoAqwtIAIoAiAgAigCDEECdGovAQJrNgKsLQsMAQsLIAIoAiggAigCEDYCBCACIAIoAiwoAtAoQQJtNgIYA0AgAigCGEEBTgRAIAIoAiwgAigCJCACKAIYEHogAiACKAIYQQFrNgIYDAELCyACIAIoAhw2AgwDQCACIAIoAiwoAuAWNgIYIAIoAixB3BZqIQEgAigCLCIDKALQKCEAIAMgAEEBazYC0CggAigCLCAAQQJ0IAFqKAIANgLgFiACKAIsIAIoAiRBARB6IAIgAigCLCgC4BY2AhQgAigCGCEBIAIoAixB3BZqIQMgAigCLCIEKALUKEEBayEAIAQgADYC1CggAEECdCADaiABNgIAIAIoAhQhASACKAIsQdwWaiEDIAIoAiwiBCgC1ChBAWshACAEIAA2AtQoIABBAnQgA2ogATYCACACKAIkIAIoAgxBAnRqIAIoAiQgAigCGEECdGovAQAgAigCJCACKAIUQQJ0ai8BAGo7AQAgAigCDCACKAIsQdgoamoCfyACKAIYIAIoAixB2Chqai0AACACKAIUIAIoAixB2Chqai0AAE4EQCACKAIYIAIoAixB2Chqai0AAAwBCyACKAIUIAIoAixB2Chqai0AAAtBAWo6AAAgAigCJCACKAIUQQJ0aiACKAIMIgA7AQIgAigCJCACKAIYQQJ0aiAAOwECIAIgAigCDCIAQQFqNgIMIAIoAiwgADYC4BYgAigCLCACKAIkQQEQeiACKAIsKALQKEECTg0ACyACKAIsKALgFiEBIAIoAixB3BZqIQMgAigCLCIEKALUKEEBayEAIAQgADYC1CggAEECdCADaiABNgIAIAIoAighASMAQUBqIgAgAigCLDYCPCAAIAE2AjggACAAKAI4KAIANgI0IAAgACgCOCgCBDYCMCAAIAAoAjgoAggoAgA2AiwgACAAKAI4KAIIKAIENgIoIAAgACgCOCgCCCgCCDYCJCAAIAAoAjgoAggoAhA2AiAgAEEANgIEIABBADYCEANAIAAoAhBBD0wEQCAAKAI8QbwWaiAAKAIQQQF0akEAOwEAIAAgACgCEEEBajYCEAwBCwsgACgCNCAAKAI8QdwWaiAAKAI8KALUKEECdGooAgBBAnRqQQA7AQIgACAAKAI8KALUKEEBajYCHANAIAAoAhxBvQRIBEAgACAAKAI8QdwWaiAAKAIcQQJ0aigCADYCGCAAIAAoAjQgACgCNCAAKAIYQQJ0ai8BAkECdGovAQJBAWo2AhAgACgCECAAKAIgSgRAIAAgACgCIDYCECAAIAAoAgRBAWo2AgQLIAAoAjQgACgCGEECdGogACgCEDsBAiAAKAIYIAAoAjBMBEAgACgCPCAAKAIQQQF0akG8FmoiASABLwEAQQFqOwEAIABBADYCDCAAKAIYIAAoAiROBEAgACAAKAIoIAAoAhggACgCJGtBAnRqKAIANgIMCyAAIAAoAjQgACgCGEECdGovAQA7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EANAIAMpAxAgAykDCFpFBEAgAygCKCgCACADKQMQp0EEdGoQkAEgAyADKQMQQgF8NwMQDAELCyADKAIoIAMpAwgiATcDECADKAIoIAE3AwggA0EBOgAvCyADLQAvQQFxIQAgA0EwaiQAIAALzAEBAX8jAEEgayICJAAgAiAANwMQIAIgATYCDCACQTAQGCIBNgIIAkAgAUUEQCACKAIMQQ5BABAUIAJBADYCHAwBCyACKAIIQQA2AgAgAigCCEIANwMQIAIoAghCADcDCCACKAIIQgA3AyAgAigCCEIANwMYIAIoAghBADYCKCACKAIIQQA6ACwgAigCCCACKQMQIAIoAgwQgwFBAXFFBEAgAigCCBAkIAJBADYCHAwBCyACIAIoAgg2AhwLIAIoAhwhASACQSBqJAAgAQvWAgEBfyMAQSBrIgMkACADIAA2AhggAyABNgIUIAMgAjYCECADIANBDGpCBBApNgIIAkAgAygCCEUEQCADQX82AhwMAQsDQCADKAIUBEAgAygCFCgCBCADKAIQcUGABnEEQCADKAIIQgAQLBogAygCCCADKAIULwEIEB8gAygCCCADKAIULwEKEB8CfyMAQRBrIgAgAygCCDYCDCAAKAIMLQAAQQFxRQsEQCADKAIYQQhqQRRBABAUIAMoAggQFiADQX82AhwMBAsgAygCGCADQQxqQgQQNUEASARAIAMoAggQFiADQX82AhwMBAsgAygCFC8BCgRAIAMoAhggAygCFCgCDCADKAIULwEKrRA1QQBIBEAgAygCCBAWIANBfzYCHAwFCwsLIAMgAygCFCgCADYCFAwBCwsgAygCCBAWIANBADYCHAsgAygCHCEAIANBIGokACAAC2gBAX8jAEEQayICIAA2AgwgAiABNgIIIAJBADsBBgNAIAIoAgwEQCACKAIMKAIEIAIoAghxQYAGcQRAIAIgAigCDC8BCiACLwEGQQRqajsBBgsgAiACKAIMKAIANgIMDAELCyACLwEGC/ABAQF/IwBBEGsiASQAIAEgADYCDCABIAEoAgw2AgggAUEANgIEA0AgASgCDARAAkACQCABKAIMLwEIQfXGAUYNACABKAIMLwEIQfXgAUYNACABKAIMLwEIQYGyAkYNACABKAIMLwEIQQFHDQELIAEgASgCDCgCADYCACABKAIIIAEoAgxGBEAg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IAEpA4ABIAEpAzB8IAEpA5gBIAEpAzh8VgRAIAEoApABQRVBABAUIAFBADYCrAEMAQsCQCABKAKUAUEEcUUNACABKQOAASABKQMwfCABKQOYASABKQM4fFENACABKAKQAUEVQQAQFCABQQA2AqwBDAELIAEpAyggASkDMEIugFYEQCABKAKQAUEVQQAQFCABQQA2AqwBDAELIAEgASkDKCABKAKQARCEASIFNgKMASAFRQRAIAFBADYCrAEMAQsgASgCjAFBAToALCABKAKMASABKQMwNwMYIAEoAowBIAEpA4ABNwMgIAEgASgCjAE2AqwBCyABKAKsASEFIAFBsAFqJAAgACAFNgJQDAELIAAoAmQgACkDMBAsGiAAKAJkIQUgACkDWCEJIAAoAmgoAhQhBiAAKAJUIQcjAEHQAGsiASQAIAEgBTYCSCABIAk3A0AgASAGNgI8IAEgBzYCOAJAIAEoAkgQL0IWVARAIAEoAjhBFUEAEBQgAUEANgJMDAELIwBBEGsiBSABKAJINgIMIAECfiAFKAIMLQAAQQFxBEAgBSgCDCkDEAwBC0IACzcDCCABKAJIQgQQHhogASgCSBAqBEAgASgCOEEBQQAQFCABQQA2AkwMAQsgASABKAJIEB1B//8Dca03AyggASABKAJIEB1B//8Dca03AyAgASkDICABKQMoUgRAIAEoAjhBE0EAEBQgAUEANgJMDAELIAEgASgCSBAqrTcDGCABIAEoAkgQKq03AxAgASkDECABKQMQIAEpAxh8VgRAIAEoAjhBBEEWEBQgAUEANgJMDAELIAEpAxAgASkDGHwgASkDQCABKQMIfFYEQCABKAI4QRVBABAUIAFBADYCTAwBCwJAIAEoAjxBBHFFDQAgASkDECABKQMYfCABKQNAIAEpAwh8UQ0AIAEoAjhBFUEAEBQgAUEANgJMDAELIAEgASkDICABKAI4EIQBIgU2AjQgBUUEQCABQQA2AkwMAQsgASgCNEEAOgAsIAEoAjQgASkDGDcDGCABKAI0IAEpAxA3AyAgASABKAI0NgJMCyABKAJMIQUgAUHQAGokACAAIAU2AlALIAAoAlBFBEAgAEEANgJsDAELIAAoAmQgACkDMEIUfBAsGiAAIAAoAmQQHTsBTiAAKAJQKQMgIAAoAlApAxh8IAApA1ggACkDMHxWBEAgACgCVEEVQQAQFCAAKAJQECQgAEEANgJsDAELAkAgAC8BTkUEQCAAKAJoKAIEQQRxRQ0BCyAAKAJkIAApAzBCFnwQLBogACAAKAJkEC83AyACQCAAKQMgIAAvAU6tWgRAIAAoAmgoAgRBBHFFDQEgACkDICAALwFOrVENAQsgACgCVEEVQQAQFCAAKAJQECQgAEEANgJsDAILIAAvAU4EQCAAKAJkIAAvAU6tEB4gAC8BTkEAIAAoAlQQUiEBIAAoAlAgATYCKCABRQRAIAAoAlAQJCAAQQA2AmwMAwsLCwJAIAAoAlApAyAgACkDWFoEQCAAKAJkIAAoAlApAyAgACkDWH0QLBogACAAKAJkIAAoAlApAxgQHiIBNgIcIAFFBEAgACgCVEEVQQAQFCAAKAJQECQgAEEANgJsDAMLIAAgACgCHCAAKAJQKQMYECkiATYCLCABRQRAIAAoAlRBDkEAEBQgACgCUBAkIABBADYCbAwDCwwBCyAAQQA2AiwgACgCaCgCACAAKAJQKQMgQQAQJ0EASARAIAAoAlQgACgCaCgCABAXIAAoAlAQJCAAQQA2AmwMAgsgACgCaCgCABBKIAAoAlApAyBSBEAgACgCVEETQQAQFCAAKAJQECQgAEEANgJsDAILCyAAIAAoAlApAxg3AzggAEIANwNAA0ACQCAAKQM4UA0AIABBADoAGyAAKQNAIAAoAlApAwhRBEAgACgCUC0ALEEBcQ0BIAApAzhCLlQNASAAKAJQQoCABCAAKAJUEIMBQQFxRQRAIAAoAlAQJCAAKAIsEBYgAEEANgJsDAQLIABBAToAGwsjAEEQayIBJAAgAUHYABAYIgU2AggCQCAFRQRAIAFBADYCDAwBCyABKAIIEE8gASABKAIINgIMCyABKAIMIQUgAUEQaiQAIAUhASAAKAJQKAIAIAApA0CnQQR0aiABNgIAAkAgAQRAIAAgACgCUCgCACAAKQNAp0EEdGooAgAgACgCaCgCACAAKAIsQQAgACgCVBDGASIJNwMQIAlCAFkNAQsCQCAALQAbQQFxRQ0AIwBBEGsiASAAKAJUNgIMIAEoAgwoAgBBE0cNACAAKAJUQRVBABAUCyAAKAJQECQgACgCLBAWIABBADYCbAwDCyAAIAApA0BCAXw3A0AgACAAKQM4IAApAxB9NwM4DAELCwJAIAApA0AgACgCUCkDCFEEQCAAKQM4UA0BCyAAKAJUQRVBABAUIAAoAiwQFiAAKAJQECQgAEEANgJsDAELIAAoAmgoAgRBBHEEQAJAIAAoAiwEQCAAIAAoAiwQR0EBcToADwwBCyAAIAAoAmgoAgAQSjcDACAAKQMAQgBTBEAgACgCVCAAKAJoKAIAEBcgACgCUBAkIABBADYCbAwDCyAAIAApAwAgACgCUCkDICAAKAJQKQMYfFE6AA8LIAAtAA9BAXFFBEAgACgCVEEVQQAQFCAAKAIsEBYgACgCUBAkIABBADYCbAwCCwsgACgCLBAWIAAgACgCUDYCbAsgACgCbCEBIABB8ABqJAAgAiABNgJIIAEEQAJAIAIoAkwEQCACKQMgQgBXBEAgAiACKAJYIAIoAkwgAkEQahBpNwMgCyACIAIoAlggAigCSCACQRBqEGk3AygCQCACKQMgIAIpAyhTBEAgAigCTBAkIAIgAigCSDYCTCACIAIpAyg3AyAMAQsgAigCSBAkCwwBCyACIAIoAkg2AkwCQCACKAJYKAIEQQRxBEAgAiACKAJYIAIoAkwgAkEQahBpNwMgDAELIAJCADcDIAsLIAJBADYCSAsgAiACKAJEQQFqNgJEIAIoAgwgAigCRAJ/IwBBEGsiACACKAIMNgIMIAAoAgwoAgQLa6wQLBoMAQsLIAIoAgwQFiACKQMgQgBTBEAgAigCWEEIaiACQRBqEEMgAigCTBAkIAJBADYCXAwBCyACIAIoAkw2AlwLIAIoAlwhACACQeAAaiQAIAMgADYCWCAARQRAIAMoAmAgAygCXEEIahBDIwBBEGsiACADKAJoNgIMIAAoAgwiACAAKAIwQQFqNgIwIAMoAlwQPSADQQA2AmwMAQsgAygCXCADKAJYKAIANgJAIAMoAlwgAygCWCkDCDcDMCADKAJcIAMoAlgpAxA3AzggAygCXCADKAJYKAIoNgIgIAMoAlgQFSADKAJcKAJQIQAgAygCXCkDMCEJIAMoAlxBCGohAiMAQSBrIgEkACABIAA2AhggASAJNwMQIAEgAjYCDAJAIAEpAxBQBEAgAUEBOgAfDAELIwBBIGsiACABKQMQNwMQIAAgACkDELpEAAAAAAAA6D+jOQMIAkAgACsDCEQAAOD////vQWQEQCAAQX82AgQMAQsgAAJ/IAArAwgiCkQAAAAAAADwQWMgCkQAAAAAAAAAAGZxBEAgCqsMAQtBAAs2AgQLAkAgACgCBEGAgICAeEsEQCAAQYCAgIB4NgIcDAELIAAgACgCBEEBazYCBCAAIAAoAgQgACgCBEEBdnI2AgQgACAAKAIEIAAoAgRBAnZyNgIEIAAgACgCBCAAKAIEQQR2cjYCBCAAIAAoAgQgACgCBEEIdnI2AgQgACAAKAIEIAAoAgRBEHZyNgIEIAAgACgCBEEBajYCBCAAIAAoAgQ2AhwLIAEgACgCHDYCCCABKAIIIAEoAhgoAgBNBEAgAUEBOgAfDAELIAEoAhggASgCCCABKAIMEFlBAXFFBEAgAUEAOgAfDAELIAFBAToAHwsgAS0AHxogAUEgaiQAIANCADcDEANAIAMpAxAgAygCXCkDMFQEQCADIAMoAlwoAkAgAykDEKdBBHRqKAIAKAIwQQBBACADKAJgEEY2AgwgAygCDEUEQCMAQRBrIgAgAygCaDYCDCAAKAIMIgAgACgCMEEBajYCMCADKAJcED0gA0EANgJsDAMLIAMoAlwoAlAgAygCDCADKQMQQQggAygCXEEIahB1QQFxRQRAAkAgAygCXCgCCEEKRgRAIAMoAmRBBHFFDQELIAMoAmAgAygCXEEIahBDIwBBEGsiACADKAJoNgIMIAAoAgwiACAAKAIwQQFqNgIwIAMoAlwQPSADQQA2AmwMBAsLIAMgAykDEEIBfDcDEAwBCwsgAygCXCADKAJcKAIUNgIYIAMgAygCXDYCbAsgAygCbCEAIANB8ABqJAAgBCAANgI4CyAEKAI4RQRAIAQoAlgQMRogBEEANgJcDAELIAQgBCgCODYCXAsgBCgCXCEAIARB4ABqJAAgAAuOAQEBfyMAQRBrIgIkACACIAA2AgwgAiABNgIIIAJBADYCBCACKAIIBEAjAEEQayIAIAIoAgg2AgwgAiAAKAIMKAIANgIEIAIoAggQlgFBAUYEQCMAQRBrIgAgAigCCDYCDEG0mwEgACgCDCgCBDYCAAsLIAIoAgwEQCACKAIMIAIoAgQ2AgALIAJBEGokAAuVAQEBfyMAQRBrIgEkACABIAA2AggCQAJ/IwBBEGsiACABKAIINgIMIAAoAgwpAxhCgIAQg1ALBEAgASgCCCgCAARAIAEgASgCCCgCABCeAUEBcToADwwCCyABQQE6AA8MAQsgASABKAIIQQBCAEESECE+AgQgASABKAIEQQBHOgAPCyABLQAPQQFxIQAgAUEQaiQAIAALfwEBfyMAQSBrIgMkACADIAA2AhggAyABNwMQIANBADYCDCADIAI2AggCQCADKQMQQv///////////wBWBEAgAygCCEEEQT0QFCADQX82AhwMAQsgAyADKAIYIAMpAxAgAygCDCADKAIIEGs2AhwLIAMoAhwhACADQSBqJAAgAAt9ACACQQFGBEAgASAAKAIIIAAoAgRrrH0hAQsCQCAAKAIUIAAoAhxLBEAgAEEAQQAgACgCJBEBABogACgCFEUNAQsgAEEANgIcIABCADcDECAAIAEgAiAAKAIoEQ8AQgBTDQAgAEIANwIEIAAgACgCAEFvcTYCAEEADwtBfwvhAgECfyMAQSBrIgMkAAJ/AkACQEGnEiABLAAAEKIBRQRAQbSbAUEcNgIADAELQZgJEBgiAg0BC0EADAELIAJBAEGQARAyIAFBKxCiAUUEQCACQQhBBCABLQAAQfIARhs2AgALAkAgAS0AAEHhAEcEQCACKAIAIQEMAQsgAEEDQQAQBCIBQYAIcUUEQCADIAFBgAhyNgIQIABBBCADQRBqEAQaCyACIAIoAgBBgAFyIgE2AgALIAJB/wE6AEsgAkGACDYCMCACIAA2AjwgAiACQZgBajYCLAJAIAFBCHENACADIANBGGo2AgAgAEGTqAEgAxAODQAgAkEKOgBLCyACQRo2AiggAkEbNgIkIAJBHDYCICACQR02AgxB6J8BKAIARQRAIAJBfzYCTAsgAkGsoAEoAgA2AjhBrKABKAIAIgAEQCAAIAI2AjQLQaygASACNgIAIAILIQAgA0EgaiQAIAAL8AEBAn8CfwJAIAFB/wFxIgMEQCAAQQNxBEADQCAALQAAIgJFDQMgAiABQf8BcUYNAyAAQQFqIgBBA3ENAAsLAkAgACgCACICQX9zIAJBgYKECGtxQYCBgoR4cQ0AIANBgYKECGwhAwNAIAIgA3MiAkF/cyACQYGChAhrcUGAgYKEeHENASAAKAIEIQIgAEEEaiEAIAJBgYKECGsgAkF/c3FBgIGChHhxRQ0ACwsDQCAAIgItAAAiAwRAIAJBAWohACADIAFB/wFxRw0BCwsgAgwCCyAAECsgAGoMAQsgAAsiAEEAIAAtAAAgAUH/AXFGGwsYACAAKAJMQX9MBEAgABCkAQ8LIAAQpAELYAIBfgJ/IAAoAighAkEBIQMgAEIAIAAtAABBgAFxBH9BAkEBIAAoAhQgACgCHEsbBUEBCyACEQ8AIgFCAFkEfiAAKAIUIAAoAhxrrCABIAAoAgggACgCBGusfXwFIAELC2sBAX8gAARAIAAoAkxBf0wEQCAAEG8PCyAAEG8PC0GwoAEoAgAEQEGwoAEoAgAQpQEhAQtBrKABKAIAIgAEQANAIAAoAkwaIAAoAhQgACgCHEsEQCAAEG8gAXIhAQsgACgCOCIADQALCyABCyIAIAAgARACIgBBgWBPBH9BtJsBQQAgAGs2AgBBfwUgAAsLUwEDfwJAIAAoAgAsAABBMGtBCk8NAANAIAAoAgAiAiwAACEDIAAgAkEBajYCACABIANqQTBrIQEgAiwAAUEwa0EKTw0BIAFBCmwhAQwACwALIAELuwIAAkAgAUEUSw0AAkACQAJAAkACQAJAAkACQAJAAkAgAUEJaw4KAAECAwQFBgcICQoLIAIgAigCACIBQQRqNgIAIAAgASgCADYCAA8LIAIgAigCACIBQQRqNgIAIAAgATQCADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATUCADcDAA8LIAIgAigCAEEHakF4cSIBQQhqNgIAIAAgASkDADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATIBADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATMBADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATAAADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATEAADcDAA8LIAIgAigCAEEHakF4cSIBQQhqNgIAIAAgASsDADkDAA8LIAAgAkEYEQQACwt/AgF/AX4gAL0iA0I0iKdB/w9xIgJB/w9HBHwgAkUEQCABIABEAAAAAAAAAABhBH9BAAUgAEQAAAAAAADwQ6IgARCpASEAIAEoAgBBQGoLNgIAIAAPCyABIAJB/gdrNgIAIANC/////////4eAf4NCgICAgICAgPA/hL8FIAALC5sCACAARQRAQQAPCwJ/AkAgAAR/IAFB/wBNDQECQEGQmQEoAgAoAgBFBEAgAUGAf3FBgL8DRg0DDAELIAFB/w9NBEAgACABQT9xQYABcjoAASAAIAFBBnZBwAFyOgAAQQIMBAsgAUGAsANPQQAgAUGAQHFBgMADRxtFBEAgACABQT9xQYABcjoAAiAAIAFBDHZB4AFyOgAAIAAgAUEGdkE/cUGAAXI6AAFBAwwECyABQYCABGtB//8/TQRAIAAgAUE/cUGAAXI6AAMgACABQRJ2QfABcjoAACAAIAFBBnZBP3FBgAFyOgACIAAgAUEMdkE/cUGAAXI6AAFBBAwECwtBtJsBQRk2AgBBfwVBAQsMAQsgACABOgAAQQELC+MBAQJ/IAJBAEchAwJAAkACQCAAQQNxRQ0AIAJFDQAgAUH/AXEhBANAIAAtAAAgBEYNAiACQQFrIgJBAEchAyAAQQFqIgBBA3FFDQEgAg0ACwsgA0UNAQsCQCAALQAAIAFB/wFxRg0AIAJBBEkNACABQf8BcUGBgoQIbCEDA0AgACgCACADcyIEQX9zIARBgYKECGtxQYCBgoR4cQ0BIABBBGohACACQQRrIgJBA0sNAAsLIAJFDQAgAUH/AXEhAQNAIAEgAC0AAEYEQCAADwsgAEEBaiEAIAJBAWsiAg0ACwtBAAuLDAEGfyAAIAFqIQUCQAJAIAAoAgQiAkEBcQ0AIAJBA3FFDQEgACgCACICIAFqIQECQCAAIAJrIgBBzJsBKAIARwRAIAJB/wFNBEAgACgCCCIEIAJBA3YiAkEDdEHgmwFqRhogACgCDCIDIARHDQJBuJsBQbibASgCAEF+IAJ3cTYCAAwDCyAAKAIYIQYCQCAAIAAoAgwiA0cEQCAAKAIIIgJByJsBKAIASRogAiADNgIMIAMgAjYCCAwBCwJAIABBFGoiAigCACIEDQAgAEEQaiICKAIAIgQNAEEAIQMMAQsDQCACIQcgBCIDQRRqIgIoAgAiBA0AIANBEGohAiADKAIQIgQNAAsgB0EANgIACyAGRQ0CAkAgACAAKAIcIgRBAnRB6J0BaiICKAIARgRAIAIgAzYCACADDQFBvJsBQbybASgCAEF+IAR3cTYCAAwECyAGQRBBFCAGKAIQIABGG2ogAzYCACADRQ0DCyADIAY2AhggACgCECICBEAgAyACNgIQIAIgAzYCGAsgACgCFCICRQ0CIAMgAjYCFCACIAM2AhgMAgsgBSgCBCICQQNxQQNHDQFBwJsBIAE2AgAgBSACQX5xNgIEIAAgAUEBcjYCBCAFIAE2AgAPCyAEIAM2AgwgAyAENgIICwJAIAUoAgQiAkECcUUEQCAFQdCbASgCAEYEQEHQmwEgADYCAEHEmwFBxJsBKAIAIAFqIgE2AgAgACABQQFyNgIEIABBzJsBKAIARw0DQcCbAUEANgIAQcybAUEANgIADwsgBUHMmwEoAgBGBEBBzJsBIAA2AgBBwJsBQcCbASgCACABaiIBNgIAIAAgAUEBcjYCBCAAIAFqIAE2AgAPCyACQXhxIAFqIQECQCACQf8BTQRAIAUoAggiBCACQQN2IgJBA3RB4JsBakYaIAQgBSgCDCIDRgRAQbibAUG4mwEoAgBBfiACd3E2AgAMAgsgBCADNgIMIAMgBDYCCAwBCyAFKAIYIQYCQCAFIAUoAgwiA0cEQCAFKAIIIgJByJsBKAIASRogAiADNgIMIAMgAjYCCAwBCwJAIAVBFGoiBCgCACICDQAgBUEQaiIEKAIAIgINAEEAIQMMAQsDQCAEIQcgAiIDQRRqIgQoAgAiAg0AIANBEGohBCADKAIQIgINAAsgB0EANgIACyAGRQ0AAkAgBSAFKAIcIgRBAnRB6J0BaiICKAIARgRAIAIgAzYCACADDQFBvJsBQbybASgCAEF+IAR3cTYCAAwCCyAGQRBBFCAGKAIQIAVGG2ogAzYCACADRQ0BCyADIAY2AhggBSgCECICBEAgAyACNgIQIAIgAzYCGAsgBSgCFCICRQ0AIAMgAjYCFCACIAM2AhgLIAAgAUEBcjYCBCAAIAFqIAE2AgAgAEHMmwEoAgBHDQFBwJsBIAE2AgAPCyAFIAJBfnE2AgQgACABQQFyNgIEIAAgAWogATYCAAsgAUH/AU0EQCABQQN2IgJBA3RB4JsBaiEBAn9BuJsBKAIAIgNBASACdCICcUUEQEG4mwEgAiADcjYCACABDAELIAEoAggLIQIgASAANgIIIAIgADYCDCAAIAE2AgwgACACNgIIDwtBHyECIABCADcCECABQf///wdNBEAgAUEIdiICIAJBgP4/akEQdkEIcSIEdCICIAJBgOAfakEQdkEEcSIDdCICIAJBgIAPakEQdkECcSICdEEPdiADIARyIAJyayICQQF0IAEgAkEVanZBAXFyQRxqIQILIAAgAjYCHCACQQJ0QeidAWohBwJAAkBBvJsBKAIAIgRBASACdCIDcUUEQEG8mwEgAyAEcjYCACAHIAA2AgAgACAHNgIYDAELIAFBAEEZIAJBAXZrIAJBH0YbdCECIAcoAgAhAwNAIAMiBCgCBEF4cSABRg0CIAJBHXYhAyACQQF0IQIgBCADQQRxaiIHQRBqKAIAIgMNAAsgByAANgIQIAAgBDYCGAsgACAANgIMIAAgADYCCA8LIAQoAggiASAANgIMIAQgADYCCCAAQQA2AhggACAENgIMIAAgATYCCAsL+QIBAX8jAEEgayIEJAAgBCAANgIYIAQgATcDECAEIAI2AgwgBCADNgIIIAQgBCgCGCAEKAIYIAQpAxAgBCgCDCAEKAIIEK4BIgA2AgACQCAARQRAIARBADYCHAwBCyAEKAIAEElBAEgEQCAEKAIYQQhqIAQoAgAQFyAEKAIAEBsgBEEANgIcDAELIAQoAhghAiMAQRBrIgAkACAAIAI2AgggAEEYEBgiAjYCBAJAIAJFBEAgACgCCEEIakEOQQAQFCAAQQA2AgwMAQsgACgCBCAAKAIINgIAIwBBEGsiAiAAKAIEQQRqNgIMIAIoAgxBADYCACACKAIMQQA2AgQgAigCDEEANgIIIAAoAgRBADoAECAAKAIEQQA2AhQgACAAKAIENgIMCyAAKAIMIQIgAEEQaiQAIAQgAjYCBCACRQRAIAQoAgAQGyAEQQA2AhwMAQsgBCgCBCAEKAIANgIUIAQgBCgCBDYCHAsgBCgCHCEAIARBIGokACAAC7cOAgN/AX4jAEHAAWsiBSQAIAUgADYCuAEgBSABNgK0ASAFIAI3A6gBIAUgAzYCpAEgBUIANwOYASAFQgA3A5ABIAUgBDYCjAECQCAFKAK4AUUEQCAFQQA2ArwBDAELAkAgBSgCtAEEQCAFKQOoASAFKAK0ASkDMFQNAQsgBSgCuAFBCGpBEkEAEBQgBUEANgK8AQwBCwJAIAUoAqQBQQhxDQAgBSgCtAEoAkAgBSkDqAGnQQR0aigCCEUEQCAFKAK0ASgCQCAFKQOoAadBBHRqLQAMQQFxRQ0BCyAFKAK4AUEIakEPQQAQFCAFQQA2ArwBDAELIAUoArQBIAUpA6gBIAUoAqQBQQhyIAVByABqEH9BAEgEQCAFKAK4AUEIakEUQQAQFCAFQQA2ArwBDAELIAUoAqQBQSBxBEAgBSAFKAKkAUEEcjYCpAELAkAgBSkDmAFQBEAgBSkDkAFQDQELIAUoAqQBQQRxRQ0AIAUoArgBQQhqQRJBABAUIAVBADYCvAEMAQsCQCAFKQOYAVAEQCAFKQOQAVANAQsgBSkDmAEgBSkDmAEgBSkDkAF8WARAIAUpA2AgBSkDmAEgBSkDkAF8Wg0BCyAFKAK4AUEIakESQQAQFCAFQQA2ArwBDAELIAUpA5ABUARAIAUgBSkDYCAFKQOYAX03A5ABCyAFIAUpA5ABIAUpA2BUOgBHIAUgBSgCpAFBIHEEf0EABSAFLwF6QQBHC0EBcToARSAFIAUoAqQBQQRxBH9BAAUgBS8BeEEARwtBAXE6AEQgBQJ/IAUoAqQBQQRxBEBBACAFLwF4DQEaCyAFLQBHQX9zC0EBcToARiAFLQBFQQFxBEAgBSgCjAFFBEAgBSAFKAK4ASgCHDYCjAELIAUoAowBRQRAIAUoArgBQQhqQRpBABAUIAVBADYCvAEMAgsLIAUpA2hQBEAgBSAFKAK4AUEAQgBBABB+NgK8AQwBCwJAAkAgBS0AR0EBcUUNACAFLQBFQQFxDQAgBS0AREEBcQ0AIAUgBSkDkAE3AyAgBSAFKQOQATcDKCAFQQA7ATggBSAFKAJwNgIwIAVC3AA3AwggBSAFKAK0ASgCACAFKQOYASAFKQOQASAFQQhqQQAgBSgCtAEgBSkDqAEgBSgCuAFBCGoQZCIANgKIAQwBCyAFIAUoArQBIAUpA6gBIAUoAqQBIAUoArgBQQhqEEUiADYCBCAARQRAIAVBADYCvAEMAgsgBSAFKAK0ASgCAEIAIAUpA2ggBUHIAGogBSgCBC8BDEEBdkEDcSAFKAK0ASAFKQOoASAFKAK4AUEIahBkIgA2AogBCyAARQRAIAVBADYCvAEMAQsCfyAFKAKIASEAIAUoArQBIQMjAEEQayIBJAAgASAANgIMIAEgAzYCCCABKAIMIAEoAgg2AiwgASgCCCEDIAEoAgwhBCMAQSBrIgAkACAAIAM2AhggACAENgIUAkAgACgCGCgCSCAAKAIYKAJEQQFqTQRAIAAgACgCGCgCSEEKajYCDCAAIAAoAhgoAkwgACgCDEECdBBINgIQIAAoAhBFBEAgACgCGEEIakEOQQAQFCAAQX82AhwMAgsgACgCGCAAKAIMNgJIIAAoAhggACgCEDYCTAsgACgCFCEEIAAoAhgoAkwhBiAAKAIYIgcoAkQhAyAHIANBAWo2AkQgA0ECdCAGaiAENgIAIABBADYCHAsgACgCHCEDIABBIGokACABQRBqJAAgA0EASAsEQCAFKAKIARAbIAVBADYCvAEMAQsgBS0ARUEBcQRAIAUgBS8BekEAEHwiADYCACAARQRAIAUoArgBQQhqQRhBABAUIAVBADYCvAEMAgsgBSAFKAK4ASAFKAKIASAFLwF6QQAgBSgCjAEgBSgCABEFADYChAEgBSgCiAEQGyAFKAKEAUUEQCAFQQA2ArwBDAILIAUgBSgChAE2AogBCyAFLQBEQQFxBEAgBSAFKAK4ASAFKAKIASAFLwF4ELABNgKEASAFKAKIARAbIAUoAoQBRQRAIAVBADYCvAEMAgsgBSAFKAKEATYCiAELIAUtAEZBAXEEQCAFIAUoArgBIAUoAogBQQEQrwE2AoQBIAUoAogBEBsgBSgChAFFBEAgBUEANgK8AQwCCyAFIAUoAoQBNgKIAQsCQCAFLQBHQQFxRQ0AIAUtAEVBAXFFBEAgBS0AREEBcUUNAQsgBSgCuAEhASAFKAKIASEDIAUpA5gBIQIgBSkDkAEhCCMAQSBrIgAkACAAIAE2AhwgACADNgIYIAAgAjcDECAAIAg3AwggACgCGCAAKQMQIAApAwhBAEEAQQBCACAAKAIcQQhqEGQhASAAQSBqJAAgBSABNgKEASAFKAKIARAbIAUoAoQBRQRAIAVBADYCvAEMAgsgBSAFKAKEATYCiAELIAUgBSgCiAE2ArwBCyAFKAK8ASEAIAVBwAFqJAAgAAuEAgEBfyMAQSBrIgMkACADIAA2AhggAyABNgIUIAMgAjYCEAJAIAMoAhRFBEAgAygCGEEIakESQQAQFCADQQA2AhwMAQsgA0E4EBgiADYCDCAARQRAIAMoAhhBCGpBDkEAEBQgA0EANgIcDAELIwBBEGsiACADKAIMQQhqNgIMIAAoAgxBADYCACAAKAIMQQA2AgQgACgCDEEANgIIIAMoAgwgAygCEDYCACADKAIMQQA2AgQgAygCDEIANwMoQQBBAEEAEBohACADKAIMIAA2AjAgAygCDEIANwMYIAMgAygCGCADKAIUQRQgAygCDBBmNgIcCyADKAIcIQAgA0EgaiQAIAALQwEBfyMAQRBrIgMkACADIAA2AgwgAyABNgIIIAMgAjYCBCADKAIMIAMoAgggAygCBEEAQQAQsgEhACADQRBqJAAgAAtJAQF/IwBBEGsiASQAIAEgADYCDCABKAIMBEAgASgCDCgCrEAgASgCDCgCqEAoAgQRAgAgASgCDBA3IAEoAgwQFQsgAUEQaiQAC5QFAQF/IwBBMGsiBSQAIAUgADYCKCAFIAE2AiQgBSACNgIgIAUgAzoAHyAFIAQ2AhggBUEANgIMAkAgBSgCJEUEQCAFKAIoQQhqQRJBABAUIAVBADYCLAwBCyAFIAUoAiAgBS0AH0EBcRCzASIANgIMIABFBEAgBSgCKEEIakEQQQAQFCAFQQA2AiwMAQsgBSgCICEBIAUtAB9BAXEhAiAFKAIYIQMgBSgCDCEEIwBBIGsiACQAIAAgATYCGCAAIAI6ABcgACADNgIQIAAgBDYCDCAAQbDAABAYIgE2AggCQCABRQRAIABBADYCHAwBCyMAQRBrIgEgACgCCDYCDCABKAIMQQA2AgAgASgCDEEANgIEIAEoAgxBADYCCCAAKAIIAn8gAC0AF0EBcQRAIAAoAhhBf0cEfyAAKAIYQX5GBUEBC0EBcQwBC0EAC0EARzoADiAAKAIIIAAoAgw2AqhAIAAoAgggACgCGDYCFCAAKAIIIAAtABdBAXE6ABAgACgCCEEAOgAMIAAoAghBADoADSAAKAIIQQA6AA8gACgCCCgCqEAoAgAhAQJ/AkAgACgCGEF/RwRAIAAoAhhBfkcNAQtBCAwBCyAAKAIYC0H//wNxIAAoAhAgACgCCCABEQEAIQEgACgCCCABNgKsQCABRQRAIAAoAggQNyAAKAIIEBUgAEEANgIcDAELIAAgACgCCDYCHAsgACgCHCEBIABBIGokACAFIAE2AhQgAUUEQCAFKAIoQQhqQQ5BABAUIAVBADYCLAwBCyAFIAUoAiggBSgCJEETIAUoAhQQZiIANgIQIABFBEAgBSgCFBCxASAFQQA2AiwMAQsgBSAFKAIQNgIsCyAFKAIsIQAgBUEwaiQAIAALzAEBAX8jAEEgayICIAA2AhggAiABOgAXIAICfwJAIAIoAhhBf0cEQCACKAIYQX5HDQELQQgMAQsgAigCGAs7AQ4gAkEANgIQAkADQCACKAIQQdSXASgCAEkEQCACKAIQQQxsQdiXAWovAQAgAi8BDkYEQCACLQAXQQFxBEAgAiACKAIQQQxsQdiXAWooAgQ2AhwMBAsgAiACKAIQQQxsQdiXAWooAgg2AhwMAwUgAiACKAIQQQFqNgIQDAILAAsLIAJBADYCHAsgAigCHAvkAQEBfyMAQSBrIgMkACADIAA6ABsgAyABNgIUIAMgAjYCECADQcgAEBgiADYCDAJAIABFBEAgAygCEEEBQbSbASgCABAUIANBADYCHAwBCyADKAIMIAMoAhA2AgAgAygCDCADLQAbQQFxOgAEIAMoAgwgAygCFDYCCAJAIAMoAgwoAghBAU4EQCADKAIMKAIIQQlMDQELIAMoAgxBCTYCCAsgAygCDEEAOgAMIAMoAgxBADYCMCADKAIMQQA2AjQgAygCDEEANgI4IAMgAygCDDYCHAsgAygCHCEAIANBIGokACAAC+MIAQF/IwBBQGoiAiAANgI4IAIgATYCNCACIAIoAjgoAnw2AjAgAiACKAI4KAI4IAIoAjgoAmxqNgIsIAIgAigCOCgCeDYCICACIAIoAjgoApABNgIcIAICfyACKAI4KAJsIAIoAjgoAixBhgJrSwRAIAIoAjgoAmwgAigCOCgCLEGGAmtrDAELQQALNgIYIAIgAigCOCgCQDYCFCACIAIoAjgoAjQ2AhAgAiACKAI4KAI4IAIoAjgoAmxqQYICajYCDCACIAIoAiwgAigCIEEBa2otAAA6AAsgAiACKAIsIAIoAiBqLQAAOgAKIAIoAjgoAnggAigCOCgCjAFPBEAgAiACKAIwQQJ2NgIwCyACKAIcIAIoAjgoAnRLBEAgAiACKAI4KAJ0NgIcCwNAAkAgAiACKAI4KAI4IAIoAjRqNgIoAkAgAigCKCACKAIgai0AACACLQAKRw0AIAIoAiggAigCIEEBa2otAAAgAi0AC0cNACACKAIoLQAAIAIoAiwtAABHDQAgAiACKAIoIgBBAWo2AiggAC0AASACKAIsLQABRwRADAELIAIgAigCLEECajYCLCACIAIoAihBAWo2AigDQCACIAIoAiwiAEEBajYCLCAALQABIQEgAiACKAIoIgBBAWo2AigCf0EAIAAtAAEgAUcNABogAiACKAIsIgBBAWo2AiwgAC0AASEBIAIgAigCKCIAQQFqNgIoQQAgAC0AASABRw0AGiACIAIoAiwiAEEBajYCLCAALQABIQEgAiACKAIoIgBBAWo2AihBACAALQABIAFHDQAaIAIgAigCLCIAQQFqNgIsIAAtAAEhASACIAIoAigiAEEBajYCKEEAIAAtAAEgAUcNABogAiACKAIsIgBBAWo2AiwgAC0AASEBIAIgAigCKCIAQQFqNgIoQQAgAC0AASABRw0AGiACIAIoAiwiAEEBajYCLCAALQABIQEgAiACKAIoIgBBAWo2AihBACAALQABIAFHDQAaIAIgAigCLCIAQQFqNgIsIAAtAAEhASACIAIoAigiAEEBajYCKEEAIAAtAAEgAUcNABogAiACKAIsIgBBAWo2AiwgAC0AASEBIAIgAigCKCIAQQFqNgIoQQAgAC0AASABRw0AGiACKAIsIAIoAgxJC0EBcQ0ACyACQYICIAIoAgwgAigCLGtrNgIkIAIgAigCDEGCAms2AiwgAigCJCACKAIgSgRAIAIoAjggAigCNDYCcCACIAIoAiQ2AiAgAigCJCACKAIcTg0CIAIgAigCLCACKAIgQQFrai0AADoACyACIAIoAiwgAigCIGotAAA6AAoLCyACIAIoAhQgAigCNCACKAIQcUEBdGovAQAiATYCNEEAIQAgASACKAIYSwR/IAIgAigCMEEBayIANgIwIABBAEcFQQALQQFxDQELCwJAIAIoAiAgAigCOCgCdE0EQCACIAIoAiA2AjwMAQsgAiACKAI4KAJ0NgI8CyACKAI8C5IQAQF/IwBBMGsiAiQAIAIgADYCKCACIAE2AiQgAgJ/IAIoAigoAiwgAigCKCgCDEEFa0kEQCACKAIoKAIsDAELIAIoAigoAgxBBWsLNgIgIAJBADYCECACIAIoAigoAgAoAgQ2AgwDQAJAIAJB//8DNgIcIAIgAigCKCgCvC1BKmpBA3U2AhQgAigCKCgCACgCECACKAIUSQ0AIAIgAigCKCgCACgCECACKAIUazYCFCACIAIoAigoAmwgAigCKCgCXGs2AhggAigCHCACKAIYIAIoAigoAgAoAgRqSwRAIAIgAigCGCACKAIoKAIAKAIEajYCHAsgAigCHCACKAIUSwRAIAIgAigCFDYCHAsCQCACKAIcIAIoAiBPDQACQCACKAIcRQRAIAIoAiRBBEcNAQsgAigCJEUNACACKAIcIAIoAhggAigCKCgCACgCBGpGDQELDAELQQAhACACIAIoAiRBBEYEfyACKAIcIAIoAhggAigCKCgCACgCBGpGBUEAC0EBcTYCECACKAIoQQBBACACKAIQEFwgAigCKCgCCCACKAIoKAIUQQRraiACKAIcOgAAIAIoAigoAgggAigCKCgCFEEDa2ogAigCHEEIdjoAACACKAIoKAIIIAIoAigoAhRBAmtqIAIoAhxBf3M6AAAgAigCKCgCCCACKAIoKAIUQQFraiACKAIcQX9zQQh2OgAAIAIoAigoAgAQHCACKAIYBEAgAigCGCACKAIcSwRAIAIgAigCHDYCGAsgAigCKCgCACgCDCACKAIoKAI4IAIoAigoAlxqIAIoAhgQGRogAigCKCgCACIAIAIoAhggACgCDGo2AgwgAigCKCgCACIAIAAoAhAgAigCGGs2AhAgAigCKCgCACIAIAIoAhggACgCFGo2AhQgAigCKCIAIAIoAhggACgCXGo2AlwgAiACKAIcIAIoAhhrNgIcCyACKAIcBEAgAigCKCgCACACKAIoKAIAKAIMIAIoAhwQeBogAigCKCgCACIAIAIoAhwgACgCDGo2AgwgAigCKCgCACIAIAAoAhAgAigCHGs2AhAgAigCKCgCACIAIAIoAhwgACgCFGo2AhQLIAIoAhBFDQELCyACIAIoAgwgAigCKCgCACgCBGs2AgwgAigCDARAAkAgAigCDCACKAIoKAIsTwRAIAIoAihBAjYCsC0gAigCKCgCOCACKAIoKAIAKAIAIAIoAigoAixrIAIoAigoAiwQGRogAigCKCACKAIoKAIsNgJsDAELIAIoAgwgAigCKCgCPCACKAIoKAJsa08EQCACKAIoIgAgACgCbCACKAIoKAIsazYCbCACKAIoKAI4IAIoAigoAjggAigCKCgCLGogAigCKCgCbBAZGiACKAIoKAKwLUECSQRAIAIoAigiACAAKAKwLUEBajYCsC0LCyACKAIoKAI4IAIoAigoAmxqIAIoAigoAgAoAgAgAigCDGsgAigCDBAZGiACKAIoIgAgAigCDCAAKAJsajYCbAsgAigCKCACKAIoKAJsNgJcIAIoAigiAQJ/IAIoAgwgAigCKCgCLCACKAIoKAK0LWtLBEAgAigCKCgCLCACKAIoKAK0LWsMAQsgAigCDAsgASgCtC1qNgK0LQsgAigCKCgCwC0gAigCKCgCbEkEQCACKAIoIAIoAigoAmw2AsAtCwJAIAIoAhAEQCACQQM2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mwFCADcDAEGYmwFCADcDAEGQmwFCADcDAEGImwFCADcDAEGAmwFCADcDAEH4mgFCADcDAEHwmgFCADcDAEHwmgEL1QQBBX8jAEGwAWsiASQAIAEgADYCqAEgASgCqAEQNwJAAkAgASgCqAEoAgBBAE4EQCABKAKoASgCAEGAFCgCAEgNAQsgASABKAKoASgCADYCECABQSBqQY8SIAFBEGoQcCABQQA2AqQBIAEgAUEgajYCoAEMAQsgASABKAKoASgCAEECdEGAE2ooAgA2AqQBAkACQAJAAkAgASgCqAEoAgBBAnRBkBRqKAIAQQFrDgIAAQILIAEoAqgBKAIEIQJBkJkBKAIAIQRBACEAAkACQANAIAIgAEGgiAFqLQAARwRAQdcAIQMgAEEBaiIAQdcARw0BDAILCyAAIgMNAEGAiQEhAgwBC0GAiQEhAANAIAAtAAAhBSAAQQFqIgIhACAFDQAgAiEAIANBAWsiAw0ACwsgBCgCFBogASACNgKgAQwCCyMAQRBrIgAgASgCqAEoAgQ2AgwgAUEAIAAoAgxrQQJ0QajZAGooAgA2AqABDAELIAFBADYCoAELCwJAIAEoAqABRQRAIAEgASgCpAE2AqwBDAELIAEgASgCoAEQKwJ/IAEoAqQBBEAgASgCpAEQK0ECagwBC0EAC2pBAWoQGCIANgIcIABFBEAgAUG4EygCADYCrAEMAQsgASgCHCEAAn8gASgCpAEEQCABKAKkAQwBC0H6EgshA0HfEkH6EiABKAKkARshAiABIAEoAqABNgIIIAEgAjYCBCABIAM2AgAgAEG+CiABEHAgASgCqAEgASgCHDYCCCABIAEoAhw2AqwBCyABKAKsASEAIAFBsAFqJAAgAAszAQF/IAAoAhQiAyABIAIgACgCECADayIBIAEgAksbIgEQGRogACAAKAIUIAFqNgIUIAILjwUCBn4BfyABIAEoAgBBD2pBcHEiAUEQajYCACAAAnwgASkDACEDIAEpAwghBiMAQSBrIggkAAJAIAZC////////////AIMiBEKAgICAgIDAgDx9IARCgICAgICAwP/DAH1UBEAgBkIEhiADQjyIhCEEIANC//////////8PgyIDQoGAgICAgICACFoEQCAEQoGAgICAgICAwAB8IQIMAgsgBEKAgICAgICAgEB9IQIgA0KAgICAgICAgAiFQgBSDQEgAiAEQgGDfCECDAELIANQIARCgICAgICAwP//AFQgBEKAgICAgIDA//8AURtFBEAgBkIEhiADQjyIhEL/////////A4NCgICAgICAgPz/AIQhAgwBC0KAgICAgICA+P8AIQIgBEL///////+//8MAVg0AQgAhAiAEQjCIpyIAQZH3AEkNACADIQIgBkL///////8/g0KAgICAgIDAAIQiBSEHAkAgAEGB9wBrIgFBwABxBEAgAiABQUBqrYYhB0IAIQIMAQsgAUUNACAHIAGtIgSGIAJBwAAgAWutiIQhByACIASGIQILIAggAjcDECAIIAc3AxgCQEGB+AAgAGsiAEHAAHEEQCAFIABBQGqtiCEDQgAhBQwBCyAARQ0AIAVBwAAgAGuthiADIACtIgKIhCEDIAUgAoghBQsgCCADNwMAIAggBTcDCCAIKQMIQgSGIAgpAwAiA0I8iIQhAiAIKQMQIAgpAxiEQgBSrSADQv//////////D4OEIgNCgYCAgICAgIAIWgRAIAJCAXwhAgwBCyADQoCAgICAgICACIVCAFINACACQgGDIAJ8IQILIAhBIGokACACIAZCgICAgICAgICAf4OEvws5AwALrRcDEn8CfgF8IwBBsARrIgkkACAJQQA2AiwCQCABvSIYQn9XBEBBASESQa4IIRMgAZoiAb0hGAwBCyAEQYAQcQRAQQEhEkGxCCETDAELQbQIQa8IIARBAXEiEhshEyASRSEXCwJAIBhCgICAgICAgPj/AINCgICAgICAgPj/AFEEQCAAQSAgAiASQQNqIg0gBEH//3txECYgACATIBIQIiAAQeQLQbUSIAVBIHEiAxtBjw1BuRIgAxsgASABYhtBAxAiDAELIAlBEGohEAJAAn8CQCABIAlBLGoQqQEiASABoCIBRAAAAAAAAAAAYgRAIAkgCSgCLCIGQQFrNgIsIAVBIHIiFEHhAEcNAQwDCyAFQSByIhRB4QBGDQIgCSgCLCELQQYgAyADQQBIGwwBCyAJIAZBHWsiCzYCLCABRAAAAAAAALBBoiEBQQYgAyADQQBIGwshCiAJQTBqIAlB0AJqIAtBAEgbIg4hBwNAIAcCfyABRAAAAAAAAPBBYyABRAAAAAAAAAAAZnEEQCABqwwBC0EACyIDNgIAIAdBBGohByABIAO4oUQA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HCECIAEgASgCGCIDQQFqNgIYQQAgAy0AASACRw0AGiABKAIcIQIgASABKAIYIgNBAWo2AhhBACADLQABIAJHDQAaIAEoAhwhAiABIAEoAhgiA0EBajYCGEEAIAMtAAEgAkcNABogASgCHCECIAEgASgCGCIDQQFqNgIYQQAgAy0AASACRw0AGiABKAIcIQIgASABKAIYIgNBAWo2AhhBACADLQABIAJHDQAaIAEoAhwhAiABIAEoAhgiA0EBajYCGEEAIAMtAAEgAkcNABogASgCGCABKAIUSQtBAXENAAsgASgCKEGCAiABKAIUIAEoAhhrazYCYCABKAIoKAJgIAEoAigoAnRLBEAgASgCKCABKAIoKAJ0NgJgCwsLAkAgASgCKCgCYEEDTwRAIAEgASgCKCgCYEEDazoAEyABQQE7ARAgASgCKCICKAKkLSACKAKgLUEBdGogAS8BEDsBACABLQATIQMgASgCKCICKAKYLSEEIAIgAigCoC0iAkEBajYCoC0gAiAEaiADOgAAIAEgAS8BEEEBazsBECABKAIoIAEtABNB0N0Aai0AAEECdGpBmAlqIgIgAi8BAEEBajsBACABKAIoQYgTagJ/IAEvARBBgAJJBEAgAS8BEC0A0FkMAQsgAS8BEEEHdkGAAmotANBZC0ECdGoiAiACLwEAQQFqOwEAIAEgASgCKCgCoC0gASgCKCgCnC1BAWtGNgIgIAEoAigiAiACKAJ0IAEoAigoAmBrNgJ0IAEoAigiAiABKAIoKAJgIAIoAmxqNgJsIAEoAihBADYCYAwBCyABIAEoAigiAigCOCACKAJsai0AADoADyABKAIoIgIoAqQtIAIoAqAtQQF0akEAOwEAIAEtAA8hAyABKAIoIgIoApgtIQQgAiACKAKgLSICQQFqNgKgLSACIARqIAM6AAAgASgCKCABLQAPQQJ0aiICIAIvAZQBQQFqOwGUASABIAEoAigoAqAtIAEoAigoApwtQQFrRjYCICABKAIoIgIgAigCdEEBazYCdCABKAIoIgIgAigCbEEBajYCbAsgASgCIARAIAEoAigCfyABKAIoKAJcQQBOBEAgASgCKCgCOCABKAIoKAJcagwBC0EACyABKAIoKAJsIAEoAigoAlxrQQAQKCABKAIoIAEoAigoAmw2AlwgASgCKCgCABAcIAEoAigo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QCABKAIoQQ9JBEAgASABKAJQIgJBAWo2AlAgASABKAIsIAItAAAgASgCKHRqNgIsIAEgASgCKEEIajYCKCABIAEoAlAiAkEBajYCUCABIAEoAiwgAi0AACABKAIodGo2AiwgASABKAIoQQhqNgIoCyABIAEoAiQgASgCLCABKAIccUECdGooAQA2ARACQAJAA0AgASABLQARNgIMIAEgASgCLCABKAIMdjYCLCABIAEoAiggASgCDGs2AiggASABLQAQNgIMIAEoAgxFBEAgAS8BEiECIAEgASgCSCIDQQFqNgJIIAMgAjoAAAwCCyABKAIMQRBxBEAgASABLwESNgIIIAEgASgCDEEPcTYCDCABKAIMBEAgASgCKCABKAIMSQRAIAEgASgCUCICQQFqNgJQIAEgASgCLCACLQAAIAEoAih0ajYCLCABIAEoAihBCGo2AigLIAEgASgCCCABKAIsQQEgASgCDHRBAWtxajYCCCABIAEoAiwgASgCDHY2AiwgASABKAIoIAEoAgxrNgIoCyABKAIoQQ9JBEAgASABKAJQIgJBAWo2AlAgASABKAIsIAItAAAgASgCKHRqNgIsIAEgASgCKEEIajYCKCABIAEoAlAiAkEBajYCUCABIAEoAiwgAi0AACABKAIodGo2AiwgASABKAIoQQhqNgIoCyABIAEoAiAgASgCLCABKAIYcUECdGooAQA2ARACQANAIAEgAS0AETYCDCABIAEoAiwgASgCDHY2AiwgASABKAIoIAEoAgxrNgIoIAEgAS0AEDYCDCABKAIMQRBxBEAgASABLwESNgIEIAEgASgCDEEPcTYCDCABKAIoIAEoAgxJBEAgASABKAJQIgJBAWo2AlAgASABKAIsIAItAAAgASgCKHRqNgIsIAEgASgCKEEIajYCKCABKAIoIAEoAgxJBEAgASABKAJQIgJBAWo2AlAgASABKAIsIAItAAAgASgCKHRqNgIsIAEgASgCKEEIajYCKAsLIAEgASgCBCABKAIsQQEgASgCDHRBAWtxajYCBCABIAEoAiwgASgCDHY2AiwgASABKAIoIAEoAgxrNgIoIAEgASgCSCABKAJEazYCDAJAIAEoAgQgASgCDEsEQCABIAEoAgQgASgCDGs2AgwgASgCDCABKAI4SwRAIAEoAlQoAsQ3BEAgASgCXEHdDDYCGCABKAJUQdH+ADYCBAwKCwsgASABKAIwNgIAAkAgASgCNEUEQCABIAEoAgAgASgCPCABKAIMa2o2AgAgASgCDCABKAIISQRAIAEgASgCCCABKAIMazYCCANAIAEgASgCACICQQFqNgIAIAItAAAhAiABIAEoAkgiA0EBajYCSCADIAI6AAAgASABKAIMQQFrIgI2AgwgAg0ACyABIAEoAkggASgCBGs2AgALDAELAkAgASgCNCABKAIMSQRAIAEgASgCACABKAI8IAEoAjRqIAEoAgxrajYCACABIAEoAgwgASgCNGs2AgwgASgCDCABKAIISQRAIAEgASgCCCABKAIMazYCCANAIAEgASgCACICQQFqNgIAIAItAAAhAiABIAEoAkgiA0EBajYCSCADIAI6AAAgASABKAIMQQFrIgI2AgwgAg0ACyABIAEoAjA2AgAgASgCNCABKAIISQRAIAEgASgCNDYCDCABIAEoAgggASgCDGs2AggDQCABIAEoAgAiAkEBajYCACACLQAAIQIgASABKAJIIgNBAWo2AkggAyACOgAAIAEgASgCDEEBayICNgIMIAINAAsgASABKAJIIAEoAgRrNgIACwsMAQsgASABKAIAIAEoAjQgASgCDGtqNgIAIAEoAgwgASgCCEkEQCABIAEoAgggASgCDGs2AggDQCABIAEoAgAiAkEBajYCACACLQAAIQIgASABKAJIIgNBAWo2AkggAyACOgAAIAEgASgCDEEBayICNgIMIAINAAsgASABKAJIIAEoAgRrNgIACwsLA0AgASgCCEECSwRAIAEgASgCACICQQFqNgIAIAItAAAhAiABIAEoAkgiA0EBajYCSCADIAI6AAAgASABKAIAIgJBAWo2AgAgAi0AACECIAEgASgCSCIDQQFqNgJIIAMgAjoAACABIAEoAgAiAkEBajYCACACLQAAIQIgASABKAJIIgNBAWo2AkggAyACOgAAIAEgASgCCEEDazYCCAwBCwsMAQsgASABKAJIIAEoAgRrNgIAA0AgASABKAIAIgJBAWo2AgAgAi0AACECIAEgASgCSCIDQQFqNgJIIAMgAjoAACABIAEoAgAiAkEBajYCACACLQAAIQIgASABKAJIIgNBAWo2AkggAyACOgAAIAEgASgCACICQQFqNgIAIAItAAAhAiABIAEoAkgi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ZWFkIGVycm9yAFpsaWIgZXJyb3IAZGF0YSBlcnJvcgBDUkMgZXJyb3IAaW5jb21wYXRpYmxlIHZlcnNpb24AbmFuAC9kZXYvdXJhbmRvbQBpbnZhbGlkIGNvZGUgLS0gbWlzc2luZyBlbmQtb2YtYmxvY2sAaW5jb3JyZWN0IGhlYWRlciBjaGVjawBpbmNvcnJlY3QgbGVuZ3RoIGNoZWNrAGluY29ycmVjdCBkYXRhIGNoZWNrAGludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrAGhlYWRlciBjcmMgbWlzbWF0Y2gAaW5mAGludmFsaWQgd2luZG93IHNpemUAUmVhZC1vbmx5IGFyY2hpdmUATm90IGEgemlwIGFyY2hpdmUAUmVzb3VyY2Ugc3RpbGwgaW4gdXNlAE1hbGxvYyBmYWlsdXJlAGludmFsaWQgYmxvY2sgdHlwZQBGYWlsdXJlIHRvIGNyZWF0ZSB0ZW1wb3JhcnkgZmlsZQBDYW4ndCBvcGVuIGZpbGUATm8gc3VjaCBmaWxlAFByZW1hdHVyZSBlbmQgb2YgZmlsZQBDYW4ndCByZW1vdmUgZmlsZQBpbnZhbGlkIGxpdGVyYWwvbGVuZ3RoIGNvZGUAaW52YWxpZCBkaXN0YW5jZSBjb2RlAHVua25vd24gY29tcHJlc3Npb24gbWV0aG9kAHN0cmVhbSBlbmQAQ29tcHJlc3NlZCBkYXRhIGludmFsaWQATXVsdGktZGlzayB6aXAgYXJjaGl2ZXMgbm90IHN1cHBvcnRlZABPcGVyYXRpb24gbm90IHN1cHBvcnRlZABFbmNyeXB0aW9uIG1ldGhvZCBub3Qgc3VwcG9ydGVkAENvbXByZXNzaW9uIG1ldGhvZCBub3Qgc3VwcG9ydGVkAEVudHJ5IGhhcyBiZWVuIGRlbGV0ZWQAQ29udGFpbmluZyB6aXAgYXJjaGl2ZSB3YXMgY2xvc2VkAENsb3NpbmcgemlwIGFyY2hpdmUgZmFpbGVkAFJlbmFtaW5nIHRlbXBvcmFyeSBmaWxlIGZhaWxlZABFbnRyeSBoYXMgYmVlbiBjaGFuZ2VkAE5vIHBhc3N3b3JkIHByb3ZpZGVkAFdyb25nIHBhc3N3b3JkIHByb3ZpZGVkAFVua25vd24gZXJyb3IgJWQAcmIAcitiAHJ3YQAlcy5YWFhYWFgATkFOAElORgBBRQAxLjIuMTEAL3Byb2Mvc2VsZi9mZC8ALgAobnVsbCkAOiAAUEsGBwBQSwYGAFBLBQYAUEsDBABQSwECAAAAAAAAUgUAANkHAACsCAAAkQgAAIIFAACkBQAAjQUAAMUFAABvCAAANAcAAOkEAAAkBwAAAwcAAK8FAADhBgAAywgAADcIAABBBwAAWgQAALkGAABzBQAAQQQAAFcHAABYCAAAFwgAAKcGAADiCAAA9wgAAP8HAADLBgAAaAUAAMEHAAAgAEGYFAsRAQAAAAEAAAABAAAAAQAAAAEAQbwUCwkBAAAAAQAAAAIAQegUCwEBAEGIFQsBAQBBlBUL+0OWMAd3LGEO7rpRCZkZxG0Hj/RqcDWlY+mjlWSeMojbDqS43Hke6dXgiNnSlytMtgm9fLF+By2455Edv5BkELcd8iCwakhxufPeQb6EfdTaGuvk3W1RtdT0x4XTg1aYbBPAqGtkevli/ezJZYpPXAEU2WwGY2M9D/r1DQiNyCBuO14QaUzkQWDVcnFnotHkAzxH1ARL/YUN0mu1CqX6qLU1bJiyQtbJu9tA+bys42zYMnVc30XPDdbcWT3Rq6ww2SY6AN5RgFHXyBZh0L+19LQhI8SzVpmVus8Ppb24nrgCKAiIBV+y2QzGJOkLsYd8by8RTGhYqx1hwT0tZraQQdx2BnHbAbwg0pgqENXviYWxcR+1tgal5L+fM9S46KLJB3g0+QAPjqgJlhiYDuG7DWp/LT1tCJdsZJEBXGPm9FFra2JhbBzYMGWFTgBi8u2VBmx7pQEbwfQIglfED/XG2bBlUOm3Euq4vot8iLn83x3dYkkt2hXzfNOMZUzU+1hhsk3OUbU6dAC8o+Iwu9RBpd9K15XYPW3E0aT79NbTaulpQ/zZbjRGiGet0Lhg2nMtBETlHQMzX0wKqsl8Dd08cQVQqkECJxAQC76GIAzJJbVoV7OFbyAJ1Ga5n+Rhzg753l6YydkpIpjQsLSo18cXPbNZgQ20LjtcvbetbLrAIIO47bazv5oM4rYDmtKxdDlH1eqvd9KdFSbbBIMW3HMSC2PjhDtklD5qbQ2oWmp6C88O5J3/CZMnrgAKsZ4HfUSTD/DSowiHaPIBHv7CBmldV2L3y2dlgHE2bBnnBmtudhvU/uAr04laetoQzErdZ2/fufn5776OQ763F9WOsGDoo9bWfpPRocTC2DhS8t9P8We70WdXvKbdBrU/SzaySNorDdhMGwqv9koDNmB6BEHD72DfVd9nqO+ObjF5vmlGjLNhyxqDZryg0m8lNuJoUpV3DMwDRwu7uRYCIi8mBVW+O7rFKAu9spJatCsEarNcp//XwjHP0LWLntksHa7eW7DCZJsm8mPsnKNqdQqTbQKpBgmcPzYO64VnB3ITVwAFgkq/lRR6uOKuK7F7OBu2DJuO0pINvtXlt+/cfCHf2wvU0tOGQuLU8fiz3Whug9ofzRa+gVsmufbhd7Bvd0e3GOZaCIhwag//yjsGZlwLARH/nmWPaa5i+NP/a2FFz2wWeOIKoO7SDddUgwROwrMDOWEmZ6f3FmDQTUdpSdt3bj5KatGu3FrW2WYL30DwO9g3U668qcWeu95/z7JH6f+1MBzyvb2KwrrKMJOzU6ajtCQFNtC6kwbXzSlX3lS/Z9kjLnpms7hKYcQCG2hdlCtvKje+C7ShjgzDG98FWo3vAi0AAAAAQTEbGYJiNjLDUy0rBMVsZEX0d32Gp1pWx5ZBTwiK2chJu8LRiujv+svZ9OMMT7WsTX6utY4tg57PHJiHURLCShAj2VPTcPR4kkHvYVXXri4U5rU317WYHJaEgwVZmBuCGKkAm9v6LbCayzapXV135hxsbP/fP0HUng5azaIkhJXjFZ+MIEayp2F3qb6m4ejx59Dz6CSD3sNlssXaqq5dXeufRkQozGtvaf1wdq5rMTnvWiogLAkHC204HBLzNkbfsgddxnFUcO0wZWv09/Mqu7bCMaJ1kRyJNKAHkPu8nxe6jYQOed6pJTjvsjz/efNzvkjoan0bxUE8Kt5YBU958ER+YumHLU/CxhxU2wGKFZRAuw6Ng+gjpsLZOL8NxaA4TPS7IY+nlgrOlo0TCQDMXEgx10WLYvpuylPhd1Rdu7oVbKCj1j+NiJcOlpFQmNfeEanMx9L64eyTy/r1XNdich3meWvetVRAn4RPWVgSDhYZIxUP2nA4JJtBIz2na/1l5lrmfCUJy1dkONBOo66RAeKfihghzKczYP28Kq/hJK3u0D+0LYMSn2yyCYarJEjJ6hVT0ClGfvtod2Xi9nk/L7dIJDZ0GwkdNSoSBPK8U0uzjUhScN5leTHvfmD+8+bnv8L9/nyR0NU9oMvM+jaKg7sHkZp4VLyxOWWnqEuYgzsKqZgiyfq1CYjLrhBPXe9fDmz0Rs0/2W2MDsJ0QxJa8wIjQerBcGzBgEF32EfXNpcG5i2OxbUApYSEG7waikFxW7taaJjod0PZ2WxaHk8tFV9+NgycLRsn3RwAPhIAmLlTMYOgkGKui9FTtZIWxfTdV/TvxJSnwu/Vltn26bwHrqiNHLdr3jGcKu8qhe15a8qsSHDTbxtd+C4qRuHhNt5moAfFf2NU6FQiZfNN5fOyAqTCqRtnkYQwJqCfKbiuxeT5n979Oszz1nv96M+8a6mA/VqymT4Jn7J/OISrsCQcLPEVBzUyRioec3cxB7ThcEj10GtRNoNGeneyXWNO1/rLD+bh0sy1zPmNhNfgShKWrwsjjbbIcKCdiUG7hEZdIwMHbDgaxD8VMYUODihCmE9nA6lUfsD6eVWBy2JMH8U4gV70I5idpw6z3JYVqhsAVOVaMU/8mWJi19hTec4XT+FJVn76UJUt13vUHMxiE4qNLVK7ljSR6Lsf0NmgBuzzfl6twmVHbpFIbC+gU3XoNhI6qQcJI2pUJAgrZT8R5HmnlqVIvI9mG5GkJyqKveC8y/KhjdDrYt79wCPv5tm94bwU/NCnDT+DiiZ+spE/uSTQcPgVy2k7RuZCenf9W7VrZdz0Wn7FNwlT7nY4SPexrgm48J8SoTPMP4py/SSTAAAAADdqwgFu1IQDWb5GAtyoCQfrwssGsnyNBIUWTwW4URMOjzvRD9aFlw3h71UMZPkaCVOT2AgKLZ4KPUdcC3CjJhxHyeQdHneiHykdYB6sCy8bm2HtGsLfqxj1tWkZyPI1Ev+Y9xOmJrERkUxzEBRaPBUjMP4Ueo64Fk3kehfgRk041yyPOY6SyTu5+As6PO5EPwuEhj5SOsA8ZVACPVgXXjZvfZw3NsPaNQGpGDSEv1cxs9WVMOpr0zLdAREzkOVrJKePqSX+Me8nyVstJkxNYiN7J6AiIpnmIBXzJCEotHgqH966K0Zg/ClxCj4o9BxxLcN2syyayPUuraI3L8CNmnD351hxrlkec5kz3HIcJZN3K09RdnLxF3RFm9V1eNyJfk+2S38WCA19IWLPfKR0gHmTHkJ4yqAEev3KxnuwLrxsh0R+bd76OG/pkPpubIa1a1vsd2oCUjFoNTjzaQh/r2I/FW1jZqsrYVHB6WDU16Zl471kZLoDImaNaeBnIMvXSBehFUlOH1NLeXWRSvxj3k/LCRxOkrdaTKXdmE2YmsRGr/AGR/ZOQEXBJIJERDLNQXNYD0Aq5klCHYyLQ1Bo8VRnAjNVPrx1VwnWt1aMwPhTu6o6UuIUfFDVfr5R6DniWt9TIFuG7WZZsYekWDSR610D+ylcWkVvXm0vrV+AGzXht3H34O7PseLZpXPjXLM85mvZ/ucyZ7jlBQ165DhKJu8PIOTuVp6i7GH0YO3k4i/o04jt6Yo2q+u9XGnq8LgT/cfS0fyebJf+qQZV/ywQGvobetj7QsSe+XWuXPhI6QDzf4PC8iY9hPARV0bxlEEJ9KMry/X6lY33zf9P9mBdeNlXN7rYDon82jnjPtu89XHei5+z39Ih9d3lSzfc2Axr1+9mqda22O/UgbIt1QSkYtAzzqDRanDm010aJNIQ/l7FJ5ScxH4q2sZJQBjHzFZXwvs8lcOigtPBlegRwKivTcufxY/KxnvJyPERC8l0B0TMQ22GzRrTwM8tuQLOQJavkXf8bZAuQiuSGSjpk5w+pparVGSX8uoilcWA4JT4x7yfz61+npYTOJyhefqdJG+1mBMFd5lKuzGbfdHzmjA1iY0HX0uMXuENjmmLz4/snYCK2/dCi4JJBIm1I8aIiGSag78OWILmsB6A0drcgVTMk4RjplGFOhgXhw1y1Yag0OKpl7ogqM4EZqr5bqSrfHjrrksSKa8SrG+tJcatrBiB8acv6zOmdlV1pEE/t6XEKfig80M6oar9fKOdl76i0HPEtecZBrS+p0C2ic2CtwzbzbI7sQ+zYg9JsVVli7BoIte7X0gVugb2U7gxnJG5tIrevIPgHL3aXlq/7TSYvgAAAABlZ7y4i8gJqu6vtRJXl2KPMvDeN9xfayW5ONed7yi0xYpPCH1k4L1vAYcB17i/1krd2GryM3ff4FYQY1ifVxlQ+jCl6BSfEPpx+KxCyMB7362nx2dDCHJ1Jm/OzXB/rZUVGBEt+7ekP57QGIcn6M8aQo9zoqwgxrDJR3oIPq8yoFvIjhi1ZzsK0ACHsmk4UC8MX+yX4vBZhYeX5T3Rh4ZltOA63VpPj88/KDN3hhDk6uN3WFIN2O1AaL9R+KH4K/DEn5dIKjAiWk9XnuL2b0l/kwj1x32nQNUYwPxtTtCfNSu3I43FGJafoH8qJxlH/bp8IEECko/0EPfoSKg9WBSbWD+oI7aQHTHT96GJas92FA+oyqzhB3++hGDDBtJwoF63FxzmWbip9DzfFUyF58LR4IB+aQ4vy3trSHfDog8Ny8dosXMpxwRhTKC42fWYb0SQ/9P8flBm7hs32lZNJ7kOKEAFtsbvsKSjiAwcGrDbgX/XZzmReNIr9B9ukwP3JjtmkJqDiD8vke1YkylUYES0MQf4DN+oTR66z/Gm7N+S/om4LkZnF5tUAnAn7LtI8HHeL0zJMID521XnRWOcoD9r+ceD0xdoNsFyD4p5yzdd5K5Q4VxA/1ROJZjo9nOIi64W7zcW+ECCBJ0nPrwkH+khQXhVma/X4IvKsFwzO7ZZ7V7R5VWwflBH1Rns/2whO2IJRofa5+kyyIKOjnDUnu0osflRkF9W5II6MVg6gwmPp+ZuMx8IwYYNbaY6taThQL3BhvwFLylJF0pO9a/zdiIylhGeini+K5gd2ZcgS8n0eC6uSMDAAf3SpWZBahxelvd5OSpPl5afXfLxI+UFGWtNYH7X9Y7RYufrtt5fUo4JwjfptXrZRgBovCG80Oox34iPVmMwYfnWIgSeapq9pr0H2MEBvzZutK1TCQgVmk5yHf8pzqURhnu3dOHHD83ZEJKovqwqRhEZOCN2pYB1ZsbYEAF6YP6uz3KbyXPKIvGkV0eWGO+pOa39zF4RRQbuTXZjifHOjSZE3OhB+GRReS/5NB6TQdqxJlO/1prr6cb5s4yhRQtiDvAZB2lMob5RmzzbNieENZmSllD+Li6ZuVQm/N7onhJxXYx3FuE0zi42qatJihFF5j8DIIGDu3aR4OMT9lxb/VnpSZg+VfEhBoJsRGE+1KrOi8bPqTd+OEF/1l0mw26ziXZ81u7KxG/WHVkKsaHh5B4U84F5qEvXacsTsg53q1yhwrk5xn4BgP6pnOWZFSQLNqA2blEcjqcWZobCcdo+LN5vLEm505TwgQQJlea4sXtJDaMeLrEbSD7SQy1ZbvvD9tvpppFnUR+psMx6zgx0lGG5ZvEGBd4AAAAAdwcwlu4OYSyZCVG6B23EGXBq9I/pY6U1nmSVow7biDJ53Lik4NXpHpfS2YgJtkwrfrF8vee4LQeQvx2RHbcQZGqwIPLzuXFIhL5B3hra1H1t3eTr9NS1UYPThccTbJhWZGuowP1i+XqKZcnsFAFcT2MGbNn6Dz1jjQgN9TtuIMhMaRBe1WBB5KJncXI8A+TRSwTUR9INhf2lCrVrNbWo+kKymGzbu8nWrLz5QDLYbONF31x13NYNz6vRPVkm2TCsUd4AOsjXUYC/0GEWIbT0tVazxCPPupWZuL2lDygCuJ5fBYgIxgzZsrEL6SQvb3yHWGhMEcFhHau2Zi09dtxBkAHbcQaY0iC879UQKnGxhYkGtrUfn7/kpei41DN4B8miDwD5NJYJqI7hDpgYf2oNuwhtPS2RZGyX5mNcAWtrUfQcbGFihWUw2PJiAE5sBpXtGwGle4II9MH1D8RXZbDZxhK36VCLvrjq/LmIfGLdHd8V2i1JjNN88/vUTGVNsmFYOrVRzqO8AHTUuzDiSt+lQT3Yldek0cRt09b0+0Np6Wo0btn8rWeIRtpguNBEBC1zMwMd5aoKTF/dDXzJUAVxPCcCQaq+CxAQyQwghldotSUgb4WzuWbUCc5h5J9e3vkOKdnJmLDQmCLH16i0WbM9Fy60DYG3vVw7wLpsre24gyCav7O2A7biDHSx0prq1Uc5ndJ3rwTbJhVz3BaD42MLEpRkO4QNbWo+empaqOQOzwuTCf+dCgCuJ30HnrHwD5NEhwij0h4B8mhpBsL+92JXXYBlZ8sZbDZxbmsG5/7UG3aJ0yvgENp6WmfdSsz5ud9vjr7v+Re3vkNgsI7V1taj6KHRk3442MLET9/yUtG7Z/GmvFdnP7UG3UiyNkvYDSvarwobTDYDSvZBBHpg32Dvw6hn31Uxbo7vRmm+ecths4y8ZoMaJW/SoFJo4jbMDHeVuwtHAyICFrlVBSYvxbo7vrK9CygrtFqSXLNqBMLX/6e10M8xLNmei1verh2bZMKw7GPyJnVqo5wCbZMKnAkGqesONj9yB2eFBQBXE5W/SoLiuHoUe7Errgy2GziS0o6b5dW+DXzc77cL298hhtPS1PHU4kJo3bP4H9qDboG+Fs32uSZbb7B34Ri3R3eICFrm/w9qcGYGO8oRAQtcj2We//hirmlha//TFmzPRaAK4njXDdLuTgSDVDkDs8KnZyZh0GAW90lpR00+bnfbrtFqStnWWtxA3wtmN9g78Km8rlPeu57FR7LPfzC1/+m9vfIcyrrCilOzkzAktKOmutA2Bc3XBpNU3lcpI9lnv7Nmei7EYUq4XWgbAipvK5S0C743wwyOoVoF3xstAu+NAAAAABkbMUEyNmKCKy1Tw2RsxQR9d/RFVlqnhk9BlsfI2YoI0cK7Sfrv6Irj9NnLrLVPDLWufk2egy2Oh5gcz0rCElFT2SMQePRw02HvQZIurtdVN7XmFByYtdcFg4SWghuYWZsAqRiwLfrbqTbLmuZ3XV3/bGwc1EE/381aDp6VhCSijJ8V46eyRiC+qXdh8ejhpujz0OfD3oMk2sWyZV1drqpERp/rb2vMKHZw/Wk5MWuuICpa7wsHCSwSHDht30Y288ZdB7LtcFRx9GtlMLsq8/eiMcK2iRyRdZAHoDQXn7z7DoSNuiWp3nk8su84c/N5/2roSL5BxRt9WN4qPPB5TwXpYn5Ewk8th9tUHMaUFYoBjQ67QKYj6IO/ONnCOKDFDSG79EwKlqePE42WzlzMAAlF1zFIbvpii3fhU8q6u11Uo6BsFYiNP9aRlg6X3teYUMfMqRHs4frS9frLk3Ji11xreeYdQFS13llPhJ8WDhJYDxUjGSQ4cNo9I0GbZf1rp3zmWuZXywklTtA4ZAGRrqMYip/iM6fMISq8/WCtJOGvtD/Q7p8Sgy2GCbJsyUgkq9BTFer7fkYp4mV3aC8/efY2JEi3HQkbdAQSKjVLU7zyUkiNs3ll3nBgfu8x5+bz/v79wr/V0JF8zMugPYOKNvqakQe7sbxUeKinZTk7g5hLIpipCgm1+skQrsuIX+9dT0b0bA5t2T/NdMIOjPNaEkPqQSMCwWxwwdh3QYCXNtdHji3mBqUAtcW8G4SEcUGKGmhau1tDd+iYWmzZ2RUtTx4MNn5fJxstnD4AHN25mAASoIMxU4uuYpCStVPR3fTFFsTv9FfvwqeU9tmW1a4HvOm3HI2onDHea4Uq7yrKa3nt03BIrPhdG2/hRiouZt424X/FB6BU6FRjTfNlIgKy8+UbqcKkMISRZymfoCbkxa64/d6f+dbzzDrP6P17gKlrvJmyWv2ynwk+q4Q4fywcJLA1BxXxHipGMgcxd3NIcOG0UWvQ9XpGgzZjXbJ3y/rXTtLh5g/5zLXM4NeEja+WEkq2jSMLnaBwyIS7QYkDI11GGjhsBzEVP8QoDg6FZ0+YQn5UqQNVefrATGLLgYE4xR+YI/Resw6nnaoVltzlVAAb/E8xWtdiYpnOeVPYSeFPF1D6flZ71y2VYswc1C2NihM0lrtSH7vokQag2dBefvPsR2XCrWxIkW51U6AvOhI26CMJB6kIJFRqET9lK5aneeSPvEilpJEbZr2KKifyy7zg69CNocD93mLZ5u8jFLzhvQ2n0PwmioM/P5GyfnDQJLlpyxX4QuZGO1v9d3rcZWu1xX5a9O5TCTf3SDh2uAmusaESn/CKP8wzkyT9cgAAAAABwmo3A4TUbgJGvlkHCajcBsvC6wSNfLIFTxaFDhNRuA/RO48Nl4XWDFXv4Qka+WQI2JNTCp4tCgtcRz0cJqNwHeTJRx+idx4eYB0pGy8LrBrtYZsYq9/CGWm19RI18sgT95j/EbEmphBzTJEVPFoUFP4wIxa4jnoXeuRNOE1G4DmPLNc7yZKOOgv4uT9E7jw+hoQLPMA6Uj0CUGU2XhdYN5x9bzXawzY0GKkBMVe/hDCV1bMy02vqMxEB3SRr5ZAlqY+nJ+8x/iYtW8kjYk1MIqAneyDmmSIhJPMVKni0KCu63h8p/GBGKD4KcS1xHPQss3bDLvXImi83oq1wmo3AcVjn93MeWa5y3DOZd5MlHHZRTyt0F/FyddWbRX6J3Hh/S7ZPfQ0IFnzPYiF5gHSkeEIek3oEoMp7xsr9bLwusG1+RIdvOPrebvqQ6Wu1hmxqd+xbaDFSAmnzODVir38IY20VP2Erq2Zg6cFRZabX1GRkveNmIgO6Z+BpjUjXyyBJFaEXS1MfTkqRdXlP3mP8ThwJy0xat5JNmN2lRsSamEcG8K9FQE72RIIkwUHNMkRAD1hzQknmKkOLjB1U8WhQVTMCZ1d1vD5Wt9YJU/jAjFI6qrtQfBTiUb5+1VriOehbIFPfWWbthlikh7Fd65E0XCn7A15vRVpfrS9t4TUbgOD3cbfisc/u43Ol2eY8s1zn/tlr5bhnMuR6DQXvJko47uQgD+yinlbtYPRh6C/i5OntiNPrqzaK6mlcvf0TuPD80dLH/pdsnv9VBqn6GhAs+9h6G/mexEL4XK518wDpSPLCg3/whD0m8UZXEfQJQZT1yyuj942V+vZP/83ZeF1g2Lo3V9r8iQ7bPuM53nH1vN+zn4vd9SHS3DdL5ddrDNjWqWbv1O/YttUtsoHQYqQE0aDOM9PmcGrSJBpdxV7+EMSclCfG2ip+xxhAScJXVszDlTz7wdOCosAR6JXLTa+oyo/Fn8jJe8bJCxHxzEQHdM2GbUPPwNMazgK5LZGvlkCQbfx3kitCLpPpKBmWpj6cl2RUq5Ui6vKU4IDFn7zH+J5+rc+cOBOWnfp5oZi1bySZdwUTmzG7Sprz0X2NiTUwjEtfB44N4V6Pz4tpioCd7ItC99uJBEmCiMYjtYOaZIiCWA6/gB6w5oHc2tGEk8xUhVGmY4cXGDqG1XINqeLQoKggupeqZgTOq6Ru+a7reHyvKRJLrW+sEqytxiWn8YEYpjPrL6R1VXaltz9BoPgpxKE6Q/OjfP2qor6XnbXEc9C0BhnntkCnvreCzYmyzdsMsw+xO7FJD2Kwi2VVu9ciaLoVSF+4U/YGuZGcMbzeirS9HOCDv1pe2r6YNO0AAAAAuLxnZaoJyIsSta/uj2KXVzfe8DIla1/cndc4ucW0KO99CE+Kb73gZNcBhwFK1r+48mrY3eDfdzNYYxBWUBlXn+ilMPr6EJ8UQqz4cd97wMhnx6etdXIIQ83ObyaVrX9wLREYFT+kt/uHGNCeGs/oJ6Jzj0KwxiCsCHpHyaAyrz4YjshbCjtntbKHANAvUDhpl+xfDIVZ8OI95ZeHZYaH0d064LTPj09adzMoP+rkEIZSWHfjQO3YDfhRv2jwK/ihSJefxFoiMCrinldPf0lv9sf1CJPVQKd9bfzAGDWf0E6NI7crn5YYxScqf6C6/UcZAkEgfBD0j5KoSOj3mxRYPSOoP1gxHZC2iaH30xR2z2qsyqgPvn8H4QbDYIReoHDS5hwXt/SpuFlMFd880cLnhWl+gOB7yy8Ow3dIa8sND6JzsWjHYQTHKdm4oExEb5j1/NP/kO5mUH5W2jcbDrknTbYFQCiksO/GHAyIo4HbsBo5Z9d/K9J4kZNuH/Q7JvcDg5qQZpEvP4gpk1jttERgVAz4BzEeTajfpvHPuv6S3+xGLriJVJsXZ+wncAJx8Ei7yUwv3tv5gDBjRedVaz+gnNODx/nBNmgXeYoPcuRdN8tc4VCuTlT/QPbomCWui4hzFjfvFgSCQPi8PiedIekfJJlVeEGL4NevM1ywyu1ZtjtV5dFeR1B+sP/sGdViOyFs2odGCcgy6edwjo6CKO2e1JBR+bGC5FZfOlgxOqePCYMfM27mDYbBCLU6pm29QOGkBfyGwRdJKS+v9U5KMiJ284qeEZaYK754IJfZHXj0yUvASK4u0v0BwGpBZqX3ll4cTyo5eV2flpflI/HyTWsZBfXXfmDnYtGOX96268IJjlJ6tek3aABG2dC8IbyI3zHqMGNWjyLW+WGaap4EB72mvb8BwdittG42FQgJUx1yTpqlzin/t3uGEQ/H4XSSENnNKqy+qDgZEUaApXYj2MZmdWB6ARByz67+ynPJm1ek8SLvGJZH/a05qUURXsx2Te4GzvGJY9xEJo1k+EHo+S95UUGTHjRTJrHa65rWv7P5xukLRaGMGfAOYqFMaQc8m1G+hCc225aSmTUuLv5QJlS5mZ7o3vyMXXESNOEWd6k2Ls4RikmrAz/mRbuDgSDj4JF2W1z2E0npWf3xVT6YbIIGIdQ+YUTGi86qfjepz9Z/QThuwyZdfHaJs8TK7tZZHdZv4aGxCvMUHuRLqHmBE8tp16t3DrK5wqFcAX7GOZyp/oAkFZnlNqA2C44cUW6GZhanPtpxwixv3iyU07lJCQSB8LG45pWjDUl7G7EuHkPSPkj7blkt6dv2w1FnkabMsKkfdAzOema5YZTeBQbxAAA6JjsmZSZmJmMmYCYiINglyyXZJUImQCZqJmsmPCa6JcQllSE8ILYApwCsJaghkSGTIZIhkCEfIpQhsiW8JSAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAGIAYwBkAGUAZgBnAGgAaQBqAGsAbABtAG4AbwBwAHEAcgBzAHQAdQB2AHcAeAB5AHoAewB8AH0AfgACI8cA/ADpAOIA5ADgAOUA5wDqAOsA6ADvAO4A7ADEAMUAyQDmAMYA9AD2APIA+wD5AP8A1gDcAKIAowClAKcgkgHhAO0A8wD6APEA0QCqALoAvwAQI6wAvQC8AKEAqwC7AJElkiWTJQIlJCVhJWIlViVVJWMlUSVXJV0lXCVbJRAlFCU0JSwlHCUAJTwlXiVfJVolVCVpJWYlYCVQJWwlZyVoJWQlZSVZJVglUiVTJWslaiUYJQwliCWEJYwlkCWAJbED3wCTA8ADowPDA7UAxAOmA5gDqQO0Ax4ixgO1AykiYSKxAGUiZCIgIyEj9wBIIrAAGSK3ABoifyCyAKAloABBoNkACyYUBAAAtgcAAHoJAACZBQAAWwUAALoFAAAABAAARQUAAM8FAAB6CQBB0dkAC7YQAQIDBAQFBQYGBgYHBwcHCAgICAgICAgJCQkJCQkJCQoKCgoKCgoKCgoKCgoKCgoLCwsLCwsLCwsLCwsLCwsLDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwNDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PAAAQERISExMUFBQUFRUVFRYWFhYWFhYWFxcXFxcXFxcYGBgYGBgYGBgYGBgYGBgYGRkZGRkZGRkZGRkZGRkZGRoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxscHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHQABAgMEBQYHCAgJCQoKCwsMDAwMDQ0NDQ4ODg4PDw8PEBAQEBAQEBARERERERERERISEhISEhISExMTExMTExMUFBQUFBQUFBQUFBQUFBQUFRUVFRUVFRUVFRUVFRUVFRYWFhYWFhYWFhYWFhYWFhYXFxcXFxcXFxcXFxcXFxcXGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxwQMAAAEDUAAAEBAAAeAQAADwAAAJA0AACQNQAAAAAAAB4AAAAPAAAAAAAAABA2AAAAAAAAEwAAAAcAAAAAAAAADAAIAIwACABMAAgAzAAIACwACACsAAgAbAAIAOwACAAcAAgAnAAIAFwACADcAAgAPAAIALwACAB8AAgA/AAIAAIACACCAAgAQgAIAMIACAAiAAgAogAIAGIACADiAAgAEgAIAJIACABSAAgA0gAIADIACACyAAgAcgAIAPIACAAKAAgAigAIAEoACADKAAgAKgAIAKoACABqAAgA6gAIABoACACaAAgAWgAIANoACAA6AAgAugAIAHoACAD6AAgABgAIAIYACABGAAgAxgAIACYACACmAAgAZgAIAOYACAAWAAgAlgAIAFYACADWAAgANgAIALYACAB2AAgA9gAIAA4ACACOAAgATgAIAM4ACAAuAAgArgAIAG4ACADuAAgAHgAIAJ4ACABeAAgA3gAIAD4ACAC+AAgAfgAIAP4ACAABAAgAgQAIAEEACADBAAgAIQAIAKEACABhAAgA4QAIABEACACRAAgAUQAIANEACAAxAAgAsQAIAHEACADxAAgACQAIAIkACABJAAgAyQAIACkACACpAAgAaQAIAOkACAAZAAgAmQAIAFkACADZAAgAOQAIALkACAB5AAgA+QAIAAUACACFAAgARQAIAMUACAAlAAgApQAIAGUACADlAAgAFQAIAJUACABVAAgA1QAIADUACAC1AAgAdQAIAPUACAANAAgAjQAIAE0ACADNAAgALQAIAK0ACABtAAgA7QAIAB0ACACdAAgAXQAIAN0ACAA9AAgAvQAIAH0ACAD9AAgAEwAJABMBCQCTAAkAkwEJAFMACQBTAQkA0wAJANMBCQAzAAkAMwEJALMACQCzAQkAcwAJAHMBCQDzAAkA8wEJAAsACQALAQkAiwAJAIsBCQBLAAkASwEJAMsACQDLAQkAKwAJACsBCQCrAAkAqwEJAGsACQBrAQkA6wAJAOsBCQAbAAkAGwEJAJsACQCbAQkAWwAJAFsBCQDbAAkA2wEJADsACQA7AQkAuwAJALsBCQB7AAkAewEJAPsACQD7AQkABwAJAAcBCQCHAAkAhwEJAEcACQBHAQkAxwAJAMcBCQAnAAkAJwEJAKcACQCnAQkAZwAJAGcBCQDnAAkA5wEJABcACQAXAQkAlwAJAJcBCQBXAAkAVwEJANcACQDXAQkANwAJADcBCQC3AAkAtwEJAHcACQB3AQkA9wAJAPcBCQAPAAkADwEJAI8ACQCPAQkATwAJAE8BCQDPAAkAzwEJAC8ACQAvAQkArwAJAK8BCQBvAAkAbwEJAO8ACQDvAQkAHwAJAB8BCQCfAAkAnwEJAF8ACQBfAQkA3wAJAN8BCQA/AAkAPwEJAL8ACQC/AQkAfwAJAH8BCQD/AAkA/wEJAAAABwBAAAcAIAAHAGAABwAQAAcAUAAHADAABwBwAAcACAAHAEgABwAoAAcAaAAHABgABwBYAAcAOAAHAHgABwAEAAcARAAHACQABwBkAAcAFAAHAFQABwA0AAcAdAAHAAMACACDAAgAQwAIAMMACAAjAAgAowAIAGMACADjAAgAAAAFABAABQAIAAUAGAAFAAQABQAUAAUADAAFABwABQACAAUAEgAFAAoABQAaAAUABgAFABYABQAOAAUAHgAFAAEABQARAAUACQAFABkABQAFAAUAFQAFAA0ABQAdAAUAAwAFABMABQALAAUAGwAFAAcABQAXAAUAQbDqAAtNAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAIAAAADAAAAAwAAAAMAAAADAAAABAAAAAQAAAAEAAAABAAAAAUAAAAFAAAABQAAAAUAQaDrAAtlAQAAAAEAAAACAAAAAgAAAAMAAAADAAAABAAAAAQAAAAFAAAABQAAAAYAAAAGAAAABwAAAAcAAAAIAAAACAAAAAkAAAAJAAAACgAAAAoAAAALAAAACwAAAAwAAAAMAAAADQAAAA0AQdDsAAsjAgAAAAMAAAAHAAAAAAAAABAREgAIBwkGCgULBAwDDQIOAQ8AQYTtAAtpAQAAAAIAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAKAAAADAAAAA4AAAAQAAAAFAAAABgAAAAcAAAAIAAAACgAAAAwAAAAOAAAAEAAAABQAAAAYAAAAHAAAACAAAAAoAAAAMAAAADgAEGE7gALegEAAAACAAAAAwAAAAQAAAAGAAAACAAAAAwAAAAQAAAAGAAAACAAAAAwAAAAQAAAAGAAAACAAAAAwAAAAAABAACAAQAAAAIAAAADAAAABAAAAAYAAAAIAAAADAAAABAAAAAYAAAAIAAAADAAAABAAAAAYAAAMS4yLjExAEGI7wALbQcAAAAEAAQACAAEAAgAAAAEAAUAEAAIAAgAAAAEAAYAIAAgAAgAAAAEAAQAEAAQAAkAAAAIABAAIAAgAAkAAAAIABAAgACAAAkAAAAIACAAgAAAAQkAAAAgAIAAAgEABAkAAAAgAAIBAgEAEAkAQYDwAAulAgMABAAFAAYABwAIAAkACgALAA0ADwARABMAFwAbAB8AIwArADMAOwBDAFMAYwBzAIMAowDDAOMAAgEAAAAAAAAQABAAEAAQABAAEAAQABAAEQARABEAEQASABIAEgASABMAEwATABMAFAAUABQAFAAVABUAFQAVABAATQDKAAAAAQACAAMABAAFAAcACQANABEAGQAhADEAQQBhAIEAwQABAYEBAQIBAwEEAQYBCAEMARABGAEgATABQAFgAAAAABAAEAAQABAAEQARABIAEgATABMAFAAUABUAFQAWABYAFwAXABgAGAAZABkAGgAaABsAGwAcABwAHQAdAEAAQAAQABEAEgAAAAgABwAJAAYACgAFAAsABAAMAAMADQACAA4AAQAPAEGw8gALwRFgBwAAAAhQAAAIEAAUCHMAEgcfAAAIcAAACDAAAAnAABAHCgAACGAAAAggAAAJoAAACAAAAAiAAAAIQAAACeAAEAcGAAAIWAAACBgAAAmQABMHOwAACHgAAAg4AAAJ0AARBxEAAAhoAAAIKAAACbAAAAgIAAAIiAAACEgAAAnwABAHBAAACFQAAAgUABUI4wATBysAAAh0AAAINAAACcgAEQcNAAAIZAAACCQAAAmoAAAIBAAACIQAAAhEAAAJ6AAQBwgAAAhcAAAIHAAACZgAFAdTAAAIfAAACDwAAAnYABIHFwAACGwAAAgsAAAJuAAACAwAAAiMAAAITAAACfgAEAcDAAAIUgAACBIAFQijABMHIwAACHIAAAgyAAAJxAARBwsAAAhiAAAIIgAACaQAAAgCAAAIggAACEIAAAnkABAHBwAACFoAAAgaAAAJlAAUB0MAAAh6AAAIOgAACdQAEgcTAAAIagAACCoAAAm0AAAICgAACIoAAAhKAAAJ9AAQBwUAAAhWAAAIFgBACAAAEwczAAAIdgAACDYAAAnMABEHDwAACGYAAAgmAAAJrAAACAYAAAiGAAAIRgAACewAEAcJAAAIXgAACB4AAAmcABQHYwAACH4AAAg+AAAJ3AASBxsAAAhuAAAILgAACbwAAAgOAAAIjgAACE4AAAn8AGAHAAAACFEAAAgRABUIgwASBx8AAAhxAAAIMQAACcIAEAcKAAAIYQAACCEAAAmiAAAIAQAACIEAAAhBAAAJ4gAQBwYAAAhZAAAIGQAACZIAEwc7AAAIeQAACDkAAAnSABEHEQAACGkAAAgpAAAJsgAACAkAAAiJAAAISQAACfIAEAcEAAAIVQAACBUAEAgCARMHKwAACHUAAAg1AAAJygARBw0AAAhlAAAIJQAACaoAAAgFAAAIhQAACEUAAAnqABAHCAAACF0AAAgdAAAJmgAUB1MAAAh9AAAIPQAACdoAEgcXAAAIbQAACC0AAAm6AAAIDQAACI0AAAhNAAAJ+gAQBwMAAAhTAAAIEwAVCMMAEwcjAAAIcwAACDMAAAnGABEHCwAACGMAAAgjAAAJpgAACAMAAAiDAAAIQwAACeYAEAcHAAAIWwAACBsAAAmWABQHQwAACHsAAAg7AAAJ1gASBxMAAAhrAAAIKwAACbYAAAgLAAAIiwAACEsAAAn2ABAHBQAACFcAAAgXAEAIAAATBzMAAAh3AAAINwAACc4AEQcPAAAIZwAACCcAAAmuAAAIBwAACIcAAAhHAAAJ7gAQBwkAAAhfAAAIHwAACZ4AFAdjAAAIfwAACD8AAAneABIHGwAACG8AAAgvAAAJvgAACA8AAAiPAAAITwAACf4AYAcAAAAIUAAACBAAFAhzABIHHwAACHAAAAgwAAAJwQAQBwoAAAhgAAAIIAAACaEAAAgAAAAIgAAACEAAAAnhABAHBgAACFgAAAgYAAAJkQATBzsAAAh4AAAIOAAACdEAEQcRAAAIaAAACCgAAAmxAAAICAAACIgAAAhIAAAJ8QAQBwQAAAhUAAAIFAAVCOMAEwcrAAAIdAAACDQAAAnJABEHDQAACGQAAAgkAAAJqQAACAQAAAiEAAAIRAAACekAEAcIAAAIXAAACBwAAAmZABQHUwAACHwAAAg8AAAJ2QASBxcAAAhsAAAILAAACbkAAAgMAAAIjAAACEwAAAn5ABAHAwAACFIAAAgSABUIowATByMAAAhyAAAIMgAACcUAEQcLAAAIYgAACCIAAAmlAAAIAgAACIIAAAhCAAAJ5QAQBwcAAAhaAAAIGgAACZUAFAdDAAAIegAACDoAAAnVABIHEwAACGoAAAgqAAAJtQAACAoAAAiKAAAISgAACfUAEAcFAAAIVgAACBYAQAgAABMHMwAACHYAAAg2AAAJzQARBw8AAAhmAAAIJgAACa0AAAgGAAAIhgAACEYAAAntABAHCQAACF4AAAgeAAAJnQAUB2MAAAh+AAAIPgAACd0AEgcbAAAIbgAACC4AAAm9AAAIDgAACI4AAAhOAAAJ/QBgBwAAAAhRAAAIEQAVCIMAEgcfAAAIcQAACDEAAAnDABAHCgAACGEAAAghAAAJowAACAEAAAiBAAAIQQAACeMAEAcGAAAIWQAACBkAAAmTABMHOwAACHkAAAg5AAAJ0wARBxEAAAhpAAAIKQAACbMAAAgJAAAIiQAACEkAAAnzABAHBAAACFUAAAgVABAIAgETBysAAAh1AAAINQAACcsAEQcNAAAIZQAACCUAAAmrAAAIBQAACIUAAAhFAAAJ6wAQBwgAAAhdAAAIHQAACZsAFAdTAAAIfQAACD0AAAnbABIHFwAACG0AAAgtAAAJuwAACA0AAAiNAAAITQAACfsAEAcDAAAIUwAACBMAFQjDABMHIwAACHMAAAgzAAAJxwARBwsAAAhjAAAIIwAACacAAAgDAAAIgwAACEMAAAnnABAHBwAACFsAAAgbAAAJlwAUB0MAAAh7AAAIOwAACdcAEgcTAAAIawAACCsAAAm3AAAICwAACIsAAAhLAAAJ9wAQBwUAAAhXAAAIFwBACAAAEwczAAAIdwAACDcAAAnPABEHDwAACGcAAAgnAAAJrwAACAcAAAiHAAAIRwAACe8AEAcJAAAIXwAACB8AAAmfABQHYwAACH8AAAg/AAAJ3wASBxsAAAhvAAAILwAACb8AAAgPAAAIjwAACE8AAAn/ABAFAQAXBQEBEwURABsFARARBQUAGQUBBBUFQQAdBQFAEAUDABgFAQIUBSEAHAUBIBIFCQAaBQEIFgWBAEAFAAAQBQIAFwWBARMFGQAbBQEYEQUHABkFAQYVBWEAHQUBYBAFBAAYBQEDFAUxABwFATASBQ0AGgUBDBYFwQBABQAAEQAKABEREQAAAAAFAAAAAAAACQAAAAALAAAAAAAAAAARAA8KERERAwoHAAEACQsLAAAJBgsAAAsABhEAAAAREREAQYGEAQshCwAAAAAAAAAAEQAKChEREQAKAAACAAkLAAAACQALAAALAEG7hAELAQwAQceEAQsVDAAAAAAMAAAAAAkMAAAAAAAMAAAMAEH1hAELAQ4AQYGFAQsVDQAAAAQNAAAAAAkOAAAAAAAOAAAOAEGvhQELARAAQbuFAQseDwAAAAAPAAAAAAkQAAAAAAAQAAAQAAASAAAAEhISAEHyhQELDhIAAAASEhIAAAAAAAAJAEGjhgELAQsAQa+GAQsVCgAAAAAKAAAAAAkLAAAAAAALAAALAEHdhgELAQwAQemGAQsnDAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAwMTIzNDU2Nzg5QUJDREVGAEG0hwELARkAQduHAQsF//////8AQaCIAQtXGRJEOwI/LEcUPTMwChsGRktFNw9JDo4XA0AdPGkrNh9KLRwBICUpIQgMFRYiLhA4Pgs0MRhkdHV2L0EJfzkRI0MyQomKiwUEJignDSoeNYwHGkiTE5SVAEGAiQELig5JbGxlZ2FsIGJ5dGUgc2VxdWVuY2UARG9tYWluIGVycm9yAFJlc3VsdCBub3QgcmVwcmVzZW50YWJsZQBOb3QgYSB0dHkAUGVybWlzc2lvbiBkZW5pZWQAT3BlcmF0aW9uIG5vdCBwZXJtaXR0ZWQATm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeQBObyBzdWNoIHByb2Nlc3MARmlsZSBleGlzdHMAVmFsdWUgdG9vIGxhcmdlIGZvciBkYXRhIHR5cGUATm8gc3BhY2UgbGVmdCBvbiBkZXZpY2UAT3V0IG9mIG1lbW9yeQBSZXNvdXJjZSBidXN5AEludGVycnVwdGVkIHN5c3RlbSBjYWxsAFJlc291cmNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlAEludmFsaWQgc2VlawBDcm9zcy1kZXZpY2UgbGluawBSZWFkLW9ubHkgZmlsZSBzeXN0ZW0ARGlyZWN0b3J5IG5vdCBlbXB0eQBDb25uZWN0aW9uIHJlc2V0IGJ5IHBlZXIAT3BlcmF0aW9uIHRpbWVkIG91dABDb25uZWN0aW9uIHJlZnVzZWQASG9zdCBpcyBkb3duAEhvc3QgaXMgdW5yZWFjaGFibGUAQWRkcmVzcyBpbiB1c2UAQnJva2VuIHBpcGUASS9PIGVycm9yAE5vIHN1Y2ggZGV2aWNlIG9yIGFkZHJlc3MAQmxvY2sgZGV2aWNlIHJlcXVpcmVkAE5vIHN1Y2ggZGV2aWNlAE5vdCBhIGRpcmVjdG9yeQBJcyBhIGRpcmVjdG9yeQBUZXh0IGZpbGUgYnVzeQBFeGVjIGZvcm1hdCBlcnJvcgBJbnZhbGlkIGFyZ3VtZW50AEFyZ3VtZW50IGxpc3QgdG9vIGxvbmcAU3ltYm9saWMgbGluayBsb29wAEZpbGVuYW1lIHRvbyBsb25nAFRvbyBtYW55IG9wZW4gZmlsZXMgaW4gc3lzdGVtAE5vIGZpbGUgZGVzY3JpcHRvcnMgYXZhaWxhYmxlAEJhZCBmaWxlIGRlc2NyaXB0b3IATm8gY2hpbGQgcHJvY2VzcwBCYWQgYWRkcmVzcwBGaWxlIHRvbyBsYXJnZQBUb28gbWFueSBsaW5rcwBObyBsb2NrcyBhdmFpbGFibGUAUmVzb3VyY2UgZGVhZGxvY2sgd291bGQgb2NjdXIAU3RhdGUgbm90IHJlY292ZXJhYmxlAFByZXZpb3VzIG93bmVyIGRpZWQAT3BlcmF0aW9uIGNhbmNlbGVkAEZ1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZABObyBtZXNzYWdlIG9mIGRlc2lyZWQgdHlwZQBJZGVudGlmaWVyIHJlbW92ZWQARGV2aWNlIG5vdCBhIHN0cmVhbQBObyBkYXRhIGF2YWlsYWJsZQBEZXZpY2UgdGltZW91dABPdXQgb2Ygc3RyZWFtcyByZXNvdXJjZXMATGluayBoYXMgYmVlbiBzZXZlcmVkAFByb3RvY29sIGVycm9yAEJhZCBtZXNzYWdlAEZpbGUgZGVzY3JpcHRvciBpbiBiYWQgc3RhdGUATm90IGEgc29ja2V0AERlc3RpbmF0aW9uIGFkZHJlc3MgcmVxdWlyZWQATWVzc2FnZSB0b28gbGFyZ2UAUHJvdG9jb2wgd3JvbmcgdHlwZSBmb3Igc29ja2V0AFByb3RvY29sIG5vdCBhdmFpbGFibGUAUHJvdG9jb2wgbm90IHN1cHBvcnRlZABTb2NrZXQgdHlwZSBub3Qgc3VwcG9ydGVkAE5vdCBzdXBwb3J0ZWQAUHJvdG9jb2wgZmFtaWx5IG5vdCBzdXBwb3J0ZWQAQWRkcmVzcyBmYW1pbHkgbm90IHN1cHBvcnRlZCBieSBwcm90b2NvbABBZGRyZXNzIG5vdCBhdmFpbGFibGUATmV0d29yayBpcyBkb3duAE5ldHdvcmsgdW5yZWFjaGFibGUAQ29ubmVjdGlvbiByZXNldCBieSBuZXR3b3JrAENvbm5lY3Rpb24gYWJvcnRlZABObyBidWZmZXIgc3BhY2UgYXZhaWxhYmxlAFNvY2tldCBpcyBjb25uZWN0ZWQAU29ja2V0IG5vdCBjb25uZWN0ZWQAQ2Fubm90IHNlbmQgYWZ0ZXIgc29ja2V0IHNodXRkb3duAE9wZXJhdGlvbiBhbHJlYWR5IGluIHByb2dyZXNzAE9wZXJhdGlvbiBpbiBwcm9ncmVzcwBTdGFsZSBmaWxlIGhhbmRsZQBSZW1vdGUgSS9PIGVycm9yAFF1b3RhIGV4Y2VlZGVkAE5vIG1lZGl1bSBmb3VuZABXcm9uZyBtZWRpdW0gdHlwZQBObyBlcnJvciBpbmZvcm1hdGlvbgBBkJcBC1JQUFAACgAAAAsAAAAMAAAADQAAAA4AAAAPAAAAEAAAABEAAAASAAAACwAAAAwAAAANAAAADgAAAA8AAAAQAAAAEQAAAAEAAAAIAAAAlEsAALRLAEGQmQELAgxQAEHImQELCR8AAADkTAAAAwBB5JkBC4wBLfRRWM+MscBG9rXLKTEDxwRbcDC0Xf0geH+LmthZKVBoSImrp1YDbP+3zYg/1He0K6WjcPG65Kj8QYP92W/hinovLXSWBx8NCV4Ddixw90ClLKdvV0GoqnTfoFhkA0rHxDxTrq9fGAQVseNtKIarDKS/Q/DpUIE5VxZSN/////////////////////8=";
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}
function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    var binary = tryParseAsDataURI(file);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(file);
    } else {
      throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
    }
  } catch (err) {
    abort(err);
  }
}
function instantiateSync(file, info) {
  var instance;
  var module;
  var binary;
  try {
    binary = getBinary(file);
    module = new WebAssembly.Module(binary);
    instance = new WebAssembly.Instance(module, info);
  } catch (e) {
    var str = e.toString();
    err("failed to compile wasm module: " + str);
    if (str.includes("imported Memory") || str.includes("memory import")) {
      err(
        "Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time)."
      );
    }
    throw e;
  }
  return [instance, module];
}
function createWasm() {
  var info = { a: asmLibraryArg };
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module["asm"] = exports;
    wasmMemory = Module["asm"]["u"];
    updateGlobalBufferAndViews(wasmMemory.buffer);
    wasmTable = Module["asm"]["za"];
    addOnInit(Module["asm"]["v"]);
    removeRunDependency("wasm-instantiate");
  }
  addRunDependency("wasm-instantiate");
  if (Module["instantiateWasm"]) {
    try {
      var exports = Module["instantiateWasm"](info, receiveInstance);
      return exports;
    } catch (e) {
      err("Module.instantiateWasm callback failed with error: " + e);
      return false;
    }
  }
  var result = instantiateSync(wasmBinaryFile, info);
  receiveInstance(result[0]);
  return Module["asm"];
}
var tempDouble;
var tempI64;
function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == "function") {
      callback(Module);
      continue;
    }
    var func = callback.func;
    if (typeof func === "number") {
      if (callback.arg === undefined) {
        wasmTable.get(func)();
      } else {
        wasmTable.get(func)(callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
function _gmtime_r(time, tmPtr) {
  var date = new Date(HEAP32[time >> 2] * 1e3);
  HEAP32[tmPtr >> 2] = date.getUTCSeconds();
  HEAP32[(tmPtr + 4) >> 2] = date.getUTCMinutes();
  HEAP32[(tmPtr + 8) >> 2] = date.getUTCHours();
  HEAP32[(tmPtr + 12) >> 2] = date.getUTCDate();
  HEAP32[(tmPtr + 16) >> 2] = date.getUTCMonth();
  HEAP32[(tmPtr + 20) >> 2] = date.getUTCFullYear() - 1900;
  HEAP32[(tmPtr + 24) >> 2] = date.getUTCDay();
  HEAP32[(tmPtr + 36) >> 2] = 0;
  HEAP32[(tmPtr + 32) >> 2] = 0;
  var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
  var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
  HEAP32[(tmPtr + 28) >> 2] = yday;
  if (!_gmtime_r.GMTString) _gmtime_r.GMTString = allocateUTF8("GMT");
  HEAP32[(tmPtr + 40) >> 2] = _gmtime_r.GMTString;
  return tmPtr;
}
function ___gmtime_r(a0, a1) {
  return _gmtime_r(a0, a1);
}
var PATH = {
  splitPath: function(filename) {
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1);
  },
  normalizeArray: function(parts, allowAboveRoot) {
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1);
      } else if (last === "..") {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    if (allowAboveRoot) {
      for (; up; up--) {
        parts.unshift("..");
      }
    }
    return parts;
  },
  normalize: function(path) {
    var isAbsolute = path.charAt(0) === "/",
      trailingSlash = path.substr(-1) === "/";
    path = PATH.normalizeArray(
      path.split("/").filter(function(p) {
        return !!p;
      }),
      !isAbsolute
    ).join("/");
    if (!path && !isAbsolute) {
      path = ".";
    }
    if (path && trailingSlash) {
      path += "/";
    }
    return (isAbsolute ? "/" : "") + path;
  },
  dirname: function(path) {
    var result = PATH.splitPath(path),
      root = result[0],
      dir = result[1];
    if (!root && !dir) {
      return ".";
    }
    if (dir) {
      dir = dir.substr(0, dir.length - 1);
    }
    return root + dir;
  },
  basename: function(path) {
    if (path === "/") return "/";
    path = PATH.normalize(path);
    path = path.replace(/\/$/, "");
    var lastSlash = path.lastIndexOf("/");
    if (lastSlash === -1) return path;
    return path.substr(lastSlash + 1);
  },
  extname: function(path) {
    return PATH.splitPath(path)[3];
  },
  join: function() {
    var paths = Array.prototype.slice.call(arguments, 0);
    return PATH.normalize(paths.join("/"));
  },
  join2: function(l, r) {
    return PATH.normalize(l + "/" + r);
  }
};
function getRandomDevice() {
  if (
    typeof crypto === "object" &&
    typeof crypto["getRandomValues"] === "function"
  ) {
    var randomBuffer = new Uint8Array(1);
    return function() {
      crypto.getRandomValues(randomBuffer);
      return randomBuffer[0];
    };
  } else if (ENVIRONMENT_IS_NODE) {
    try {
      var crypto_module = __webpack_require__(/*! crypto */ "crypto");
      return function() {
        return crypto_module["randomBytes"](1)[0];
      };
    } catch (e) {}
  }
  return function() {
    abort("randomDevice");
  };
}
var PATH_FS = {
  resolve: function() {
    var resolvedPath = "",
      resolvedAbsolute = false;
    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = i >= 0 ? arguments[i] : FS.cwd();
      if (typeof path !== "string") {
        throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
        return "";
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = path.charAt(0) === "/";
    }
    resolvedPath = PATH.normalizeArray(
      resolvedPath.split("/").filter(function(p) {
        return !!p;
      }),
      !resolvedAbsolute
    ).join("/");
    return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
  },
  relative: function(from, to) {
    from = PATH_FS.resolve(from).substr(1);
    to = PATH_FS.resolve(to).substr(1);
    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/");
  }
};
var TTY = {
  ttys: [],
  init: function() {},
  shutdown: function() {},
  register: function(dev, ops) {
    TTY.ttys[dev] = { input: [], output: [], ops: ops };
    FS.registerDevice(dev, TTY.stream_ops);
  },
  stream_ops: {
    open: function(stream) {
      var tty = TTY.ttys[stream.node.rdev];
      if (!tty) {
        throw new FS.ErrnoError(43);
      }
      stream.tty = tty;
      stream.seekable = false;
    },
    close: function(stream) {
      stream.tty.ops.flush(stream.tty);
    },
    flush: function(stream) {
      stream.tty.ops.flush(stream.tty);
    },
    read: function(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.get_char) {
        throw new FS.ErrnoError(60);
      }
      var bytesRead = 0;
      for (var i = 0; i < length; i++) {
        var result;
        try {
          result = stream.tty.ops.get_char(stream.tty);
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
        if (result === undefined && bytesRead === 0) {
          throw new FS.ErrnoError(6);
        }
        if (result === null || result === undefined) break;
        bytesRead++;
        buffer[offset + i] = result;
      }
      if (bytesRead) {
        stream.node.timestamp = Date.now();
      }
      return bytesRead;
    },
    write: function(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.put_char) {
        throw new FS.ErrnoError(60);
      }
      try {
        for (var i = 0; i < length; i++) {
          stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
        }
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (length) {
        stream.node.timestamp = Date.now();
      }
      return i;
    }
  },
  default_tty_ops: {
    get_char: function(tty) {
      if (!tty.input.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
          var BUFSIZE = 256;
          var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
          var bytesRead = 0;
          try {
            bytesRead = nodeFS.readSync(
              process.stdin.fd,
              buf,
              0,
              BUFSIZE,
              null
            );
          } catch (e) {
            if (e.toString().includes("EOF")) bytesRead = 0;
            else throw e;
          }
          if (bytesRead > 0) {
            result = buf.slice(0, bytesRead).toString("utf-8");
          } else {
            result = null;
          }
        } else if (
          typeof window != "undefined" &&
          typeof window.prompt == "function"
        ) {
          result = window.prompt("Input: ");
          if (result !== null) {
            result += "\n";
          }
        } else if (typeof readline == "function") {
          result = readline();
          if (result !== null) {
            result += "\n";
          }
        }
        if (!result) {
          return null;
        }
        tty.input = intArrayFromString(result, true);
      }
      return tty.input.shift();
    },
    put_char: function(tty, val) {
      if (val === null || val === 10) {
        out(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    flush: function(tty) {
      if (tty.output && tty.output.length > 0) {
        out(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      }
    }
  },
  default_tty1_ops: {
    put_char: function(tty, val) {
      if (val === null || val === 10) {
        err(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    flush: function(tty) {
      if (tty.output && tty.output.length > 0) {
        err(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      }
    }
  }
};
function mmapAlloc(size) {
  var alignedSize = alignMemory(size, 65536);
  var ptr = _malloc(alignedSize);
  while (size < alignedSize) HEAP8[ptr + size++] = 0;
  return ptr;
}
var MEMFS = {
  ops_table: null,
  mount: function(mount) {
    return MEMFS.createNode(null, "/", 16384 | 511, 0);
  },
  createNode: function(parent, name, mode, dev) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      throw new FS.ErrnoError(63);
    }
    if (!MEMFS.ops_table) {
      MEMFS.ops_table = {
        dir: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          },
          stream: { llseek: MEMFS.stream_ops.llseek }
        },
        file: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          },
          stream: {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap,
            msync: MEMFS.stream_ops.msync
          }
        },
        link: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          },
          stream: {}
        },
        chrdev: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          },
          stream: FS.chrdev_stream_ops
        }
      };
    }
    var node = FS.createNode(parent, name, mode, dev);
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node;
      node.stream_ops = MEMFS.ops_table.dir.stream;
      node.contents = {};
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node;
      node.stream_ops = MEMFS.ops_table.file.stream;
      node.usedBytes = 0;
      node.contents = null;
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node;
      node.stream_ops = MEMFS.ops_table.link.stream;
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node;
      node.stream_ops = MEMFS.ops_table.chrdev.stream;
    }
    node.timestamp = Date.now();
    if (parent) {
      parent.contents[name] = node;
      parent.timestamp = node.timestamp;
    }
    return node;
  },
  getFileDataAsTypedArray: function(node) {
    if (!node.contents) return new Uint8Array(0);
    if (node.contents.subarray)
      return node.contents.subarray(0, node.usedBytes);
    return new Uint8Array(node.contents);
  },
  expandFileStorage: function(node, newCapacity) {
    var prevCapacity = node.contents ? node.contents.length : 0;
    if (prevCapacity >= newCapacity) return;
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(
      newCapacity,
      (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0
    );
    if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
    var oldContents = node.contents;
    node.contents = new Uint8Array(newCapacity);
    if (node.usedBytes > 0)
      node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
  },
  resizeFileStorage: function(node, newSize) {
    if (node.usedBytes == newSize) return;
    if (newSize == 0) {
      node.contents = null;
      node.usedBytes = 0;
    } else {
      var oldContents = node.contents;
      node.contents = new Uint8Array(newSize);
      if (oldContents) {
        node.contents.set(
          oldContents.subarray(0, Math.min(newSize, node.usedBytes))
        );
      }
      node.usedBytes = newSize;
    }
  },
  node_ops: {
    getattr: function(node) {
      var attr = {};
      attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
      attr.ino = node.id;
      attr.mode = node.mode;
      attr.nlink = 1;
      attr.uid = 0;
      attr.gid = 0;
      attr.rdev = node.rdev;
      if (FS.isDir(node.mode)) {
        attr.size = 4096;
      } else if (FS.isFile(node.mode)) {
        attr.size = node.usedBytes;
      } else if (FS.isLink(node.mode)) {
        attr.size = node.link.length;
      } else {
        attr.size = 0;
      }
      attr.atime = new Date(node.timestamp);
      attr.mtime = new Date(node.timestamp);
      attr.ctime = new Date(node.timestamp);
      attr.blksize = 4096;
      attr.blocks = Math.ceil(attr.size / attr.blksize);
      return attr;
    },
    setattr: function(node, attr) {
      if (attr.mode !== undefined) {
        node.mode = attr.mode;
      }
      if (attr.timestamp !== undefined) {
        node.timestamp = attr.timestamp;
      }
      if (attr.size !== undefined) {
        MEMFS.resizeFileStorage(node, attr.size);
      }
    },
    lookup: function(parent, name) {
      throw FS.genericErrors[44];
    },
    mknod: function(parent, name, mode, dev) {
      return MEMFS.createNode(parent, name, mode, dev);
    },
    rename: function(old_node, new_dir, new_name) {
      if (FS.isDir(old_node.mode)) {
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {}
        if (new_node) {
          for (var i in new_node.contents) {
            throw new FS.ErrnoError(55);
          }
        }
      }
      delete old_node.parent.contents[old_node.name];
      old_node.parent.timestamp = Date.now();
      old_node.name = new_name;
      new_dir.contents[new_name] = old_node;
      new_dir.timestamp = old_node.parent.timestamp;
      old_node.parent = new_dir;
    },
    unlink: function(parent, name) {
      delete parent.contents[name];
      parent.timestamp = Date.now();
    },
    rmdir: function(parent, name) {
      var node = FS.lookupNode(parent, name);
      for (var i in node.contents) {
        throw new FS.ErrnoError(55);
      }
      delete parent.contents[name];
      parent.timestamp = Date.now();
    },
    readdir: function(node) {
      var entries = [".", ".."];
      for (var key in node.contents) {
        if (!node.contents.hasOwnProperty(key)) {
          continue;
        }
        entries.push(key);
      }
      return entries;
    },
    symlink: function(parent, newname, oldpath) {
      var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
      node.link = oldpath;
      return node;
    },
    readlink: function(node) {
      if (!FS.isLink(node.mode)) {
        throw new FS.ErrnoError(28);
      }
      return node.link;
    }
  },
  stream_ops: {
    read: function(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= stream.node.usedBytes) return 0;
      var size = Math.min(stream.node.usedBytes - position, length);
      if (size > 8 && contents.subarray) {
        buffer.set(contents.subarray(position, position + size), offset);
      } else {
        for (var i = 0; i < size; i++)
          buffer[offset + i] = contents[position + i];
      }
      return size;
    },
    write: function(stream, buffer, offset, length, position, canOwn) {
      if (buffer.buffer === HEAP8.buffer) {
        canOwn = false;
      }
      if (!length) return 0;
      var node = stream.node;
      node.timestamp = Date.now();
      if (buffer.subarray && (!node.contents || node.contents.subarray)) {
        if (canOwn) {
          node.contents = buffer.subarray(offset, offset + length);
          node.usedBytes = length;
          return length;
        } else if (node.usedBytes === 0 && position === 0) {
          node.contents = buffer.slice(offset, offset + length);
          node.usedBytes = length;
          return length;
        } else if (position + length <= node.usedBytes) {
          node.contents.set(buffer.subarray(offset, offset + length), position);
          return length;
        }
      }
      MEMFS.expandFileStorage(node, position + length);
      if (node.contents.subarray && buffer.subarray) {
        node.contents.set(buffer.subarray(offset, offset + length), position);
      } else {
        for (var i = 0; i < length; i++) {
          node.contents[position + i] = buffer[offset + i];
        }
      }
      node.usedBytes = Math.max(node.usedBytes, position + length);
      return length;
    },
    llseek: function(stream, offset, whence) {
      var position = offset;
      if (whence === 1) {
        position += stream.position;
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          position += stream.node.usedBytes;
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(28);
      }
      return position;
    },
    allocate: function(stream, offset, length) {
      MEMFS.expandFileStorage(stream.node, offset + length);
      stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
    },
    mmap: function(stream, address, length, position, prot, flags) {
      if (address !== 0) {
        throw new FS.ErrnoError(28);
      }
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      var ptr;
      var allocated;
      var contents = stream.node.contents;
      if (!(flags & 2) && contents.buffer === buffer) {
        allocated = false;
        ptr = contents.byteOffset;
      } else {
        if (position > 0 || position + length < contents.length) {
          if (contents.subarray) {
            contents = contents.subarray(position, position + length);
          } else {
            contents = Array.prototype.slice.call(
              contents,
              position,
              position + length
            );
          }
        }
        allocated = true;
        ptr = mmapAlloc(length);
        if (!ptr) {
          throw new FS.ErrnoError(48);
        }
        HEAP8.set(contents, ptr);
      }
      return { ptr: ptr, allocated: allocated };
    },
    msync: function(stream, buffer, offset, length, mmapFlags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      if (mmapFlags & 2) {
        return 0;
      }
      var bytesWritten = MEMFS.stream_ops.write(
        stream,
        buffer,
        0,
        length,
        offset,
        false
      );
      return 0;
    }
  }
};
var ERRNO_CODES = {
  EPERM: 63,
  ENOENT: 44,
  ESRCH: 71,
  EINTR: 27,
  EIO: 29,
  ENXIO: 60,
  E2BIG: 1,
  ENOEXEC: 45,
  EBADF: 8,
  ECHILD: 12,
  EAGAIN: 6,
  EWOULDBLOCK: 6,
  ENOMEM: 48,
  EACCES: 2,
  EFAULT: 21,
  ENOTBLK: 105,
  EBUSY: 10,
  EEXIST: 20,
  EXDEV: 75,
  ENODEV: 43,
  ENOTDIR: 54,
  EISDIR: 31,
  EINVAL: 28,
  ENFILE: 41,
  EMFILE: 33,
  ENOTTY: 59,
  ETXTBSY: 74,
  EFBIG: 22,
  ENOSPC: 51,
  ESPIPE: 70,
  EROFS: 69,
  EMLINK: 34,
  EPIPE: 64,
  EDOM: 18,
  ERANGE: 68,
  ENOMSG: 49,
  EIDRM: 24,
  ECHRNG: 106,
  EL2NSYNC: 156,
  EL3HLT: 107,
  EL3RST: 108,
  ELNRNG: 109,
  EUNATCH: 110,
  ENOCSI: 111,
  EL2HLT: 112,
  EDEADLK: 16,
  ENOLCK: 46,
  EBADE: 113,
  EBADR: 114,
  EXFULL: 115,
  ENOANO: 104,
  EBADRQC: 103,
  EBADSLT: 102,
  EDEADLOCK: 16,
  EBFONT: 101,
  ENOSTR: 100,
  ENODATA: 116,
  ETIME: 117,
  ENOSR: 118,
  ENONET: 119,
  ENOPKG: 120,
  EREMOTE: 121,
  ENOLINK: 47,
  EADV: 122,
  ESRMNT: 123,
  ECOMM: 124,
  EPROTO: 65,
  EMULTIHOP: 36,
  EDOTDOT: 125,
  EBADMSG: 9,
  ENOTUNIQ: 126,
  EBADFD: 127,
  EREMCHG: 128,
  ELIBACC: 129,
  ELIBBAD: 130,
  ELIBSCN: 131,
  ELIBMAX: 132,
  ELIBEXEC: 133,
  ENOSYS: 52,
  ENOTEMPTY: 55,
  ENAMETOOLONG: 37,
  ELOOP: 32,
  EOPNOTSUPP: 138,
  EPFNOSUPPORT: 139,
  ECONNRESET: 15,
  ENOBUFS: 42,
  EAFNOSUPPORT: 5,
  EPROTOTYPE: 67,
  ENOTSOCK: 57,
  ENOPROTOOPT: 50,
  ESHUTDOWN: 140,
  ECONNREFUSED: 14,
  EADDRINUSE: 3,
  ECONNABORTED: 13,
  ENETUNREACH: 40,
  ENETDOWN: 38,
  ETIMEDOUT: 73,
  EHOSTDOWN: 142,
  EHOSTUNREACH: 23,
  EINPROGRESS: 26,
  EALREADY: 7,
  EDESTADDRREQ: 17,
  EMSGSIZE: 35,
  EPROTONOSUPPORT: 66,
  ESOCKTNOSUPPORT: 137,
  EADDRNOTAVAIL: 4,
  ENETRESET: 39,
  EISCONN: 30,
  ENOTCONN: 53,
  ETOOMANYREFS: 141,
  EUSERS: 136,
  EDQUOT: 19,
  ESTALE: 72,
  ENOTSUP: 138,
  ENOMEDIUM: 148,
  EILSEQ: 25,
  EOVERFLOW: 61,
  ECANCELED: 11,
  ENOTRECOVERABLE: 56,
  EOWNERDEAD: 62,
  ESTRPIPE: 135
};
var NODEFS = {
  isWindows: false,
  staticInit: function() {
    NODEFS.isWindows = !!process.platform.match(/^win/);
    var flags = { fs: fs.constants };
    if (flags["fs"]) {
      flags = flags["fs"];
    }
    NODEFS.flagsForNodeMap = {
      1024: flags["O_APPEND"],
      64: flags["O_CREAT"],
      128: flags["O_EXCL"],
      256: flags["O_NOCTTY"],
      0: flags["O_RDONLY"],
      2: flags["O_RDWR"],
      4096: flags["O_SYNC"],
      512: flags["O_TRUNC"],
      1: flags["O_WRONLY"]
    };
  },
  bufferFrom: function(arrayBuffer) {
    return Buffer["alloc"] ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer);
  },
  convertNodeCode: function(e) {
    var code = e.code;
    return ERRNO_CODES[code];
  },
  mount: function(mount) {
    return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0);
  },
  createNode: function(parent, name, mode, dev) {
    if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
      throw new FS.ErrnoError(28);
    }
    var node = FS.createNode(parent, name, mode);
    node.node_ops = NODEFS.node_ops;
    node.stream_ops = NODEFS.stream_ops;
    return node;
  },
  getMode: function(path) {
    var stat;
    try {
      stat = fs.lstatSync(path);
      if (NODEFS.isWindows) {
        stat.mode = stat.mode | ((stat.mode & 292) >> 2);
      }
    } catch (e) {
      if (!e.code) throw e;
      throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
    }
    return stat.mode;
  },
  realPath: function(node) {
    var parts = [];
    while (node.parent !== node) {
      parts.push(node.name);
      node = node.parent;
    }
    parts.push(node.mount.opts.root);
    parts.reverse();
    return PATH.join.apply(null, parts);
  },
  flagsForNode: function(flags) {
    flags &= ~2097152;
    flags &= ~2048;
    flags &= ~32768;
    flags &= ~524288;
    var newFlags = 0;
    for (var k in NODEFS.flagsForNodeMap) {
      if (flags & k) {
        newFlags |= NODEFS.flagsForNodeMap[k];
        flags ^= k;
      }
    }
    if (!flags) {
      return newFlags;
    } else {
      throw new FS.ErrnoError(28);
    }
  },
  node_ops: {
    getattr: function(node) {
      var path = NODEFS.realPath(node);
      var stat;
      try {
        stat = fs.lstatSync(path);
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
      if (NODEFS.isWindows && !stat.blksize) {
        stat.blksize = 4096;
      }
      if (NODEFS.isWindows && !stat.blocks) {
        stat.blocks = ((stat.size + stat.blksize - 1) / stat.blksize) | 0;
      }
      return {
        dev: stat.dev,
        ino: stat.ino,
        mode: stat.mode,
        nlink: stat.nlink,
        uid: stat.uid,
        gid: stat.gid,
        rdev: stat.rdev,
        size: stat.size,
        atime: stat.atime,
        mtime: stat.mtime,
        ctime: stat.ctime,
        blksize: stat.blksize,
        blocks: stat.blocks
      };
    },
    setattr: function(node, attr) {
      var path = NODEFS.realPath(node);
      try {
        if (attr.mode !== undefined) {
          fs.chmodSync(path, attr.mode);
          node.mode = attr.mode;
        }
        if (attr.timestamp !== undefined) {
          var date = new Date(attr.timestamp);
          fs.utimesSync(path, date, date);
        }
        if (attr.size !== undefined) {
          fs.truncateSync(path, attr.size);
        }
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
    },
    lookup: function(parent, name) {
      var path = PATH.join2(NODEFS.realPath(parent), name);
      var mode = NODEFS.getMode(path);
      return NODEFS.createNode(parent, name, mode);
    },
    mknod: function(parent, name, mode, dev) {
      var node = NODEFS.createNode(parent, name, mode, dev);
      var path = NODEFS.realPath(node);
      try {
        if (FS.isDir(node.mode)) {
          fs.mkdirSync(path, node.mode);
        } else {
          fs.writeFileSync(path, "", { mode: node.mode });
        }
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
      return node;
    },
    rename: function(oldNode, newDir, newName) {
      var oldPath = NODEFS.realPath(oldNode);
      var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
      try {
        fs.renameSync(oldPath, newPath);
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
      oldNode.name = newName;
    },
    unlink: function(parent, name) {
      var path = PATH.join2(NODEFS.realPath(parent), name);
      try {
        fs.unlinkSync(path);
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
    },
    rmdir: function(parent, name) {
      var path = PATH.join2(NODEFS.realPath(parent), name);
      try {
        fs.rmdirSync(path);
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
    },
    readdir: function(node) {
      var path = NODEFS.realPath(node);
      try {
        return fs.readdirSync(path);
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
    },
    symlink: function(parent, newName, oldPath) {
      var newPath = PATH.join2(NODEFS.realPath(parent), newName);
      try {
        fs.symlinkSync(oldPath, newPath);
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
    },
    readlink: function(node) {
      var path = NODEFS.realPath(node);
      try {
        path = fs.readlinkSync(path);
        path = NODEJS_PATH.relative(
          NODEJS_PATH.resolve(node.mount.opts.root),
          path
        );
        return path;
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
    }
  },
  stream_ops: {
    open: function(stream) {
      var path = NODEFS.realPath(stream.node);
      try {
        if (FS.isFile(stream.node.mode)) {
          stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
        }
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
    },
    close: function(stream) {
      try {
        if (FS.isFile(stream.node.mode) && stream.nfd) {
          fs.closeSync(stream.nfd);
        }
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
    },
    read: function(stream, buffer, offset, length, position) {
      if (length === 0) return 0;
      try {
        return fs.readSync(
          stream.nfd,
          NODEFS.bufferFrom(buffer.buffer),
          offset,
          length,
          position
        );
      } catch (e) {
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
    },
    write: function(stream, buffer, offset, length, position) {
      try {
        return fs.writeSync(
          stream.nfd,
          NODEFS.bufferFrom(buffer.buffer),
          offset,
          length,
          position
        );
      } catch (e) {
        throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
      }
    },
    llseek: function(stream, offset, whence) {
      var position = offset;
      if (whence === 1) {
        position += stream.position;
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          try {
            var stat = fs.fstatSync(stream.nfd);
            position += stat.size;
          } catch (e) {
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(28);
      }
      return position;
    },
    mmap: function(stream, address, length, position, prot, flags) {
      if (address !== 0) {
        throw new FS.ErrnoError(28);
      }
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      var ptr = mmapAlloc(length);
      NODEFS.stream_ops.read(stream, HEAP8, ptr, length, position);
      return { ptr: ptr, allocated: true };
    },
    msync: function(stream, buffer, offset, length, mmapFlags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      if (mmapFlags & 2) {
        return 0;
      }
      var bytesWritten = NODEFS.stream_ops.write(
        stream,
        buffer,
        0,
        length,
        offset,
        false
      );
      return 0;
    }
  }
};
var NODERAWFS = {
  lookupPath: function(path) {
    return { path: path, node: { mode: NODEFS.getMode(path) } };
  },
  createStandardStreams: function() {
    FS.streams[0] = {
      fd: 0,
      nfd: 0,
      position: 0,
      path: "",
      flags: 0,
      tty: true,
      seekable: false
    };
    for (var i = 1; i < 3; i++) {
      FS.streams[i] = {
        fd: i,
        nfd: i,
        position: 0,
        path: "",
        flags: 577,
        tty: true,
        seekable: false
      };
    }
  },
  cwd: function() {
    return process.cwd();
  },
  chdir: function() {
    process.chdir.apply(void 0, arguments);
  },
  mknod: function(path, mode) {
    if (FS.isDir(path)) {
      fs.mkdirSync(path, mode);
    } else {
      fs.writeFileSync(path, "", { mode: mode });
    }
  },
  mkdir: function() {
    fs.mkdirSync.apply(void 0, arguments);
  },
  symlink: function() {
    fs.symlinkSync.apply(void 0, arguments);
  },
  rename: function() {
    fs.renameSync.apply(void 0, arguments);
  },
  rmdir: function() {
    fs.rmdirSync.apply(void 0, arguments);
  },
  readdir: function() {
    fs.readdirSync.apply(void 0, arguments);
  },
  unlink: function() {
    fs.unlinkSync.apply(void 0, arguments);
  },
  readlink: function() {
    return fs.readlinkSync.apply(void 0, arguments);
  },
  stat: function() {
    return fs.statSync.apply(void 0, arguments);
  },
  lstat: function() {
    return fs.lstatSync.apply(void 0, arguments);
  },
  chmod: function() {
    fs.chmodSync.apply(void 0, arguments);
  },
  fchmod: function() {
    fs.fchmodSync.apply(void 0, arguments);
  },
  chown: function() {
    fs.chownSync.apply(void 0, arguments);
  },
  fchown: function() {
    fs.fchownSync.apply(void 0, arguments);
  },
  truncate: function() {
    fs.truncateSync.apply(void 0, arguments);
  },
  ftruncate: function(fd, len) {
    if (len < 0) {
      throw new FS.ErrnoError(28);
    }
    fs.ftruncateSync.apply(void 0, arguments);
  },
  utime: function() {
    fs.utimesSync.apply(void 0, arguments);
  },
  open: function(path, flags, mode, suggestFD) {
    if (typeof flags === "string") {
      flags = VFS.modeStringToFlags(flags);
    }
    var nfd = fs.openSync(path, NODEFS.flagsForNode(flags), mode);
    var fd = suggestFD != null ? suggestFD : FS.nextfd(nfd);
    var stream = {
      fd: fd,
      nfd: nfd,
      position: 0,
      path: path,
      flags: flags,
      seekable: true
    };
    FS.streams[fd] = stream;
    return stream;
  },
  close: function(stream) {
    if (!stream.stream_ops) {
      fs.closeSync(stream.nfd);
    }
    FS.closeStream(stream.fd);
  },
  llseek: function(stream, offset, whence) {
    if (stream.stream_ops) {
      return VFS.llseek(stream, offset, whence);
    }
    var position = offset;
    if (whence === 1) {
      position += stream.position;
    } else if (whence === 2) {
      position += fs.fstatSync(stream.nfd).size;
    } else if (whence !== 0) {
      throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
    }
    if (position < 0) {
      throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
    }
    stream.position = position;
    return position;
  },
  read: function(stream, buffer, offset, length, position) {
    if (stream.stream_ops) {
      return VFS.read(stream, buffer, offset, length, position);
    }
    var seeking = typeof position !== "undefined";
    if (!seeking && stream.seekable) position = stream.position;
    var bytesRead = fs.readSync(
      stream.nfd,
      NODEFS.bufferFrom(buffer.buffer),
      offset,
      length,
      position
    );
    if (!seeking) stream.position += bytesRead;
    return bytesRead;
  },
  write: function(stream, buffer, offset, length, position) {
    if (stream.stream_ops) {
      return VFS.write(stream, buffer, offset, length, position);
    }
    if (stream.flags & +"1024") {
      FS.llseek(stream, 0, +"2");
    }
    var seeking = typeof position !== "undefined";
    if (!seeking && stream.seekable) position = stream.position;
    var bytesWritten = fs.writeSync(
      stream.nfd,
      NODEFS.bufferFrom(buffer.buffer),
      offset,
      length,
      position
    );
    if (!seeking) stream.position += bytesWritten;
    return bytesWritten;
  },
  allocate: function() {
    throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
  },
  mmap: function(stream, address, length, position, prot, flags) {
    if (stream.stream_ops) {
      return VFS.mmap(stream, address, length, position, prot, flags);
    }
    if (address !== 0) {
      throw new FS.ErrnoError(28);
    }
    var ptr = mmapAlloc(length);
    FS.read(stream, HEAP8, ptr, length, position);
    return { ptr: ptr, allocated: true };
  },
  msync: function(stream, buffer, offset, length, mmapFlags) {
    if (stream.stream_ops) {
      return VFS.msync(stream, buffer, offset, length, mmapFlags);
    }
    if (mmapFlags & 2) {
      return 0;
    }
    FS.write(stream, buffer, 0, length, offset);
    return 0;
  },
  munmap: function() {
    return 0;
  },
  ioctl: function() {
    throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
  }
};
var FS = {
  root: null,
  mounts: [],
  devices: {},
  streams: [],
  nextInode: 1,
  nameTable: null,
  currentPath: "/",
  initialized: false,
  ignorePermissions: true,
  trackingDelegate: {},
  tracking: { openFlags: { READ: 1, WRITE: 2 } },
  ErrnoError: null,
  genericErrors: {},
  filesystems: null,
  syncFSRequests: 0,
  lookupPath: function(path, opts) {
    path = PATH_FS.resolve(FS.cwd(), path);
    opts = opts || {};
    if (!path) return { path: "", node: null };
    var defaults = { follow_mount: true, recurse_count: 0 };
    for (var key in defaults) {
      if (opts[key] === undefined) {
        opts[key] = defaults[key];
      }
    }
    if (opts.recurse_count > 8) {
      throw new FS.ErrnoError(32);
    }
    var parts = PATH.normalizeArray(
      path.split("/").filter(function(p) {
        return !!p;
      }),
      false
    );
    var current = FS.root;
    var current_path = "/";
    for (var i = 0; i < parts.length; i++) {
      var islast = i === parts.length - 1;
      if (islast && opts.parent) {
        break;
      }
      current = FS.lookupNode(current, parts[i]);
      current_path = PATH.join2(current_path, parts[i]);
      if (FS.isMountpoint(current)) {
        if (!islast || (islast && opts.follow_mount)) {
          current = current.mounted.root;
        }
      }
      if (!islast || opts.follow) {
        var count = 0;
        while (FS.isLink(current.mode)) {
          var link = FS.readlink(current_path);
          current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
          var lookup = FS.lookupPath(current_path, {
            recurse_count: opts.recurse_count
          });
          current = lookup.node;
          if (count++ > 40) {
            throw new FS.ErrnoError(32);
          }
        }
      }
    }
    return { path: current_path, node: current };
  },
  getPath: function(node) {
    var path;
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint;
        if (!path) return mount;
        return mount[mount.length - 1] !== "/"
          ? mount + "/" + path
          : mount + path;
      }
      path = path ? node.name + "/" + path : node.name;
      node = node.parent;
    }
  },
  hashName: function(parentid, name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    }
    return ((parentid + hash) >>> 0) % FS.nameTable.length;
  },
  hashAddNode: function(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    node.name_next = FS.nameTable[hash];
    FS.nameTable[hash] = node;
  },
  hashRemoveNode: function(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next;
    } else {
      var current = FS.nameTable[hash];
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next;
          break;
        }
        current = current.name_next;
      }
    }
  },
  lookupNode: function(parent, name) {
    var errCode = FS.mayLookup(parent);
    if (errCode) {
      throw new FS.ErrnoError(errCode, parent);
    }
    var hash = FS.hashName(parent.id, name);
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name;
      if (node.parent.id === parent.id && nodeName === name) {
        return node;
      }
    }
    return FS.lookup(parent, name);
  },
  createNode: function(parent, name, mode, rdev) {
    var node = new FS.FSNode(parent, name, mode, rdev);
    FS.hashAddNode(node);
    return node;
  },
  destroyNode: function(node) {
    FS.hashRemoveNode(node);
  },
  isRoot: function(node) {
    return node === node.parent;
  },
  isMountpoint: function(node) {
    return !!node.mounted;
  },
  isFile: function(mode) {
    return (mode & 61440) === 32768;
  },
  isDir: function(mode) {
    return (mode & 61440) === 16384;
  },
  isLink: function(mode) {
    return (mode & 61440) === 40960;
  },
  isChrdev: function(mode) {
    return (mode & 61440) === 8192;
  },
  isBlkdev: function(mode) {
    return (mode & 61440) === 24576;
  },
  isFIFO: function(mode) {
    return (mode & 61440) === 4096;
  },
  isSocket: function(mode) {
    return (mode & 49152) === 49152;
  },
  flagModes: { r: 0, "r+": 2, w: 577, "w+": 578, a: 1089, "a+": 1090 },
  modeStringToFlags: function(str) {
    var flags = FS.flagModes[str];
    if (typeof flags === "undefined") {
      throw new Error("Unknown file open mode: " + str);
    }
    return flags;
  },
  flagsToPermissionString: function(flag) {
    var perms = ["r", "w", "rw"][flag & 3];
    if (flag & 512) {
      perms += "w";
    }
    return perms;
  },
  nodePermissions: function(node, perms) {
    if (FS.ignorePermissions) {
      return 0;
    }
    if (perms.includes("r") && !(node.mode & 292)) {
      return 2;
    } else if (perms.includes("w") && !(node.mode & 146)) {
      return 2;
    } else if (perms.includes("x") && !(node.mode & 73)) {
      return 2;
    }
    return 0;
  },
  mayLookup: function(dir) {
    var errCode = FS.nodePermissions(dir, "x");
    if (errCode) return errCode;
    if (!dir.node_ops.lookup) return 2;
    return 0;
  },
  mayCreate: function(dir, name) {
    try {
      var node = FS.lookupNode(dir, name);
      return 20;
    } catch (e) {}
    return FS.nodePermissions(dir, "wx");
  },
  mayDelete: function(dir, name, isdir) {
    var node;
    try {
      node = FS.lookupNode(dir, name);
    } catch (e) {
      return e.errno;
    }
    var errCode = FS.nodePermissions(dir, "wx");
    if (errCode) {
      return errCode;
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 54;
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 10;
      }
    } else {
      if (FS.isDir(node.mode)) {
        return 31;
      }
    }
    return 0;
  },
  mayOpen: function(node, flags) {
    if (!node) {
      return 44;
    }
    if (FS.isLink(node.mode)) {
      return 32;
    } else if (FS.isDir(node.mode)) {
      if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
        return 31;
      }
    }
    return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
  },
  MAX_OPEN_FDS: 4096,
  nextfd: function(fd_start, fd_end) {
    fd_start = fd_start || 0;
    fd_end = fd_end || FS.MAX_OPEN_FDS;
    for (var fd = fd_start; fd <= fd_end; fd++) {
      if (!FS.streams[fd]) {
        return fd;
      }
    }
    throw new FS.ErrnoError(33);
  },
  getStream: function(fd) {
    return FS.streams[fd];
  },
  createStream: function(stream, fd_start, fd_end) {
    if (!FS.FSStream) {
      FS.FSStream = function() {};
      FS.FSStream.prototype = {
        object: {
          get: function() {
            return this.node;
          },
          set: function(val) {
            this.node = val;
          }
        },
        isRead: {
          get: function() {
            return (this.flags & 2097155) !== 1;
          }
        },
        isWrite: {
          get: function() {
            return (this.flags & 2097155) !== 0;
          }
        },
        isAppend: {
          get: function() {
            return this.flags & 1024;
          }
        }
      };
    }
    var newStream = new FS.FSStream();
    for (var p in stream) {
      newStream[p] = stream[p];
    }
    stream = newStream;
    var fd = FS.nextfd(fd_start, fd_end);
    stream.fd = fd;
    FS.streams[fd] = stream;
    return stream;
  },
  closeStream: function(fd) {
    FS.streams[fd] = null;
  },
  chrdev_stream_ops: {
    open: function(stream) {
      var device = FS.getDevice(stream.node.rdev);
      stream.stream_ops = device.stream_ops;
      if (stream.stream_ops.open) {
        stream.stream_ops.open(stream);
      }
    },
    llseek: function() {
      throw new FS.ErrnoError(70);
    }
  },
  major: function(dev) {
    return dev >> 8;
  },
  minor: function(dev) {
    return dev & 255;
  },
  makedev: function(ma, mi) {
    return (ma << 8) | mi;
  },
  registerDevice: function(dev, ops) {
    FS.devices[dev] = { stream_ops: ops };
  },
  getDevice: function(dev) {
    return FS.devices[dev];
  },
  getMounts: function(mount) {
    var mounts = [];
    var check = [mount];
    while (check.length) {
      var m = check.pop();
      mounts.push(m);
      check.push.apply(check, m.mounts);
    }
    return mounts;
  },
  syncfs: function(populate, callback) {
    if (typeof populate === "function") {
      callback = populate;
      populate = false;
    }
    FS.syncFSRequests++;
    if (FS.syncFSRequests > 1) {
      err(
        "warning: " +
          FS.syncFSRequests +
          " FS.syncfs operations in flight at once, probably just doing extra work"
      );
    }
    var mounts = FS.getMounts(FS.root.mount);
    var completed = 0;
    function doCallback(errCode) {
      FS.syncFSRequests--;
      return callback(errCode);
    }
    function done(errCode) {
      if (errCode) {
        if (!done.errored) {
          done.errored = true;
          return doCallback(errCode);
        }
        return;
      }
      if (++completed >= mounts.length) {
        doCallback(null);
      }
    }
    mounts.forEach(function(mount) {
      if (!mount.type.syncfs) {
        return done(null);
      }
      mount.type.syncfs(mount, populate, done);
    });
  },
  mount: function(type, opts, mountpoint) {
    var root = mountpoint === "/";
    var pseudo = !mountpoint;
    var node;
    if (root && FS.root) {
      throw new FS.ErrnoError(10);
    } else if (!root && !pseudo) {
      var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
      mountpoint = lookup.path;
      node = lookup.node;
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54);
      }
    }
    var mount = { type: type, opts: opts, mountpoint: mountpoint, mounts: [] };
    var mountRoot = type.mount(mount);
    mountRoot.mount = mount;
    mount.root = mountRoot;
    if (root) {
      FS.root = mountRoot;
    } else if (node) {
      node.mounted = mount;
      if (node.mount) {
        node.mount.mounts.push(mount);
      }
    }
    return mountRoot;
  },
  unmount: function(mountpoint) {
    var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
    if (!FS.isMountpoint(lookup.node)) {
      throw new FS.ErrnoError(28);
    }
    var node = lookup.node;
    var mount = node.mounted;
    var mounts = FS.getMounts(mount);
    Object.keys(FS.nameTable).forEach(function(hash) {
      var current = FS.nameTable[hash];
      while (current) {
        var next = current.name_next;
        if (mounts.includes(current.mount)) {
          FS.destroyNode(current);
        }
        current = next;
      }
    });
    node.mounted = null;
    var idx = node.mount.mounts.indexOf(mount);
    node.mount.mounts.splice(idx, 1);
  },
  lookup: function(parent, name) {
    return parent.node_ops.lookup(parent, name);
  },
  mknod: function(path, mode, dev) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    if (!name || name === "." || name === "..") {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.mayCreate(parent, name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.mknod(parent, name, mode, dev);
  },
  create: function(path, mode) {
    mode = mode !== undefined ? mode : 438;
    mode &= 4095;
    mode |= 32768;
    return FS.mknod(path, mode, 0);
  },
  mkdir: function(path, mode) {
    mode = mode !== undefined ? mode : 511;
    mode &= 511 | 512;
    mode |= 16384;
    return FS.mknod(path, mode, 0);
  },
  mkdirTree: function(path, mode) {
    var dirs = path.split("/");
    var d = "";
    for (var i = 0; i < dirs.length; ++i) {
      if (!dirs[i]) continue;
      d += "/" + dirs[i];
      try {
        FS.mkdir(d, mode);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
    }
  },
  mkdev: function(path, mode, dev) {
    if (typeof dev === "undefined") {
      dev = mode;
      mode = 438;
    }
    mode |= 8192;
    return FS.mknod(path, mode, dev);
  },
  symlink: function(oldpath, newpath) {
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(44);
    }
    var lookup = FS.lookupPath(newpath, { parent: true });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.symlink(parent, newname, oldpath);
  },
  rename: function(old_path, new_path) {
    var old_dirname = PATH.dirname(old_path);
    var new_dirname = PATH.dirname(new_path);
    var old_name = PATH.basename(old_path);
    var new_name = PATH.basename(new_path);
    var lookup, old_dir, new_dir;
    lookup = FS.lookupPath(old_path, { parent: true });
    old_dir = lookup.node;
    lookup = FS.lookupPath(new_path, { parent: true });
    new_dir = lookup.node;
    if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(75);
    }
    var old_node = FS.lookupNode(old_dir, old_name);
    var relative = PATH_FS.relative(old_path, new_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(28);
    }
    relative = PATH_FS.relative(new_path, old_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(55);
    }
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (old_node === new_node) {
      return;
    }
    var isdir = FS.isDir(old_node.mode);
    var errCode = FS.mayDelete(old_dir, old_name, isdir);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    errCode = new_node
      ? FS.mayDelete(new_dir, new_name, isdir)
      : FS.mayCreate(new_dir, new_name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
      throw new FS.ErrnoError(10);
    }
    if (new_dir !== old_dir) {
      errCode = FS.nodePermissions(old_dir, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    try {
      if (FS.trackingDelegate["willMovePath"]) {
        FS.trackingDelegate["willMovePath"](old_path, new_path);
      }
    } catch (e) {
      err(
        "FS.trackingDelegate['willMovePath']('" +
          old_path +
          "', '" +
          new_path +
          "') threw an exception: " +
          e.message
      );
    }
    FS.hashRemoveNode(old_node);
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name);
    } catch (e) {
      throw e;
    } finally {
      FS.hashAddNode(old_node);
    }
    try {
      if (FS.trackingDelegate["onMovePath"])
        FS.trackingDelegate["onMovePath"](old_path, new_path);
    } catch (e) {
      err(
        "FS.trackingDelegate['onMovePath']('" +
          old_path +
          "', '" +
          new_path +
          "') threw an exception: " +
          e.message
      );
    }
  },
  rmdir: function(path) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, true);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    try {
      if (FS.trackingDelegate["willDeletePath"]) {
        FS.trackingDelegate["willDeletePath"](path);
      }
    } catch (e) {
      err(
        "FS.trackingDelegate['willDeletePath']('" +
          path +
          "') threw an exception: " +
          e.message
      );
    }
    parent.node_ops.rmdir(parent, name);
    FS.destroyNode(node);
    try {
      if (FS.trackingDelegate["onDeletePath"])
        FS.trackingDelegate["onDeletePath"](path);
    } catch (e) {
      err(
        "FS.trackingDelegate['onDeletePath']('" +
          path +
          "') threw an exception: " +
          e.message
      );
    }
  },
  readdir: function(path) {
    var lookup = FS.lookupPath(path, { follow: true });
    var node = lookup.node;
    if (!node.node_ops.readdir) {
      throw new FS.ErrnoError(54);
    }
    return node.node_ops.readdir(node);
  },
  unlink: function(path) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, false);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    try {
      if (FS.trackingDelegate["willDeletePath"]) {
        FS.trackingDelegate["willDeletePath"](path);
      }
    } catch (e) {
      err(
        "FS.trackingDelegate['willDeletePath']('" +
          path +
          "') threw an exception: " +
          e.message
      );
    }
    parent.node_ops.unlink(parent, name);
    FS.destroyNode(node);
    try {
      if (FS.trackingDelegate["onDeletePath"])
        FS.trackingDelegate["onDeletePath"](path);
    } catch (e) {
      err(
        "FS.trackingDelegate['onDeletePath']('" +
          path +
          "') threw an exception: " +
          e.message
      );
    }
  },
  readlink: function(path) {
    var lookup = FS.lookupPath(path);
    var link = lookup.node;
    if (!link) {
      throw new FS.ErrnoError(44);
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(28);
    }
    return PATH_FS.resolve(
      FS.getPath(link.parent),
      link.node_ops.readlink(link)
    );
  },
  stat: function(path, dontFollow) {
    var lookup = FS.lookupPath(path, { follow: !dontFollow });
    var node = lookup.node;
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    if (!node.node_ops.getattr) {
      throw new FS.ErrnoError(63);
    }
    return node.node_ops.getattr(node);
  },
  lstat: function(path) {
    return FS.stat(path, true);
  },
  chmod: function(path, mode, dontFollow) {
    var node;
    if (typeof path === "string") {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup.node;
    } else {
      node = path;
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(63);
    }
    node.node_ops.setattr(node, {
      mode: (mode & 4095) | (node.mode & ~4095),
      timestamp: Date.now()
    });
  },
  lchmod: function(path, mode) {
    FS.chmod(path, mode, true);
  },
  fchmod: function(fd, mode) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    FS.chmod(stream.node, mode);
  },
  chown: function(path, uid, gid, dontFollow) {
    var node;
    if (typeof path === "string") {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup.node;
    } else {
      node = path;
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(63);
    }
    node.node_ops.setattr(node, { timestamp: Date.now() });
  },
  lchown: function(path, uid, gid) {
    FS.chown(path, uid, gid, true);
  },
  fchown: function(fd, uid, gid) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    FS.chown(stream.node, uid, gid);
  },
  truncate: function(path, len) {
    if (len < 0) {
      throw new FS.ErrnoError(28);
    }
    var node;
    if (typeof path === "string") {
      var lookup = FS.lookupPath(path, { follow: true });
      node = lookup.node;
    } else {
      node = path;
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.nodePermissions(node, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
  },
  ftruncate: function(fd, len) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(28);
    }
    FS.truncate(stream.node, len);
  },
  utime: function(path, atime, mtime) {
    var lookup = FS.lookupPath(path, { follow: true });
    var node = lookup.node;
    node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
  },
  open: function(path, flags, mode, fd_start, fd_end) {
    if (path === "") {
      throw new FS.ErrnoError(44);
    }
    flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
    mode = typeof mode === "undefined" ? 438 : mode;
    if (flags & 64) {
      mode = (mode & 4095) | 32768;
    } else {
      mode = 0;
    }
    var node;
    if (typeof path === "object") {
      node = path;
    } else {
      path = PATH.normalize(path);
      try {
        var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
        node = lookup.node;
      } catch (e) {}
    }
    var created = false;
    if (flags & 64) {
      if (node) {
        if (flags & 128) {
          throw new FS.ErrnoError(20);
        }
      } else {
        node = FS.mknod(path, mode, 0);
        created = true;
      }
    }
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    if (FS.isChrdev(node.mode)) {
      flags &= ~512;
    }
    if (flags & 65536 && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
    if (!created) {
      var errCode = FS.mayOpen(node, flags);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    if (flags & 512) {
      FS.truncate(node, 0);
    }
    flags &= ~(128 | 512 | 131072);
    var stream = FS.createStream(
      {
        node: node,
        path: FS.getPath(node),
        flags: flags,
        seekable: true,
        position: 0,
        stream_ops: node.stream_ops,
        ungotten: [],
        error: false
      },
      fd_start,
      fd_end
    );
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream);
    }
    if (Module["logReadFiles"] && !(flags & 1)) {
      if (!FS.readFiles) FS.readFiles = {};
      if (!(path in FS.readFiles)) {
        FS.readFiles[path] = 1;
        err("FS.trackingDelegate error on read file: " + path);
      }
    }
    try {
      if (FS.trackingDelegate["onOpenFile"]) {
        var trackingFlags = 0;
        if ((flags & 2097155) !== 1) {
          trackingFlags |= FS.tracking.openFlags.READ;
        }
        if ((flags & 2097155) !== 0) {
          trackingFlags |= FS.tracking.openFlags.WRITE;
        }
        FS.trackingDelegate["onOpenFile"](path, trackingFlags);
      }
    } catch (e) {
      err(
        "FS.trackingDelegate['onOpenFile']('" +
          path +
          "', flags) threw an exception: " +
          e.message
      );
    }
    return stream;
  },
  close: function(stream) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (stream.getdents) stream.getdents = null;
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream);
      }
    } catch (e) {
      throw e;
    } finally {
      FS.closeStream(stream.fd);
    }
    stream.fd = null;
  },
  isClosed: function(stream) {
    return stream.fd === null;
  },
  llseek: function(stream, offset, whence) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(70);
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(28);
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence);
    stream.ungotten = [];
    return stream.position;
  },
  read: function(stream, buffer, offset, length, position) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(28);
    }
    var seeking = typeof position !== "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesRead = stream.stream_ops.read(
      stream,
      buffer,
      offset,
      length,
      position
    );
    if (!seeking) stream.position += bytesRead;
    return bytesRead;
  },
  write: function(stream, buffer, offset, length, position, canOwn) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(28);
    }
    if (stream.seekable && stream.flags & 1024) {
      FS.llseek(stream, 0, 2);
    }
    var seeking = typeof position !== "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesWritten = stream.stream_ops.write(
      stream,
      buffer,
      offset,
      length,
      position,
      canOwn
    );
    if (!seeking) stream.position += bytesWritten;
    try {
      if (stream.path && FS.trackingDelegate["onWriteToFile"])
        FS.trackingDelegate["onWriteToFile"](stream.path);
    } catch (e) {
      err(
        "FS.trackingDelegate['onWriteToFile']('" +
          stream.path +
          "') threw an exception: " +
          e.message
      );
    }
    return bytesWritten;
  },
  allocate: function(stream, offset, length) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (offset < 0 || length <= 0) {
      throw new FS.ErrnoError(28);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    if (!stream.stream_ops.allocate) {
      throw new FS.ErrnoError(138);
    }
    stream.stream_ops.allocate(stream, offset, length);
  },
  mmap: function(stream, address, length, position, prot, flags) {
    if (
      (prot & 2) !== 0 &&
      (flags & 2) === 0 &&
      (stream.flags & 2097155) !== 2
    ) {
      throw new FS.ErrnoError(2);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(2);
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(43);
    }
    return stream.stream_ops.mmap(
      stream,
      address,
      length,
      position,
      prot,
      flags
    );
  },
  msync: function(stream, buffer, offset, length, mmapFlags) {
    if (!stream || !stream.stream_ops.msync) {
      return 0;
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
  },
  munmap: function(stream) {
    return 0;
  },
  ioctl: function(stream, cmd, arg) {
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(59);
    }
    return stream.stream_ops.ioctl(stream, cmd, arg);
  },
  readFile: function(path, opts) {
    opts = opts || {};
    opts.flags = opts.flags || 0;
    opts.encoding = opts.encoding || "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      throw new Error('Invalid encoding type "' + opts.encoding + '"');
    }
    var ret;
    var stream = FS.open(path, opts.flags);
    var stat = FS.stat(path);
    var length = stat.size;
    var buf = new Uint8Array(length);
    FS.read(stream, buf, 0, length, 0);
    if (opts.encoding === "utf8") {
      ret = UTF8ArrayToString(buf, 0);
    } else if (opts.encoding === "binary") {
      ret = buf;
    }
    FS.close(stream);
    return ret;
  },
  writeFile: function(path, data, opts) {
    opts = opts || {};
    opts.flags = opts.flags || 577;
    var stream = FS.open(path, opts.flags, opts.mode);
    if (typeof data === "string") {
      var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
      var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
      FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
    } else if (ArrayBuffer.isView(data)) {
      FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
    } else {
      throw new Error("Unsupported data type");
    }
    FS.close(stream);
  },
  cwd: function() {
    return FS.currentPath;
  },
  chdir: function(path) {
    var lookup = FS.lookupPath(path, { follow: true });
    if (lookup.node === null) {
      throw new FS.ErrnoError(44);
    }
    if (!FS.isDir(lookup.node.mode)) {
      throw new FS.ErrnoError(54);
    }
    var errCode = FS.nodePermissions(lookup.node, "x");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.currentPath = lookup.path;
  },
  createDefaultDirectories: function() {
    FS.mkdir("/tmp");
    FS.mkdir("/home");
    FS.mkdir("/home/web_user");
  },
  createDefaultDevices: function() {
    FS.mkdir("/dev");
    FS.registerDevice(FS.makedev(1, 3), {
      read: function() {
        return 0;
      },
      write: function(stream, buffer, offset, length, pos) {
        return length;
      }
    });
    FS.mkdev("/dev/null", FS.makedev(1, 3));
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
    FS.mkdev("/dev/tty", FS.makedev(5, 0));
    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
    var random_device = getRandomDevice();
    FS.createDevice("/dev", "random", random_device);
    FS.createDevice("/dev", "urandom", random_device);
    FS.mkdir("/dev/shm");
    FS.mkdir("/dev/shm/tmp");
  },
  createSpecialDirectories: function() {
    FS.mkdir("/proc");
    var proc_self = FS.mkdir("/proc/self");
    FS.mkdir("/proc/self/fd");
    FS.mount(
      {
        mount: function() {
          var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
          node.node_ops = {
            lookup: function(parent, name) {
              var fd = +name;
              var stream = FS.getStream(fd);
              if (!stream) throw new FS.ErrnoError(8);
              var ret = {
                parent: null,
                mount: { mountpoint: "fake" },
                node_ops: {
                  readlink: function() {
                    return stream.path;
                  }
                }
              };
              ret.parent = ret;
              return ret;
            }
          };
          return node;
        }
      },
      {},
      "/proc/self/fd"
    );
  },
  createStandardStreams: function() {
    if (Module["stdin"]) {
      FS.createDevice("/dev", "stdin", Module["stdin"]);
    } else {
      FS.symlink("/dev/tty", "/dev/stdin");
    }
    if (Module["stdout"]) {
      FS.createDevice("/dev", "stdout", null, Module["stdout"]);
    } else {
      FS.symlink("/dev/tty", "/dev/stdout");
    }
    if (Module["stderr"]) {
      FS.createDevice("/dev", "stderr", null, Module["stderr"]);
    } else {
      FS.symlink("/dev/tty1", "/dev/stderr");
    }
    var stdin = FS.open("/dev/stdin", 0);
    var stdout = FS.open("/dev/stdout", 1);
    var stderr = FS.open("/dev/stderr", 1);
  },
  ensureErrnoError: function() {
    if (FS.ErrnoError) return;
    FS.ErrnoError = function ErrnoError(errno, node) {
      this.node = node;
      this.setErrno = function(errno) {
        this.errno = errno;
      };
      this.setErrno(errno);
      this.message = "FS error";
    };
    FS.ErrnoError.prototype = new Error();
    FS.ErrnoError.prototype.constructor = FS.ErrnoError;
    [44].forEach(function(code) {
      FS.genericErrors[code] = new FS.ErrnoError(code);
      FS.genericErrors[code].stack = "<generic error, no stack>";
    });
  },
  staticInit: function() {
    FS.ensureErrnoError();
    FS.nameTable = new Array(4096);
    FS.mount(MEMFS, {}, "/");
    FS.createDefaultDirectories();
    FS.createDefaultDevices();
    FS.createSpecialDirectories();
    FS.filesystems = { MEMFS: MEMFS, NODEFS: NODEFS };
  },
  init: function(input, output, error) {
    FS.init.initialized = true;
    FS.ensureErrnoError();
    Module["stdin"] = input || Module["stdin"];
    Module["stdout"] = output || Module["stdout"];
    Module["stderr"] = error || Module["stderr"];
    FS.createStandardStreams();
  },
  quit: function() {
    FS.init.initialized = false;
    var fflush = Module["_fflush"];
    if (fflush) fflush(0);
    for (var i = 0; i < FS.streams.length; i++) {
      var stream = FS.streams[i];
      if (!stream) {
        continue;
      }
      FS.close(stream);
    }
  },
  getMode: function(canRead, canWrite) {
    var mode = 0;
    if (canRead) mode |= 292 | 73;
    if (canWrite) mode |= 146;
    return mode;
  },
  findObject: function(path, dontResolveLastLink) {
    var ret = FS.analyzePath(path, dontResolveLastLink);
    if (ret.exists) {
      return ret.object;
    } else {
      return null;
    }
  },
  analyzePath: function(path, dontResolveLastLink) {
    try {
      var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
      path = lookup.path;
    } catch (e) {}
    var ret = {
      isRoot: false,
      exists: false,
      error: 0,
      name: null,
      path: null,
      object: null,
      parentExists: false,
      parentPath: null,
      parentObject: null
    };
    try {
      var lookup = FS.lookupPath(path, { parent: true });
      ret.parentExists = true;
      ret.parentPath = lookup.path;
      ret.parentObject = lookup.node;
      ret.name = PATH.basename(path);
      lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
      ret.exists = true;
      ret.path = lookup.path;
      ret.object = lookup.node;
      ret.name = lookup.node.name;
      ret.isRoot = lookup.path === "/";
    } catch (e) {
      ret.error = e.errno;
    }
    return ret;
  },
  createPath: function(parent, path, canRead, canWrite) {
    parent = typeof parent === "string" ? parent : FS.getPath(parent);
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part) continue;
      var current = PATH.join2(parent, part);
      try {
        FS.mkdir(current);
      } catch (e) {}
      parent = current;
    }
    return current;
  },
  createFile: function(parent, name, properties, canRead, canWrite) {
    var path = PATH.join2(
      typeof parent === "string" ? parent : FS.getPath(parent),
      name
    );
    var mode = FS.getMode(canRead, canWrite);
    return FS.create(path, mode);
  },
  createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
    var path = name
      ? PATH.join2(
          typeof parent === "string" ? parent : FS.getPath(parent),
          name
        )
      : parent;
    var mode = FS.getMode(canRead, canWrite);
    var node = FS.create(path, mode);
    if (data) {
      if (typeof data === "string") {
        var arr = new Array(data.length);
        for (var i = 0, len = data.length; i < len; ++i)
          arr[i] = data.charCodeAt(i);
        data = arr;
      }
      FS.chmod(node, mode | 146);
      var stream = FS.open(node, 577);
      FS.write(stream, data, 0, data.length, 0, canOwn);
      FS.close(stream);
      FS.chmod(node, mode);
    }
    return node;
  },
  createDevice: function(parent, name, input, output) {
    var path = PATH.join2(
      typeof parent === "string" ? parent : FS.getPath(parent),
      name
    );
    var mode = FS.getMode(!!input, !!output);
    if (!FS.createDevice.major) FS.createDevice.major = 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    FS.registerDevice(dev, {
      open: function(stream) {
        stream.seekable = false;
      },
      close: function(stream) {
        if (output && output.buffer && output.buffer.length) {
          output(10);
        }
      },
      read: function(stream, buffer, offset, length, pos) {
        var bytesRead = 0;
        for (var i = 0; i < length; i++) {
          var result;
          try {
            result = input();
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (result === undefined && bytesRead === 0) {
            throw new FS.ErrnoError(6);
          }
          if (result === null || result === undefined) break;
          bytesRead++;
          buffer[offset + i] = result;
        }
        if (bytesRead) {
          stream.node.timestamp = Date.now();
        }
        return bytesRead;
      },
      write: function(stream, buffer, offset, length, pos) {
        for (var i = 0; i < length; i++) {
          try {
            output(buffer[offset + i]);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
        if (length) {
          stream.node.timestamp = Date.now();
        }
        return i;
      }
    });
    return FS.mkdev(path, mode, dev);
  },
  forceLoadFile: function(obj) {
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
    if (typeof XMLHttpRequest !== "undefined") {
      throw new Error(
        "Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread."
      );
    } else if (read_) {
      try {
        obj.contents = intArrayFromString(read_(obj.url), true);
        obj.usedBytes = obj.contents.length;
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    } else {
      throw new Error("Cannot load without read() or XMLHttpRequest.");
    }
  },
  createLazyFile: function(parent, name, url, canRead, canWrite) {
    function LazyUint8Array() {
      this.lengthKnown = false;
      this.chunks = [];
    }
    LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
      if (idx > this.length - 1 || idx < 0) {
        return undefined;
      }
      var chunkOffset = idx % this.chunkSize;
      var chunkNum = (idx / this.chunkSize) | 0;
      return this.getter(chunkNum)[chunkOffset];
    };
    LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(
      getter
    ) {
      this.getter = getter;
    };
    LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
      var xhr = new XMLHttpRequest();
      xhr.open("HEAD", url, false);
      xhr.send(null);
      if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
        throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
      var datalength = Number(xhr.getResponseHeader("Content-length"));
      var header;
      var hasByteServing =
        (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
      var usesGzip =
        (header = xhr.getResponseHeader("Content-Encoding")) &&
        header === "gzip";
      var chunkSize = 1024 * 1024;
      if (!hasByteServing) chunkSize = datalength;
      var doXHR = function(from, to) {
        if (from > to)
          throw new Error(
            "invalid range (" + from + ", " + to + ") or no bytes requested!"
          );
        if (to > datalength - 1)
          throw new Error(
            "only " + datalength + " bytes available! programmer error!"
          );
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        if (datalength !== chunkSize)
          xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
        if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
        if (xhr.overrideMimeType) {
          xhr.overrideMimeType("text/plain; charset=x-user-defined");
        }
        xhr.send(null);
        if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
          throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
        if (xhr.response !== undefined) {
          return new Uint8Array(xhr.response || []);
        } else {
          return intArrayFromString(xhr.responseText || "", true);
        }
      };
      var lazyArray = this;
      lazyArray.setDataGetter(function(chunkNum) {
        var start = chunkNum * chunkSize;
        var end = (chunkNum + 1) * chunkSize - 1;
        end = Math.min(end, datalength - 1);
        if (typeof lazyArray.chunks[chunkNum] === "undefined") {
          lazyArray.chunks[chunkNum] = doXHR(start, end);
        }
        if (typeof lazyArray.chunks[chunkNum] === "undefined")
          throw new Error("doXHR failed!");
        return lazyArray.chunks[chunkNum];
      });
      if (usesGzip || !datalength) {
        chunkSize = datalength = 1;
        datalength = this.getter(0).length;
        chunkSize = datalength;
        out(
          "LazyFiles on gzip forces download of the whole file when length is accessed"
        );
      }
      this._length = datalength;
      this._chunkSize = chunkSize;
      this.lengthKnown = true;
    };
    if (typeof XMLHttpRequest !== "undefined") {
      if (!ENVIRONMENT_IS_WORKER)
        throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
      var lazyArray = new LazyUint8Array();
      Object.defineProperties(lazyArray, {
        length: {
          get: function() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
        },
        chunkSize: {
          get: function() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
      });
      var properties = { isDevice: false, contents: lazyArray };
    } else {
      var properties = { isDevice: false, url: url };
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite);
    if (properties.contents) {
      node.contents = properties.contents;
    } else if (properties.url) {
      node.contents = null;
      node.url = properties.url;
    }
    Object.defineProperties(node, {
      usedBytes: {
        get: function() {
          return this.contents.length;
        }
      }
    });
    var stream_ops = {};
    var keys = Object.keys(node.stream_ops);
    keys.forEach(function(key) {
      var fn = node.stream_ops[key];
      stream_ops[key] = function forceLoadLazyFile() {
        FS.forceLoadFile(node);
        return fn.apply(null, arguments);
      };
    });
    stream_ops.read = function stream_ops_read(
      stream,
      buffer,
      offset,
      length,
      position
    ) {
      FS.forceLoadFile(node);
      var contents = stream.node.contents;
      if (position >= contents.length) return 0;
      var size = Math.min(contents.length - position, length);
      if (contents.slice) {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i];
        }
      } else {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents.get(position + i);
        }
      }
      return size;
    };
    node.stream_ops = stream_ops;
    return node;
  },
  createPreloadedFile: function(
    parent,
    name,
    url,
    canRead,
    canWrite,
    onload,
    onerror,
    dontCreateFile,
    canOwn,
    preFinish
  ) {
    Browser.init();
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency("cp " + fullname);
    function processData(byteArray) {
      function finish(byteArray) {
        if (preFinish) preFinish();
        if (!dontCreateFile) {
          FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
        }
        if (onload) onload();
        removeRunDependency(dep);
      }
      var handled = false;
      Module["preloadPlugins"].forEach(function(plugin) {
        if (handled) return;
        if (plugin["canHandle"](fullname)) {
          plugin["handle"](byteArray, fullname, finish, function() {
            if (onerror) onerror();
            removeRunDependency(dep);
          });
          handled = true;
        }
      });
      if (!handled) finish(byteArray);
    }
    addRunDependency(dep);
    if (typeof url == "string") {
      Browser.asyncLoad(
        url,
        function(byteArray) {
          processData(byteArray);
        },
        onerror
      );
    } else {
      processData(url);
    }
  },
  indexedDB: function() {
    return (
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB
    );
  },
  DB_NAME: function() {
    return "EM_FS_" + window.location.pathname;
  },
  DB_VERSION: 20,
  DB_STORE_NAME: "FILE_DATA",
  saveFilesToDB: function(paths, onload, onerror) {
    onload = onload || function() {};
    onerror = onerror || function() {};
    var indexedDB = FS.indexedDB();
    try {
      var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
    } catch (e) {
      return onerror(e);
    }
    openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
      out("creating db");
      var db = openRequest.result;
      db.createObjectStore(FS.DB_STORE_NAME);
    };
    openRequest.onsuccess = function openRequest_onsuccess() {
      var db = openRequest.result;
      var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
      var files = transaction.objectStore(FS.DB_STORE_NAME);
      var ok = 0,
        fail = 0,
        total = paths.length;
      function finish() {
        if (fail == 0) onload();
        else onerror();
      }
      paths.forEach(function(path) {
        var putRequest = files.put(FS.analyzePath(path).object.contents, path);
        putRequest.onsuccess = function putRequest_onsuccess() {
          ok++;
          if (ok + fail == total) finish();
        };
        putRequest.onerror = function putRequest_onerror() {
          fail++;
          if (ok + fail == total) finish();
        };
      });
      transaction.onerror = onerror;
    };
    openRequest.onerror = onerror;
  },
  loadFilesFromDB: function(paths, onload, onerror) {
    onload = onload || function() {};
    onerror = onerror || function() {};
    var indexedDB = FS.indexedDB();
    try {
      var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
    } catch (e) {
      return onerror(e);
    }
    openRequest.onupgradeneeded = onerror;
    openRequest.onsuccess = function openRequest_onsuccess() {
      var db = openRequest.result;
      try {
        var transaction = db.transaction([FS.DB_STORE_NAME], "readonly");
      } catch (e) {
        onerror(e);
        return;
      }
      var files = transaction.objectStore(FS.DB_STORE_NAME);
      var ok = 0,
        fail = 0,
        total = paths.length;
      function finish() {
        if (fail == 0) onload();
        else onerror();
      }
      paths.forEach(function(path) {
        var getRequest = files.get(path);
        getRequest.onsuccess = function getRequest_onsuccess() {
          if (FS.analyzePath(path).exists) {
            FS.unlink(path);
          }
          FS.createDataFile(
            PATH.dirname(path),
            PATH.basename(path),
            getRequest.result,
            true,
            true,
            true
          );
          ok++;
          if (ok + fail == total) finish();
        };
        getRequest.onerror = function getRequest_onerror() {
          fail++;
          if (ok + fail == total) finish();
        };
      });
      transaction.onerror = onerror;
    };
    openRequest.onerror = onerror;
  }
};
var SYSCALLS = {
  mappings: {},
  DEFAULT_POLLMASK: 5,
  umask: 511,
  calculateAt: function(dirfd, path, allowEmpty) {
    if (path[0] === "/") {
      return path;
    }
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd();
    } else {
      var dirstream = FS.getStream(dirfd);
      if (!dirstream) throw new FS.ErrnoError(8);
      dir = dirstream.path;
    }
    if (path.length == 0) {
      if (!allowEmpty) {
        throw new FS.ErrnoError(44);
      }
      return dir;
    }
    return PATH.join2(dir, path);
  },
  doStat: function(func, path, buf) {
    try {
      var stat = func(path);
    } catch (e) {
      if (
        e &&
        e.node &&
        PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))
      ) {
        return -54;
      }
      throw e;
    }
    HEAP32[buf >> 2] = stat.dev;
    HEAP32[(buf + 4) >> 2] = 0;
    HEAP32[(buf + 8) >> 2] = stat.ino;
    HEAP32[(buf + 12) >> 2] = stat.mode;
    HEAP32[(buf + 16) >> 2] = stat.nlink;
    HEAP32[(buf + 20) >> 2] = stat.uid;
    HEAP32[(buf + 24) >> 2] = stat.gid;
    HEAP32[(buf + 28) >> 2] = stat.rdev;
    HEAP32[(buf + 32) >> 2] = 0;
    (tempI64 = [
      stat.size >>> 0,
      ((tempDouble = stat.size),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>>
            0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0)
    ]),
      (HEAP32[(buf + 40) >> 2] = tempI64[0]),
      (HEAP32[(buf + 44) >> 2] = tempI64[1]);
    HEAP32[(buf + 48) >> 2] = 4096;
    HEAP32[(buf + 52) >> 2] = stat.blocks;
    HEAP32[(buf + 56) >> 2] = (stat.atime.getTime() / 1e3) | 0;
    HEAP32[(buf + 60) >> 2] = 0;
    HEAP32[(buf + 64) >> 2] = (stat.mtime.getTime() / 1e3) | 0;
    HEAP32[(buf + 68) >> 2] = 0;
    HEAP32[(buf + 72) >> 2] = (stat.ctime.getTime() / 1e3) | 0;
    HEAP32[(buf + 76) >> 2] = 0;
    (tempI64 = [
      stat.ino >>> 0,
      ((tempDouble = stat.ino),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>>
            0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0)
    ]),
      (HEAP32[(buf + 80) >> 2] = tempI64[0]),
      (HEAP32[(buf + 84) >> 2] = tempI64[1]);
    return 0;
  },
  doMsync: function(addr, stream, len, flags, offset) {
    var buffer = HEAPU8.slice(addr, addr + len);
    FS.msync(stream, buffer, offset, len, flags);
  },
  doMkdir: function(path, mode) {
    path = PATH.normalize(path);
    if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
    FS.mkdir(path, mode, 0);
    return 0;
  },
  doMknod: function(path, mode, dev) {
    switch (mode & 61440) {
      case 32768:
      case 8192:
      case 24576:
      case 4096:
      case 49152:
        break;
      default:
        return -28;
    }
    FS.mknod(path, mode, dev);
    return 0;
  },
  doReadlink: function(path, buf, bufsize) {
    if (bufsize <= 0) return -28;
    var ret = FS.readlink(path);
    var len = Math.min(bufsize, lengthBytesUTF8(ret));
    var endChar = HEAP8[buf + len];
    stringToUTF8(ret, buf, bufsize + 1);
    HEAP8[buf + len] = endChar;
    return len;
  },
  doAccess: function(path, amode) {
    if (amode & ~7) {
      return -28;
    }
    var node;
    var lookup = FS.lookupPath(path, { follow: true });
    node = lookup.node;
    if (!node) {
      return -44;
    }
    var perms = "";
    if (amode & 4) perms += "r";
    if (amode & 2) perms += "w";
    if (amode & 1) perms += "x";
    if (perms && FS.nodePermissions(node, perms)) {
      return -2;
    }
    return 0;
  },
  doDup: function(path, flags, suggestFD) {
    var suggest = FS.getStream(suggestFD);
    if (suggest) FS.close(suggest);
    return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
  },
  doReadv: function(stream, iov, iovcnt, offset) {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAP32[(iov + i * 8) >> 2];
      var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
      var curr = FS.read(stream, HEAP8, ptr, len, offset);
      if (curr < 0) return -1;
      ret += curr;
      if (curr < len) break;
    }
    return ret;
  },
  doWritev: function(stream, iov, iovcnt, offset) {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAP32[(iov + i * 8) >> 2];
      var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
      var curr = FS.write(stream, HEAP8, ptr, len, offset);
      if (curr < 0) return -1;
      ret += curr;
    }
    return ret;
  },
  varargs: undefined,
  get: function() {
    SYSCALLS.varargs += 4;
    var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
    return ret;
  },
  getStr: function(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  },
  getStreamFromFD: function(fd) {
    var stream = FS.getStream(fd);
    if (!stream) throw new FS.ErrnoError(8);
    return stream;
  },
  get64: function(low, high) {
    return low;
  }
};
function ___sys_chmod(path, mode) {
  try {
    path = SYSCALLS.getStr(path);
    FS.chmod(path, mode);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function setErrNo(value) {
  HEAP32[___errno_location() >> 2] = value;
  return value;
}
function ___sys_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (cmd) {
      case 0: {
        var arg = SYSCALLS.get();
        if (arg < 0) {
          return -28;
        }
        var newStream;
        newStream = FS.open(stream.path, stream.flags, 0, arg);
        return newStream.fd;
      }
      case 1:
      case 2:
        return 0;
      case 3:
        return stream.flags;
      case 4: {
        var arg = SYSCALLS.get();
        stream.flags |= arg;
        return 0;
      }
      case 12: {
        var arg = SYSCALLS.get();
        var offset = 0;
        HEAP16[(arg + offset) >> 1] = 2;
        return 0;
      }
      case 13:
      case 14:
        return 0;
      case 16:
      case 8:
        return -28;
      case 9:
        setErrNo(28);
        return -1;
      default: {
        return -28;
      }
    }
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function ___sys_fstat64(fd, buf) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    return SYSCALLS.doStat(FS.stat, stream.path, buf);
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function ___sys_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (op) {
      case 21509:
      case 21505: {
        if (!stream.tty) return -59;
        return 0;
      }
      case 21510:
      case 21511:
      case 21512:
      case 21506:
      case 21507:
      case 21508: {
        if (!stream.tty) return -59;
        return 0;
      }
      case 21519: {
        if (!stream.tty) return -59;
        var argp = SYSCALLS.get();
        HEAP32[argp >> 2] = 0;
        return 0;
      }
      case 21520: {
        if (!stream.tty) return -59;
        return -28;
      }
      case 21531: {
        var argp = SYSCALLS.get();
        return FS.ioctl(stream, op, argp);
      }
      case 21523: {
        if (!stream.tty) return -59;
        return 0;
      }
      case 21524: {
        if (!stream.tty) return -59;
        return 0;
      }
      default:
        abort("bad ioctl syscall " + op);
    }
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function ___sys_open(path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var pathname = SYSCALLS.getStr(path);
    var mode = varargs ? SYSCALLS.get() : 0;
    var stream = FS.open(pathname, flags, mode);
    return stream.fd;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function ___sys_rename(old_path, new_path) {
  try {
    old_path = SYSCALLS.getStr(old_path);
    new_path = SYSCALLS.getStr(new_path);
    FS.rename(old_path, new_path);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function ___sys_rmdir(path) {
  try {
    path = SYSCALLS.getStr(path);
    FS.rmdir(path);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function ___sys_stat64(path, buf) {
  try {
    path = SYSCALLS.getStr(path);
    return SYSCALLS.doStat(FS.stat, path, buf);
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function ___sys_unlink(path) {
  try {
    path = SYSCALLS.getStr(path);
    FS.unlink(path);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}
function _emscripten_memcpy_big(dest, src, num) {
  HEAPU8.copyWithin(dest, src, src + num);
}
function emscripten_realloc_buffer(size) {
  try {
    wasmMemory.grow((size - buffer.byteLength + 65535) >>> 16);
    updateGlobalBufferAndViews(wasmMemory.buffer);
    return 1;
  } catch (e) {}
}
function _emscripten_resize_heap(requestedSize) {
  var oldSize = HEAPU8.length;
  requestedSize = requestedSize >>> 0;
  var maxHeapSize = 2147483648;
  if (requestedSize > maxHeapSize) {
    return false;
  }
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(
      maxHeapSize,
      alignUp(Math.max(requestedSize, overGrownHeapSize), 65536)
    );
    var replacement = emscripten_realloc_buffer(newSize);
    if (replacement) {
      return true;
    }
  }
  return false;
}
function _fd_close(fd) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.close(stream);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
}
function _fd_fdstat_get(fd, pbuf) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var type = stream.tty
      ? 2
      : FS.isDir(stream.mode)
      ? 3
      : FS.isLink(stream.mode)
      ? 7
      : 4;
    HEAP8[pbuf >> 0] = type;
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
}
function _fd_read(fd, iov, iovcnt, pnum) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = SYSCALLS.doReadv(stream, iov, iovcnt);
    HEAP32[pnum >> 2] = num;
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var HIGH_OFFSET = 4294967296;
    var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
    var DOUBLE_LIMIT = 9007199254740992;
    if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
      return -61;
    }
    FS.llseek(stream, offset, whence);
    (tempI64 = [
      stream.position >>> 0,
      ((tempDouble = stream.position),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>>
            0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0)
    ]),
      (HEAP32[newOffset >> 2] = tempI64[0]),
      (HEAP32[(newOffset + 4) >> 2] = tempI64[1]);
    if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
}
function _fd_write(fd, iov, iovcnt, pnum) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = SYSCALLS.doWritev(stream, iov, iovcnt);
    HEAP32[pnum >> 2] = num;
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
}
function _setTempRet0(val) {
  setTempRet0(val);
}
function _time(ptr) {
  var ret = (Date.now() / 1e3) | 0;
  if (ptr) {
    HEAP32[ptr >> 2] = ret;
  }
  return ret;
}
function _tzset() {
  if (_tzset.called) return;
  _tzset.called = true;
  var currentYear = new Date().getFullYear();
  var winter = new Date(currentYear, 0, 1);
  var summer = new Date(currentYear, 6, 1);
  var winterOffset = winter.getTimezoneOffset();
  var summerOffset = summer.getTimezoneOffset();
  var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  HEAP32[__get_timezone() >> 2] = stdTimezoneOffset * 60;
  HEAP32[__get_daylight() >> 2] = Number(winterOffset != summerOffset);
  function extractZone(date) {
    var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
    return match ? match[1] : "GMT";
  }
  var winterName = extractZone(winter);
  var summerName = extractZone(summer);
  var winterNamePtr = allocateUTF8(winterName);
  var summerNamePtr = allocateUTF8(summerName);
  if (summerOffset < winterOffset) {
    HEAP32[__get_tzname() >> 2] = winterNamePtr;
    HEAP32[(__get_tzname() + 4) >> 2] = summerNamePtr;
  } else {
    HEAP32[__get_tzname() >> 2] = summerNamePtr;
    HEAP32[(__get_tzname() + 4) >> 2] = winterNamePtr;
  }
}
function _timegm(tmPtr) {
  _tzset();
  var time = Date.UTC(
    HEAP32[(tmPtr + 20) >> 2] + 1900,
    HEAP32[(tmPtr + 16) >> 2],
    HEAP32[(tmPtr + 12) >> 2],
    HEAP32[(tmPtr + 8) >> 2],
    HEAP32[(tmPtr + 4) >> 2],
    HEAP32[tmPtr >> 2],
    0
  );
  var date = new Date(time);
  HEAP32[(tmPtr + 24) >> 2] = date.getUTCDay();
  var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
  var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
  HEAP32[(tmPtr + 28) >> 2] = yday;
  return (date.getTime() / 1e3) | 0;
}
var FSNode = function(parent, name, mode, rdev) {
  if (!parent) {
    parent = this;
  }
  this.parent = parent;
  this.mount = parent.mount;
  this.mounted = null;
  this.id = FS.nextInode++;
  this.name = name;
  this.mode = mode;
  this.node_ops = {};
  this.stream_ops = {};
  this.rdev = rdev;
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {
  read: {
    get: function() {
      return (this.mode & readMode) === readMode;
    },
    set: function(val) {
      val ? (this.mode |= readMode) : (this.mode &= ~readMode);
    }
  },
  write: {
    get: function() {
      return (this.mode & writeMode) === writeMode;
    },
    set: function(val) {
      val ? (this.mode |= writeMode) : (this.mode &= ~writeMode);
    }
  },
  isFolder: {
    get: function() {
      return FS.isDir(this.mode);
    }
  },
  isDevice: {
    get: function() {
      return FS.isChrdev(this.mode);
    }
  }
});
FS.FSNode = FSNode;
FS.staticInit();
if (ENVIRONMENT_IS_NODE) {
  var fs = frozenFs;
  var NODEJS_PATH = __webpack_require__(/*! path */ "path");
  NODEFS.staticInit();
}
if (ENVIRONMENT_IS_NODE) {
  var _wrapNodeError = function(func) {
    return function() {
      try {
        return func.apply(this, arguments);
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(ERRNO_CODES[e.code]);
      }
    };
  };
  var VFS = Object.assign({}, FS);
  for (var _key in NODERAWFS) FS[_key] = _wrapNodeError(NODERAWFS[_key]);
} else {
  throw new Error(
    "NODERAWFS is currently only supported on Node.js environment."
  );
}
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
var decodeBase64 =
  typeof atob === "function"
    ? atob
    : function(input) {
        var keyStr =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        do {
          enc1 = keyStr.indexOf(input.charAt(i++));
          enc2 = keyStr.indexOf(input.charAt(i++));
          enc3 = keyStr.indexOf(input.charAt(i++));
          enc4 = keyStr.indexOf(input.charAt(i++));
          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;
          output = output + String.fromCharCode(chr1);
          if (enc3 !== 64) {
            output = output + String.fromCharCode(chr2);
          }
          if (enc4 !== 64) {
            output = output + String.fromCharCode(chr3);
          }
        } while (i < input.length);
        return output;
      };
function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE === "boolean" && ENVIRONMENT_IS_NODE) {
    var buf;
    try {
      buf = Buffer.from(s, "base64");
    } catch (_) {
      buf = new Buffer(s, "base64");
    }
    return new Uint8Array(buf["buffer"], buf["byteOffset"], buf["byteLength"]);
  }
  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0; i < decoded.length; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error("Converting base64 string to bytes failed.");
  }
}
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }
  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}
var asmLibraryArg = {
  l: ___gmtime_r,
  p: ___sys_chmod,
  e: ___sys_fcntl64,
  k: ___sys_fstat64,
  o: ___sys_ioctl,
  q: ___sys_open,
  i: ___sys_rename,
  r: ___sys_rmdir,
  c: ___sys_stat64,
  h: ___sys_unlink,
  s: _emscripten_memcpy_big,
  t: _emscripten_resize_heap,
  f: _fd_close,
  j: _fd_fdstat_get,
  g: _fd_read,
  n: _fd_seek,
  d: _fd_write,
  a: _setTempRet0,
  b: _time,
  m: _timegm
};
var asm = createWasm();
var ___wasm_call_ctors = (Module["___wasm_call_ctors"] = asm["v"]);
var _zipstruct_stat = (Module["_zipstruct_stat"] = asm["w"]);
var _zipstruct_statS = (Module["_zipstruct_statS"] = asm["x"]);
var _zipstruct_stat_name = (Module["_zipstruct_stat_name"] = asm["y"]);
var _zipstruct_stat_index = (Module["_zipstruct_stat_index"] = asm["z"]);
var _zipstruct_stat_size = (Module["_zipstruct_stat_size"] = asm["A"]);
var _zipstruct_stat_mtime = (Module["_zipstruct_stat_mtime"] = asm["B"]);
var _zipstruct_stat_crc = (Module["_zipstruct_stat_crc"] = asm["C"]);
var _zipstruct_error = (Module["_zipstruct_error"] = asm["D"]);
var _zipstruct_errorS = (Module["_zipstruct_errorS"] = asm["E"]);
var _zipstruct_error_code_zip = (Module["_zipstruct_error_code_zip"] =
  asm["F"]);
var _zipstruct_stat_comp_size = (Module["_zipstruct_stat_comp_size"] =
  asm["G"]);
var _zipstruct_stat_comp_method = (Module["_zipstruct_stat_comp_method"] =
  asm["H"]);
var _zip_close = (Module["_zip_close"] = asm["I"]);
var _zip_delete = (Module["_zip_delete"] = asm["J"]);
var _zip_dir_add = (Module["_zip_dir_add"] = asm["K"]);
var _zip_discard = (Module["_zip_discard"] = asm["L"]);
var _zip_error_init_with_code = (Module["_zip_error_init_with_code"] =
  asm["M"]);
var _zip_get_error = (Module["_zip_get_error"] = asm["N"]);
var _zip_file_get_error = (Module["_zip_file_get_error"] = asm["O"]);
var _zip_error_strerror = (Module["_zip_error_strerror"] = asm["P"]);
var _zip_fclose = (Module["_zip_fclose"] = asm["Q"]);
var _zip_file_add = (Module["_zip_file_add"] = asm["R"]);
var _zip_file_get_external_attributes = (Module[
  "_zip_file_get_external_attributes"
] = asm["S"]);
var _zip_file_set_external_attributes = (Module[
  "_zip_file_set_external_attributes"
] = asm["T"]);
var _zip_file_set_mtime = (Module["_zip_file_set_mtime"] = asm["U"]);
var _zip_fopen = (Module["_zip_fopen"] = asm["V"]);
var _zip_fopen_index = (Module["_zip_fopen_index"] = asm["W"]);
var _zip_fread = (Module["_zip_fread"] = asm["X"]);
var _zip_get_name = (Module["_zip_get_name"] = asm["Y"]);
var _zip_get_num_entries = (Module["_zip_get_num_entries"] = asm["Z"]);
var _zip_name_locate = (Module["_zip_name_locate"] = asm["_"]);
var _zip_open = (Module["_zip_open"] = asm["$"]);
var _zip_open_from_source = (Module["_zip_open_from_source"] = asm["aa"]);
var _zip_set_file_compression = (Module["_zip_set_file_compression"] =
  asm["ba"]);
var _zip_source_buffer = (Module["_zip_source_buffer"] = asm["ca"]);
var _zip_source_buffer_create = (Module["_zip_source_buffer_create"] =
  asm["da"]);
var _zip_source_close = (Module["_zip_source_close"] = asm["ea"]);
var _zip_source_error = (Module["_zip_source_error"] = asm["fa"]);
var _zip_source_free = (Module["_zip_source_free"] = asm["ga"]);
var _zip_source_keep = (Module["_zip_source_keep"] = asm["ha"]);
var _zip_source_open = (Module["_zip_source_open"] = asm["ia"]);
var _zip_source_read = (Module["_zip_source_read"] = asm["ja"]);
var _zip_source_seek = (Module["_zip_source_seek"] = asm["ka"]);
var _zip_source_set_mtime = (Module["_zip_source_set_mtime"] = asm["la"]);
var _zip_source_tell = (Module["_zip_source_tell"] = asm["ma"]);
var _zip_stat = (Module["_zip_stat"] = asm["na"]);
var _zip_stat_index = (Module["_zip_stat_index"] = asm["oa"]);
var _zip_ext_count_symlinks = (Module["_zip_ext_count_symlinks"] = asm["pa"]);
var ___errno_location = (Module["___errno_location"] = asm["qa"]);
var __get_tzname = (Module["__get_tzname"] = asm["ra"]);
var __get_daylight = (Module["__get_daylight"] = asm["sa"]);
var __get_timezone = (Module["__get_timezone"] = asm["ta"]);
var stackSave = (Module["stackSave"] = asm["ua"]);
var stackRestore = (Module["stackRestore"] = asm["va"]);
var stackAlloc = (Module["stackAlloc"] = asm["wa"]);
var _malloc = (Module["_malloc"] = asm["xa"]);
var _free = (Module["_free"] = asm["ya"]);
Module["cwrap"] = cwrap;
Module["getValue"] = getValue;
var calledRun;
dependenciesFulfilled = function runCaller() {
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller;
};
function run(args) {
  args = args || arguments_;
  if (runDependencies > 0) {
    return;
  }
  preRun();
  if (runDependencies > 0) {
    return;
  }
  function doRun() {
    if (calledRun) return;
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function() {
      setTimeout(function() {
        Module["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module["run"] = run;
if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function")
    Module["preInit"] = [Module["preInit"]];
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}
run();


/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");;

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");;

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");;

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");;

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");;

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");;

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");;

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");;

/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("vscode");;

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;
/*!**************************!*\
  !*** ./sources/index.ts ***!
  \**************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const tslib_1 = __webpack_require__(/*! tslib */ "../../.yarn/cache/tslib-npm-1.13.0-f5e9ea9b66-50e9327361.zip/node_modules/tslib/tslib.es6.js");
const fslib_1 = __webpack_require__(/*! @yarnpkg/fslib */ "../yarnpkg-fslib/sources/index.ts");
const vscode = (0, tslib_1.__importStar)(__webpack_require__(/*! vscode */ "vscode"));
const TerminalLinkProvider_1 = __webpack_require__(/*! ./TerminalLinkProvider */ "./sources/TerminalLinkProvider.ts");
const ZipFSProvider_1 = __webpack_require__(/*! ./ZipFSProvider */ "./sources/ZipFSProvider.ts");
function mount(uri) {
    const zipUri = vscode.Uri.parse(`zip:${uri.fsPath}`);
    if (vscode.workspace.getWorkspaceFolder(zipUri) === undefined) {
        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders.length, 0, {
            name: fslib_1.npath.basename(zipUri.fsPath),
            uri: zipUri,
        });
    }
}
function activate(context) {
    // Until a more specific activation event exists this requires onStartupFinished
    context.subscriptions.push((0, TerminalLinkProvider_1.registerTerminalLinkProvider)());
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(`zip`, new ZipFSProvider_1.ZipFSProvider(), {
        isCaseSensitive: true,
    }));
    context.subscriptions.push(vscode.commands.registerCommand(`zipfs.mountZipFile`, (uri) => {
        mount(uri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand(`zipfs.mountZipEditor`, () => {
        mount(vscode.window.activeTextEditor.document.uri);
    }));
}
exports.activate = activate;

})();

module.exports = __webpack_exports__;
/******/ })()
;