module.exports = {
    coverageProvider: "v8",
    testEnvironment: "node",
    preset: "ts-jest",
    testTimeout: 15000,
    testMatch: ["**/?(*.)+(spec|test).ts"],
    coverageReporters: ['json-summary'],
};