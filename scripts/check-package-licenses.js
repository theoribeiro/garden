#!/usr/bin/env ts-node
"use strict";
/**
 * Scans all package.json files in the repo and throws if one or more packages have a disallowed license
 * (i.e. GPL, other copyleft licenses).
 *
 * Stores a CSV dump
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const npm_license_crawler_1 = require("npm-license-crawler");
const path_1 = require("path");
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const chalk_1 = __importDefault(require("chalk"));
const bluebird_1 = require("bluebird");
const treeify_1 = require("treeify");
const sync_1 = require("csv-stringify/sync");
const fs_extra_1 = require("fs-extra");
const gardenRoot = (0, path_1.resolve)(__dirname, "..");
const disallowedLicenses = [
    /^AGPL/,
    /^copyleft/,
    "CC-BY-NC",
    "CC-BY-SA",
    /^FAL/,
    /^GPL/,
];
const dumpLicensesAsync = (0, bluebird_1.promisify)(npm_license_crawler_1.dumpLicenses);
async function checkPackageLicenses(root) {
    const res = await dumpLicensesAsync({ start: [root] });
    const disallowedPackages = {};
    for (const [ansiName, entry] of Object.entries(res)) {
        const name = (0, strip_ansi_1.default)(ansiName);
        const licenses = entry.licenses.trimEnd().split(" OR ");
        if (licenses[0].startsWith("(")) {
            licenses[0] = licenses[0].slice(1);
        }
        if (licenses[licenses.length - 1].endsWith(")")) {
            licenses[licenses.length - 1] = licenses[licenses.length - 1].slice(0, -1);
        }
        let anyAllowed = false;
        for (const license of licenses) {
            let allowed = true;
            for (const d of disallowedLicenses) {
                if (license.match(d)) {
                    allowed = false;
                    break;
                }
            }
            if (allowed) {
                anyAllowed = true;
                break;
            }
        }
        if (!anyAllowed) {
            disallowedPackages[chalk_1.default.red.bold(name)] = { ...entry, licenses: chalk_1.default.red.bold(entry.licenses) };
        }
    }
    // Dump to CSV
    const csvPath = (0, path_1.join)(gardenRoot, "tmp", "package-licenses.csv");
    console.log("Dumping CSV to " + csvPath);
    const rows = Object.entries(res).map(([name, entry]) => ({ name: (0, strip_ansi_1.default)(name), ...entry }));
    await (0, fs_extra_1.writeFile)(csvPath, (0, sync_1.stringify)(rows, { header: true }));
    // Throw on disallowed licenses
    const disallowedCount = Object.keys(disallowedPackages).length;
    if (disallowedCount > 0) {
        let msg = chalk_1.default.red.bold(`\nFound ${disallowedCount} packages with disallowed licenses:\n`);
        msg += (0, treeify_1.asTree)(disallowedPackages, true, true);
        throw new Error(msg);
    }
}
if (require.main === module) {
    checkPackageLicenses(gardenRoot).catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2stcGFja2FnZS1saWNlbnNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNoZWNrLXBhY2thZ2UtbGljZW5zZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7Ozs7R0FLRzs7Ozs7QUFFSCw2REFBa0Q7QUFDbEQsK0JBQW9DO0FBQ3BDLDREQUFrQztBQUNsQyxrREFBeUI7QUFDekIsdUNBQW9DO0FBQ3BDLHFDQUFnQztBQUNoQyw2Q0FBOEM7QUFDOUMsdUNBQW9DO0FBRXBDLE1BQU0sVUFBVSxHQUFHLElBQUEsY0FBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUUzQyxNQUFNLGtCQUFrQixHQUFHO0lBQ3pCLE9BQU87SUFDUCxXQUFXO0lBQ1gsVUFBVTtJQUNWLFVBQVU7SUFDVixNQUFNO0lBQ04sTUFBTTtDQUNQLENBQUE7QUFXRCxNQUFNLGlCQUFpQixHQUFHLElBQUEsb0JBQVMsRUFBbUIsa0NBQVksQ0FBQyxDQUFBO0FBRW5FLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxJQUFZO0lBQzlDLE1BQU0sR0FBRyxHQUFHLE1BQU0saUJBQWlCLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7SUFFdEQsTUFBTSxrQkFBa0IsR0FBZ0IsRUFBRSxDQUFBO0lBRTFDLEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ25ELE1BQU0sSUFBSSxHQUFHLElBQUEsb0JBQVMsRUFBQyxRQUFRLENBQUMsQ0FBQTtRQUNoQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUV2RCxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDL0IsUUFBUSxDQUFD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