import Writer from './writer';
import Module from './module';

export interface IConfig {
    /**
     * The index.html file used to find all the *.ts files and
     * build them in order. Starts at the <!-- ts-bundle-start -->
     * comment and ends at <!-- ts-bundle-end -->
     */
    src: string;

    /**
     * An array of destination file paths. Once the framework
     * is built, it will be output to these paths.
     */
    dest: Array<string>;

    /**
     * An optional root module to define as the encompassing
     * module for the framework (i.e. 'plat'). All lines that
     * are on the window will be put into this module. If no
     * value is specified, window lines will remain on the window.
     */
    rootModule?: string;

    /**
     * If true, we assume you have logic included to export your
     * root module for CommonJS/AMD. We will add an ambient
     * typescript declaration into the output file.
     */
    exportRoot?: boolean;

    /**
     * The version number used in conjunction with the license.
     */
    version?: string;

    /**
     * The path to the license file to be added to the build as a
     * comment. If a version is specified, the v.0.0.0.0 in the
     * license will be replaced with the version.
     */
    license?: string;

    /**
     * Disables tslint on the output file.
     */
    disableLint?: boolean;

    /**
     * Called prior to saving the output, you can stip out any extra
     * text that you might not want.
     *
     * @param data The data to manipulate.
     * @param done A callback to call in order to save the data.
     */
    preSave? (data: string, done: (data: string) => void): void;
}

function isString(obj: any): boolean {
    return typeof obj === 'string';
}

function isArray(obj: any): boolean {
    return Array.isArray(obj);
}

function validate(config: IConfig): Array<string> {
    let errors: Array<string> = [];

    if (!isString(config.src) || config.src.indexOf('.ts') < 0) {
        errors.push('Error: src config property must be a string locating the .ts file for the bundle');
    }

    if (!isArray(config.dest)) {
        errors.push('Error: dest config property must be a string or array of strings designating the output file(s).');
    }

    return errors;
}

/**
 * Creates the config, and rootModule if necessary.
 *
 * @param cfg The root config.
 */
export function initialize(cfg: IConfig) {
    if (!cfg) {
        throw new Error('No config specified');
    }
    config = cfg;

    if (typeof cfg.dest === 'string') {
        config.dest = [<string><any>cfg.dest];
    }

    let errors = validate(config);

    if (errors.length > 0) {
        errors.forEach((error) => { console.log(error); });
        throw new Error('Invalid config');
    }

    rootModule = new Module(config.rootModule || windowName);

    config.preSave = config.preSave || defaultPreSave;

    return config;
}

export let config: IConfig,
    windowName = 'window',
    rootModule: Module,
    output: Array<string> = [],

    // Finds all the <reference path="" /> tags
    fileRegex = /path=("[^"]*)/,

    // Finds the ts-bundle-start comment Node
    startRegex = /\/\/\sts-bundle-start/,

    // Finds the ts-bundle-end comment Node
    endRegex = /\/\/\sts-bundle-end/,

    // Finds all comments and strings on a line
    commentAndStringRegex = /(?:\/\*.*\*\/)|(?:'(?:[^'])*')|(?:"(?:[^"])*")|(?:\/(?:[^/])+\/)/g,

    // Finds all whitespace on a line
    whitespaceRegex = /^\s*/,

    // Finds a comment on a line
    commentsRemainingRegex = /\/\/.*/,

    // Finds spaces/tabs on a line
    intermediarySpaceRegex = /(?:\s|\t)+/,

    // Determines if "export module" is found on a line
    exportModuleRegex = /^export(?:\s|\t)+module/;

/**
 * Removes all the comments and strings on a line, and trims the
 * whitespace from the ends.
 *
 * @param line The line with which to remove comments and strings.
 */
export function removeCommentsAndStrings(line: string) {
    return line.replace(commentAndStringRegex, '').trim();
}

/**
 * Traverses the Module tree and creates a whitespace variable with
 * 4 spaces for every module up to the root module.
 *
 * @param mod The module from which to start the traversing
 */
export function getPrependedTabs(mod: Module) {
    if (!mod) {
        return '';
    }

    let isExported = mod.isExported,
        prepend = isExported && mod.parent ? '    ' : '';

    while (!!(mod = mod.parent)) {
        if (!mod.parent && (isExported || mod.name === windowName)) {
            break;
        }

        prepend += '    ';
    }

    return prepend;
}

/**
 * Adds writers for a module all the way to the specified root module.
 *
 * @param mod The starting module in the tree
 * @param root The root module at which to stop adding writers
 */
export function addWriters(mod: Module, root: Module) {
    while (mod !== root) {
        if (mod.parent.childNames.indexOf(mod.name) === -1) {
            mod.parent.writers.push(new Writer(mod));
            mod.parent.childNames.push(mod.name);
        }
        mod = mod.parent;
    }
}

/**
 * Called prior to saving the output, you can stip out any extra
 * text that you might not want.
 *
 * @param data The data to manipulate.
 * @param done A callback to call in order to save the data.
 */
function defaultPreSave(data: string, done: (data: string) => void) {
    done(data);
}
