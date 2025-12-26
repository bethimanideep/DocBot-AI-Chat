"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.hashPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const SALT_LENGTH = 16; // Length of salt
const ITERATIONS = 100000; // Number of iterations (higher = more secure)
const KEY_LENGTH = 64; // Length of derived key
const DIGEST = 'sha512'; // Hashing algorithm
// Function to hash a password
const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        // Generate a random salt
        const salt = crypto_1.default.randomBytes(SALT_LENGTH).toString('hex');
        // Hash the password using PBKDF2
        crypto_1.default.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
            if (err)
                reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`); // Store salt and hash together
        });
    });
};
exports.hashPassword = hashPassword;
// Function to verify password
const verifyPassword = (password, storedHash) => {
    return new Promise((resolve, reject) => {
        const [salt, originalHash] = storedHash.split(':'); // Extract salt and hash
        // Hash the entered password with the same salt
        crypto_1.default.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
            if (err)
                reject(err);
            resolve(derivedKey.toString('hex') === originalHash); // Compare hashes
        });
    });
};
exports.verifyPassword = verifyPassword;
