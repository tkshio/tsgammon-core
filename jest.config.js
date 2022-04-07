/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['<rootDir>/dist/','<rootDir>/node_modules','.*data.ts',],
    reporters:[
        'default',
        ['jest-junit',{
            suiteName: 'jest tests',
            outputDirectory:'reports/jest',
            outputName:'jest-test-results.xml',
        }]
    ]
}
