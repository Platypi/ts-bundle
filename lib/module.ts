/// <reference path="../references.d.ts" />

import Writer = require('./writer');

class Module {
    /**
     * Locates and returns Module in a module tree, given a period-delimited name identifier. 
     * If a module does not exist, a new one is created.
     * 
     * @param root The starting module used to begin the search for a module.
     * @param name A period-delimited string specifying the module. The final value after the 
     * last period is the name of the module.
     * @param isExported Whether or not the module is internal or external.
     */
    static fetch(root: Module, name: string, isExported: boolean = false): Module {
        // If no root module is passed in, or the module name matches the root name, 
        // we want to return the root module.
        if (!root || name === root.name) {
            return root;

        // Trim off the root name if it is in the module.
        } else if (name.indexOf(root.name) === 0) {
            name = name.replace(root.name + '.', '');
        }

        var split = name.split('.'),
            child: Module;

        // If root has a child for the first part of the name
        if (!!root.children[split[0]]) {
            child = root.children[split.shift()];

            if (split.length === 0) {
                return child;
            }

            // Any child modules will need to be exported
            return Module.fetch(child, split.join('.'), true);
        }

        child = new Module(split[0], root, true);
        
        root.children[split[0]] = child;
        split.shift();

        if (split.length === 0) {
            return child;
        }

        // Any child modules will need to be exported
        return Module.fetch(child, split.join('.'), true);
    }
    
    /**
     * An Object containing key/value pairs of module name: Module
     */
    children: { [key: string]: Module; } = {};

    /**
     * A list of the fullnames for every child in of the module.
     */
    childNames: Array<string> = [];

    /**
     * A list of Writer objects used to output the lines.
     */
    writers: Array<Writer> = [];

    /**
     * A list of Writer objects used to output any documentation that appears before a module is defined.
     */
    docs: Array<Writer> = [];

    /**
     * The full period-delimited name path of a module from the root 
     * module.
     */
    fullName: string;
    constructor(public name: string,
        public parent: Module = null,
        public isExported: boolean = false) {
        var fullname = name,
            current = parent;

        while (current) {
            fullname = current.name + '.' + fullname;
            current = current.parent;
        }

        this.fullName = fullname;
    }
}

export = Module;
