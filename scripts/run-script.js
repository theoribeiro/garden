#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackages = void 0;
const execa_1 = __importDefault(require("execa"));
const minimist_1 = __importDefault(require("minimist"));
const minimatch_1 = __importDefault(require("minimatch"));
const bluebird_1 = __importDefault(require("bluebird"));
const lodash_1 = require("lodash");
const dependency_graph_1 = require("dependency-graph");
const split2 = require("split2");
const chalk_1 = __importDefault(require("chalk"));
const wrap_ansi_1 = __importDefault(require("wrap-ansi"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const path_1 = require("path");
const colors = [chalk_1.default.red, chalk_1.default.green, chalk_1.default.yellow, chalk_1.default.magenta, chalk_1.default.cyan];
const lineChar = "┄";
const yarnPath = (0, path_1.resolve)(__dirname, "..", ".yarn", "releases", "yarn-1.22.19.js");
async function getPackages({ scope, ignore } = {}) {
    let packages = JSON.parse((await (0, execa_1.default)("node", [yarnPath, "--silent", "workspaces", "info"])).stdout);
    if (scope) {
        packages = (0, lodash_1.pickBy)(packages, (_, k) => (0, minimatch_1.default)(k, scope));
    }
    if (ignore) {
        packages = (0, lodash_1.pickBy)(packages, (_, k) => !(0, minimatch_1.default)(k, ignore));
    }
    return (0, lodash_1.mapValues)(packages, (p, k) => {
        const location = (0, path_1.resolve)(__dirname, "..", p.location);
        return {
            ...p,
            name: k,
            location,
            packageJson: require((0, path_1.resolve)(location, "package.json")),
            shortName: k.split("/")[1],
        };
    });
}
exports.getPackages = getPackages;
async function runInPackages(args) {
    const argv = (0, minimist_1.default)(args, { boolean: ["bail", "parallel"], default: { bail: true } });
    const script = argv._[0];
    const rest = argv._.slice(1);
    const { scope, ignore, bail, parallel } = argv;
    const repoRoot = (0, path_1.resolve)(__dirname, "..");
    if (!script) {
        throw new Error("Must specify script name");
    }
    const packages = await getPackages({ scope, ignore });
    const packageList = Object.values(packages);
    for (let i = 0; i < packageList.length; i++) {
        packageList[i].color = colors[i % colors.length];
    }
    console.log(chalk_1.default.cyanBright(`\nRunning script ${chalk_1.default.whiteBright(script)} in package(s) ` +
        chalk_1.default.whiteBright(Object.keys(packages).join(", "))));
    // Make sure subprocesses inherit color support level
    process.env.FORCE_COLOR = chalk_1.default.supportsColor.toString() || "0";
    const maxNameLength = (0, lodash_1.max)(packageList.map((p) => p.shortName.length));
    let lastPackage = "";
    let failed = [];
    async function runScript(packageName) {
        var _a, _b;
        const { color, location, shortName, packageJson } = packages[packageName];
        if (!packageJson.scripts || !packageJson.scripts[script]) {
            return;
        }
        const proc = (0, execa_1.default)("node", [yarnPath, "run", script, ...rest], { cwd: (0, path_1.resolve)(repoRoot, location), reject: false });
        proc.on("error", (error) => {
            console.log(chalk_1.default.redBright(`\nCould not run ${script} script in package ${packageName}: ${error}`));
            process.exit(1);
        });
        const stream = split2();
        stream.on("data", (data) => {
            const width = process.stdout.columns;
            const line = data.toString();
            if (line.trim().length <= 0) {
                return;
            }
            if (lastPackage !== packageName) {
                console.log(chalk_1.default.gray((0, lodash_1.padEnd)("", width || 80, "┄")));
            }
            lastPackage = packageName;
            const prefix = (0, lodash_1.padEnd)(shortName + " ", maxNameLength + 1, lineChar) + "  ";
            // Only wrap and suffix if the terminal doesn't have a set width or is reasonably wider than the prefix length
            if (process.stdout.columns > maxNameLength + 30) {
                const suffix = "  " + lineChar + lineChar;
                const lineWidth = width - prefix.length - suffix.length;
                const justified = (0, wrap_ansi_1.default)(line, lineWidth, { trim: false })
                    .split("\n")
                    .map((l) => l + (0, lodash_1.padEnd)("", lineWidth - (0, strip_ansi_1.default)(l).length, " "));
                console.log(`${color.bold(prefix)}${justified[0]}${color.bold(suffix)}`);
                for (const nextLine of justified.slice(1)) {
                    console.log(`${(0, lodash_1.padStart)(nextLine, prefix.length + lineWidth, " ")}${color.bold(suffix)}`);
                }
            }
            else {
                console.log(color.bold(prefix) + line);
            }
        });
        (_a = proc.stdout) === null || _a === void 0 ? void 0 : _a.pipe(stream);
        (_b = proc.stderr) === null || _b === void 0 ? void 0 : _b.pipe(stream);
        const result = await proc;
        if (result.exitCode && result.exitCode !== 0) {
            if (bail) {
                console.log(chalk_1.default.redBright(`\n${script} script in package ${packageName} failed with code ${result.exitCode}`));
                process.exit(result.exitCode);
            }
            else {
                failed.push(packageName);
            }
        }
    }
    if (parallel) {
        await bluebird_1.default.map(Object.keys(packages), runScript);
    }
    else {
        const depGraph = new dependency_graph_1.DepGraph();
        for (const p of packageList) {
            depGraph.addNode(p.name);
            const deps = packages[p.name].workspaceDependencies;
            for (const dep of deps) {
                if (packages[dep]) {
                    depGraph.addNode(dep);
                    depGraph.addDependency(p.name, dep);
                }
            }
        }
        let leaves = depGraph.overallOrder(true);
        while (leaves.length > 0) {
            await bluebird_1.default.map(leaves, runScript);
            for (const name of leaves) {
                depGraph.removeNode(name);
            }
            leaves = depGraph.overallOrder(true);
        }
    }
    console.log(chalk_1.default.gray((0, lodash_1.padEnd)("", process.stdout.columns || 80, "┄")));
    if (failed.length > 0) {
        console.log(chalk_1.default.redBright(`${script} script failed in ${failed.length} packages(s): ${failed.join(", ")}\n`));
        process.exit(failed.length);
    }
    else {
        console.log(chalk_1.default.greenBright("Done!\n"));
    }
}
runInPackages(process.argv.slice(2)).catch((err) => {
    console.log(chalk_1.default.redBright(err));
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXNjcmlwdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJ1bi1zY3JpcHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBLGtEQUF5QjtBQUN6Qix3REFBK0I7QUFDL0IsMERBQWlDO0FBQ2pDLHdEQUErQjtBQUMvQixtQ0FBaUU7QUFDakUsdURBQTJDO0FBQzNDLGlDQUFpQztBQUNqQyxrREFBeUI7QUFDekIsMERBQWdDO0FBQ2hDLDREQUFrQztBQUNsQywrQkFBOEI7QUFFOUIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxlQUFLLENBQUMsR0FBRyxFQUFFLGVBQUssQ0FBQyxLQUFLLEVBQUUsZUFBSyxDQUFDLE1BQU0sRUFBRSxlQUFLLENBQUMsT0FBTyxFQUFFLGVBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUVoRixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUE7QUFDcEIsTUFBTSxRQUFRLEdBQUcsSUFBQSxjQUFPLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUE7QUFFMUUsS0FBSyxVQUFVLFdBQVcsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEtBQTBDLEVBQUU7SUFDM0YsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sSUFBQSxlQUFLLEVBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRXJHLElBQUksS0FBSyxFQUFFO1FBQ1QsUUFBUSxHQUFHLElBQUEsZUFBTSxFQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUEsbUJBQVMsRUFBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQTtLQUMzRDtJQUVELElBQUksTUFBTSxFQUFFO1FBQ1YsUUFBUSxHQUFHLElB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