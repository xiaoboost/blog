const fs = require('fs'),
    path = require('path');

function writeFileSync(pathname, file, fsm) {
    pathname = path.normalize(pathname);
    if (fsm && fsm.mkdirpSync) {
        fsm.mkdirpSync(path.dirname(pathname));
        fsm.writeFileSync(pathname, file);
        return (true);
    }
    const paths = [];
    for (let i = path.dirname(pathname); i !== paths[paths.length - 1]; i = path.dirname(i)) {
        paths.push(i);
        if (fs.existsSync(i)) break;
    }
    paths.reverse();

    for (let i = 0; i < paths.length; i++) {
        fs.mkdirSync(paths[i]);
    }
    fs.writeFileSync(pathname, file);
}

Object.setPrototypeOf(exports, fs);
exports.writeFileSync = writeFileSync;
