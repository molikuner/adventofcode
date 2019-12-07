const readline = require('readline-sync');

const input: Array<bigint> = `3,225,1,225,6,6,1100,1,238,225,104,0,2,136,183,224,101,-5304,224,224,4,224,1002,223,8,223,1001,224,6,224,1,224,223,223,1101,72,47,225,1101,59,55,225,1101,46,75,225,1101,49,15,224,101,-64,224,224,4,224,1002,223,8,223,1001,224,5,224,1,224,223,223,102,9,210,224,1001,224,-270,224,4,224,1002,223,8,223,1001,224,2,224,1,223,224,223,101,14,35,224,101,-86,224,224,4,224,1002,223,8,223,101,4,224,224,1,224,223,223,1102,40,74,224,1001,224,-2960,224,4,224,1002,223,8,223,101,5,224,224,1,224,223,223,1101,10,78,225,1001,39,90,224,1001,224,-149,224,4,224,102,8,223,223,1001,224,4,224,1,223,224,223,1002,217,50,224,1001,224,-1650,224,4,224,1002,223,8,223,1001,224,7,224,1,224,223,223,1102,68,8,225,1,43,214,224,1001,224,-126,224,4,224,102,8,223,223,101,3,224,224,1,224,223,223,1102,88,30,225,1102,18,80,225,1102,33,28,225,4,223,99,0,0,0,677,0,0,0,0,0,0,0,0,0,0,0,1105,0,99999,1105,227,247,1105,1,99999,1005,227,99999,1005,0,256,1105,1,99999,1106,227,99999,1106,0,265,1105,1,99999,1006,0,99999,1006,227,274,1105,1,99999,1105,1,280,1105,1,99999,1,225,225,225,1101,294,0,0,105,1,0,1105,1,99999,1106,0,300,1105,1,99999,1,225,225,225,1101,314,0,0,106,0,0,1105,1,99999,108,677,677,224,102,2,223,223,1005,224,329,1001,223,1,223,1107,677,226,224,102,2,223,223,1006,224,344,1001,223,1,223,108,226,226,224,102,2,223,223,1005,224,359,1001,223,1,223,1108,677,226,224,102,2,223,223,1006,224,374,101,1,223,223,108,677,226,224,102,2,223,223,1006,224,389,1001,223,1,223,107,226,226,224,102,2,223,223,1005,224,404,1001,223,1,223,8,226,226,224,102,2,223,223,1006,224,419,101,1,223,223,1107,677,677,224,102,2,223,223,1006,224,434,1001,223,1,223,1107,226,677,224,1002,223,2,223,1006,224,449,101,1,223,223,7,677,677,224,1002,223,2,223,1006,224,464,1001,223,1,223,1108,226,677,224,1002,223,2,223,1005,224,479,1001,223,1,223,8,677,226,224,1002,223,2,223,1005,224,494,101,1,223,223,7,226,677,224,102,2,223,223,1005,224,509,101,1,223,223,1008,677,226,224,102,2,223,223,1006,224,524,101,1,223,223,8,226,677,224,1002,223,2,223,1006,224,539,1001,223,1,223,1007,677,677,224,102,2,223,223,1005,224,554,101,1,223,223,107,226,677,224,1002,223,2,223,1005,224,569,1001,223,1,223,1108,677,677,224,1002,223,2,223,1006,224,584,1001,223,1,223,1008,226,226,224,1002,223,2,223,1005,224,599,101,1,223,223,1008,677,677,224,102,2,223,223,1005,224,614,101,1,223,223,7,677,226,224,1002,223,2,223,1005,224,629,1001,223,1,223,107,677,677,224,1002,223,2,223,1006,224,644,101,1,223,223,1007,226,677,224,1002,223,2,223,1005,224,659,1001,223,1,223,1007,226,226,224,102,2,223,223,1005,224,674,101,1,223,223,4,223,99,226`.split(",").map(x => BigInt(x));
//                            IN AT EQ A  B  AT PR AT HALT
//const input: Array<bigint> = "3 ,9 ,8 ,9 ,10,9 ,4 ,9 ,99,-1 ,8".split(",").map(it => BigInt(it.trim()));
//                            0  1  2  3  4  5  6  7  8  9  10
//const input: Array<bigint> = [1,12,2,3,1,1,2,3,1,3,4,3,1,5,0,3,2,1,6,19,2,19,6,23,1,23,5,27,1,9,27,31,1,31,10,35,2,35,9,39,1,5,39,43,2,43,9,47,1,5,47,51,2,51,13,55,1,55,10,59,1,59,10,63,2,9,63,67,1,67,5,71,2,13,71,75,1,75,10,79,1,79,6,83,2,13,83,87,1,87,6,91,1,6,91,95,1,10,95,99,2,99,6,103,1,103,5,107,2,6,107,111,1,10,111,115,1,115,5,119,2,6,119,123,1,123,5,127,2,127,6,131,1,131,5,135,1,2,135,139,1,139,13,0,99,2,0,14,0].map(it => BigInt(it));
//const input: Array<bigint> = [1,0,0,0,99].map(it => BigInt(it));
//const input: Array<bigint> = "3,21,1008,21,8,20,1005,20,22,107,8,21,20,1006,20,31,1106,0,36,98,0,0,1002,21,125,20,4,20,1105,1,46,104,999,1105,1,46,1101,1000,1,20,4,20,1105,1,46,98,99".split(",").map(it => BigInt(it.trim()));

type Pointer = number

function instruction(value: bigint): bigint {
    return BigInt(value.toString().split("").slice(-2).join(""));
}

function instructionArgumentModes(value: bigint, num: bigint): Array<bigint> {
    if (value === undefined) value = 0n;
    const instructionModes = value.toString().split("").slice(0, -2).map(it => BigInt(it));
    return new Array(Number(num) - instructionModes.length).fill(0n).concat(instructionModes).reverse();
}

function argumentWithMode(argumentPointer: number, mode: bigint, memory: Array<bigint>): bigint {
    //console.log("getting argument for ptr:", argumentPointer, ", with mode", mode, "from", memory, "as pointer:", memory[Number(memory[argumentPointer])], ", as value:", memory[argumentPointer]);
    switch (BigInt(mode)) {
        case 0n:
            return memory[Number(memory[argumentPointer])];
        case 1n:
            return memory[argumentPointer];
        default:
            throw new Error(`Illegal argument mode for argument at pos ${argumentPointer} is ${mode}`);
    }
}

function saveTo(memory: Array<bigint>, location: number | bigint, value: bigint) {
    //console.log("saving", value, "to", location, "in", memory);
    memory[Number(location)] = value;
}

function runComputer(memory: Array<bigint>): Array<bigint> {
    const computeMemory: Array<bigint> = [].concat(memory);
    for (let pointer: Pointer = 0, memLength = computeMemory.length; pointer < memLength;) {
        const currentInstruction = instruction(computeMemory[pointer]);
        //console.log("*", pointer, computeMemory, currentInstruction, computeMemory[pointer], instructionArgumentModes(computeMemory[pointer], 4n));
        switch (currentInstruction) {
            case 1n: {
                const modes = instructionArgumentModes(computeMemory[pointer], 2n);
                //console.log("times", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 3]);
                saveTo(computeMemory, computeMemory[pointer + 3], argumentWithMode(pointer + 1, modes[0], computeMemory) + argumentWithMode(pointer + 2, modes[1], computeMemory));
                pointer += 4;
                break;
            }
            case 2n: {
                const modes = instructionArgumentModes(computeMemory[pointer], 2n);
                //console.log("times", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 3]);
                saveTo(computeMemory, computeMemory[pointer + 3], argumentWithMode(pointer + 1, modes[0], computeMemory) * argumentWithMode(pointer + 2, modes[1], computeMemory));
                pointer += 4;
                break;
            }
            case 3n: {
                const modes = instructionArgumentModes(computeMemory[pointer], 0n);
                //console.log("read", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 1]);
                saveTo(computeMemory, computeMemory[pointer + 1], BigInt(readline.question(`At instruction ${pointer} we need a input: `)));
                pointer += 2;
                break;
            }
            case 4n: {
                const modes = instructionArgumentModes(computeMemory[pointer], 1n);
                //console.log("print", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);
                console.log(`At instruction ${pointer} got: ${argumentWithMode(pointer + 1, modes[0], computeMemory)}`);
                pointer += 2;
                break;
            }
            case 99n: {
                const modes = instructionArgumentModes(computeMemory[pointer], 0n);
                pointer = computeMemory.length;
                break;
            }
            default:
                throw new Error("Unknown opcode " + computeMemory[pointer]);
        }
    }
    return computeMemory;
}

const output = runComputer(input);
console.log(output[0]);

