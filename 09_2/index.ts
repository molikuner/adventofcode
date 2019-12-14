const readline = require('readline-sync');

interface Array<T> {
    flatMap<R>(block: (T) => Array<R>): Array<R>

    removed(item: T): Array<T>
}

Array.prototype.flatMap = function flatMap<T, R>(this: Array<T>, block: (T) => Array<R>): Array<R> {
    let result: Array<R> = [];
    for (let a of this) result = result.concat(block(a));
    return result;
};
Array.prototype.removed = function removed<T>(this: Array<T>, item: T): Array<T> {
    const index = this.indexOf(item);
    const result = [].concat(this);
    if (index != -1) result.splice(index, 1);
    return result

};

type Pointer = number

type ComputerValueType = bigint
type Output = Array<bigint>
type Input = Array<bigint>

class ExecutionResult {
    constructor(readonly finishedWithHalt: boolean, readonly memory: ComputerMemory, readonly output: Output) {
    }
}

class ComputerMemory extends Array<ComputerValueType> {
    private relativeBase: bigint = 0n;

    constructor(...items: Array<ComputerValueType | number>) {
        super(...items.map(it => BigInt(it)));
        Object.setPrototypeOf(this, ComputerMemory.prototype);
    }

    setRelativeBase(base: bigint): ComputerMemory {
        this.relativeBase = base;
        return this
    }

    concat(...items: Array<Array<ComputerValueType>>): ComputerMemory {
        return Object.setPrototypeOf(super.concat(...items), ComputerMemory.prototype);
    }

    private getValue(pointer: Pointer | ComputerValueType): ComputerValueType {
        if (this[Number(pointer)] === undefined) return 0n;
        return this[Number(pointer)];
    }

    private instruction(pointer: Pointer): ComputerValueType {
        return BigInt(this.getValue(pointer).toString().split("").slice(-2).join(""));
    }

    private instructionArgumentModes(pointer: Pointer, amountArgs: bigint): Array<ComputerValueType> {
        const instructionModes = this.getValue(pointer).toString().split("").slice(0, -2).map(it => BigInt(it));
        return new Array(Number(amountArgs) - instructionModes.length).fill(0n).concat(instructionModes).reverse();
    }

    private argumentWithMode(argumentPointer: Pointer, mode: ComputerValueType): ComputerValueType {
        //console.log("getting argument for ptr:", argumentPointer, ", with mode", mode, /*"from", this, */"as pointer:", this.getValue(this.getValue(argumentPointer)), ", as value:", this.getValue(argumentPointer), ", as shifting:", this.getValue(this.relativeBase + this.getValue(argumentPointer)));
        switch (mode) {
            case 0n:
                return this.getValue(this.getValue(argumentPointer));
            case 1n:
                return this.getValue(argumentPointer);
            case 2n:
                //console.log("getting argument value with relative base", this.relativeBase, "at position", argumentPointer, "is", this.getValue(this.relativeBase + this.getValue(argumentPointer)));
                return this.getValue(this.relativeBase + this.getValue(argumentPointer));
            default:
                throw new Error(`Illegal argument mode for argument at pos ${argumentPointer} is ${mode}`);
        }
    }

    private saveTo(location: Pointer | ComputerValueType, value: ComputerValueType, mode: ComputerValueType) {
        switch (mode) {
            case 0n:
                this[Number(this[Number(location)])] = value;
                //console.log("saved", value, "to", this[Number(location)], "is", this[Number(this[Number(location)])]);
                break;
            case 2n:
                this[Number(this.relativeBase + this[Number(location)])] = value;
                //console.log("saved", value, "to", this.relativeBase + this[Number(location)], "is", this[Number(this.relativeBase + BigInt(location))]);
                break;
            default:
                throw new Error(`Illegal save mode for location ${location} is ${mode}. Should have saved ${value}`);
        }
    }

    runComputer(input: Input = [], waitOnInput: boolean = false, inPlace: boolean = false): ExecutionResult {
        const computeMemory: ComputerMemory = (inPlace) ? this : new ComputerMemory(...this).setRelativeBase(this.relativeBase);
        const outputs: Output = [];
        for (let pointer: Pointer = 0, memLength = computeMemory.length; pointer < memLength;) {
            const currentInstruction = computeMemory.instruction(pointer);
            //console.log("*", pointer, computeMemory, currentInstruction, computeMemory[pointer], computeMemory.instructionArgumentModes(pointer, 4n), computeMemory[100], computeMemory[101]);
            switch (currentInstruction) {
                case 1n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 3n);
                    //console.log("times", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 3]);
                    computeMemory.saveTo(
                        pointer + 3,
                        computeMemory.argumentWithMode(pointer + 1, modes[0])
                        +
                        computeMemory.argumentWithMode(pointer + 2, modes[1]),
                        modes[2]
                    );
                    pointer += 4;
                    break;
                }
                case 2n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 3n);
                    //console.log("times", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 3]);
                    computeMemory.saveTo(
                        pointer + 3,
                        computeMemory.argumentWithMode(pointer + 1, modes[0])
                        *
                        computeMemory.argumentWithMode(pointer + 2, modes[1]),
                        modes[2]
                    );
                    pointer += 4;
                    break;
                }
                case 3n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 1n);
                    //console.log("read", pointer, computeMemory[pointer], modes, "saving to", computeMemory[pointer + 1], ", possible input:", input[0]);
                    let readIn;
                    if (input[0] !== undefined) {
                        console.log(`At instruction ${pointer} need input, which will be get from storage. (${input[0]})`);
                        readIn = input.splice(0, 1)[0];
                    } else if (waitOnInput) {
                        console.log(`At instruction ${pointer} need input, pausing computer.`);
                        return new ExecutionResult(false, computeMemory, outputs);
                    } else {
                        readIn = BigInt(readline.question(`At instruction ${pointer} we need a input: `));
                    }
                    computeMemory.saveTo(pointer + 1, readIn, modes[0]);
                    pointer += 2;
                    break;
                }
                case 4n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 1n);
                    //console.log("print", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes);
                    const out = computeMemory.argumentWithMode(pointer + 1, modes[0]);
                    outputs.push(out);
                    console.log(`At instruction ${pointer} with relativeBase ${computeMemory.relativeBase} got: ${out}`);
                    pointer += 2;
                    break;
                }
                case 5n:
                case 6n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 2n);
                    //console.log("jump-if-true/false", currentInstruction, computeMemory.argumentWithMode(pointer + 1, modes[0]), pointer, computeMemory[pointer], computeMemory[pointer + 1], modes, computeMemory.argumentWithMode(pointer + 2, modes[1]));
                    if (Boolean(computeMemory.argumentWithMode(pointer + 1, modes[0])) === Boolean(6n - currentInstruction)) {
                        pointer = Number(computeMemory.argumentWithMode(pointer + 2, modes[1]));
                        //console.log("jumping to", pointer);
                    } else {
                        pointer += 3;
                    }
                    break;
                }
                case 7n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 3n);
                    //console.log("less than", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes, computeMemory[pointer + 3], computeMemory.argumentWithMode(pointer + 3, modes[2]));
                    computeMemory.saveTo(pointer + 3,
                        BigInt(
                            computeMemory.argumentWithMode(pointer + 1, modes[0])
                            <
                            computeMemory.argumentWithMode(pointer + 2, modes[1])
                        ),
                        modes[2]
                    );
                    pointer += 4;
                    break;
                }
                case 8n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 3n);
                    //console.log("equals", pointer, computeMemory[pointer], computeMemory[pointer + 1], modes, computeMemory[pointer + 3], computeMemory.argumentWithMode(pointer + 3, modes[2]));//, BigInt(argumentWithMode(pointer + 1, modes[0], computeMemory) == argumentWithMode(pointer + 2, modes[1], computeMemory)), argumentWithMode(pointer + 3, modes[0], computeMemory));
                    computeMemory.saveTo(pointer + 3,
                        BigInt(
                            computeMemory.argumentWithMode(pointer + 1, modes[0])
                            ==
                            computeMemory.argumentWithMode(pointer + 2, modes[1])
                        ),
                        modes[2]
                    );
                    pointer += 4;
                    break;
                }
                case 9n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 1n);
                    //const prev = computeMemory.relativeBase;
                    computeMemory.relativeBase += computeMemory.argumentWithMode(pointer + 1, modes[0]);
                    //console.log(pointer, computeMemory[pointer + 1], modes[0], "increased relative base from", prev, "to", computeMemory.relativeBase);
                    pointer += 2;
                    break;
                }
                case 99n: {
                    const modes = computeMemory.instructionArgumentModes(pointer, 0n);
                    pointer = computeMemory.length;
                    break;
                }
                default:
                    throw new Error("Unknown opcode " + computeMemory[pointer] + " at pointer " + pointer);
            }
        }
        return new ExecutionResult(true, computeMemory, outputs);
    }
}

const inputMemory: ComputerMemory = new ComputerMemory(1102, 34463338, 34463338, 63, 1007, 63, 34463338, 63, 1005, 63, 53, 1101, 3, 0, 1000, 109, 988, 209, 12, 9, 1000, 209, 6, 209, 3, 203, 0, 1008, 1000, 1, 63, 1005, 63, 65, 1008, 1000, 2, 63, 1005, 63, 904, 1008, 1000, 0, 63, 1005, 63, 58, 4, 25, 104, 0, 99, 4, 0, 104, 0, 99, 4, 17, 104, 0, 99, 0, 0, 1101, 27, 0, 1014, 1101, 286, 0, 1023, 1102, 1, 35, 1018, 1102, 20, 1, 1000, 1101, 26, 0, 1010, 1101, 0, 289, 1022, 1102, 1, 30, 1019, 1102, 734, 1, 1025, 1102, 1, 31, 1012, 1101, 25, 0, 1001, 1102, 1, 1, 1021, 1101, 0, 36, 1002, 1101, 0, 527, 1028, 1101, 895, 0, 1026, 1102, 1, 23, 1016, 1101, 21, 0, 1003, 1102, 22, 1, 1011, 1102, 1, 522, 1029, 1102, 1, 892, 1027, 1102, 1, 0, 1020, 1102, 1, 28, 1015, 1102, 38, 1, 1006, 1101, 0, 32, 1008, 1101, 743, 0, 1024, 1101, 0, 37, 1007, 1102, 1, 24, 1013, 1102, 1, 33, 1009, 1102, 39, 1, 1004, 1102, 1, 34, 1005, 1102, 1, 29, 1017, 109, 19, 21102, 40, 1, -3, 1008, 1016, 40, 63, 1005, 63, 203, 4, 187, 1106, 0, 207, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, -7, 2101, 0, -7, 63, 1008, 63, 32, 63, 1005, 63, 227, 1106, 0, 233, 4, 213, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, -3, 2108, 37, -2, 63, 1005, 63, 255, 4, 239, 1001, 64, 1, 64, 1105, 1, 255, 1002, 64, 2, 64, 109, 11, 21108, 41, 40, -6, 1005, 1014, 275, 1001, 64, 1, 64, 1106, 0, 277, 4, 261, 1002, 64, 2, 64, 109, 10, 2105, 1, -7, 1105, 1, 295, 4, 283, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, -27, 1201, -2, 0, 63, 1008, 63, 25, 63, 1005, 63, 321, 4, 301, 1001, 64, 1, 64, 1105, 1, 321, 1002, 64, 2, 64, 109, 15, 21107, 42, 41, 0, 1005, 1018, 341, 1001, 64, 1, 64, 1106, 0, 343, 4, 327, 1002, 64, 2, 64, 109, -25, 2108, 20, 10, 63, 1005, 63, 359, 1105, 1, 365, 4, 349, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, 12, 2107, 35, 0, 63, 1005, 63, 385, 1001, 64, 1, 64, 1106, 0, 387, 4, 371, 1002, 64, 2, 64, 109, 4, 21101, 43, 0, 6, 1008, 1015, 43, 63, 1005, 63, 409, 4, 393, 1106, 0, 413, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, 9, 21101, 44, 0, -8, 1008, 1010, 46, 63, 1005, 63, 437, 1001, 64, 1, 64, 1106, 0, 439, 4, 419, 1002, 64, 2, 64, 109, 5, 21108, 45, 45, -4, 1005, 1019, 457, 4, 445, 1106, 0, 461, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, -22, 2102, 1, 7, 63, 1008, 63, 33, 63, 1005, 63, 481, 1106, 0, 487, 4, 467, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, 14, 21102, 46, 1, -1, 1008, 1014, 43, 63, 1005, 63, 507, 1106, 0, 513, 4, 493, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, 12, 2106, 0, 1, 4, 519, 1106, 0, 531, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, -17, 1205, 10, 547, 1001, 64, 1, 64, 1106, 0, 549, 4, 537, 1002, 64, 2, 64, 109, -8, 1202, -2, 1, 63, 1008, 63, 17, 63, 1005, 63, 569, 1105, 1, 575, 4, 555, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, 23, 1206, -5, 593, 4, 581, 1001, 64, 1, 64, 1105, 1, 593, 1002, 64, 2, 64, 109, -14, 1208, -8, 24, 63, 1005, 63, 613, 1001, 64, 1, 64, 1105, 1, 615, 4, 599, 1002, 64, 2, 64, 109, -2, 1207, -1, 33, 63, 1005, 63, 633, 4, 621, 1105, 1, 637, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, 2, 21107, 47, 48, 5, 1005, 1016, 659, 4, 643, 1001, 64, 1, 64, 1105, 1, 659, 1002, 64, 2, 64, 109, -11, 1208, 8, 32, 63, 1005, 63, 681, 4, 665, 1001, 64, 1, 64, 1106, 0, 681, 1002, 64, 2, 64, 109, 2, 2101, 0, 0, 63, 1008, 63, 36, 63, 1005, 63, 703, 4, 687, 1106, 0, 707, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, 12, 1206, 7, 719, 1106, 0, 725, 4, 713, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, 2, 2105, 1, 8, 4, 731, 1001, 64, 1, 64, 1106, 0, 743, 1002, 64, 2, 64, 109, -21, 2102, 1, 9, 63, 1008, 63, 39, 63, 1005, 63, 769, 4, 749, 1001, 64, 1, 64, 1105, 1, 769, 1002, 64, 2, 64, 109, 11, 1201, -3, 0, 63, 1008, 63, 24, 63, 1005, 63, 793, 1001, 64, 1, 64, 1105, 1, 795, 4, 775, 1002, 64, 2, 64, 109, 20, 1205, -5, 809, 4, 801, 1105, 1, 813, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, -23, 1207, 4, 36, 63, 1005, 63, 833, 1001, 64, 1, 64, 1105, 1, 835, 4, 819, 1002, 64, 2, 64, 109, -3, 2107, 33, 5, 63, 1005, 63, 853, 4, 841, 1106, 0, 857, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, 16, 1202, -9, 1, 63, 1008, 63, 37, 63, 1005, 63, 879, 4, 863, 1105, 1, 883, 1001, 64, 1, 64, 1002, 64, 2, 64, 109, 12, 2106, 0, -1, 1105, 1, 901, 4, 889, 1001, 64, 1, 64, 4, 64, 99, 21101, 0, 27, 1, 21101, 0, 915, 0, 1106, 0, 922, 21201, 1, 48476, 1, 204, 1, 99, 109, 3, 1207, -2, 3, 63, 1005, 63, 964, 21201, -2, -1, 1, 21101, 0, 942, 0, 1105, 1, 922, 21202, 1, 1, -1, 21201, -2, -3, 1, 21101, 0, 957, 0, 1105, 1, 922, 22201, 1, -1, -2, 1106, 0, 968, 21202, -2, 1, -2, 109, -3, 2106, 0, 0);

const {output} = inputMemory.runComputer([2n]);
console.log(output);
