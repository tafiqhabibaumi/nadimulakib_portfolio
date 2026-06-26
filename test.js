const fs = require('fs');
const serverCode = fs.readFileSync('./server.js', 'utf8');
const vm = require('vm');
const context = {
  require: require,
  __dirname: __dirname,
  console: console,
  process: process,
  Buffer: Buffer,
  encodeURIComponent: encodeURIComponent,
  module: module,
  exports: exports
};
vm.createContext(context);
try {
  vm.runInContext(serverCode, context);
} catch (e) {}

if (typeof context.compileWebsite === 'function' && typeof context.getConfigData === 'function') {
  context.getConfigData().then(data => {
    const res = context.compileWebsite(data);
    if(res) {
      const idx = res.html.indexOf('<!-- LOGO_START -->');
      console.log(res.html.substring(idx, idx + 350));
    }
    process.exit(0);
  });
}
