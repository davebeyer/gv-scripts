#!/usr/bin/env node

'use strict';

var kill       = require('tree-kill');
var path       = require('path');
var fs         = require('fs');
var spawner    = require('child_process');

// 
// Process args
//

function showUsage() {
    console.log('Usage: [sudo] stop <process ID>|<process ID file> [options]');
    console.log("  -d, --basedir     Base directory (required)");
    console.log('  If not given, default process ID fetched from bin/server.pid, if available');
}

var pidNum         = null;
var baseDir        = null;
var baseDirFlag    = false;

process.argv.slice(2).forEach(function (option) {
    option = option.trim();
    
    if ( baseDirFlag ) {
        baseDirFlag = false;
        baseDir = option;
        
        if ( !fs.existsSync(baseDir) ) {
            console.error("Invalid base directory " + baseDir + ", exiting");
            process.exit(-1);
        }

    } else if (option[0] == '-') {
        switch(option) {
        case '-d': case '--basedir':
            if ( baseDir === null ) {
                baseDirFlag = true; 
            }
            break;
        default:
            showUsage();
            process.exit(-1);
        }

    } else if (pidNum === null) {
        try {
            pidNum = parseInt(option, 10);
        } catch (err) {
            showUsage();
            process.exit(-1);
        }
    } else {
        showUsage();
        process.exit(-1);
    }
});

if ( baseDir === null ) {
    console.error("Must specify base directory (with -d flag)");
    showUsage();
    process.exit(-1);
}

var pidPath    = path.resolve(baseDir, 'bin', 'server.pid');
var killerPath = path.resolve(__dirname, 'server-stopper-kill.js');

// 
// If not in command args, get process ID from server.pid file
//

var pidFileUsed = false;

if (pidNum === null) {
    var fileStat = null;
    try {
        fileStat = fs.statSync(pidPath);
    } catch (err) {
        // continue
    }

    if ( !fileStat || !fileStat.isFile() ) {
        console.error("ERROR: No PID given and no server.pid file");
        showUsage();
        process.exit(-1);
    }

    pidFileUsed = true;

    try {
        pidNum = fs.readFileSync(pidPath);
        pidNum = parseInt(pidNum, 10);
    } catch (err) {
        console.error("ERROR: Unable to determine a process ID; no valid PID in server.pid");
        showUsage();
        process.exit(-1);
    }
}

//
// Issue kill
//

console.log("Killing server process(es) rooted with process " + pidNum);
spawner.execSync('sudo node ' + killerPath + ' ' + pidNum);

// Remove file
if ( pidFileUsed ) {
    fs.unlinkSync(pidPath);
}
