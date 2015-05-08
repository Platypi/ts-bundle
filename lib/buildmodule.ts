/// <reference path="../references.d.ts" />

import Module = require('./module');
import Writer = require('./writer');
import globals = require('./globals');

var commentsRemainingRegex = globals.commentsRemainingRegex,
    whitespaceRegex = globals.whitespaceRegex,
    intermediarySpaceRegex = globals.intermediarySpaceRegex,
    exportModuleRegex = globals.exportModuleRegex;

function buildModule(currentModule: Module, lines: Array<string>, index: number) {
    var leftBraceCount = 0,
        rightBraceCount = 0,
        moduleName = '',
        prependedTabs = globals.getPrependedTabs(currentModule),
        line: string,
        currentLines: Array<string> = [],
        left: Array<any>,
        right: Array<any>;

    if (index > 0) {
        line = lines[index - 1].replace(commentsRemainingRegex, '').trim();

        if (!!line) {
            left = line.match(/{/g) || [];
            right = line.match(/}/g) || [];

            leftBraceCount += left.length;
            rightBraceCount += right.length;
        }
    }

    if (currentModule.writers.length > 0) {
        currentLines.push('');
    }

    for (; index < lines.length; ++index) {
        line = globals.removeCommentsAndStrings(lines[index]);

        // Handles comment blocks
        while (line.indexOf('/*') !== -1) {
            currentLines.push(prependedTabs + lines[index]);

            // If we reach the end of lines, we can return
            if (++index === lines.length) {
                return index;
            }

            line = lines[index];

            // Find the end of the comment block
            while (line.indexOf('*/') === -1) {
                currentLines.push(prependedTabs + line);

                if (++index === lines.length) {
                    return index;
                }
                line = lines[index];
            }

            var substringLine = line.substr(line.indexOf('*/') + 2);
            substringLine = globals.removeCommentsAndStrings(substringLine);

            // Check if there is another comment block on the same line as the 
            // end comment.
            if (substringLine.indexOf('/*') === -1) {
                currentLines.push(prependedTabs + line);
                line = globals.removeCommentsAndStrings(lines[++index]);
                break;
            } else if (substringLine.indexOf('/*') === 0) {
                line = substringLine;
            } else {
                // We have a new comment block, so we need to cut out the whitespace 
                // between the end comment and beginning comment, and add a new line 
                // to break up the comment block.
                var i = lines[index].indexOf('/*'),
                    whitespace = lines[index].match(whitespaceRegex)[0];

                lines.splice(index + 1, 0, whitespace + lines[index].substr(i));

                var startSubstring = lines[index].indexOf('*/') + 2;
                lines.splice(index + 1, 0, whitespace + lines[index].substr(startSubstring, i - startSubstring).trim());
                lines[index] = lines[index].substring(0, startSubstring);
                currentLines.push(prependedTabs + lines[index]);

                line = globals.removeCommentsAndStrings(lines[++index]);

                break;
            }
        }

        line = line.replace(commentsRemainingRegex, '').trim();

        // If we had a blank line we still want to append it.
        if (!line) {
            currentLines.push((!lines[index].trim()) ? lines[index] : (prependedTabs + lines[index]));
            continue;
        }

        // If we reach a line that has an exported module
        if (exportModuleRegex.test(line)) {
            if (index > 0) {
                currentLines.push('');
            }

            if (currentLines.length > 0) {
                // Push all the current lines to a new Writer because we are going to 
                // reset current lines.
                currentModule.writers.push(new Writer(currentLines));
                currentLines = [];
            }

            moduleName = line.replace('{', '').split(intermediarySpaceRegex)[2];

            // Find/create the new module so we can begin building its contents
            var mod = Module.fetch(currentModule, moduleName, true);
            index = buildModule(mod, lines, index + 1);

            globals.addWriters(mod, currentModule);
            continue;
        }

        // Count right and left curly braces to know when we have reached the 
        // end of a module.
        left = line.match(/{/g) || [];
        right = line.match(/}/g) || [];

        leftBraceCount += left.length;
        rightBraceCount += right.length;

        if (leftBraceCount === rightBraceCount) {
            currentModule.writers.push(new Writer(currentLines));
            return index;
        } else {
            currentLines.push(prependedTabs + lines[index]);
        }
    }

    // Put any remaining lines on the current module
    currentModule.writers.push(new Writer(currentLines));
    return index;
}

export = buildModule;
