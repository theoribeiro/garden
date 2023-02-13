#!/usr/bin/env ts-node
"use strict";
/**
 * Helper script for encrypting files and storing them in the repository. Uses Google Cloud KMS (which devs should
 * have access to anyway) to encrypt the data, such that it's safe to commit the file to git.
 *
 * Usage example: `echo "my data" | ./scripts/encrypt-file.ts filename.txt`
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kms_1 = __importDefault(require("@google-cloud/kms"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const projectId = "garden-ci";
const keyRingId = "dev";
const cryptoKeyId = "dev";
const locationId = "global";
async function encrypt(filename, plaintext) {
    const client = new kms_1.default.KeyManagementServiceClient();
    const name = client.cryptoKeyPath(projectId, locationId, keyRingId, cryptoKeyId);
    const [result] = await client.encrypt({ name, plaintext });
    const outputPath = (0, path_1.resolve)(__dirname, "..", "secrets", filename);
    await (0, fs_extra_1.writeFile)(outputPath, result.ciphertext);
    console.log(`Encrypted input, result saved to ${outputPath}`);
}
const args = process.argv.slice(2);
const filename = args[0];
if (require.main === module) {
    process.stdin.resume();
    let data = Buffer.from("");
    process.stdin.on("data", (chunk) => {
        data = Buffer.concat([data, chunk]);
    });
    process.stdin.on("end", function () {
        encrypt(filename, data).catch((err) => {
            console.error(err);
            process.exit(1);
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jcnlwdC1maWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW5jcnlwdC1maWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7O0dBS0c7Ozs7O0FBRUgsNERBQW1DO0FBQ25DLHVDQUFvQztBQUNwQywrQkFBOEI7QUFFOUIsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFBO0FBQzdCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQTtBQUN2QixNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUE7QUFDekIsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFBO0FBRTNCLEtBQUssVUFBVSxPQUFPLENBQUMsUUFBZ0IsRUFBRSxTQUFpQjtJQUN4RCxNQUFNLE1BQU0sR0FBRyxJQUFJLGFBQUcsQ0FBQywwQkFBMEIsRUFBRSxDQUFBO0lBRW5ELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQy9CLFNBQVMsRUFDVCxVQUFVLEVBQ1YsU0FBUyxFQUNULFdBQVcsQ0FDWixDQUFBO0lBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFBO0lBRTFELE1BQU0sVUFBVSxHQUFHLElBQUEsY0FBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ2hFLE1BQU0sSUFBQSxvQkFBUyxFQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUE7SUFFOUMsT0FBTyxDQUFDLEdBQUcsQ0FDVCxvQ0FBb0MsVUFBVSxFQUFFLENBQ2pELENBQUE7QUFDSCxDQUFDO0FBRUQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDbEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBRXhCLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7SUFDM0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUV0QixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBRTFCLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ2pDLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUE7SUFDckMsQ0FBQyxDQUFDLENBQUE7SUFFRixPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUU7UUFDdEIsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDakIsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtDQUNIIn0=