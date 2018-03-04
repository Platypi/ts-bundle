import Module from './module';
import Writer from './writer';
import buildModule from './buildmodule';
import * as globals from './globals';

let commentsRemainingRegex = globals.commentsRemainingRegex,
    whitespaceRegex = globals.whitespaceRegex,
    intermediarySpaceRegex = globals.intermediarySpaceRegex;

export default function buildContents(lines: Array<string>) {
    let root = globals.rootModule,
        prepend = root.name !== globals.windowName ? '    ' : '',
        moduleName = '',
        previousLine = '',
        currentLines: Array<string> = [],
        commentLines: Array<string> = [],
        line: string,
        index = 0;

    for (; index < lines.length; ++index) {
        line = globals.removeCommentsAndStrings(lines[index]);

        // Handles comment blocks
        while (line.indexOf('/*') !== -1) {
            if (index > 0 && !!previousLine) {
                commentLines.push('');
            }

            commentLines.push(prepend + lines[index]);

            // If we reach the end of lines, we can return
            if (++index === lines.length) {
                break;
            }

            line = lines[index];

            // Find the end of the comment block
            while (line.indexOf('*/') === -1) {
                commentLines.push(prepend + line);

                if (++index === lines.length) {
                    break;
                }
                line = lines[index];
            }

            let substringLine = line.substr(line.indexOf('*/') + 2);
            substringLine = globals.removeCommentsAndStrings(substringLine);

            // Check if there is another comment block on the same line as the
            // end comment.
            if (substringLine.indexOf('/*') === -1) {
                commentLines.push(prepend + line);
                line = globals.removeCommentsAndStrings(lines[++index]);
                break;
            } else if (substringLine.indexOf('/*') === 0) {
                line = substringLine;
            } else {
                // We have a new comment block, so we need to cut out the whitespace
                // between the end comment and beginning comment, and add a new line
                // to break up the comment block.
                let i = lines[index].indexOf('/*'),
                    whitespace = lines[index].match(whitespaceRegex)[0];

                lines.splice(index + 1, 0, whitespace + lines[index].substr(i));

                let startSubstring = lines[index].indexOf('*/') + 2;
                lines.splice(index + 1, 0, whitespace + lines[index].substr(startSubstring, i - startSubstring).trim());
                lines[index] = lines[index].substring(0, startSubstring);

                commentLines.push(prepend + lines[index]);

                line = globals.removeCommentsAndStrings(lines[++index]);

                break;
            }
        }

        line = line.replace(commentsRemainingRegex, '').trim();

        if (/^(?:module|namespace)\s/.test(line)) {
            // We found a new module, so we need to add the remaining currentLines
            // to the root module, then build the new module lines.
            if (currentLines.length > 0) {
                root.writers.push(new Writer(currentLines));
                currentLines = [];
            }
            moduleName = line.replace('{', '').split(intermediarySpaceRegex)[1];

            let mod = Module.fetch(root, moduleName);
            mod.docs.push(new Writer(commentLines));
            index = buildModule(mod, lines, index + 1);

            // Add the new module to the root as a writer for output
            globals.addWriters(mod, root);

            currentLines.push('');
            line = '';
        } else {
            currentLines = currentLines.concat(commentLines);
            currentLines.push(prepend + lines[index]);
        }

        commentLines = [];
        previousLine = line;
    }

    // Push all remaining lines to the root module.
    root.writers.push(new Writer(currentLines));
    return index;
}
