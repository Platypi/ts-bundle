import * as globals from './globals';
import Module from './module';

let output = globals.output;

function removeEmptyStringsFromEnd(output: Array<string>) {
    while (!output[output.length - 1]) {
        output.pop();
    }
}

/**
 * Iterates through a module's writers and invokes their write
 * function, building the output array. This method is recursive
 * because we want to build the output in a logical order, corresponding
 * to the file order in the index.html.
 *
 * @param currentModule The module whose writers need to be called.
 */
export default function generateOutput(currentModule: Module) {
    let root = globals.rootModule,
        prependedTabs = globals.getPrependedTabs(currentModule),
        isRoot = currentModule === root && currentModule.name === globals.windowName,
        str = 'namespace ';

    if (currentModule.isExported &&
        currentModule !== root &&

        // If parent is not root, we don't care if it shares the same name as
        // the window module
        (currentModule.parent !== root ||
         currentModule.parent.name !== globals.windowName)) {
        str = 'export ' + str;
    }

    let previousLine = '';

    currentModule.docs.forEach((writer) => {
        // We pass the generateOutput function into the write method so we
        // can continue processing the modules recursively after the writer
        // writes the module lines.
        previousLine = writer.write(output, previousLine, generateOutput);
    });

    // The root module will always have its module definition in its
    // writers if necessary.
    if (!isRoot) {
        previousLine = str + currentModule.name + ' {';
    }

    output.push(prependedTabs + previousLine);

    currentModule.writers.forEach((writer) => {
        previousLine = writer.write(output, previousLine, generateOutput);
    });

    removeEmptyStringsFromEnd(output);


    // The root module will always have a closing curly brace for its module
    // definition in its writers if necessary.
    if (!isRoot) {
        output.push(prependedTabs + '}');
    }
}
