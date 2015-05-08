# TS Bundle

Bundle all your TypeScript files into 1 file. Useful for packaging library components.

## Usage

```javascript
var bundle = require("ts-bundle");

bundle({
    src: 'index.html',
    dest: 'out.ts'
}, function (err) {
  
});
```


## Options

```typescript
interface IConfig {
    /**
     * The references.d.ts file used to find all the *.ts files and 
     * build them in order. Starts at the // ts-bundle-start
     * comment and ends at // ts-bundle-end
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
     * The version number used in conjunction with the license.
     */
    version?: string;

    /**
     * The path to the license file to be added to the build as a
     * comment. If a version is specified, the v0.0.0 in the 
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
```
