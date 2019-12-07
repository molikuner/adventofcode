const readline = require('readline-sync');

const input: Array<bigint> = [3, 8, 1001, 8, 10, 8, 105, 1, 0, 0, 21, 38, 63, 72, 81, 106, 187, 268, 349, 430, 99999, 3, 9, 101, 5, 9, 9, 1002, 9, 3, 9, 101, 3, 9, 9, 4, 9, 99, 3, 9, 102, 3, 9, 9, 101, 4, 9, 9, 1002, 9, 2, 9, 1001, 9, 2, 9, 1002, 9, 4, 9, 4, 9, 99, 3, 9, 1001, 9, 3, 9, 4, 9, 99, 3, 9, 102, 5, 9, 9, 4, 9, 99, 3, 9, 102, 4, 9, 9, 1001, 9, 2, 9, 1002, 9, 5, 9, 1001, 9, 2, 9, 102, 3, 9, 9, 4, 9, 99, 3, 9, 1001, 9, 2, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 99, 3, 9, 1001, 9, 2, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 99, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 1001, 9, 2, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 99, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 99, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 1002, 9, 2, 9, 4, 9, 3, 9, 101, 1, 9, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 1001, 9, 1, 9, 4, 9, 3, 9, 102, 2, 9, 9, 4, 9, 3, 9, 101, 2, 9, 9, 4, 9, 99].map(x => BigInt(x));

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

function runComputer(memory: Array<bigint>, input: Array<bigint> = []): Array<Array<bigint>> {
    const computeMemory: Array<bigint> = [].concat(memory);
    const outputs: Array<bigint> = [];
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
                //console.log("read", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 1], ", possible input:", input[0]);
                const readIn = (input[0] !== undefined)
                    ? (console.log(`At instruction ${pointer} we need a input: ${input[0]} (got from program input storage)`)
                        , input.splice(0, 1)[0])
                    : BigInt(readline.question(`At instruction ${pointer} we need a input: `));
                saveTo(computeMemory, computeMemory[pointer + 1], readIn);
                pointer += 2;
                break;
            }
            case 4n: {
                const modes = instructionArgumentModes(computeMemory[pointer], 1n);
                //console.log("print", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);
                const out = argumentWithMode(pointer + 1, modes[0], computeMemory);
                outputs.push(out);
                console.log(`At instruction ${pointer} got: ${out}`);
                pointer += 2;
                break;
            }
            case 5n:
            case 6n: {
                const modes = instructionArgumentModes(computeMemory[pointer], 2n);
                //console.log("jump-if-true/false", currentInstruction, argumentWithMode(pointer + 1, modes[0], computeMemory), pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);
                if (Boolean(argumentWithMode(pointer + 1, modes[0], computeMemory)) === Boolean(6n - currentInstruction)) {
                    pointer = Number(argumentWithMode(pointer + 2, modes[1], computeMemory));
                    //console.log("jumping to", pointer);
                } else {
                    pointer += 3;
                }
                break;
            }
            case 7n: {
                const modes = instructionArgumentModes(computeMemory[pointer], 2n);
                //console.log("less than", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);
                saveTo(computeMemory,
                    computeMemory[pointer + 3],
                    BigInt(
                        argumentWithMode(pointer + 1, modes[0], computeMemory)
                        < argumentWithMode(pointer + 2, modes[1], computeMemory)
                    )
                );
                pointer += 4;
                break;
            }
            case 8n: {
                const modes = instructionArgumentModes(computeMemory[pointer], 2n);
                //console.log("equals", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);//, BigInt(argumentWithMode(pointer + 1, modes[0], computeMemory) == argumentWithMode(pointer + 2, modes[1], computeMemory)), argumentWithMode(pointer + 3, modes[0], computeMemory));
                saveTo(computeMemory,
                    computeMemory[pointer + 3],
                    BigInt(
                        argumentWithMode(pointer + 1, modes[0], computeMemory)
                        == argumentWithMode(pointer + 2, modes[1], computeMemory)
                    )
                );
                pointer += 4;
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
    return [computeMemory, outputs];
}

const amplifier: Array<Array<bigint>> = new Array<Array<bigint>>(5);
for (let i = 0; i < 5; i++) {
    amplifier[i] = [].concat(input);
}

//const output = runComputer(amplifier[0], [0n, 0n]);
//console.log(output[1][0]);

const phases: Array<Array<bigint>> = [];
for (let a = 0; a < 5; a++) {
    for (let b = 0; b < 5; b++) {
        if (b != a) {
            for (let c = 0; c < 5; c++) {
                if (c != a && c != b) {
                    for (let d = 0; d < 5; d++) {
                        if (d != a && d != b && d != c) {
                            for (let e = 0; e < 5; e++) {
                                if (e != a && e != b && e != c && e != d) {
                                    phases.push([BigInt(a), BigInt(b), BigInt(c), BigInt(d), BigInt(e)]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

let maxOut = 0n;
for (let phase of phases) {
    let prevOut = 0n;
    for (let i = 0; i < amplifier.length; i++) {
        const output = runComputer(amplifier[i], [phase[i], prevOut]);
        prevOut = output[1][0];
    }
    if (maxOut < prevOut) maxOut = prevOut;
}
console.log(maxOut);
